import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Brain, Scan, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { importFromUltrasoundDevice } from "../data/ultrasoundData";
import { simulateNerveDetection } from "../utils/nerveDetection";
import { NerveDetection } from "../components/UltrasoundImage";
import { Progress } from "../components/ui/progress";

interface ProcessedImage {
  id: string;
  url: string;
  name: string;
  detections: NerveDetection[];
  isProcessed: boolean;
}

export function Welcome() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  const handleStart = async () => {
    setIsProcessing(true);
    setProcessingProgress(0);

    // Import ultrasound images
    const ultrasoundData = await importFromUltrasoundDevice();

    // Create initial image objects
    const initialImages: ProcessedImage[] = ultrasoundData.map((data) => ({
      id: data.id,
      url: data.url,
      name: data.name,
      detections: [],
      isProcessed: false,
    }));

    // Process images one by one with AI detection
    const processedImages: ProcessedImage[] = [];
    for (let i = 0; i < ultrasoundData.length; i++) {
      const detections = await simulateNerveDetection(null as any);
      processedImages.push({
        ...initialImages[i],
        detections,
        isProcessed: true,
      });
      
      setProcessingProgress(((i + 1) / ultrasoundData.length) * 100);
    }

    // Navigate to detection page with processed images
    navigate("/detection", { state: { processedImages } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Logo/Icon Section */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex justify-center mb-8"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-full p-8 shadow-2xl">
                <Brain className="w-20 h-20 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-4 text-gray-900"
          >
            Welcome to
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-6"
          >
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Wrist Ultrasound Nerve Detection System
            </h2>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto"
          >
            AI-Powered Medical Imaging Analysis Platform
            <br />
            Precise Detection, Smart Annotation, Efficient Diagnosis
          </motion.p>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Scan className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Smart Scanning</h3>
              <p className="text-sm text-gray-600">
                Automatically identify nerve structures in ultrasound images
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AI Annotation</h3>
              <p className="text-sm text-gray-600">
                Real-time annotation of nerve locations and confidence scores
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Deep Learning</h3>
              <p className="text-sm text-gray-600">
                Trained on large-scale medical datasets
              </p>
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 }}
          >
            <Button
              size="lg"
              onClick={handleStart}
              className="text-lg px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-2xl hover:shadow-3xl transition-all duration-300"
            >
              Start AI Detection
              <Sparkles className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>

          {/* Footer Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="mt-12 text-sm text-gray-500"
          >
            <p>System will automatically load and analyze ultrasound images</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Processing Modal */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 overflow-visible"
          >
            <div className="text-center mb-6 overflow-visible">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-white animate-pulse" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 leading-relaxed">
                AI Processing Progress
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Analyzing ultrasound images and detecting nerve structures...
              </p>
            </div>

            <div className="space-y-3 overflow-visible">
              <Progress value={processingProgress} className="h-3" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 leading-relaxed">Processing</span>
                <span className="font-semibold text-gray-900 leading-relaxed">
                  {Math.round(processingProgress)}%
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}