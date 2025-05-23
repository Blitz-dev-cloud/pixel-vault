import React, { useState } from "react";
import { Monitor, Camera, ExternalLink, ImageIcon } from "lucide-react";

const ArtDetailModal = ({ art, onClose, setCurrentView }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const getImageDisplay = () => {
    // Check if we have an actual image URL from IPFS
    if (art.imageUrl && !imageError) {
      return (
        <div className="relative w-full h-full">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
            </div>
          )}
          <img
            src={art.imageUrl}
            alt={art.title}
            className="w-full h-full object-cover"
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ display: imageLoading ? "none" : "block" }}
          />
          {!imageLoading && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          )}
          {!imageLoading && (
            <div className="absolute bottom-4 right-4 text-white font-bold text-2xl drop-shadow-lg">
              #{art.tokenId}
            </div>
          )}
        </div>
      );
    }

    // Fallback to colored background with token ID
    return (
      <div
        className="w-full h-full flex items-center justify-center text-white relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${art.color}, #000000)`,
        }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 text-center">
          <div className="text-4xl mb-4">#{art.tokenId}</div>
          {imageError && (
            <div className="text-sm text-gray-300 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 mr-2" />
              Image unavailable
            </div>
          )}
        </div>
      </div>
    );
  };

  // Determine if this is a minted NFT (has IPFS data)
  const isMintedNFT =
    art.ipfsHash || art.tokenURI?.startsWith("https://") || art.imageUrl;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
        {/* Image Section */}
        <div className="h-80 relative overflow-hidden">
          {getImageDisplay()}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all z-20"
          >
            ×
          </button>
          {/* IPFS Link for minted NFTs */}
          {isMintedNFT && art.ipfsHash && (
            <a
              href={`https://gateway.pinata.cloud/ipfs/${art.ipfsHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-4 left-4 bg-black/50 hover:bg-black/70 p-2 rounded-full text-white transition-all z-20"
              title="View on IPFS"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          )}
          {/* NFT Type Badge */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                isMintedNFT
                  ? "bg-green-600/80 text-green-100 border border-green-400/30"
                  : "bg-blue-600/80 text-blue-100 border border-blue-400/30"
              }`}
            >
              {isMintedNFT ? "🎨 Minted NFT" : "🖼️ Demo Artwork"}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-3xl font-bold text-white mb-2">
                {art.title}
              </h3>
              <p className="text-gray-400">
                {isMintedNFT ? "Blockchain NFT" : "Demo Gallery Piece"}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                #{art.tokenId}
              </div>
              <div className="text-sm text-gray-400">Token ID</div>
            </div>
          </div>

          <p className="text-gray-300 mb-8 leading-relaxed text-lg">
            {art.description}
          </p>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800/50 p-4 rounded-xl">
              <p className="text-gray-500 mb-1 text-sm">Artist</p>
              <p className="text-white font-semibold">
                {art.artist && art.artist.length > 20
                  ? `${art.artist.slice(0, 8)}...${art.artist.slice(-6)}`
                  : art.artist || "Unknown"}
              </p>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-xl">
              <p className="text-gray-500 mb-1 text-sm">Type</p>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  art.is3D
                    ? "bg-purple-900 text-purple-300"
                    : "bg-blue-900 text-blue-300"
                }`}
              >
                {art.is3D ? "3D Artwork" : "2D Artwork"}
              </span>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-xl">
              <p className="text-gray-500 mb-1 text-sm">Gallery Position</p>
              <p className="text-white font-semibold font-mono">
                ({art.positionX || 0}, {art.positionY || 0},{" "}
                {art.positionZ || 0})
              </p>
            </div>
            {isMintedNFT && art.ipfsHash && (
              <div className="bg-gray-800/50 p-4 rounded-xl">
                <p className="text-gray-500 mb-1 text-sm">IPFS Hash</p>
                <p className="text-white font-mono text-sm">
                  {art.ipfsHash.slice(0, 12)}...{art.ipfsHash.slice(-8)}
                </p>
              </div>
            )}
            {art.mintedAt && (
              <div className="bg-gray-800/50 p-4 rounded-xl">
                <p className="text-gray-500 mb-1 text-sm">Minted</p>
                <p className="text-white font-semibold">
                  {new Date(art.mintedAt).toLocaleDateString()}
                </p>
              </div>
            )}
            {art.tokenURI && (
              <div className="bg-gray-800/50 p-4 rounded-xl">
                <p className="text-gray-500 mb-1 text-sm">Metadata</p>
                <a
                  href={art.tokenURI}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 hover:text-green-300 text-sm flex items-center"
                >
                  View JSON <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            )}
          </div>

          {/* Attributes if available */}
          {art.attributes && art.attributes.length > 0 && (
            <div className="mb-8">
              <h4 className="text-xl font-bold text-white mb-4">Attributes</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {art.attributes.map((attr, index) => (
                  <div key={index} className="bg-gray-800/50 p-3 rounded-lg">
                    <div className="text-gray-400 text-xs uppercase tracking-wide">
                      {attr.trait_type}
                    </div>
                    <div className="text-white font-semibold">{attr.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => {
                setCurrentView("3d");
                onClose();
              }}
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold flex items-center justify-center space-x-2"
            >
              <Monitor className="w-5 h-5" />
              <span>View in 3D Gallery</span>
            </button>
            <button
              onClick={() => {
                setCurrentView("ar");
                onClose();
              }}
              className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white py-4 px-6 rounded-xl hover:from-green-700 hover:to-teal-700 transition-all font-semibold flex items-center justify-center space-x-2"
            >
              <Camera className="w-5 h-5" />
              <span>AR Experience</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtDetailModal;
