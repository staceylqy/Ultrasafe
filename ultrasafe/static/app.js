const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const fpsEl = document.getElementById("fps");
const wsEl = document.getElementById("ws");

const maskCanvas = document.createElement("canvas");
const maskCtx = maskCanvas.getContext("2d");
const overlayCtx = overlay.getContext("2d");

let lastTs = performance.now();
let frames = 0;

function resizeCanvases() {
  const w = video.naturalWidth || video.clientWidth;
  const h = video.naturalHeight || video.clientHeight;
  if (!w || !h) return;
  overlay.width = w;
  overlay.height = h;
  maskCanvas.width = w;
  maskCanvas.height = h;
}

video.addEventListener("load", resizeCanvases);
window.addEventListener("resize", resizeCanvases);

function updateFps() {
  const now = performance.now();
  frames += 1;
  const dt = now - lastTs;
  if (dt >= 1000) {
    const fps = Math.round((frames * 1000) / dt);
    fpsEl.textContent = `FPS: ${fps}`;
    frames = 0;
    lastTs = now;
  }
}

function drawMask(maskBitmap) {
  overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
  maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);

  maskCtx.drawImage(maskBitmap, 0, 0, maskCanvas.width, maskCanvas.height);

  overlayCtx.globalCompositeOperation = "source-over";
  overlayCtx.globalAlpha = 0.45;
  overlayCtx.drawImage(maskCanvas, 0, 0);

  overlayCtx.globalCompositeOperation = "source-in";
  overlayCtx.fillStyle = "red";
  overlayCtx.fillRect(0, 0, overlay.width, overlay.height);

  overlayCtx.globalCompositeOperation = "source-over";
  overlayCtx.globalAlpha = 1.0;
}

function connectWs() {
  const wsUrl = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws/mask`;
  const ws = new WebSocket(wsUrl);
  ws.binaryType = "blob";

  ws.onopen = () => {
    wsEl.textContent = "WS: connected";
    ws.send("next");
  };
  ws.onclose = () => {
    wsEl.textContent = "WS: disconnected";
    setTimeout(connectWs, 1000);
  };
  ws.onerror = () => {
    wsEl.textContent = "WS: error";
  };
  ws.onmessage = async (event) => {
    if (typeof event.data === "string") {
      ws.send("next");
      return;
    }
    const blob = event.data;
    const bitmap = await createImageBitmap(blob);
    resizeCanvases();
    drawMask(bitmap);
    updateFps();
    ws.send("next");
  };
}

connectWs();

