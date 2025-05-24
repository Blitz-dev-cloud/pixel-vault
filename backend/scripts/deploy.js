const hre = require("hardhat");

async function main() {
  console.log("Starting ArtGalleryNFT deployment...");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Get account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Get the contract factory
  const ArtGalleryNFT = await hre.ethers.getContractFactory("ArtGalleryNFT");

  // Deploy the contract with deployer as initial owner
  console.log("Deploying ArtGalleryNFT...");
  const artGalleryNFT = await ArtGalleryNFT.deploy(deployer.address);

  // Wait for deployment to complete
  await artGalleryNFT.waitForDeployment();

  const contractAddress = await artGalleryNFT.getAddress();
  console.log("ArtGalleryNFT deployed to:", contractAddress);

  // Display contract details
  console.log("\n=== Contract Details ===");
  console.log("Contract Address:", contractAddress);
  console.log("Owner:", deployer.address);
  console.log("Name:", await artGalleryNFT.name());
  console.log("Symbol:", await artGalleryNFT.symbol());
  console.log(
    "Minting Fee:",
    hre.ethers.formatEther(await artGalleryNFT.mintingFee()),
    "ETH"
  );
  console.log("Max Supply:", await artGalleryNFT.maxSupply());

  console.log("\n=== Deployment Successful! ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:");
    console.error(error);
    process.exit(1);
  });
