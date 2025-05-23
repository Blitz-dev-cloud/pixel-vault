import React, { useState, useRef } from "react";
import {
  Coins,
  Plus,
  Upload,
  Image,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";

const MintView = ({
  mintForm,
  setMintForm,
  isLoading,
  isConnected,
  handleMintSubmit,
  setCurrentView,
  pinataConfigured = false,
  uploadProgress = 0,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null); // 'uploading', 'success', 'error'
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "model/gltf-binary",
      "model/gltf+json",
    ];
    if (!validTypes.includes(file.type)) {
      alert(
        "Please upload a valid image or 3D model file (JPEG, PNG, GIF, WebP, GLB, GLTF)"
      );
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }

    // Update form with file
    setMintForm({ ...mintForm, artworkFile: file });

    // Auto-detect if it's a 3D file
    const is3D =
      file.type.includes("gltf") || file.name.toLowerCase().includes(".glb");
    if (is3D) {
      setMintForm((prev) => ({ ...prev, artworkFile: file, is3D: true }));
    }
  };

  const removeFile = () => {
    setMintForm({ ...mintForm, artworkFile: null });
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const generateTokenURIFromIPFS = () => {
    if (mintForm.ipfsHash) {
      const tokenURI = `https://gateway.pinata.cloud/ipfs/${mintForm.ipfsHash}`;
      setMintForm({ ...mintForm, tokenURI });
    }
  };

  // Enhanced form submission with file upload
  const handleEnhancedSubmit = async () => {
    if (!pinataConfigured && mintForm.artworkFile) {
      alert("Please configure Pinata IPFS to upload files");
      return;
    }

    if (!mintForm.artworkFile && !mintForm.ipfsHash) {
      alert("Please either upload a file or provide an IPFS hash");
      return;
    }

    setUploadStatus("uploading");

    try {
      const fakeEvent = { preventDefault: () => {} };
      await handleMintSubmit(fakeEvent);
      setUploadStatus("success");
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (error) {
      setUploadStatus("error");
      setTimeout(() => setUploadStatus(null), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-4xl font-bold text-white">Create New NFT</h2>
          <button
            onClick={() => setCurrentView("home")}
            className="px-6 py-3 bg-white/10 backdrop-blur-md text-white rounded-xl hover:bg-white/20 border border-white/20 transition-all"
          >
            ← Back
          </button>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-10 border border-white/20 shadow-2xl">
          <div className="space-y-8">
            {/* File Upload Section */}
            <div className="space-y-4">
              <label className="block text-white text-sm font-bold mb-3">
                Artwork File{" "}
                {pinataConfigured ? "*" : "(Configure Pinata IPFS first)"}
              </label>

              <div
                className={`relative border-2 border-dashed rounded-2xl p-8 transition-all ${
                  dragActive
                    ? "border-purple-400 bg-purple-400/10"
                    : "border-white/30 hover:border-white/50"
                } ${
                  !pinataConfigured
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() =>
                  pinataConfigured && fileInputRef.current?.click()
                }
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.glb,.gltf"
                  onChange={handleFileInput}
                  className="hidden"
                  disabled={!pinataConfigured}
                />

                {mintForm.artworkFile ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                          <Image className="w-8 h-8 text-white/60" />
                        </div>
                      )}
                      <div>
                        <p className="text-white font-medium">
                          {mintForm.artworkFile.name}
                        </p>
                        <p className="text-white/60 text-sm">
                          {(mintForm.artworkFile.size / 1024 / 1024).toFixed(2)}{" "}
                          MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile();
                      }}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-red-300" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-white/60 mx-auto mb-4" />
                    <p className="text-white text-lg mb-2">
                      {pinataConfigured
                        ? "Drop your artwork here or click to browse"
                        : "Pinata IPFS not configured"}
                    </p>
                    <p className="text-white/60 text-sm">
                      Supports: JPEG, PNG, GIF, WebP, GLB, GLTF (max 10MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Upload Progress */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm">
                      Uploading to IPFS...
                    </span>
                    <span className="text-white text-sm">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Upload Status */}
              {uploadStatus && (
                <div
                  className={`flex items-center space-x-2 p-3 rounded-xl ${
                    uploadStatus === "success"
                      ? "bg-green-500/20 text-green-300"
                      : uploadStatus === "error"
                      ? "bg-red-500/20 text-red-300"
                      : "bg-blue-500/20 text-blue-300"
                  }`}
                >
                  {uploadStatus === "success" && (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  {uploadStatus === "error" && (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  {uploadStatus === "uploading" && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                  )}
                  <span className="text-sm">
                    {uploadStatus === "success" && "Upload successful!"}
                    {uploadStatus === "error" &&
                      "Upload failed. Please try again."}
                    {uploadStatus === "uploading" && "Uploading to IPFS..."}
                  </span>
                </div>
              )}
            </div>

            {/* Existing Form Fields */}
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <label className="block text-white text-sm font-bold mb-3">
                  Artwork Title *
                </label>
                <input
                  type="text"
                  value={mintForm.title}
                  onChange={(e) =>
                    setMintForm({ ...mintForm, title: e.target.value })
                  }
                  className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                  placeholder="Enter your artwork's title"
                  required
                />
              </div>
              <div>
                <label className="block text-white text-sm font-bold mb-3">
                  IPFS Hash {!pinataConfigured && "*"}
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={mintForm.ipfsHash}
                    onChange={(e) =>
                      setMintForm({ ...mintForm, ipfsHash: e.target.value })
                    }
                    className="flex-1 px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                    placeholder="QmX... (auto-filled after upload)"
                    required={!pinataConfigured}
                  />
                  {mintForm.ipfsHash && (
                    <button
                      type="button"
                      onClick={generateTokenURIFromIPFS}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors text-sm"
                      title="Generate Token URI from IPFS Hash"
                    >
                      Generate URI
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-white text-sm font-bold mb-3">
                Description *
              </label>
              <textarea
                value={mintForm.description}
                onChange={(e) =>
                  setMintForm({ ...mintForm, description: e.target.value })
                }
                className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all h-32 resize-none"
                placeholder="Describe your artwork, its inspiration, and unique features"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm font-bold mb-3">
                Token URI {!pinataConfigured && "*"}
              </label>
              <input
                type="url"
                value={mintForm.tokenURI}
                onChange={(e) =>
                  setMintForm({ ...mintForm, tokenURI: e.target.value })
                }
                className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                placeholder="https://gateway.pinata.cloud/ipfs/... (auto-filled after upload)"
                required={!pinataConfigured}
              />
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="is3D"
                checked={mintForm.is3D}
                onChange={(e) =>
                  setMintForm({ ...mintForm, is3D: e.target.checked })
                }
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 bg-white/10 border-white/20"
              />
              <label
                htmlFor="is3D"
                className="text-white text-sm font-semibold"
              >
                This artwork supports 3D viewing
                {mintForm.artworkFile &&
                  (mintForm.artworkFile.type.includes("gltf") ||
                    mintForm.artworkFile.name
                      .toLowerCase()
                      .includes(".glb")) && (
                    <span className="ml-2 text-green-300 text-xs">
                      (Auto-detected)
                    </span>
                  )}
              </label>
            </div>

            {/* Pinata Status Warning */}
            {!pinataConfigured && (
              <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-2xl p-6">
                <div className="flex items-center text-yellow-200 mb-3">
                  <AlertCircle className="w-6 h-6 mr-3" />
                  <span className="text-lg font-bold">
                    IPFS Configuration Required
                  </span>
                </div>
                <p className="text-yellow-300 text-sm mb-3">
                  To upload files directly to IPFS, you need to configure your
                  Pinata JWT token. Without it, you'll need to manually provide
                  the IPFS hash and token URI.
                </p>
                <p className="text-yellow-300 text-xs">
                  Click the "IPFS: Not Configured" button in the top-right
                  corner to set up Pinata.
                </p>
              </div>
            )}

            {/* Minting Information */}
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-2xl p-6">
              <div className="flex items-center text-purple-200 mb-3">
                <Coins className="w-6 h-6 mr-3" />
                <span className="text-lg font-bold">Minting Information</span>
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-purple-300 mb-1">Minting Fee:</p>
                  <p className="text-white font-semibold">0.001 ETH</p>
                </div>
                <div>
                  <p className="text-purple-300 mb-1">Network:</p>
                  <p className="text-white font-semibold">Ethereum Mainnet</p>
                </div>
              </div>
              <p className="text-xs text-purple-300 mt-3">
                This fee covers gas costs, IPFS storage, and platform
                maintenance
              </p>
            </div>

            <button
              type="button"
              onClick={handleEnhancedSubmit}
              disabled={
                isLoading || !isConnected || uploadStatus === "uploading"
              }
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-5 px-8 rounded-2xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none shadow-2xl"
            >
              {isLoading || uploadStatus === "uploading" ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>
                    {uploadStatus === "uploading"
                      ? "Uploading to IPFS..."
                      : "Minting NFT..."}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3">
                  <Plus className="w-6 h-6" />
                  <span>Mint NFT</span>
                </div>
              )}
            </button>

            {!isConnected && (
              <div className="text-center">
                <p className="text-yellow-300 text-sm">
                  ⚠️ Please connect your wallet to mint NFTs
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MintView;
