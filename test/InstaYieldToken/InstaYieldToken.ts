import hre from "hardhat";
import { InstaYieldToken } from "../../typechain";
import { Artifact } from "hardhat/types";
import { expect } from "chai";
import { BigNumber } from "ethers";

const { deployContract } = hre.waffle;

describe("InstaYield Token Tests", function () {
  let InstaYieldTokenContract: InstaYieldToken;
  const multiplier = BigNumber.from(10).pow(18);

  before(async function () {
    this.signers = await hre.ethers.getSigners();

    // Deploy the InstaYield Token Contract
    const tokenArtifact: Artifact = await hre.artifacts.readArtifact("InstaYieldToken");
    InstaYieldTokenContract = <InstaYieldToken>await deployContract(this.signers[0], tokenArtifact);
  });

  it("should burn tokens", async function () {
    expect(await InstaYieldTokenContract.connect(this.signers[0]).burn(BigNumber.from(10000).mul(multiplier))).to.be.ok;
  });
});
