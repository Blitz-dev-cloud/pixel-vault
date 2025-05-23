// utils/contractService.js
import { BrowserProvider, Contract, parseEther, formatEther } from "ethers";

// Replace with your deployed contract address
const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE";

class ContractService {
  constructor() {
    this.contract = null;
    this.provider = null;
    this.signer = null;
  }

  async initialize() {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    this.provider = new BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();
    this.contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.signer);

    return this.contract;
  }

  async getContract() {
    if (!this.contract) {
      await this.initialize();
    }
    return this.contract;
  }

  // Mint a new NFT
  async mintArt(tokenURI, title, description, ipfsHash, is3D) {
    try {
      const contract = await this.getContract();
      const mintingFee = await contract.mintingFee();

      const tx = await contract.mintArt(
        tokenURI,
        title,
        description,
        ipfsHash,
        is3D,
        {
          value: mintingFee,
          gasLimit: 500000, // Set appropriate gas limit
        }
      );

      const receipt = await tx.wait();

      // Extract token ID from events
      const mintEvent = receipt.logs.find((log) => {
        try {
          const parsed = contract.interface.parseLog({
            topics: log.topics,
            data: log.data,
          });
          return parsed.name === "ArtMinted";
        } catch {
          return false;
        }
      });

      let tokenId = null;
      if (mintEvent) {
        const parsed = contract.interface.parseLog({
          topics: mintEvent.topics,
          data: mintEvent.data,
        });
        tokenId = parsed.args.tokenId.toString();
      }

      return {
        success: true,
        txHash: tx.hash,
        tokenId,
        receipt,
      };
    } catch (error) {
      console.error("Minting error:", error);
      throw error;
    }
  }

  // Get all art pieces from the contract
  async getAllArtPieces() {
    try {
      const contract = await this.getContract();
      const artPieces = await contract.getAllArtPieces();

      return artPieces.map((piece) => ({
        tokenId: piece.tokenId.toString(),
        title: piece.title,
        description: piece.description,
        ipfsHash: piece.ipfsHash,
        artist: piece.artist,
        mintedAt: piece.mintedAt.toString(),
        is3D: piece.is3D,
        positionX: piece.positionX.toString(),
        positionY: piece.positionY.toString(),
        positionZ: piece.positionZ.toString(),
        imageUrl: piece.ipfsHash
          ? `https://gateway.pinata.cloud/ipfs/${piece.ipfsHash}`
          : "",
        color: `hsl(${Math.random() * 360}, 70%, 60%)`, // Generate random color for display
      }));
    } catch (error) {
      console.error("Error fetching art pieces:", error);
      return [];
    }
  }

  // Get art pieces by artist
  async getArtistTokens(artistAddress) {
    try {
      const contract = await this.getContract();
      const tokenIds = await contract.getArtistTokens(artistAddress);

      const artPieces = [];
      for (const tokenId of tokenIds) {
        const piece = await contract.artPieces(tokenId);
        artPieces.push({
          tokenId: piece.tokenId.toString(),
          title: piece.title,
          description: piece.description,
          ipfsHash: piece.ipfsHash,
          artist: piece.artist,
          mintedAt: piece.mintedAt.toString(),
          is3D: piece.is3D,
          positionX: piece.positionX.toString(),
          positionY: piece.positionY.toString(),
          positionZ: piece.positionZ.toString(),
          imageUrl: piece.ipfsHash
            ? `https://gateway.pinata.cloud/ipfs/${piece.ipfsHash}`
            : "",
        });
      }

      return artPieces;
    } catch (error) {
      console.error("Error fetching artist tokens:", error);
      return [];
    }
  }

  // Update art position (for 3D gallery)
  async updateArtPosition(tokenId, positionX, positionY, positionZ) {
    try {
      const contract = await this.getContract();
      const tx = await contract.updateArtPosition(
        tokenId,
        positionX,
        positionY,
        positionZ,
        {
          gasLimit: 100000,
        }
      );

      const receipt = await tx.wait();
      return {
        success: true,
        txHash: tx.hash,
        receipt,
      };
    } catch (error) {
      console.error("Error updating art position:", error);
      throw error;
    }
  }

  // Get contract information
  async getContractInfo() {
    try {
      const contract = await this.getContract();
      const [mintingFee, maxSupply, currentTokenId, name, symbol] =
        await Promise.all([
          contract.mintingFee(),
          contract.maxSupply(),
          contract.getCurrentTokenId(),
          contract.name(),
          contract.symbol(),
        ]);

      return {
        mintingFee: formatEther(mintingFee),
        maxSupply: maxSupply.toString(),
        currentTokenId: currentTokenId.toString(),
        totalMinted: currentTokenId.toString(),
        name,
        symbol,
        contractAddress: CONTRACT_ADDRESS,
      };
    } catch (error) {
      console.error("Error fetching contract info:", error);
      return null;
    }
  }

  // Get user's NFT balance
  async getUserBalance(userAddress) {
    try {
      const contract = await this.getContract();
      const balance = await contract.balanceOf(userAddress);
      return balance.toString();
    } catch (error) {
      console.error("Error fetching user balance:", error);
      return "0";
    }
  }

  // Get token owner
  async getTokenOwner(tokenId) {
    try {
      const contract = await this.getContract();
      const owner = await contract.ownerOf(tokenId);
      return owner;
    } catch (error) {
      console.error("Error fetching token owner:", error);
      return null;
    }
  }

  // Get token URI
  async getTokenURI(tokenId) {
    try {
      const contract = await this.getContract();
      const tokenURI = await contract.tokenURI(tokenId);
      return tokenURI;
    } catch (error) {
      console.error("Error fetching token URI:", error);
      return null;
    }
  }

  // Listen to contract events
  setupEventListeners(callbacks = {}) {
    if (!this.contract) return;

    // Listen for new art minted
    if (callbacks.onArtMinted) {
      this.contract.on(
        "ArtMinted",
        (tokenId, artist, title, ipfsHash, is3D, event) => {
          callbacks.onArtMinted({
            tokenId: tokenId.toString(),
            artist,
            title,
            ipfsHash,
            is3D,
            txHash: event.transactionHash,
          });
        }
      );
    }

    // Listen for art position updates
    if (callbacks.onArtPositioned) {
      this.contract.on(
        "ArtPositioned",
        (tokenId, positionX, positionY, positionZ, event) => {
          callbacks.onArtPositioned({
            tokenId: tokenId.toString(),
            positionX: positionX.toString(),
            positionY: positionY.toString(),
            positionZ: positionZ.toString(),
            txHash: event.transactionHash,
          });
        }
      );
    }
  }

  // Remove event listeners
  removeEventListeners() {
    if (this.contract) {
      this.contract.removeAllListeners();
    }
  }
}

export const contractService = new ContractService();
export { CONTRACT_ADDRESS, CONTRACT_ABI };
