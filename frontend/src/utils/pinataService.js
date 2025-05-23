// utils/pinataService.js
class PinataService {
  constructor(jwt) {
    this.jwt = jwt;
    this.pinataApiUrl = "https://api.pinata.cloud";
    this.pinataGatewayUrl = "https://gateway.pinata.cloud/ipfs";
  }

  // Upload file to IPFS via Pinata
  async uploadFile(file, metadata = {}) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Add metadata if provided
      if (metadata.name || metadata.description) {
        const pinataMetadata = {
          name: metadata.name || file.name,
          keyvalues: {
            description: metadata.description || "",
            artist: metadata.artist || "",
            type: metadata.type || "artwork",
            uploadedAt: new Date().toISOString(),
          },
        };
        formData.append("pinataMetadata", JSON.stringify(pinataMetadata));
      }

      // Pinata options for file organization
      const pinataOptions = {
        cidVersion: 1,
        wrapWithDirectory: false,
      };
      formData.append("pinataOptions", JSON.stringify(pinataOptions));

      const response = await fetch(
        `${this.pinataApiUrl}/pinning/pinFileToIPFS`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.jwt}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Pinata upload failed: ${errorData.error || response.statusText}`
        );
      }

      const result = await response.json();
      return {
        success: true,
        ipfsHash: result.IpfsHash,
        pinSize: result.PinSize,
        timestamp: result.Timestamp,
        gatewayUrl: `${this.pinataGatewayUrl}/${result.IpfsHash}`,
      };
    } catch (error) {
      console.error("Error uploading to Pinata:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Upload JSON metadata to IPFS
  async uploadJSON(jsonData, name = "metadata") {
    try {
      const response = await fetch(
        `${this.pinataApiUrl}/pinning/pinJSONToIPFS`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.jwt}`,
          },
          body: JSON.stringify({
            pinataContent: jsonData,
            pinataMetadata: {
              name: name,
              keyvalues: {
                type: "metadata",
                uploadedAt: new Date().toISOString(),
              },
            },
            pinataOptions: {
              cidVersion: 1,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Pinata JSON upload failed: ${errorData.error || response.statusText}`
        );
      }

      const result = await response.json();
      return {
        success: true,
        ipfsHash: result.IpfsHash,
        pinSize: result.PinSize,
        timestamp: result.Timestamp,
        gatewayUrl: `${this.pinataGatewayUrl}/${result.IpfsHash}`,
      };
    } catch (error) {
      console.error("Error uploading JSON to Pinata:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Retrieve data from IPFS
  async retrieveFromIPFS(ipfsHash) {
    try {
      const response = await fetch(`${this.pinataGatewayUrl}/${ipfsHash}`);

      if (!response.ok) {
        throw new Error(`Failed to retrieve from IPFS: ${response.statusText}`);
      }

      // Try to parse as JSON first, if it fails return as text/blob
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      } else if (contentType && contentType.includes("image")) {
        return {
          type: "image",
          url: `${this.pinataGatewayUrl}/${ipfsHash}`,
          blob: await response.blob(),
        };
      } else {
        return await response.text();
      }
    } catch (error) {
      console.error("Error retrieving from IPFS:", error);
      throw error;
    }
  }

  // Get pinned files list
  async getPinnedFiles(limit = 10, offset = 0) {
    try {
      const response = await fetch(
        `${this.pinataApiUrl}/data/pinList?status=pinned&pageLimit=${limit}&pageOffset=${offset}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.jwt}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get pinned files: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting pinned files:", error);
      throw error;
    }
  }

  // Unpin file from IPFS
  async unpinFile(ipfsHash) {
    try {
      const response = await fetch(
        `${this.pinataApiUrl}/pinning/unpin/${ipfsHash}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${this.jwt}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to unpin file: ${response.statusText}`);
      }

      return { success: true, message: "File unpinned successfully" };
    } catch (error) {
      console.error("Error unpinning file:", error);
      return { success: false, error: error.message };
    }
  }

  // Test authentication
  async testAuthentication() {
    try {
      const response = await fetch(
        `${this.pinataApiUrl}/data/testAuthentication`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.jwt}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Authentication test failed: ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, message: result.message };
    } catch (error) {
      console.error("Authentication test failed:", error);
      return { success: false, error: error.message };
    }
  }
}

// Hook for using Pinata service
import { useState, useCallback, useMemo } from "react";

export const usePinata = (jwt) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const pinataService = useMemo(() => {
    if (!jwt) return null;
    return new PinataService(jwt);
  }, [jwt]);

  const uploadArtwork = useCallback(
    async (file, metadata) => {
      if (!pinataService) {
        setError("Pinata service not initialized. Please provide JWT token.");
        return null;
      }

      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      try {
        // Simulate progress for user feedback
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90));
        }, 200);

        // Upload the artwork file
        const fileResult = await pinataService.uploadFile(file, {
          name: metadata.title,
          description: metadata.description,
          artist: metadata.artist,
          type: "artwork",
        });

        if (!fileResult.success) {
          throw new Error(fileResult.error);
        }

        // Create and upload metadata JSON
        const metadataJson = {
          name: metadata.title,
          description: metadata.description,
          image: fileResult.gatewayUrl,
          attributes: [
            {
              trait_type: "Artist",
              value: metadata.artist,
            },
            {
              trait_type: "Type",
              value: metadata.is3D ? "3D Artwork" : "2D Artwork",
            },
            {
              trait_type: "Created",
              value: new Date().toLocaleDateString(),
            },
          ],
          external_url: fileResult.gatewayUrl,
          ipfs_hash: fileResult.ipfsHash,
        };

        const metadataResult = await pinataService.uploadJSON(
          metadataJson,
          `${metadata.title}_metadata`
        );

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!metadataResult.success) {
          throw new Error(metadataResult.error);
        }

        return {
          success: true,
          imageHash: fileResult.ipfsHash,
          imageUrl: fileResult.gatewayUrl,
          metadataHash: metadataResult.ipfsHash,
          metadataUrl: metadataResult.gatewayUrl,
          tokenURI: metadataResult.gatewayUrl,
        };
      } catch (err) {
        setError(err.message);
        return null;
      } finally {
        setIsUploading(false);
        setTimeout(() => setUploadProgress(0), 2000);
      }
    },
    [pinataService]
  );

  const retrieveArtwork = useCallback(
    async (ipfsHash) => {
      if (!pinataService) {
        setError("Pinata service not initialized. Please provide JWT token.");
        return null;
      }

      try {
        return await pinataService.retrieveFromIPFS(ipfsHash);
      } catch (err) {
        setError(err.message);
        return null;
      }
    },
    [pinataService]
  );

  const testConnection = useCallback(async () => {
    if (!pinataService) {
      setError("Pinata service not initialized. Please provide JWT token.");
      return false;
    }

    const result = await pinataService.testAuthentication();
    if (!result.success) {
      setError(result.error);
    }
    return result.success;
  }, [pinataService]);

  return {
    pinataService,
    uploadArtwork,
    retrieveArtwork,
    testConnection,
    isUploading,
    uploadProgress,
    error,
    clearError: () => setError(null),
  };
};

export default PinataService;
