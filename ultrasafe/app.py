import os
import time

import cv2
import numpy as np
import torch
from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from .capture import FrameGrabber
from .model import UNet

APP_ROOT = os.path.dirname(os.path.abspath(__file__))

CAMERA_INDEX = int(os.getenv("CAMERA_INDEX", "0"))
MODEL_PATH = os.getenv("MODEL_PATH", "")
INFER_SIZE = int(os.getenv("INFER_SIZE", "256"))
USE_CUDA = os.getenv("USE_CUDA", "1") == "1"

app = FastAPI()
app.mount("/static", StaticFiles(directory=os.path.join(APP_ROOT, "static")), name="static")

grabber = FrameGrabber(camera_index=CAMERA_INDEX)
grabber.start()


def load_model() -> torch.nn.Module:
    device = torch.device("cuda" if torch.cuda.is_available() and USE_CUDA else "cpu")
    model = UNet().to(device)
    model.eval()
    if MODEL_PATH and os.path.exists(MODEL_PATH):
        state = torch.load(MODEL_PATH, map_location=device)
        model.load_state_dict(state)
    return model


model = load_model()


@app.get("/")
def index() -> HTMLResponse:
    with open(os.path.join(APP_ROOT, "static", "index.html"), "r", encoding="utf-8") as f:
        return HTMLResponse(f.read())


def preprocess(frame: np.ndarray) -> torch.Tensor:
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    resized = cv2.resize(gray, (INFER_SIZE, INFER_SIZE), interpolation=cv2.INTER_AREA)
    tensor = torch.from_numpy(resized).float().unsqueeze(0).unsqueeze(0) / 255.0
    return tensor


def postprocess(mask: torch.Tensor, out_shape) -> np.ndarray:
    mask = torch.sigmoid(mask).squeeze(0).squeeze(0).cpu().numpy()
    mask = cv2.resize(mask, out_shape, interpolation=cv2.INTER_LINEAR)
    mask = (mask * 255.0).clip(0, 255).astype(np.uint8)
    return mask


def mjpeg_stream():
    while True:
        frame = grabber.get_frame()
        if frame is None:
            time.sleep(0.01)
            continue
        ok, jpg = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
        if not ok:
            continue
        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n" + jpg.tobytes() + b"\r\n"
        )


@app.get("/video")
def video_feed() -> StreamingResponse:
    return StreamingResponse(mjpeg_stream(), media_type="multipart/x-mixed-replace; boundary=frame")


@app.websocket("/ws/mask")
async def mask_socket(ws: WebSocket):
    await ws.accept()
    device = next(model.parameters()).device
    try:
        while True:
            frame = grabber.get_frame()
            if frame is None:
                await ws.send_text("nop")
                await ws.receive_text()
                continue
            tensor = preprocess(frame).to(device)
            with torch.no_grad():
                out = model(tensor)
            mask = postprocess(out, (frame.shape[1], frame.shape[0]))
            ok, png = cv2.imencode(".png", mask)
            if not ok:
                continue
            await ws.send_bytes(png.tobytes())
            await ws.receive_text()
    except Exception:
        await ws.close()

