# Ultrasafe
Ultrasound nerve detection UI with a training pipeline and optional backend API.

## Project layout
- `frontend/` - UI app (React/TS + Vite)
- `ultrasafe/` - backend API (FastAPI + PyTorch, optional)
- `notebooks/` - Jupyter notebooks for data exploration and training
- `raw_data/` - original datasets (do not modify)
- `ultrasafe/data/` - curated data artifacts for training/inference
- `tests/` - tests

## Quick start (local dev)
```
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Frontend UI (main app):
```
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

Backend API (optional, for video/masks):
```
python -m ultrasafe
```

## Run together (single URL)
1) Build the frontend:
```
cd frontend
npm run build
```
2) Run the backend:
```
python -m ultrasafe
```
Then open `http://localhost:8000`.

## Configuration
- `CAMERA_INDEX` (default `0`)
- `MODEL_PATH` (path to a trained `.pt` model)
- `INFER_SIZE` (default `256`)
- `USE_CUDA` (`1` to enable if available, `0` to force CPU)

## Local images
Place ultrasound images in:
`frontend/src/assets/ultrasound/`

The list is defined in:
`frontend/src/app/data/ultrasoundData.ts`
