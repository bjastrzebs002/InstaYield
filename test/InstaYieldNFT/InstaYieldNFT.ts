import hre from "hardhat";
import {
  InstaYieldNFT,
} from "../../typechain";
import { Artifact } from "hardhat/types";
import { expect } from "chai";
import { BigNumber, ContractReceipt } from "ethers";

const { deployContract } = hre.waffle;

describe("InstaYield NFT Token Tests", function() {
  let InstaYieldNFTContract: InstaYieldNFT;

  before(async function() {
    this.signers = await hre.ethers.getSigners();

    // Deploy the NFT Contract
    const nftArtifact: Artifact = await hre.artifacts.readArtifact("InstaYieldNFT");
    InstaYieldNFTContract = <InstaYieldNFT>await deployContract(this.signers[0], nftArtifact);
  })

  it("should mint as owner and ensure NFT ID started from 1", async function () {
    let result = await InstaYieldNFTContract.connect(this.signers[0]).mint(this.signers[1].address);

    let receipt: ContractReceipt = await result.wait();
    // @ts-ignore
    const args = (receipt.events?.filter((x) => {return x.event == "Transfer"}))[0]['args'];
    // @ts-ignore

    const tokenId = args["tokenId"];

    expect(tokenId).to.be.eq(BigNumber.from(1));
  });

  it("should ensure exists function works as intended", async function () {
    expect(await InstaYieldNFTContract.exists(1)).to.be.true;
  });

  it("should ensure total supply is 1", async function () {
    expect(await InstaYieldNFTContract.totalSupply()).to.be.eq(1);
  });

  it("should ensure metadata url for token 1 is https://nft.InstaYield.io/1", async function () {
    expect(await InstaYieldNFTContract.tokenURI(1)).to.be.eq("https://nft.InstaYield.io/1");
  });

  it("should fail minting NFT as non owner", async function () {
    await expect(
      InstaYieldNFTContract.connect(this.signers[1]).mint(this.signers[1].address),
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should fail burning NFT as non owner", async function () {
    await expect(
      InstaYieldNFTContract.connect(this.signers[1]).burn(1),
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should burn NFT as owner", async function () {
    expect(
      await InstaYieldNFTContract.connect(this.signers[0]).burn(1),
    ).to.be.ok
  });

  it("should ensure contract URI is https://nft.InstaYield.io/metadata", async function () {
    expect(
      await InstaYieldNFTContract.contractURI(),
    ).to.be.eq("https://nft.InstaYield.io/metadata")
  });
});
