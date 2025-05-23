import { useCallback, useRef, useState } from "react";

export const useAR = (arRef, setArStream, setDetectedSurfaces) => {
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Simple edge detection for surface finding
  const detectSurfaces = useCallback(
    (videoElement) => {
      if (!canvasRef.current || isProcessing) return;

      setIsProcessing(true);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Set canvas size to match video
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      // Draw current video frame
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // Get image data for processing
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Simple edge detection algorithm
      const edges = [];
      const threshold = 50;

      for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1; x < canvas.width - 1; x++) {
          const idx = (y * canvas.width + x) * 4;

          // Calculate gradient
          const gx = data[idx + 4] - data[idx - 4]; // horizontal gradient
          const gy =
            data[idx + canvas.width * 4] - data[idx - canvas.width * 4]; // vertical gradient
          const magnitude = Math.sqrt(gx * gx + gy * gy);

          if (magnitude > threshold) {
            edges.push({ x, y, strength: magnitude });
          }
        }
      }

      // Find rectangular regions (potential walls)
      const surfaces = findRectangularSurfaces(
        edges,
        canvas.width,
        canvas.height
      );

      // Convert to screen coordinates
      const screenSurfaces = surfaces.map((surface, index) => ({
        id: Date.now() + index,
        x: (surface.x / canvas.width) * 100,
        y: (surface.y / canvas.height) * 100,
        width: Math.max(
          120,
          (surface.width / canvas.width) * window.innerWidth * 0.3
        ),
        height: Math.max(
          160,
          (surface.height / canvas.height) * window.innerHeight * 0.3
        ),
        confidence: surface.confidence,
      }));

      setDetectedSurfaces(screenSurfaces);
      setIsProcessing(false);
    },
    [isProcessing, setDetectedSurfaces]
  );

  // Find rectangular surfaces from edge points
  const findRectangularSurfaces = (edges, width, height) => {
    const surfaces = [];
    const minSurfaceSize = 80;
    const gridSize = 40;

    // Divide image into grid and analyze each section
    for (let y = 0; y < height - gridSize; y += gridSize) {
      for (let x = 0; x < width - gridSize; x += gridSize) {
        const sectionEdges = edges.filter(
          (edge) =>
            edge.x >= x &&
            edge.x < x + gridSize &&
            edge.y >= y &&
            edge.y < y + gridSize
        );

        // If section has moderate edge density, it might be a good surface
        if (sectionEdges.length > 5 && sectionEdges.length < 50) {
          // Check for rectangular patterns
          const horizontalEdges = sectionEdges.filter(
            (edge) =>
              Math.abs(edge.x - x) < 10 ||
              Math.abs(edge.x - (x + gridSize)) < 10
          );
          const verticalEdges = sectionEdges.filter(
            (edge) =>
              Math.abs(edge.y - y) < 10 ||
              Math.abs(edge.y - (y + gridSize)) < 10
          );

          if (horizontalEdges.length > 2 && verticalEdges.length > 2) {
            surfaces.push({
              x: x + gridSize / 4,
              y: y + gridSize / 4,
              width: gridSize * 1.5,
              height: gridSize * 2,
              confidence: Math.min(
                0.9,
                (horizontalEdges.length + verticalEdges.length) / 20
              ),
            });
          }
        }
      }
    }

    return surfaces.slice(0, 4); // Limit to 4 surfaces
  };

  const initAR = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("getUserMedia not supported");
      alert("AR not supported on this device");
      return;
    }

    try {
      console.log("Requesting camera access...");

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280, max: 1920, min: 640 },
          height: { ideal: 720, max: 1080, min: 480 },
          frameRate: { ideal: 30, max: 60, min: 15 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("Camera access granted");

      streamRef.current = stream;
      setArStream(stream);

      if (arRef.current) {
        arRef.current.srcObject = stream;

        arRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded");
          arRef.current.play().catch((err) => {
            console.error("Error playing video:", err);
          });

          // Start surface detection after video is playing
          setTimeout(() => {
            startSurfaceDetection();
          }, 1000);
        };
      }
    } catch (err) {
      console.error("Error accessing camera:", err);

      let errorMessage = "Camera access failed";
      if (err.name === "NotAllowedError") {
        errorMessage =
          "Camera permission denied. Please allow camera access and try again.";
      } else if (err.name === "NotFoundError") {
        errorMessage = "No camera found on this device.";
      }

      alert(errorMessage);
    }
  }, [arRef, setArStream, setDetectedSurfaces]);

  const startSurfaceDetection = useCallback(() => {
    if (!arRef.current) return;

    // Create hidden canvas for processing
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
      canvasRef.current.style.display = "none";
      document.body.appendChild(canvasRef.current);
    }

    // Process frames periodically
    const processFrame = () => {
      if (arRef.current && arRef.current.readyState === 4) {
        detectSurfaces(arRef.current);
      }
    };

    // Process every 2 seconds to avoid performance issues
    const intervalId = setInterval(processFrame, 2000);

    // Store interval ID for cleanup
    arRef.current.surfaceDetectionInterval = intervalId;
  }, [detectSurfaces]);

  const stopAR = useCallback(() => {
    console.log("Stopping AR...");

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        console.log("Stopping track:", track.kind);
        track.stop();
      });
      streamRef.current = null;
    }

    if (arRef.current) {
      if (arRef.current.surfaceDetectionInterval) {
        clearInterval(arRef.current.surfaceDetectionInterval);
      }
      arRef.current.srcObject = null;
    }

    if (canvasRef.current) {
      document.body.removeChild(canvasRef.current);
      canvasRef.current = null;
    }

    setArStream(null);
    setDetectedSurfaces([]);
    setIsProcessing(false);
  }, [arRef, setArStream, setDetectedSurfaces]);

  return { initAR, stopAR };
};
