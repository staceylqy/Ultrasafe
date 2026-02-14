# Ultrasafe
Real-time ultrasound nerve detection demo with a web UI and a training pipeline.

## Project layout
- `ultrasafe/` - application package (API, model, capture, web assets)
- `notebooks/` - Jupyter notebooks for data exploration and training
- `raw_data/` - original datasets (do not modify)
- `ultrasafe/data/` - curated data artifacts for training/inference
- `tests/` - tests

## Quick start (local dev)
```
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m ultrasafe
```

Open `http://localhost:8000`.

## Configuration
- `CAMERA_INDEX` (default `0`)
- `MODEL_PATH` (path to a trained `.pt` model)
- `INFER_SIZE` (default `256`)
- `USE_CUDA` (`1` to enable if available, `0` to force CPU)
# Ultrasafe
AI that brings intelligence to real-time ultrasound.
