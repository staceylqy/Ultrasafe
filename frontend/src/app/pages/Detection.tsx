import { useState, useEffect } from "react";
import { UltrasoundImage, NerveDetection } from "../components/UltrasoundImage";
import { Button } from "../components/ui/button";
import { Home } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface ProcessedImage {
  id: string;
  url: string;
  name: string;
  detections: NerveDetection[];
  isProcessed: boolean;
}

export function Detection() {
  const navigate = useNavigate();
  const location = useLocation();
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Get processed images from location state or redirect back to home
  useEffect(() => {
    const state = location.state as { processedImages?: ProcessedImage[] };
    if (state?.processedImages) {
      setImages(state.processedImages);
    } else {
      // If no processed images, redirect back to home
      navigate("/");
    }
  }, [location.state, navigate]);

  // Slideshow auto-loop playback (switch every second)
  useEffect(() => {
    if (images.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        // Loop playback: when the last image is reached, return to the first image
        return (prevIndex + 1) % images.length;
      });
    }, 1000); // Switch every second

    return () => clearInterval(interval);
  }, [images.length]);

  const handleBackToHome = () => {
    navigate("/");
  };

  // Loading state
  if (images.length === 0) {
    return null; // Will redirect to home if no images
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 relative">
      <div className="absolute left-6 top-6 z-10">
        <Button variant="outline" size="sm" onClick={handleBackToHome}>
          <Home className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="mb-2 text-gray-900">Wrist Ultrasound Nerve Detection System</h1>
          <p className="text-gray-600">AI Automatic Nerve Position Detection</p>
        </div>

        <div className="space-y-6">
          {/* Image display area */}
          {images.length > 0 && (
            <>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                    </div>
                  </div>
                </div>
                <UltrasoundImage
                  imageUrl={images[currentIndex].url}
                  detections={images[currentIndex].detections}
                  isProcessing={!images[currentIndex].isProcessed}
                />
              </div>      
            </>
          )}
        </div>

      </div>
    </div>
  );
}