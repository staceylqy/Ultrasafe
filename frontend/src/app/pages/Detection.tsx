import { useMemo } from "react";
import { Button } from "../components/ui/button";
import { Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Detection() {
  const navigate = useNavigate();
  const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || "";
  const streamUrl = useMemo(() => {
    return apiBase ? `${apiBase}/video/overlay` : "/video/overlay";
  }, [apiBase]);

  const handleBackToHome = () => {
    navigate("/");
  };

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
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4"></div>
              </div>
            </div>
            <div className="flex items-center justify-center bg-black">
              <img
                src={streamUrl}
                alt="Live OBS stream"
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}