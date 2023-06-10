import hre from "hardhat";
import { InstaYieldBackLM, InstaYieldToken } from "../../typechain";
import { Artifact } from "hardhat/types";
import { expect } from "chai";
import { ContractReceipt, ethers } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

const { deployContract } = hre.waffle;

describe("InstaYieldBack Liquidity Mining", function () {
  let tokenA: InstaYieldToken;
  let InstaYieldBackContract: InstaYieldBackLM;
  let tokenB: InstaYieldToken;
  let signers: SignerWithAddress[];
  let forfeitAddress = "0x0585AD5227bE9b5c2D7f9506f9b5b2409BF48524";

  before(async function () {
    signers = await hre.ethers.getSigners();

    // Deploy the Flash Token Contract
    const InstaYieldTokenArtifact: Artifact = await hre.artifacts.readArtifact("InstaYieldToken");
    tokenA = <InstaYieldToken>await deployContract(signers[0], InstaYieldTokenArtifact);

    // Deploy another ERC20
    tokenB = <InstaYieldToken>await deployContract(signers[0], InstaYieldTokenArtifact);

    const InstaYieldBackContractA: Artifact = await hre.artifacts.readArtifact("InstaYieldBackLM");

    // Expect this to revert since the staking token and reward token are the same
    await expect(
      deployContract(signers[0], InstaYieldBackContractA, [tokenA.address, tokenA.address, 86400, 31536000]),
    ).to.be.reverted;

    // Deploy the InstaYieldBack contract
    InstaYieldBackContract = <InstaYieldBackLM>(
      await deployContract(signers[0], InstaYieldBackContractA, [tokenA.address, tokenB.address, 86400, 31536000])
    );

    // Set the forfeit address
    await InstaYieldBackContract.setForfeitRewardAddress(forfeitAddress);
    await InstaYieldBackContract.connect(signers[0]).setParameters(10000, "3057320214010900165525", "175817380769661863382");
  });

  it("should transfer 5,000,000 tokenB from account 0 to InstaYieldBack contract", async function () {
    let _amount = ethers.utils.parseUnits("5000000", 18);
    let _recipient = InstaYieldBackContract.address;

    await tokenB.connect(signers[0]).transfer(_recipient, _amount);

    expect(await tokenB.balanceOf(_recipient)).to.be.eq(_amount);
    expect(await InstaYieldBackContract.getAvailableRewards()).to.be.eq(_amount);
  });

  it("should transfer 1,000,000 tokenA from account 0 to account 1", async function () {
    let _amount = ethers.utils.parseUnits("1000000", 18);
    let _recipient = signers[1].address;

    await tokenA.connect(signers[0]).transfer(_recipient, _amount);

    expect(await tokenA.balanceOf(_recipient)).to.be.eq(_amount);
  });

  it("should transfer 1,000,000 tokenA from account 0 to account 2", async function () {
    let _amount = ethers.utils.parseUnits("1000000", 18);
    let _recipient = signers[2].address;

    await tokenA.connect(signers[0]).transfer(_recipient, _amount);

    expect(await tokenA.balanceOf(_recipient)).to.be.eq(_amount);
  });

  it("account 1 should get quote, 0.1 tokenA for 365 days = 3.477836150927867203 tokenB in rewards", async function () {
    let _amount = ethers.utils.parseUnits("0.1", 18);
    let _duration = 31536000;

    let result = await InstaYieldBackContract.calculateReward(_amount, _duration);

    expect(result).to.be.eq(ethers.utils.parseUnits("3.477836150927867203", 18));
  });

  it("account 1 should get quote, 1 tokenA for 365 days = 34.778361509278672031 tokenB in rewards", async function () {
    let _amount = ethers.utils.parseUnits("1", 18);
    let _duration = 31536000;

    let result = await InstaYieldBackContract.calculateReward(_amount, _duration);

    expect(result).to.be.eq(ethers.utils.parseUnits("34.778361509278672031", 18));
  });

  it("account 1 should get quote, 10 tokenA for 365 days = 347.783615092786720314 tokenB in rewards", async function () {
    let _amount = ethers.utils.parseUnits("10", 18);
    let _duration = 31536000;

    let result = await InstaYieldBackContract.calculateReward(_amount, _duration);

    expect(result).to.be.eq(ethers.utils.parseUnits("347.783615092786720314", 18));
  });

  it("account 1 should get quote, 100 tokenA for 182.5 days = 869.459037731966800785 tokenB in rewards", async function () {
    let _amount = ethers.utils.parseUnits("100", 18);
    let _duration = 15768000;

    let result = await InstaYieldBackContract.calculateReward(_amount, _duration);

    expect(result).to.be.eq(ethers.utils.parseUnits("869.459037731966800785", 18));
  });

  it("account 1 should get quote, 1000 tokenA for 365 days = 34778.361509278672031432 tokenB in rewards (total available)", async function () {
    let _amount = ethers.utils.parseUnits("1000", 18);
    let _duration = 31536000;

    let result = await InstaYieldBackContract.calculateReward(_amount, _duration);

    expect(result).to.be.eq(ethers.utils.parseUnits("34778.361509278672031432", 18));
  });

  it("(1) account 1 should stake 1,000,000 tokenA for 36.5 days", async function () {
    let _amount = ethers.utils.parseUnits("1000000", 18);
    let _duration = 86400 * 36.5;
    let _minimumReward = ethers.utils.parseUnits("100000", 18);

    // Approval and stake
    await tokenA.connect(signers[1]).approve(InstaYieldBackContract.address, _amount);
    let result = await InstaYieldBackContract.connect(signers[1]).stake(_amount, _duration, 0);

    let receipt: ContractReceipt = await result.wait();
    // @ts-ignore
    const args = (receipt.events?.filter(x => {
      return x.event == "Staked";
    }))[0]["args"];
    // @ts-ignore
    console.log("(1) Stake ID =", args["stakeId"]);

    expect((await InstaYieldBackContract.stakes(1)).active).to.be.true;
    expect(await tokenA.balanceOf(signers[1].address)).to.be.eq(0);
  });

  it("(2) account 2 should stake 1234 tokenA for 365 days", async function () {
    let _amount = ethers.utils.parseUnits("1234", 18);
    let _duration = 86400 * 365;

    // Approval and stake
    await tokenA.connect(signers[2]).approve(InstaYieldBackContract.address, _amount);
    let result = await InstaYieldBackContract.connect(signers[2]).stake(_amount, _duration, 0);

    let receipt: ContractReceipt = await result.wait();
    // @ts-ignore
    const args = (receipt.events?.filter(x => {
      return x.event == "Staked";
    }))[0]["args"];
    // @ts-ignore
    console.log("(2) Stake ID =", args["stakeId"]);

    expect((await InstaYieldBackContract.stakes(2)).active).to.be.true;
    expect(await tokenA.balanceOf(signers[2].address)).to.be.eq(ethers.utils.parseUnits("998766", 18));
  });

  it("(3) account 2 should stake 100 tokenA for 365 days", async function () {
    let _amount = ethers.utils.parseUnits("100", 18);
    let _duration = 86400 * 365;
    let _minimumReward = ethers.utils.parseUnits("1", 18);

    // Approval and stake
    await tokenA.connect(signers[2]).approve(InstaYieldBackContract.address, _amount);
    let result = await InstaYieldBackContract.connect(signers[2]).stake(_amount, _duration, _minimumReward);

    let receipt: ContractReceipt = await result.wait();
    // @ts-ignore
    const args = (receipt.events?.filter(x => {
      return x.event == "Staked";
    }))[0]["args"];
    // @ts-ignore
    console.log("(3) Stake ID =", args["stakeId"]);

    expect((await InstaYieldBackContract.stakes(3)).active).to.be.true;
  });

  it("increase block time by 10 days", async function () {
    // Increase the timestamp of the next block
    const increaseBy = 86400 * 10;
    await hre.network.provider.send("evm_increaseTime", [increaseBy]);
  });

  it("(3a) account 1 should unstake early (stakeid 1), get back principal, rewards should redirect to treasury", async function () {
    const stakeInfo = await InstaYieldBackContract.stakes(1);
    const oldBalance = await tokenA.balanceOf(signers[1].address);
    console.log("(3a) oldBalance", ethers.utils.formatUnits(oldBalance));

    await InstaYieldBackContract.connect(signers[1]).unstake(1);

    const expectedBalance = oldBalance.add(stakeInfo.stakedAmount);
    console.log("(3a) expectedBalance", ethers.utils.formatUnits(expectedBalance));
    console.log("(3a) actualBalance", ethers.utils.formatUnits(await tokenA.balanceOf(signers[1].address)));
    expect(await tokenA.balanceOf(signers[1].address)).to.be.eq(expectedBalance);
    expect((await InstaYieldBackContract.stakes(1)).active).to.be.false;

    expect(await tokenB.balanceOf(await InstaYieldBackContract.forfeitRewardAddress())).to.be.eq(stakeInfo.reservedReward);
    expect(await tokenB.balanceOf(forfeitAddress)).to.be.eq(stakeInfo.reservedReward);
    console.log("(3a) Forfeit address balance", stakeInfo.reservedReward);
  });

  it("increase block time by 365 days", async function () {
    // Increase the timestamp of the next block
    const increaseBy = 86400 * 365;
    await hre.network.provider.send("evm_increaseTime", [increaseBy]);
  });

  it("(4) account 2 should unstake, principal and reward to wallet", async function () {
    const stakeInfo = await InstaYieldBackContract.stakes(2);
    const oldPrincipalBalance = await tokenA.balanceOf(signers[2].address);
    const oldRewardBalance = await tokenB.balanceOf(signers[2].address);
    console.log("(4) oldPrincipalBalance", oldPrincipalBalance);
    console.log("(4) oldRewardBalance", oldRewardBalance);

    await InstaYieldBackContract.connect(signers[2]).unstake(2);

    expect(await tokenA.balanceOf(signers[2].address)).to.be.eq(oldPrincipalBalance.add(stakeInfo.stakedAmount));
    expect(await tokenB.balanceOf(signers[2].address)).to.be.eq(oldRewardBalance.add(stakeInfo.reservedReward));

    console.log("(4) newPrincipalBalance", await tokenA.balanceOf(signers[2].address));
    console.log("(4) newRewardBalance", await tokenB.balanceOf(signers[2].address));

    expect((await InstaYieldBackContract.stakes(2)).active).to.be.false;
  });
});
