import React, { useState } from "react";
import { MapPin, ExternalLink, Image as ImageIcon } from "lucide-react";

const GalleryView = ({
  artPieces,
  setCurrentView,
  setSelectedArt,
  loadArtFromIPFS,
  contractInfo,
}) => {
  const [imageErrors, setImageErrors] = useState({});
  const [imageLoading, setImageLoading] = useState({});

  const handleImageError = (tokenId) => {
    setImageErrors((prev) => ({ ...prev, [tokenId]: true }));
    setImageLoading((prev) => ({ ...prev, [tokenId]: false }));
  };

  const handleImageLoad = (tokenId) => {
    setImageLoading((prev) => ({ ...prev, [tokenId]: false }));
    setImageErrors((prev) => ({ ...prev, [tokenId]: false }));
  };

  const handleImageLoadStart = (tokenId) => {
    setImageLoading((prev) => ({ ...prev, [tokenId]: true }));
  };

  const getImageDisplay = (art) => {
    const hasError = imageErrors[art.tokenId];
    const isLoading = imageLoading[art.tokenId];

    if (art.imageUrl && !hasError) {
      return (
        <div className="relative w-full h-full">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
            </div>
          )}
          <img
            src={art.imageUrl}
            alt={art.title}
            className="w-full h-full object-cover"
            onLoad={() => handleImageLoad(art.tokenId)}
            onError={() => handleImageError(art.tokenId)}
            onLoadStart={() => handleImageLoadStart(art.tokenId)}
            style={{ display: isLoading ? "none" : "block" }}
          />
          {!isLoading && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          )}
          {!isLoading && (
            <div className="absolute bottom-2 left-2 text-white font-bold text-lg drop-shadow-lg">
              #{art.tokenId}
            </div>
          )}
        </div>
      );
    }

    // Fallback to colored background with token ID
    return (
      <div
        className="w-full h-full flex items-center justify-center text-white text-xl font-bold relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${art.color}, #000000)`,
        }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 text-center">
          <div className="text-2xl mb-2">#{art.tokenId}</div>
          {hasError && (
            <div className="text-xs text-gray-300 flex items-center justify-center">
              <ImageIcon className="w-4 h-4 mr-1" />
              Image unavailable
            </div>
          )}
        </div>
      </div>
    );
  };

  // Separate contract NFTs from mock data for better organization
  const contractNFTs = artPieces.filter(
    (art) => art.ipfsHash || art.tokenURI?.startsWith("https://")
  );
  const mockNFTs = artPieces.filter(
    (art) => !art.ipfsHash && !art.tokenURI?.startsWith("https://")
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-4xl font-bold text-white mb-2">
              Digital Art Collection
            </h2>
            <div className="flex gap-4 text-sm text-gray-400">
              <span>Total: {artPieces.length} pieces</span>
              {contractNFTs.length > 0 && (
                <span className="text-green-400">
                  • {contractNFTs.length} minted NFTs
                </span>
              )}
              {mockNFTs.length > 0 && (
                <span className="text-blue-400">
                  • {mockNFTs.length} demo pieces
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setCurrentView("home")}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all flex items-center space-x-2"
          >
            <span>← Back</span>
          </button>
        </div>

        {/* Minted NFTs Section */}
        {contractNFTs.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-green-400 mb-6 flex items-center">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
              Minted NFTs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {contractNFTs.map((art) => (
                <div
                  key={art.tokenId}
                  className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden hover:shadow-green-500/20 transition-all transform hover:scale-105 border border-green-500/30"
                >
                  <div className="h-56 relative overflow-hidden">
                    {getImageDisplay(art)}
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-white flex-1 mr-2">
                        {art.title}
                      </h3>
                      {art.ipfsHash && (
                        <a
                          href={`https://gateway.pinata.cloud/ipfs/${art.ipfsHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-400 hover:text-green-300 transition-colors"
                          title="View on IPFS"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {art.description}
                    </p>
                    <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                      <span>
                        Artist:{" "}
                        {art.artist.length > 10
                          ? `${art.artist.slice(0, 6)}...${art.artist.slice(
                              -4
                            )}`
                          : art.artist}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full ${
                          art.is3D
                            ? "bg-purple-900 text-purple-300"
                            : "bg-blue-900 text-blue-300"
                        }`}
                      >
                        {art.is3D ? "3D" : "2D"}
                      </span>
                    </div>
                    {art.ipfsHash && (
                      <div className="text-xs text-gray-500 mb-4 font-mono">
                        IPFS: {art.ipfsHash.slice(0, 8)}...
                        {art.ipfsHash.slice(-8)}
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setSelectedArt(art)}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold"
                      >
                        View Details
                      </button>
                      <button className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl transition-all">
                        <MapPin className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Demo/Mock NFTs Section */}
        {mockNFTs.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold text-blue-400 mb-6 flex items-center">
              <div className="w-3 h-3 bg-blue-400 rounded-full mr-3"></div>
              Demo Gallery
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {mockNFTs.map((art) => (
                <div
                  key={art.tokenId}
                  className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden hover:shadow-purple-500/20 transition-all transform hover:scale-105 border border-gray-700"
                >
                  <div className="h-56 relative overflow-hidden">
                    {getImageDisplay(art)}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-3">
                      {art.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {art.description}
                    </p>
                    <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                      <span>
                        Artist:{" "}
                        {art.artist.length > 10
                          ? `${art.artist.slice(0, 6)}...${art.artist.slice(
                              -4
                            )}`
                          : art.artist}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full ${
                          art.is3D
                            ? "bg-purple-900 text-purple-300"
                            : "bg-blue-900 text-blue-300"
                        }`}
                      >
                        {art.is3D ? "3D" : "2D"}
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setSelectedArt(art)}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-semibold"
                      >
                        View Details
                      </button>
                      <button className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl transition-all">
                        <MapPin className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {artPieces.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              No Art Pieces Found
            </h3>
            <p className="text-gray-400 mb-6">
              Start by minting your first NFT!
            </p>
            <button
              onClick={() => setCurrentView("mint")}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-semibold"
            >
              Mint Your First NFT
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryView;
