import { useEffect, useRef } from "react";

// Simulated nerve recognition result type
export interface NerveDetection {
  x: number; // center point x coordinate (percentage)
  y: number; // Center point Y coordinate (percentage)
  width: number; // width (percentage)
  height: number; // height (percentage)
  confidence: number; // confidence
  label: string;
}

interface UltrasoundImageProps {
  imageUrl: string;
  detections: NerveDetection[];
  isProcessing: boolean;
}

export function UltrasoundImage({ imageUrl, detections, isProcessing }: UltrasoundImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawDetections = () => {
      // Set canvas size to match image
      canvas.width = image.width;
      canvas.height = image.height;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw detection boxes
      detections.forEach((detection) => {
        const x = (detection.x * canvas.width) / 100;
        const y = (detection.y * canvas.height) / 100;
        const w = (detection.width * canvas.width) / 100;
        const h = (detection.height * canvas.height) / 100;

        // Draw detection box borders
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 3;
        ctx.strokeRect(x - w / 2, y - h / 2, w, h);

        // Draw label background
        ctx.fillStyle = "#00ff00";
        const label = `${detection.label} (${Math.round(detection.confidence * 100)}%)`;
        const textMetrics = ctx.measureText(label);
        const padding = 4;
        ctx.fillRect(
          x - w / 2,
          y - h / 2 - 24,
          textMetrics.width + padding * 2,
          20
        );

        // Draw label text
        ctx.fillStyle = "#000000";
        ctx.font = "14px sans-serif";
        ctx.fillText(label, x - w / 2 + padding, y - h / 2 - 8);
      });
    };

    if (image.complete) {
      drawDetections();
    } else {
      image.onload = drawDetections;
    }
  }, [detections, imageUrl]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      <div className="relative max-w-full max-h-full">
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Ultrasound"
          className="max-w-full max-h-[70vh] object-contain"
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-white font-medium">AI detecting nerves...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
