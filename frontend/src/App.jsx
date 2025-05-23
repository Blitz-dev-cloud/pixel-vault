import React, { useState, useEffect, useRef } from "react";
import { BrowserProvider, Contract, parseEther, formatEther } from "ethers";
import { mockArtPieces } from "./constants/data.js";
import { useThreeJS } from "./hooks/useThreeJS.jsx";
import { useAR } from "./hooks/useAR.jsx";
import { usePinata } from "./utils/pinataService.js";
import HomeView from "./components/HomeView.jsx";
import GalleryView from "./components/GalleryView.jsx";
import ThreeDView from "./components/ThreeDView.jsx";
import ARView from "./components/ARView.jsx";
import MintView from "./components/MintView.jsx";
import ArtDetailModal from "./components/ArtDetailModal.jsx";
// Fix the ABI import - it should be the ABI array, not the entire JSON
import contractABIData from "./abis/ArtGalleryNFT.json";
import "./App.css";

// Extract the ABI array from the imported JSON
const contractABI = contractABIData.abi || contractABIData;

// Replace with your deployed contract address
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

const App = () => {
  const [currentView, setCurrentView] = useState("home");
  const [artPieces, setArtPieces] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedArt, setSelectedArt] = useState(null);
  const [arStream, setArStream] = useState(null);
  const [detectedSurfaces, setDetectedSurfaces] = useState([]);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [contractInfo, setContractInfo] = useState({
    mintingFee: "0.001",
    maxSupply: 1000,
    currentTokenId: 0,
  });
  const [mintForm, setMintForm] = useState({
    title: "",
    description: "",
    ipfsHash: "",
    tokenURI: "",
    is3D: false,
    artworkFile: null,
  });

  // Pinata configuration - In production, store JWT securely
  const [pinataJWT, setPinataJWT] = useState(
    import.meta.env.VITE_PINATA_JWT || ""
  );
  const [showPinataConfig, setShowPinataConfig] = useState(false);

  const canvasRef = useRef(null);
  const arRef = useRef(null);

  // Initialize Three.js
  const { init3DGallery } = useThreeJS(canvasRef, artPieces);

  // Initialize AR
  const { initAR, stopAR } = useAR(arRef, setArStream, setDetectedSurfaces);

  // Initialize Pinata
  const {
    uploadArtwork,
    retrieveArtwork,
    testConnection,
    isUploading,
    uploadProgress,
    error: pinataError,
    clearError,
  } = usePinata(pinataJWT);

  // Initialize contract connection
  // Replace your existing initializeContract function with this enhanced version:

  const initializeContract = async (signerInstance) => {
    try {
      // First check environment variables
      if (!CONTRACT_ADDRESS) {
        console.error("❌ CONTRACT_ADDRESS not set in environment variables");
        console.log("💡 Add VITE_CONTRACT_ADDRESS to your .env file");
        throw new Error("Contract address not configured");
      }

      if (!contractABI || !Array.isArray(contractABI)) {
        console.error("❌ Invalid contract ABI");
        console.log("💡 Check your ABI import and ensure it's an array");
        throw new Error("Invalid contract ABI");
      }

      console.log("🔧 Contract Configuration:");
      console.log("  Address:", CONTRACT_ADDRESS);
      console.log("  ABI functions:", contractABI.length);

      // Check if contract exists
      const provider = signerInstance.provider;
      const network = await provider.getNetwork();
      console.log(
        "🌐 Network:",
        network.name,
        `(Chain ID: ${network.chainId})`
      );

      const bytecode = await provider.getCode(CONTRACT_ADDRESS);
      console.log("📋 Contract bytecode length:", bytecode.length);

      if (bytecode === "0x" || bytecode.length <= 2) {
        console.error("❌ NO CONTRACT FOUND at address:", CONTRACT_ADDRESS);
        console.log("🔍 Possible issues:");
        console.log("  - Contract not deployed on this network");
        console.log("  - Wrong contract address");
        console.log("  - Connected to wrong network");
        throw new Error(
          `No contract found at address ${CONTRACT_ADDRESS} on network ${network.name}`
        );
      }

      console.log("✅ Contract exists at address");

      // Create contract instance
      const contractInstance = new Contract(
        CONTRACT_ADDRESS,
        contractABI,
        signerInstance
      );

      // Test critical functions with timeout
      console.log("🧪 Testing critical contract functions...");

      const timeout = (ms) =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Function call timeout")), ms)
        );

      try {
        const [mintingFee, currentTokenId] = await Promise.race([
          Promise.all([
            contractInstance.mintingFee(),
            contractInstance.getCurrentTokenId(),
          ]),
          timeout(15000), // 15 second timeout
        ]);

        console.log("✅ Contract functions working:");
        console.log("  Minting Fee:", formatEther(mintingFee), "ETH");
        console.log("  Current Token ID:", currentTokenId.toString());

        setContract(contractInstance);
        setContractInfo((prev) => ({
          ...prev,
          mintingFee: formatEther(mintingFee),
          currentTokenId: currentTokenId.toString(),
        }));

        return contractInstance;
      } catch (functionError) {
        console.error("❌ Critical functions failed:", functionError);

        if (functionError.message.includes("could not decode result data")) {
          console.log("🔍 This usually means:");
          console.log("  1. Contract doesn't exist on current network");
          console.log("  2. ABI doesn't match the deployed contract");
          console.log("  3. Function signatures have changed");
        }

        throw new Error(
          `Contract functions not working: ${functionError.message}`
        );
      }
    } catch (error) {
      console.error("❌ Contract initialization failed:", error);
      throw error;
    }
  };

  // Helper function to fetch IPFS metadata
  const fetchIPFSMetadata = async (tokenURI, ipfsHash) => {
    let metadata = null;
    let imageUrl = null;

    try {
      // First try to fetch from tokenURI (full metadata)
      if (tokenURI && tokenURI.startsWith("https://")) {
        console.log(`Fetching metadata from tokenURI: ${tokenURI}`);
        const response = await fetch(tokenURI);
        if (response.ok) {
          metadata = await response.json();
          console.log("Fetched metadata from tokenURI:", metadata);

          // Extract image URL from metadata
          if (metadata.image) {
            if (metadata.image.startsWith("ipfs://")) {
              imageUrl = `https://gateway.pinata.cloud/ipfs/${metadata.image.replace(
                "ipfs://",
                ""
              )}`;
            } else if (metadata.image.startsWith("https://")) {
              imageUrl = metadata.image;
            } else {
              imageUrl = `https://gateway.pinata.cloud/ipfs/${metadata.image}`;
            }
          }
        }
      }

      // If no metadata from tokenURI, try direct IPFS hash
      if (!metadata && ipfsHash) {
        console.log(`Fetching from IPFS hash: ${ipfsHash}`);

        // Try different IPFS gateways
        const gateways = [
          `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
          `https://ipfs.io/ipfs/${ipfsHash}`,
          `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
        ];

        for (const gateway of gateways) {
          try {
            const response = await fetch(gateway);
            if (response.ok) {
              const contentType = response.headers.get("content-type");

              if (contentType && contentType.includes("application/json")) {
                // It's JSON metadata
                metadata = await response.json();
                console.log(`Fetched metadata from ${gateway}:`, metadata);

                if (metadata.image) {
                  if (metadata.image.startsWith("ipfs://")) {
                    imageUrl = `https://gateway.pinata.cloud/ipfs/${metadata.image.replace(
                      "ipfs://",
                      ""
                    )}`;
                  } else if (metadata.image.startsWith("https://")) {
                    imageUrl = metadata.image;
                  } else {
                    imageUrl = `https://gateway.pinata.cloud/ipfs/${metadata.image}`;
                  }
                }
                break;
              } else if (contentType && contentType.startsWith("image/")) {
                // It's a direct image
                imageUrl = gateway;
                console.log(`Found direct image at ${gateway}`);
                break;
              }
            }
          } catch (gatewayError) {
            console.log(
              `Failed to fetch from ${gateway}:`,
              gatewayError.message
            );
          }
        }
      }

      // If still no image URL, use IPFS hash directly
      if (!imageUrl && ipfsHash) {
        imageUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      }
    } catch (error) {
      console.error("Error fetching IPFS metadata:", error);
    }

    return { metadata, imageUrl };
  };

  // Load art pieces from contract
  // Load art pieces from contract - FIXED VERSION
  const loadArtPiecesFromContract = async (contractInstance = contract) => {
    if (!contractInstance) {
      console.log("No contract instance available, using mock data");
      setArtPieces(mockArtPieces);
      return;
    }

    try {
      setIsLoading(true);
      console.log("Loading art pieces from contract...");

      // Get the current token ID to determine how many NFTs exist
      const currentTokenId = await contractInstance.getCurrentTokenId();
      const totalNFTs = parseInt(currentTokenId.toString());

      console.log(`Total NFTs minted: ${totalNFTs}`);

      if (totalNFTs === 0) {
        console.log("No NFTs found in contract, using mock data");
        setArtPieces(mockArtPieces);
        return;
      }

      // Load each NFT individually
      const loadedArtPieces = [];

      for (let tokenId = 1; tokenId <= totalNFTs; tokenId++) {
        try {
          console.log(`Loading NFT ${tokenId}...`);

          // Get token URI (this is standard ERC721)
          const tokenURI = await contractInstance.tokenURI(tokenId);

          console.log(`NFT ${tokenId} tokenURI:`, tokenURI);

          // Get art data from the public mapping (this creates a getter function)
          let artData = null;
          try {
            artData = await contractInstance.artPieces(tokenId);
            console.log(`NFT ${tokenId} contract data:`, {
              tokenId: artData.tokenId.toString(),
              title: artData.title,
              description: artData.description,
              ipfsHash: artData.ipfsHash,
              artist: artData.artist,
              mintedAt: artData.mintedAt.toString(),
              is3D: artData.is3D,
              positionX: artData.positionX.toString(),
              positionY: artData.positionY.toString(),
              positionZ: artData.positionZ.toString(),
            });
          } catch (artDataError) {
            console.error(
              `Could not get art data for token ${tokenId}:`,
              artDataError.message
            );
          }

          // Fetch IPFS metadata and image
          const { metadata, imageUrl } = await fetchIPFSMetadata(
            tokenURI,
            artData?.ipfsHash || ""
          );

          const formattedPiece = {
            tokenId: tokenId.toString(),
            title: artData?.title || metadata?.name || `NFT #${tokenId}`,
            description:
              artData?.description ||
              metadata?.description ||
              "No description available",
            ipfsHash: artData?.ipfsHash || "",
            artist:
              metadata?.artist ||
              (artData?.artist ? artData.artist : "Unknown Artist"),
            mintedAt: artData?.mintedAt
              ? parseInt(artData.mintedAt.toString()) * 1000
              : Date.now(),
            is3D: artData?.is3D || metadata?.is3D || false,
            positionX: artData?.positionX
              ? parseInt(artData.positionX.toString())
              : Math.floor(Math.random() * 10),
            positionY: artData?.positionY
              ? parseInt(artData.positionY.toString())
              : Math.floor(Math.random() * 10),
            positionZ: artData?.positionZ
              ? parseInt(artData.positionZ.toString())
              : Math.floor(Math.random() * 10),
            color: `hsl(${(tokenId * 137.5) % 360}, 70%, 60%)`,
            imageUrl: imageUrl || "",
            tokenURI: tokenURI,
            metadataUrl: tokenURI,
            ipfsMetadata: metadata,
            // Add additional metadata fields if available
            attributes: metadata?.attributes || [],
            external_url: metadata?.external_url || "",
            animation_url: metadata?.animation_url || "",
          };

          // Validate that we have essential data
          if (formattedPiece.imageUrl) {
            console.log(
              `✅ NFT ${tokenId} loaded successfully with image: ${formattedPiece.imageUrl}`
            );
          } else {
            console.log(`⚠️ NFT ${tokenId} loaded but no image URL found`);
          }

          loadedArtPieces.push(formattedPiece);
        } catch (tokenError) {
          console.error(`❌ Error loading NFT ${tokenId}:`, tokenError);

          // Create a minimal NFT entry even if loading fails
          const fallbackPiece = {
            tokenId: tokenId.toString(),
            title: `NFT #${tokenId}`,
            description: "Failed to load metadata",
            ipfsHash: "",
            artist: "Unknown Artist",
            mintedAt: Date.now(),
            is3D: false,
            positionX: Math.floor(Math.random() * 10),
            positionY: Math.floor(Math.random() * 10),
            positionZ: Math.floor(Math.random() * 10),
            color: `hsl(${(tokenId * 137.5) % 360}, 70%, 60%)`,
            imageUrl: "",
            tokenURI: "",
            metadataUrl: "",
            ipfsMetadata: null,
            attributes: [],
            external_url: "",
            animation_url: "",
          };

          loadedArtPieces.push(fallbackPiece);
        }
      }

      console.log(`📊 Loaded ${loadedArtPieces.length} NFTs from contract`);

      // Combine with mock data (put contract NFTs first)
      const combinedArtPieces = [...loadedArtPieces, ...mockArtPieces];
      setArtPieces(combinedArtPieces);

      // Log summary
      console.log(
        `🎨 Total art pieces available: ${combinedArtPieces.length} (${loadedArtPieces.length} from contract, ${mockArtPieces.length} mock)`
      );
    } catch (error) {
      console.error("❌ Error loading art pieces from contract:", error);
      // Fallback to mock data
      console.log("🔄 Falling back to mock data");
      setArtPieces(mockArtPieces);
    } finally {
      setIsLoading(false);
    }
  };

  // Force reload art pieces (useful for debugging)
  const forceReloadArtPieces = async () => {
    console.log("Force reloading art pieces...");
    await loadArtPiecesFromContract();
  };

  // Auto-connect to wallet
  useEffect(() => {
    const autoConnect = async () => {
      if (window.ethereum) {
        try {
          const browserProvider = new BrowserProvider(window.ethereum);
          const accounts = await browserProvider.send("eth_accounts", []);

          if (accounts.length > 0) {
            const signerInstance = await browserProvider.getSigner();
            const address = await signerInstance.getAddress();

            setProvider(browserProvider);
            setSigner(signerInstance);
            setIsConnected(true);
            setAccount(address);

            // Initialize contract
            try {
              const contractInstance = await initializeContract(signerInstance);
              await loadArtPiecesFromContract(contractInstance);
            } catch (contractError) {
              console.error("Contract initialization failed:", contractError);
              // Continue without contract functionality
              setArtPieces(mockArtPieces);
            }
          } else {
            // No connected accounts, load mock data
            setArtPieces(mockArtPieces);
          }
        } catch (error) {
          console.error("Auto-connect error:", error);
          setArtPieces(mockArtPieces);
        }
      } else {
        console.log("MetaMask not detected");
        // Load mock data if no wallet is available
        setArtPieces(mockArtPieces);
      }
    };
    autoConnect();
  }, []);

  // Load art pieces when contract or pinata changes
  useEffect(() => {
    if (contract) {
      console.log("Contract or Pinata JWT changed, reloading art pieces...");
      loadArtPiecesFromContract(contract);
    }
  }, [pinataJWT, contract]);

  useEffect(() => {
    if (currentView === "3d") {
      const cleanup = init3DGallery();
      return cleanup;
    } else if (currentView === "ar") {
      initAR();
      return () => stopAR();
    }
  }, [currentView, init3DGallery, initAR, stopAR]);

  // Smart contract minting function
  const handleMintSubmit = async (e) => {
    e.preventDefault();

    if (!contract || !signer) {
      alert("Please connect your wallet first");
      return;
    }

    if (!mintForm.title || !mintForm.description) {
      alert("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      let ipfsResult = null;
      let tokenURI = mintForm.tokenURI;
      let ipfsHash = mintForm.ipfsHash;

      // Upload to IPFS if file is provided and we have Pinata JWT
      if (mintForm.artworkFile && pinataJWT) {
        console.log("Uploading artwork to IPFS...");
        ipfsResult = await uploadArtwork(mintForm.artworkFile, {
          title: mintForm.title,
          description: mintForm.description,
          artist: account || "Unknown Artist",
          is3D: mintForm.is3D,
        });

        if (!ipfsResult || !ipfsResult.success) {
          throw new Error("Failed to upload artwork to IPFS");
        }

        tokenURI = ipfsResult.metadataUrl;
        ipfsHash = ipfsResult.imageHash;
        console.log("IPFS upload successful:", ipfsResult);
      }

      // Validate required fields
      if (!tokenURI) {
        throw new Error("Token URI is required");
      }

      console.log("Minting NFT with params:", {
        tokenURI,
        title: mintForm.title,
        description: mintForm.description,
        ipfsHash: ipfsHash || "",
        is3D: mintForm.is3D,
      });

      // Call smart contract mint function
      const mintingFee = parseEther(contractInfo.mintingFee);

      const tx = await contract.mintArt(
        tokenURI,
        mintForm.title,
        mintForm.description,
        ipfsHash || "",
        mintForm.is3D,
        { value: mintingFee }
      );

      console.log("Mint transaction sent:", tx.hash);

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log("Mint transaction confirmed:", receipt);

      // Find the ArtMinted event to get the token ID
      const artMintedEvent = receipt.logs.find((log) => {
        try {
          const parsedLog = contract.interface.parseLog(log);
          return parsedLog.name === "ArtMinted";
        } catch (e) {
          return false;
        }
      });

      let tokenId = null;
      if (artMintedEvent) {
        const parsedLog = contract.interface.parseLog(artMintedEvent);
        tokenId = parsedLog.args.tokenId.toString();
        console.log("Minted NFT token ID:", tokenId);
      }

      // Reset form
      setMintForm({
        title: "",
        description: "",
        ipfsHash: "",
        tokenURI: "",
        is3D: false,
        artworkFile: null,
      });

      // Update contract info to reflect new token count
      try {
        const newCurrentTokenId = await contract.getCurrentTokenId();
        setContractInfo((prev) => ({
          ...prev,
          currentTokenId: newCurrentTokenId.toString(),
        }));
      } catch (updateError) {
        console.log("Could not update contract info:", updateError);
      }

      // Reload art pieces from contract with a small delay to ensure blockchain state is updated
      console.log("Reloading art pieces after successful mint...");
      setTimeout(async () => {
        await loadArtPiecesFromContract(contract);
      }, 2000); // 2 second delay

      alert(
        `NFT minted successfully! ${tokenId ? `Token ID: ${tokenId}` : ""}`
      );
      setCurrentView("gallery");
    } catch (error) {
      console.error("Minting error:", error);

      let errorMessage = "Minting failed";
      if (error.reason) {
        errorMessage += `: ${error.reason}`;
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }

      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      setIsLoading(true);

      if (!window.ethereum) {
        alert("MetaMask is not installed!");
        setIsLoading(false);
        return;
      }

      const browserProvider = new BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      const signerInstance = await browserProvider.getSigner();
      const address = await signerInstance.getAddress();

      setProvider(browserProvider);
      setSigner(signerInstance);
      setIsConnected(true);
      setAccount(address);

      // Initialize contract
      try {
        const contractInstance = await initializeContract(signerInstance);
        await loadArtPiecesFromContract(contractInstance);
      } catch (contractError) {
        console.error("Contract initialization failed:", contractError);
        alert(
          "Wallet connected but contract initialization failed. Check console for details."
        );
      }
    } catch (err) {
      console.error("Wallet connection error:", err);
      alert("Failed to connect wallet. Check the console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinataConfig = async () => {
    if (pinataJWT) {
      const isValid = await testConnection();
      if (isValid) {
        alert("Pinata connection successful!");
        setShowPinataConfig(false);
      } else {
        alert("Pinata connection failed. Please check your JWT token.");
      }
    } else {
      alert("Please enter your Pinata JWT token.");
    }
  };

  const loadArtFromIPFS = async (ipfsHash) => {
    if (!ipfsHash || !pinataJWT) return null;

    try {
      setIsLoading(true);
      const artData = await retrieveArtwork(ipfsHash);
      return artData;
    } catch (error) {
      console.error("Error loading art from IPFS:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full font-sans">
      {/* Pinata Configuration Modal */}
      {showPinataConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Configure Pinata IPFS
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Pinata JWT Token
              </label>
              <input
                type="password"
                value={pinataJWT}
                onChange={(e) => setPinataJWT(e.target.value)}
                placeholder="Enter your Pinata JWT token"
                className="w-full p-2 border rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get your JWT token from Pinata Dashboard → API Keys
              </p>
            </div>
            {pinataError && (
              <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md text-sm">
                {pinataError}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={handlePinataConfig}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Test Connection
              </button>
              <button
                onClick={() => setShowPinataConfig(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress Indicator */}
      {isUploading && (
        <div className="fixed top-20 right-4 z-40 bg-white p-4 rounded-lg shadow-lg border">
          <div className="flex items-center gap-2 mb-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Uploading to IPFS...</span>
          </div>
          <div className="w-48 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">{uploadProgress}%</div>
        </div>
      )}

      {/* Error Display */}
      {pinataError && (
        <div className="fixed top-4 left-4 z-40 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
          <div className="flex justify-between items-center">
            <span className="text-sm">{pinataError}</span>
            <button
              onClick={clearError}
              className="text-red-700 hover:text-red-900 ml-2"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Views */}
      {currentView === "home" && (
        <HomeView
          isConnected={isConnected}
          isLoading={isLoading}
          account={account}
          connectWallet={connectWallet}
          setCurrentView={setCurrentView}
          contractInfo={contractInfo}
        />
      )}
      {currentView === "gallery" && (
        <GalleryView
          artPieces={artPieces}
          setCurrentView={setCurrentView}
          setSelectedArt={setSelectedArt}
          loadArtFromIPFS={loadArtFromIPFS}
          contractInfo={contractInfo}
        />
      )}
      {currentView === "3d" && (
        <ThreeDView canvasRef={canvasRef} setCurrentView={setCurrentView} />
      )}
      {currentView === "ar" && (
        <ARView
          arRef={arRef}
          arStream={arStream}
          detectedSurfaces={detectedSurfaces}
          setCurrentView={setCurrentView}
          mockArtPieces={artPieces}
        />
      )}
      {currentView === "mint" && (
        <MintView
          mintForm={mintForm}
          setMintForm={setMintForm}
          isLoading={isLoading || isUploading}
          isConnected={isConnected}
          handleMintSubmit={handleMintSubmit}
          setCurrentView={setCurrentView}
          pinataConfigured={!!pinataJWT}
          uploadProgress={uploadProgress}
          contractInfo={contractInfo}
          contract={contract}
        />
      )}
      {selectedArt && (
        <ArtDetailModal
          art={selectedArt}
          onClose={() => setSelectedArt(null)}
          setCurrentView={setCurrentView}
          loadArtFromIPFS={loadArtFromIPFS}
          contract={contract}
          signer={signer}
        />
      )}
    </div>
  );
};

export default App;
