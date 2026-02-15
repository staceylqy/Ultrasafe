import { useEffect, useRef, useState } from "react";

const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || "";

function getVideoUrl() {
  return apiBase ? `${apiBase}/video` : "/video";
}

function getWsUrl() {
  if (apiBase) {
    return apiBase.replace(/^http/, "ws") + "/ws/mask";
  }
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.host}/ws/mask`;
}

export function LiveUltrasound() {
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [wsStatus, setWsStatus] = useState("connecting");
  const [fps, setFps] = useState("--");

  useEffect(() => {
    if (!maskCanvasRef.current) {
      maskCanvasRef.current = document.createElement("canvas");
    }

    const overlay = overlayRef.current;
    if (!overlay) return;
    const overlayCtx = overlay.getContext("2d");
    const maskCtx = maskCanvasRef.current.getContext("2d");
    if (!overlayCtx || !maskCtx) return;

    let frames = 0;
    let lastTs = performance.now();
    let ws: WebSocket | null = null;

    const resize = (w: number, h: number) => {
      overlay.width = w;
      overlay.height = h;
      maskCanvasRef.current!.width = w;
      maskCanvasRef.current!.height = h;
    };

    const connect = () => {
      ws = new WebSocket(getWsUrl());
      ws.binaryType = "blob";

      ws.onopen = () => {
        setWsStatus("connected");
        ws?.send("next");
      };
      ws.onclose = () => {
        setWsStatus("disconnected");
        setTimeout(connect, 1000);
      };
      ws.onerror = () => {
        setWsStatus("error");
      };
      ws.onmessage = async (event) => {
        if (typeof event.data === "string") {
          ws?.send("next");
          return;
        }
        const bitmap = await createImageBitmap(event.data);
        resize(bitmap.width, bitmap.height);

        overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
        maskCtx.clearRect(0, 0, maskCanvasRef.current!.width, maskCanvasRef.current!.height);
        maskCtx.drawImage(bitmap, 0, 0, maskCanvasRef.current!.width, maskCanvasRef.current!.height);

        overlayCtx.globalCompositeOperation = "source-over";
        overlayCtx.globalAlpha = 0.45;
        overlayCtx.drawImage(maskCanvasRef.current!, 0, 0);

        overlayCtx.globalCompositeOperation = "source-in";
        overlayCtx.fillStyle = "red";
        overlayCtx.fillRect(0, 0, overlay.width, overlay.height);

        overlayCtx.globalCompositeOperation = "source-over";
        overlayCtx.globalAlpha = 1.0;

        const now = performance.now();
        frames += 1;
        const dt = now - lastTs;
        if (dt >= 1000) {
          setFps(String(Math.round((frames * 1000) / dt)));
          frames = 0;
          lastTs = now;
        }
        ws?.send("next");
      };
    };

    connect();
    return () => {
      ws?.close();
    };
  }, []);

  return (
    <div className="relative w-full flex flex-col items-center justify-center bg-black">
      <div className="relative max-w-full">
        <img
          src={getVideoUrl()}
          alt="Live ultrasound"
          className="max-w-full max-h-[70vh] object-contain"
        />
        <canvas
          ref={overlayRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
      </div>
      <div className="mt-2 text-xs text-gray-500">
        FPS: {fps} · WS: {wsStatus}
      </div>
    </div>
  );
}

