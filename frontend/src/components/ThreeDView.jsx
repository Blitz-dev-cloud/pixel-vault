import React from "react";
import { RotateCcw } from "lucide-react";

const ThreeDView = ({ canvasRef, setCurrentView }) => {
  const handleBackToHome = () => {
    // Add a small delay to ensure cleanup happens before view change
    setTimeout(() => {
      setCurrentView("home");
    }, 100);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute top-6 left-6 z-10 space-y-4">
        <button
          onClick={handleBackToHome}
          className="px-6 py-3 bg-white/10 backdrop-blur-md text-white rounded-xl hover:bg-white/20 border border-white/20 transition-all duration-200 flex items-center gap-2"
        >
          ← Back to Home
        </button>
      </div>
      <div className="absolute bottom-6 left-6 right-6 z-10">
        <div className="bg-black/50 backdrop-blur-md text-white p-6 rounded-2xl border border-white/20 max-w-md">
          <h3 className="text-xl font-bold mb-3 flex items-center">
            <RotateCcw className="w-6 h-6 mr-2 text-purple-400" />
            3D Gallery Controls
          </h3>
          <div className="space-y-2 text-sm text-gray-300">
            <p>
              • <strong>Mouse Drag:</strong> Rotate around the gallery
            </p>
            <p>
              • <strong>Mouse Wheel:</strong> Zoom in and out
            </p>
            <p>
              • <strong>Navigate:</strong> Explore the starry gallery space
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreeDView;
