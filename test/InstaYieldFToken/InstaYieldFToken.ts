import hre from "hardhat";
import {
  InstaYieldFToken,
} from "../../typechain";
import { Artifact } from "hardhat/types";
import { expect } from "chai";
import { BigNumber } from "ethers";

const { deployContract } = hre.waffle;

describe("InstaYieldFToken Tests", function() {
  let InstaYieldFToken: InstaYieldFToken;

  before(async function() {
    this.signers = await hre.ethers.getSigners();

    // Deploy the NFT Contract
    const nftArtifact: Artifact = await hre.artifacts.readArtifact("InstaYieldFToken");
    InstaYieldFToken = <InstaYieldFToken>await deployContract(this.signers[0], nftArtifact, ["InstaYield fDAI", "fDAI"]);
  })

  it("should mint as owner", async function () {
    let result = await InstaYieldFToken.connect(this.signers[0]).mint(this.signers[1].address, BigNumber.from(10000));
    expect(await InstaYieldFToken.totalSupply()).to.be.eq(BigNumber.from(10000));
  });

  it("should fail minting as non owner", async function () {
    await expect(
      InstaYieldFToken.connect(this.signers[1]).mint(this.signers[1].address, 10000),
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should be burnable by non-owner", async function () {
    expect(
      await InstaYieldFToken.connect(this.signers[1]).burn(5000),
    ).to.be.ok
  });
});
