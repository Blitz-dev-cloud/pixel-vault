import React, { useEffect, useState } from "react";
import {
  Camera,
  Smartphone,
  AlertCircle,
  Wifi,
  ChevronLeft,
  ChevronRight,
  X,
  MousePointer,
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

  // New state for click-to-place functionality
  const [placedNFTs, setPlacedNFTs] = useState([]);
  const [isPlacementMode, setIsPlacementMode] = useState(false);

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

  // Handle click to place NFT
  const handleScreenClick = (event) => {
    if (!isPlacementMode || !selectedNFT) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    // Create a new placed NFT
    const newPlacedNFT = {
      id: Date.now() + Math.random(), // Unique ID
      nft: { ...selectedNFT },
      x: x,
      y: y,
      confidence: 1.0, // High confidence for manually placed items
    };

    setPlacedNFTs((prev) => [...prev, newPlacedNFT]);
    setIsPlacementMode(false); // Exit placement mode after placing
  };

  // Remove a placed NFT
  const removePlacedNFT = (id) => {
    setPlacedNFTs((prev) => prev.filter((nft) => nft.id !== id));
  };

  // Clear all placed NFTs
  const clearAllNFTs = () => {
    setPlacedNFTs([]);
  };

  const renderNFTDisplay = (nft, position, id, isPlaced = false) => {
    const imageUrl = nftImages[nft.tokenId];
    const loadingState = imageLoadingStates[nft.tokenId];

    // Mobile-responsive sizing
    const isMobile = window.innerWidth <= 768;
    const baseWidth = isMobile ? 140 : 180;
    const baseHeight = isMobile ? 180 : 220;

    return (
      <div
        key={id}
        className={`absolute border-2 ${
          isPlaced ? "border-blue-400" : "border-green-400"
        } bg-black/40 backdrop-blur-sm rounded-lg transition-all duration-500 overflow-hidden group`}
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          width: `${Math.min(baseWidth, window.innerWidth * 0.5)}px`,
          height: `${Math.min(baseHeight, window.innerHeight * 0.35)}px`,
          transform: "translate(-50%, -50%)",
          boxShadow: `0 0 15px rgba(${
            isPlaced ? "59, 130, 246" : "34, 197, 94"
          }, 0.4)`,
          maxWidth: isMobile ? "140px" : "200px",
          maxHeight: isMobile ? "180px" : "240px",
          minWidth: "100px",
          minHeight: "130px",
          cursor: isPlaced ? "pointer" : "default",
        }}
        onClick={
          isPlaced
            ? (e) => {
                e.stopPropagation();
                removePlacedNFT(id);
              }
            : undefined
        }
      >
        {/* NFT Image Display */}
        <div className="w-full h-3/4 relative overflow-hidden rounded-t-lg">
          {imageUrl && loadingState === "loaded" ? (
            <img
              src={imageUrl}
              alt={nft.title}
              className="w-full h-full object-cover"
              style={{
                filter: "brightness(0.9) contrast(1.1)",
              }}
            />
          ) : loadingState === "loading" ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-400"></div>
            </div>
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white font-bold text-xs"
              style={{
                background: `linear-gradient(135deg, ${nft.color}, #000000)`,
              }}
            >
              #{nft.tokenId}
            </div>
          )}

          {/* IPFS Indicator */}
          {nft.ipfsHash && (
            <div className="absolute top-1 right-1 bg-green-500/80 rounded-full p-1">
              <Wifi className="w-2 h-2 text-white" />
            </div>
          )}

          {/* Remove button for placed NFTs */}
          {isPlaced && (
            <div className="absolute top-1 left-1 bg-red-500/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <X className="w-2 h-2 text-white" />
            </div>
          )}
        </div>

        {/* NFT Info */}
        <div className="w-full h-1/4 p-1.5 bg-black/60">
          <div className="text-white text-center">
            <div className="font-semibold truncate text-xs leading-tight">
              {nft.title.length > 12
                ? `${nft.title.slice(0, 12)}...`
                : nft.title}
            </div>
            <div className="text-green-300 text-[10px] truncate leading-tight">
              {nft.artist.length > 15
                ? `${nft.artist.slice(0, 12)}...`
                : nft.artist}
            </div>
            {nft.ipfsHash && (
              <div className="text-gray-400 text-[8px] font-mono truncate">
                {nft.ipfsHash.slice(0, 6)}...
              </div>
            )}
          </div>
        </div>

        {/* Status Indicator */}
        <div
          className={`absolute -top-1 -right-1 w-4 h-4 ${
            isPlaced ? "bg-blue-400" : "bg-green-400"
          } rounded-full flex items-center justify-center`}
        >
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
        </div>

        {/* Confidence Indicator */}
        <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2">
          <div
            className={`h-0.5 ${
              isPlaced ? "bg-blue-400" : "bg-green-400"
            } rounded-full`}
            style={{
              width: `${Math.max(20, (position.confidence || 0.5) * 40)}px`,
            }}
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

      {/* Clickable overlay for placement */}
      <div
        className={`absolute inset-0 z-5 ${
          isPlacementMode ? "cursor-crosshair bg-blue-500/10" : ""
        }`}
        onClick={handleScreenClick}
      />

      {/* Loading State */}
      {!arStream && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center text-white px-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
            <p className="text-lg">Initializing AR Camera...</p>
            <p className="text-sm text-gray-400">Preparing surface detection</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 space-y-3">
        <button
          onClick={() => setCurrentView("home")}
          className="px-4 py-2 bg-black/50 backdrop-blur-md text-white rounded-lg hover:bg-black/70 border border-white/20 transition-all text-sm"
        >
          ← Back
        </button>

        <div className="bg-black/50 backdrop-blur-md text-white p-3 rounded-lg border border-white/20 max-w-[200px]">
          <div className="flex items-center space-x-2 mb-1">
            <div
              className={`w-2 h-2 rounded-full ${
                arStream ? "bg-green-400 animate-pulse" : "bg-red-400"
              }`}
            ></div>
            <span className="text-xs font-semibold">
              {arStream ? "AR Active" : "AR Inactive"}
            </span>
          </div>
          <p className="text-xs text-gray-300 leading-tight">
            Manual placement mode
          </p>
        </div>

        {/* Placement Controls */}
        <div className="bg-black/50 backdrop-blur-md text-white p-3 rounded-lg border border-white/20 space-y-2">
          <button
            onClick={() => setIsPlacementMode(!isPlacementMode)}
            className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              isPlacementMode
                ? "bg-blue-500 hover:bg-blue-600 text-white"
                : "bg-gray-700/50 hover:bg-gray-600/50 text-gray-300"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <MousePointer className="w-3 h-3" />
              <span>{isPlacementMode ? "Cancel" : "Place NFT"}</span>
            </div>
          </button>

          {placedNFTs.length > 0 && (
            <button
              onClick={clearAllNFTs}
              className="w-full px-3 py-1.5 bg-red-600/50 hover:bg-red-600/70 text-white rounded-lg text-xs transition-all"
            >
              Clear All ({placedNFTs.length})
            </button>
          )}
        </div>
      </div>

      {/* NFT Selection Controls */}
      <div className="absolute top-4 right-4 z-10 space-y-3">
        {/* Current NFT Display */}
        <div className="bg-black/50 backdrop-blur-md text-white p-3 rounded-lg border border-white/20 max-w-[250px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold">Selected NFT</span>
            <button
              onClick={() => setShowNFTSelector(!showNFTSelector)}
              className="text-green-400 hover:text-green-300 text-xs transition-colors"
            >
              {showNFTSelector ? <X className="w-3 h-3" /> : "Change"}
            </button>
          </div>
          {selectedNFT && (
            <div className="flex items-center space-x-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${selectedNFT.color}, #000000)`,
                }}
              >
                #{selectedNFT.tokenId}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">
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
        <div className="bg-black/50 backdrop-blur-md text-white p-2 rounded-lg border border-white/20">
          <div className="flex items-center justify-between space-x-2">
            <button
              onClick={prevNFT}
              className="p-1.5 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-all"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <span className="text-xs px-2">
              {selectedNFTIndex + 1}/{mockArtPieces.length}
            </span>
            <button
              onClick={nextNFT}
              className="p-1.5 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-all"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* NFT Selector Modal */}
      {showNFTSelector && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Select NFT</h3>
                <button
                  onClick={() => setShowNFTSelector(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-96">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {mockArtPieces.map((art, index) => (
                  <button
                    key={art.tokenId}
                    onClick={() => selectNFT(index)}
                    className={`p-2 rounded-lg border-2 transition-all ${
                      index === selectedNFTIndex
                        ? "border-green-400 bg-green-400/10"
                        : "border-gray-600 hover:border-gray-500 bg-gray-800/50"
                    }`}
                  >
                    <div
                      className="w-full h-16 rounded-lg flex items-center justify-center text-white text-sm font-bold mb-1"
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

      {/* AR Overlays */}
      <div className="absolute inset-0 pointer-events-none z-8">
        {/* Render manually placed NFTs only */}
        {placedNFTs.map((placedNFT) =>
          renderNFTDisplay(placedNFT.nft, placedNFT, placedNFT.id, true)
        )}

        {/* Scanning Indicator */}
        {arStream && placedNFTs.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <div className="w-48 h-48 sm:w-64 sm:h-64 border-2 border-dashed border-blue-400 rounded-xl flex items-center justify-center animate-pulse">
              <div className="text-center text-white">
                <MousePointer className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-4 text-blue-400" />
                <p className="text-sm">Click "Place NFT" to start</p>
                <p className="text-xs text-gray-300">Manual placement only</p>
              </div>
            </div>
          </div>
        )}

        {/* Placement Mode Indicator */}
        {isPlacementMode && (
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <div className="bg-blue-500/20 border-2 border-dashed border-blue-400 rounded-xl p-6 text-center">
              <MousePointer className="w-12 h-12 mx-auto mb-4 text-blue-400 animate-bounce" />
              <p className="text-white text-lg font-semibold mb-2">
                Click to Place NFT
              </p>
              <p className="text-blue-300 text-sm">
                Tap anywhere on the screen
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Info Panel - Mobile Optimized */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="bg-black/50 backdrop-blur-md text-white p-3 sm:p-4 rounded-xl border border-white/20">
          <h3 className="text-sm sm:text-lg font-bold mb-2 flex items-center">
            <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-400" />
            NFT AR Gallery
          </h3>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-gray-300 truncate">
                <strong>NFT:</strong> {selectedNFT?.title || "None"}
              </p>
            </div>
            <div>
              <p className="text-gray-300">
                <strong>Placed:</strong> {placedNFTs.length}
              </p>
            </div>
            <div>
              <p className="text-gray-300">
                <strong>Mode:</strong> Manual
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ARView;
