import React, { useEffect, useState } from "react";
import {
  Camera,
  Smartphone,
  AlertCircle,
  Wifi,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

const ARView = ({
  arRef,
  arStream,
  detectedSurfaces,
  setCurrentView,
  mockArtPieces, // Your NFT collection
}) => {
  const [nftImages, setNftImages] = useState({});
  const [imageLoadingStates, setImageLoadingStates] = useState({});
  const [selectedNFTIndex, setSelectedNFTIndex] = useState(0);
  const [showNFTSelector, setShowNFTSelector] = useState(false);

  // Get the currently selected NFT
  const selectedNFT = mockArtPieces[selectedNFTIndex] || mockArtPieces[0];

  // Preload NFT images
  useEffect(() => {
    const loadNFTImages = async () => {
      for (const art of mockArtPieces) {
        if (art.imageUrl && !nftImages[art.tokenId]) {
          setImageLoadingStates((prev) => ({
            ...prev,
            [art.tokenId]: "loading",
          }));

          try {
            const img = new Image();
            img.crossOrigin = "anonymous";

            img.onload = () => {
              setNftImages((prev) => ({
                ...prev,
                [art.tokenId]: art.imageUrl,
              }));
              setImageLoadingStates((prev) => ({
                ...prev,
                [art.tokenId]: "loaded",
              }));
            };

            img.onerror = () => {
              console.error(`Failed to load image for NFT ${art.tokenId}`);
              setImageLoadingStates((prev) => ({
                ...prev,
                [art.tokenId]: "error",
              }));
            };

            img.src = art.imageUrl;
          } catch (error) {
            console.error(`Error loading NFT image ${art.tokenId}:`, error);
            setImageLoadingStates((prev) => ({
              ...prev,
              [art.tokenId]: "error",
            }));
          }
        }
      }
    };

    if (mockArtPieces.length > 0) {
      loadNFTImages();
    }
  }, [mockArtPieces, nftImages]);

  const renderSelectedNFTOnSurface = (surface) => {
    if (!selectedNFT) return null;

    const imageUrl = nftImages[selectedNFT.tokenId];
    const loadingState = imageLoadingStates[selectedNFT.tokenId];

    return (
      <div
        key={`${surface.id}-${selectedNFT.tokenId}`}
        className="absolute border-2 border-green-400 bg-black/40 backdrop-blur-sm rounded-xl transition-all duration-500 overflow-hidden"
        style={{
          left: `${surface.x}%`,
          top: `${surface.y}%`,
          width: `${surface.width}px`,
          height: `${surface.height}px`,
          transform: "translate(-50%, -50%)",
          boxShadow: "0 0 20px rgba(34, 197, 94, 0.5)",
        }}
      >
        {/* NFT Image Display */}
        <div className="w-full h-3/4 relative overflow-hidden rounded-t-lg">
          {imageUrl && loadingState === "loaded" ? (
            <img
              src={imageUrl}
              alt={selectedNFT.title}
              className="w-full h-full object-cover"
              style={{
                filter: "brightness(0.9) contrast(1.1)",
              }}
            />
          ) : loadingState === "loading" ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
            </div>
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white font-bold"
              style={{
                background: `linear-gradient(135deg, ${selectedNFT.color}, #000000)`,
              }}
            >
              #{selectedNFT.tokenId}
            </div>
          )}

          {/* IPFS Indicator */}
          {selectedNFT.ipfsHash && (
            <div className="absolute top-2 right-2 bg-green-500/80 rounded-full p-1">
              <Wifi className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* NFT Info */}
        <div className="w-full h-1/4 p-2 bg-black/60">
          <div className="text-white text-xs text-center">
            <div className="font-semibold truncate">{selectedNFT.title}</div>
            <div className="text-green-300 text-[10px] truncate">
              {selectedNFT.artist.length > 15
                ? `${selectedNFT.artist.slice(0, 12)}...`
                : selectedNFT.artist}
            </div>
            {selectedNFT.ipfsHash && (
              <div className="text-gray-400 text-[8px] font-mono">
                {selectedNFT.ipfsHash.slice(0, 8)}...
              </div>
            )}
          </div>
        </div>

        {/* Surface Detection Indicator */}
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
        </div>

        {/* Confidence Indicator */}
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
          <div
            className="h-1 bg-green-400 rounded-full"
            style={{ width: `${(surface.confidence || 0.5) * 40}px` }}
          ></div>
        </div>
      </div>
    );
  };

  const nextNFT = () => {
    setSelectedNFTIndex((prev) => (prev + 1) % mockArtPieces.length);
  };

  const prevNFT = () => {
    setSelectedNFTIndex(
      (prev) => (prev - 1 + mockArtPieces.length) % mockArtPieces.length
    );
  };

  const selectNFT = (index) => {
    setSelectedNFTIndex(index);
    setShowNFTSelector(false);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Video Element */}
      <video
        ref={arRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* Loading State */}
      {!arStream && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
            <p className="text-lg">Initializing AR Camera...</p>
            <p className="text-sm text-gray-400">Preparing surface detection</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-6 left-6 z-10 space-y-4">
        <button
          onClick={() => setCurrentView("home")}
          className="px-6 py-3 bg-black/50 backdrop-blur-md text-white rounded-xl hover:bg-black/70 border border-white/20 transition-all"
        >
          ← Back to Home
        </button>

        <div className="bg-black/50 backdrop-blur-md text-white p-4 rounded-xl border border-white/20">
          <div className="flex items-center space-x-2 mb-2">
            <div
              className={`w-3 h-3 rounded-full ${
                arStream ? "bg-green-400 animate-pulse" : "bg-red-400"
              }`}
            ></div>
            <span className="text-sm font-semibold">
              {arStream ? "AR Active" : "AR Inactive"}
            </span>
          </div>
          <p className="text-xs text-gray-300">
            {detectedSurfaces.length > 0
              ? `${detectedSurfaces.length} surfaces detected`
              : arStream
              ? "Scanning walls..."
              : "Camera not ready"}
          </p>
        </div>
      </div>

      {/* NFT Selection Controls */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 space-y-4">
        {/* Current NFT Display */}
        <div className="bg-black/50 backdrop-blur-md text-white p-3 sm:p-4 rounded-xl border border-white/20 max-w-[280px] sm:max-w-xs w-[calc(100vw-2rem)] sm:w-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-semibold">
              Selected NFT
            </span>
            <button
              onClick={() => setShowNFTSelector(!showNFTSelector)}
              className="text-green-400 hover:text-green-300 text-xs sm:text-sm transition-colors"
            >
              {showNFTSelector ? (
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              ) : (
                "Change"
              )}
            </button>
          </div>
          {selectedNFT && (
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${selectedNFT.color}, #000000)`,
                }}
              >
                #{selectedNFT.tokenId}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate">
                  {selectedNFT.title}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {selectedNFT.artist}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* NFT Navigation */}
        <div className="bg-black/50 backdrop-blur-md text-white p-3 rounded-xl border border-white/20">
          <div className="flex items-center justify-between space-x-2">
            <button
              onClick={prevNFT}
              className="p-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm px-2">
              {selectedNFTIndex + 1} / {mockArtPieces.length}
            </span>
            <button
              onClick={nextNFT}
              className="p-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* NFT Selector Modal */}
      {showNFTSelector && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-[92vw] sm:max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-xl font-bold text-white">
                  Select NFT to Display
                </h3>
                <button
                  onClick={() => setShowNFTSelector(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] sm:max-h-96">
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {mockArtPieces.map((art, index) => (
                  <button
                    key={art.tokenId}
                    onClick={() => selectNFT(index)}
                    className={`p-2 sm:p-3 rounded-xl border-2 transition-all ${
                      index === selectedNFTIndex
                        ? "border-green-400 bg-green-400/10"
                        : "border-gray-600 hover:border-gray-500 bg-gray-800/50"
                    }`}
                  >
                    <div
                      className="w-full h-16 sm:h-20 rounded-lg flex items-center justify-center text-white text-sm font-bold mb-1 sm:mb-2"
                      style={{
                        background: `linear-gradient(135deg, ${art.color}, #000000)`,
                      }}
                    >
                      #{art.tokenId}
                    </div>
                    <p className="text-white text-xs font-medium truncate">
                      {art.title}
                    </p>
                    <p className="text-gray-400 text-xs truncate">
                      {art.artist}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AR Overlays - Selected NFT on All Detected Surfaces */}
      <div className="absolute inset-0 pointer-events-none">
        {detectedSurfaces.map((surface) => renderSelectedNFTOnSurface(surface))}

        {/* Scanning Indicator */}
        {arStream && detectedSurfaces.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-dashed border-green-400 rounded-xl flex items-center justify-center animate-pulse">
              <div className="text-center text-white">
                <Camera className="w-12 h-12 mx-auto mb-4 text-green-400" />
                <p className="text-sm">Point camera at walls</p>
                <p className="text-xs text-gray-300">Detecting surfaces...</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Info Panel */}
      <div className="absolute bottom-6 left-6 right-6 z-10">
        <div className="bg-black/50 backdrop-blur-md text-white p-6 rounded-2xl border border-white/20">
          <h3 className="text-xl font-bold mb-3 flex items-center">
            <Smartphone className="w-6 h-6 mr-2 text-green-400" />
            NFT AR Gallery - {selectedNFT?.title}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-300">
                <strong>Surfaces:</strong> {detectedSurfaces.length} detected
              </p>
            </div>
            <div>
              <p className="text-gray-300">
                <strong>Selected:</strong> {selectedNFT?.title}
              </p>
            </div>
            <div>
              <p className="text-gray-300">
                <strong>Artist:</strong> {selectedNFT?.artist}
              </p>
            </div>
            <div>
              <p className="text-gray-300">
                <strong>Token ID:</strong> #{selectedNFT?.tokenId}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ARView;
