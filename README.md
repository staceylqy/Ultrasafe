# Ultrasafe
Ultrasound nerve detection UI with a training pipeline and a backend API for live OBS streaming.

## Project layout
- `frontend/` - UI app (React/TS + Vite)
- `ultrasafe/` - backend API (FastAPI + PyTorch)
- `notebooks/` - Jupyter notebooks for data exploration and training
- `raw_data/` - original datasets (do not modify)
- `ultrasafe/data/` - curated data artifacts for training/inference
- `tests/` - tests

## Quick start (single URL)
1) Install backend deps:
```
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

2) Build the frontend:
```
cd frontend
npm install
npm run build
```

3) Run the backend:
```
python -m ultrasafe
```

Open `http://localhost:8000`.

## Frontend dev mode (optional)
Use this only if you want hot-reload during UI development:
```
cd frontend
npm install
set VITE_API_BASE_URL=http://localhost:8000
npm run dev
```

Open `http://localhost:5173`.

## Live OBS Virtual Camera streaming
The backend exposes a live MJPEG stream with the sample overlay at:
`/video/overlay`

Set the OBS camera index if needed:
- `OBS_CAMERA_INDEX` (default `1`)
- `USE_FULL_FRAME` (`1` or `0`)
- `ROI_X`, `ROI_Y`, `ROI_W`, `ROI_H`
- `OVERLAY_ALPHA` (default `0.35`)

## Configuration
- `CAMERA_INDEX` (default `0`)
- `MODEL_PATH` (path to a trained `.pt` model)
- `INFER_SIZE` (default `256`)
- `USE_CUDA` (`1` to enable if available, `0` to force CPU)

