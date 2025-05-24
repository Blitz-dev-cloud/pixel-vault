import { useCallback, useRef, useState } from "react";

export const useAR = (arRef, setArStream, setDetectedSurfaces) => {
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Improved surface detection with better mobile compatibility
  const detectSurfaces = useCallback(
    (videoElement) => {
      if (!canvasRef.current || isProcessing) return;

      setIsProcessing(true);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Set canvas size to match video but with reasonable limits for mobile
      const maxWidth = Math.min(videoElement.videoWidth, 640);
      const maxHeight = Math.min(videoElement.videoHeight, 480);

      canvas.width = maxWidth;
      canvas.height = maxHeight;

      // Draw current video frame
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // Get image data for processing
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Enhanced edge detection algorithm
      const edges = [];
      const threshold = 40; // Slightly lower threshold for better detection

      for (let y = 2; y < canvas.height - 2; y += 2) {
        // Skip pixels for performance
        for (let x = 2; x < canvas.width - 2; x += 2) {
          const idx = (y * canvas.width + x) * 4;

          // Calculate gradient using Sobel operator
          const gx =
            data[idx + 4] +
            2 * data[idx + 4] +
            data[idx + canvas.width * 4 + 4] -
            (data[idx - 4] +
              2 * data[idx - 4] +
              data[idx + canvas.width * 4 - 4]);

          const gy =
            data[idx - canvas.width * 4] +
            2 * data[idx - canvas.width * 4] +
            data[idx - canvas.width * 4 + 4] -
            (data[idx + canvas.width * 4] +
              2 * data[idx + canvas.width * 4] +
              data[idx + canvas.width * 4 + 4]);

          const magnitude = Math.sqrt(gx * gx + gy * gy);

          if (magnitude > threshold) {
            edges.push({ x, y, strength: magnitude });
          }
        }
      }

      // Find the best surface (only one)
      const surface = findBestSurface(edges, canvas.width, canvas.height);

      if (surface) {
        // Convert to screen coordinates with mobile-friendly sizing
        const screenSurface = {
          id: Date.now(),
          x: (surface.x / canvas.width) * 100,
          y: (surface.y / canvas.height) * 100,
          width: Math.min(
            window.innerWidth * 0.6, // Maximum 60% of screen width
            Math.max(
              120, // Minimum width
              (surface.width / canvas.width) * window.innerWidth * 0.4
            )
          ),
          height: Math.min(
            window.innerHeight * 0.4, // Maximum 40% of screen height
            Math.max(
              160, // Minimum height
              (surface.height / canvas.height) * window.innerHeight * 0.3
            )
          ),
          confidence: surface.confidence,
        };

        setDetectedSurfaces([screenSurface]); // Only one surface
      } else {
        setDetectedSurfaces([]);
      }

      setIsProcessing(false);
    },
    [isProcessing, setDetectedSurfaces]
  );

  // Find the single best rectangular surface
  const findBestSurface = (edges, width, height) => {
    if (edges.length < 10) return null;

    const surfaces = [];
    const minSurfaceSize = Math.min(width, height) * 0.15; // 15% of smaller dimension
    const gridSize = Math.min(width, height) * 0.2; // 20% of smaller dimension

    // Divide image into fewer, larger grid sections
    const stepSize = Math.floor(gridSize * 0.7);

    for (let y = 0; y < height - gridSize; y += stepSize) {
      for (let x = 0; x < width - gridSize; x += stepSize) {
        const sectionEdges = edges.filter(
          (edge) =>
            edge.x >= x &&
            edge.x < x + gridSize &&
            edge.y >= y &&
            edge.y < y + gridSize
        );

        // Look for sections with good edge density (not too sparse, not too dense)
        if (sectionEdges.length > 8 && sectionEdges.length < 40) {
          // Check for rectangular patterns more strictly
          const leftEdges = sectionEdges.filter(
            (edge) => Math.abs(edge.x - x) < 15
          );
          const rightEdges = sectionEdges.filter(
            (edge) => Math.abs(edge.x - (x + gridSize)) < 15
          );
          const topEdges = sectionEdges.filter(
            (edge) => Math.abs(edge.y - y) < 15
          );
          const bottomEdges = sectionEdges.filter(
            (edge) => Math.abs(edge.y - (y + gridSize)) < 15
          );

          const hasVerticalEdges =
            leftEdges.length > 2 || rightEdges.length > 2;
          const hasHorizontalEdges =
            topEdges.length > 2 || bottomEdges.length > 2;

          if (hasVerticalEdges && hasHorizontalEdges) {
            const avgStrength =
              sectionEdges.reduce((sum, edge) => sum + edge.strength, 0) /
              sectionEdges.length;

            surfaces.push({
              x: x + gridSize / 2,
              y: y + gridSize / 2,
              width: gridSize * 1.2,
              height: gridSize * 1.5,
              confidence: Math.min(0.95, avgStrength / 100),
              edgeCount: sectionEdges.length,
              rectangularity:
                (leftEdges.length +
                  rightEdges.length +
                  topEdges.length +
                  bottomEdges.length) /
                4,
            });
          }
        }
      }
    }

    if (surfaces.length === 0) return null;

    // Sort by confidence and rectangularity, return the best one
    surfaces.sort((a, b) => {
      const scoreA = a.confidence * 0.6 + (a.rectangularity / 10) * 0.4;
      const scoreB = b.confidence * 0.6 + (b.rectangularity / 10) * 0.4;
      return scoreB - scoreA;
    });

    return surfaces[0];
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

      // Mobile-optimized constraints
      const constraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280, max: 1920, min: 480 },
          height: { ideal: 720, max: 1080, min: 360 },
          frameRate: { ideal: 24, max: 30, min: 15 }, // Lower frame rate for better performance
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
          }, 1500); // Slightly longer delay for mobile
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

    // Process every 3 seconds to avoid performance issues on mobile
    const intervalId = setInterval(processFrame, 3000);

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

    if (canvasRef.current && document.body.contains(canvasRef.current)) {
      document.body.removeChild(canvasRef.current);
      canvasRef.current = null;
    }

    setArStream(null);
    setDetectedSurfaces([]);
    setIsProcessing(false);
  }, [arRef, setArStream, setDetectedSurfaces]);

  return { initAR, stopAR };
};
