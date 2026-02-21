import os
import time

import cv2
import numpy as np
import tensorflow as tf
import torch
from fastapi import FastAPI, WebSocket
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from .capture import FrameGrabber
from .model import UNet

APP_ROOT = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIST = os.getenv(
    "FRONTEND_DIST",
    os.path.abspath(os.path.join(APP_ROOT, "..", "frontend", "dist")),
)
OBS_CAMERA_INDEX = int(os.getenv("OBS_CAMERA_INDEX", "1"))
USE_FULL_FRAME = os.getenv("USE_FULL_FRAME", "1") == "1"
ROI_X = int(os.getenv("ROI_X", "3"))
ROI_Y = int(os.getenv("ROI_Y", "4"))
ROI_W = int(os.getenv("ROI_W", "507"))
ROI_H = int(os.getenv("ROI_H", "504"))
OVERLAY_ALPHA = float(os.getenv("OVERLAY_ALPHA", "0.35"))
KERAS_MODEL_PATH = os.getenv(
    "KERAS_MODEL_PATH",
    os.path.abspath(os.path.join(APP_ROOT, "..", "models", "nerve_segmentation.keras")),
)
KERAS_THRESHOLD = float(os.getenv("KERAS_THRESHOLD", "0.1"))
RUN_EVERY_N_FRAMES = int(os.getenv("RUN_EVERY_N_FRAMES", "1"))

CAMERA_INDEX = int(os.getenv("CAMERA_INDEX", "0"))
MODEL_PATH = os.getenv("MODEL_PATH", "")
INFER_SIZE = int(os.getenv("INFER_SIZE", "256"))
USE_CUDA = os.getenv("USE_CUDA", "1") == "1"

app = FastAPI()

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
keras_model = None
keras_input_h = None
keras_input_w = None
if os.path.exists(KERAS_MODEL_PATH):
    keras_model = tf.keras.models.load_model(KERAS_MODEL_PATH, compile=False)
    keras_input_h = int(keras_model.input_shape[1])
    keras_input_w = int(keras_model.input_shape[2])
    dummy = np.zeros((1, keras_input_h, keras_input_w, 1), dtype=np.float32)
    keras_model.predict(dummy, verbose=0)


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


def _open_obs_capture() -> cv2.VideoCapture:
    if os.name == "nt":
        for backend in (cv2.CAP_DSHOW, cv2.CAP_MSMF):
            cap = cv2.VideoCapture(OBS_CAMERA_INDEX, backend)
            if cap.isOpened():
                return cap
        cap = cv2.VideoCapture(OBS_CAMERA_INDEX)
        if cap.isOpened():
            return cap
        # Fallback to default camera index if OBS index fails.
        cap = cv2.VideoCapture(CAMERA_INDEX, cv2.CAP_DSHOW)
        return cap
    if os.name == "posix" and hasattr(cv2, "CAP_AVFOUNDATION"):
        cap = cv2.VideoCapture(OBS_CAMERA_INDEX, cv2.CAP_AVFOUNDATION)
        if cap.isOpened():
            return cap
    return cv2.VideoCapture(OBS_CAMERA_INDEX)


def overlay_mjpeg_stream():
    cap = _open_obs_capture()
    if not cap.isOpened():
        raise RuntimeError("Cannot open OBS Virtual Camera.")

    fps_smooth = 0.0
    t_prev = time.time()
    frame_count = 0
    last_mask_512 = np.zeros((512, 512), dtype=np.uint8)

    try:
        while True:
            ok, frame = cap.read()
            if not ok or frame is None:
                time.sleep(0.01)
                continue

            if USE_FULL_FRAME:
                roi = frame
                x0, y0 = 0, 0
            else:
                roi = frame[ROI_Y:ROI_Y + ROI_H, ROI_X:ROI_X + ROI_W]
                x0, y0 = ROI_X, ROI_Y

            if roi.shape[0] != 512 or roi.shape[1] != 512:
                roi_512 = cv2.resize(roi, (512, 512), interpolation=cv2.INTER_AREA)
            else:
                roi_512 = roi

            infer_ms = None
            if keras_model is not None and frame_count % RUN_EVERY_N_FRAMES == 0:
                t0 = time.time()
                gray = cv2.cvtColor(roi_512, cv2.COLOR_BGR2GRAY)
                gray_in = cv2.resize(gray, (keras_input_w, keras_input_h), interpolation=cv2.INTER_AREA)
                inp = (gray_in.astype(np.float32) / 255.0)[None, ..., None]

                pred = keras_model.predict(inp, verbose=0)
                prob_map = pred[0, :, :, 0]
                mask_in = (prob_map > KERAS_THRESHOLD).astype(np.uint8)
                last_mask_512 = cv2.resize(mask_in, (512, 512), interpolation=cv2.INTER_NEAREST) * 255
                infer_ms = (time.time() - t0) * 1000.0

            overlay = roi_512.copy()
            overlay[last_mask_512 > 0] = (0, 255, 0)
            blended = cv2.addWeighted(overlay, OVERLAY_ALPHA, roi_512, 1 - OVERLAY_ALPHA, 0)

            if roi_512.shape[:2] != roi.shape[:2]:
                blended = cv2.resize(blended, (roi.shape[1], roi.shape[0]), interpolation=cv2.INTER_AREA)

            if USE_FULL_FRAME:
                out = blended
            else:
                out = frame.copy()
                out[y0:y0 + roi.shape[0], x0:x0 + roi.shape[1]] = blended

            t_now = time.time()
            dt = t_now - t_prev
            t_prev = t_now
            if dt > 0:
                inst = 1.0 / dt
                fps_smooth = inst if fps_smooth == 0 else (0.9 * fps_smooth + 0.1 * inst)

            txt = f"U-Net | FPS {fps_smooth:.1f} | thr {KERAS_THRESHOLD}"
            if infer_ms is not None:
                txt += f" | infer {infer_ms:.1f} ms"
            cv2.putText(
                out,
                txt,
                (10, 25),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255, 255, 255),
                2,
            )

            ok, jpg = cv2.imencode(".jpg", out, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
            if not ok:
                continue
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + jpg.tobytes() + b"\r\n"
            )
            frame_count += 1
    finally:
        cap.release()


@app.get("/video/overlay")
def video_overlay_feed() -> StreamingResponse:
    return StreamingResponse(overlay_mjpeg_stream(), media_type="multipart/x-mixed-replace; boundary=frame")


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


def _frontend_available() -> bool:
    return os.path.exists(os.path.join(FRONTEND_DIST, "index.html"))


if _frontend_available():
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    def frontend_index():
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))

    @app.get("/{path:path}")
    def frontend_spa(path: str):
        # Let explicit API routes handle their own paths.
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))



