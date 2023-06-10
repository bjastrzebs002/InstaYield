import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import {
  InstaYieldBack,
  InstaYieldBack__factory,
  InstaYieldBackLM,
  InstaYieldBackLM__factory,
  InstaYieldFTokenFactory,
  InstaYieldFTokenFactory__factory,
  InstaYieldNFT,
  InstaYieldNFT__factory,
  InstaYieldProtocol,
  InstaYieldProtocol__factory,
  InstaYieldStrategyAAVEv2,
  InstaYieldStrategyAAVEv2__factory,
  InstaYieldToken,
  InstaYieldToken__factory,
  UserIncentive,
  UserIncentive__factory,
} from "../../typechain";
import { BigNumber } from "ethers";

task("deploy:TestTransaction")
  .addParam("tokenaddress", "address of the token")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const [wallet1] = await ethers.getSigners();
    const tokenContract: InstaYieldToken = <InstaYieldToken>await ethers.getContractAt("InstaYieldToken", taskArguments.tokenaddress);

    await tokenContract.connect(wallet1).transfer(wallet1.address, 1);
  });

task("deploy:InstaYieldToken").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const [wallet1] = await ethers.getSigners();

  console.log("Deploying instaYield V3 Token");
  const instaYieldV3Factory: InstaYieldToken__factory = await ethers.getContractFactory("InstaYieldToken");
  const instaYieldV3Token: InstaYieldToken = <InstaYieldToken>await instaYieldV3Factory.connect(wallet1).deploy();
  await instaYieldV3Token.deployed();
  console.log("-> instaYieldV3 Token Deployed to", instaYieldV3Token.address);
});

task("deploy:SendAllInstaYieldTokens")
  .addParam("tokenaddress", "address of the token")
  .addParam("address", "address to send to")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const [wallet1] = await ethers.getSigners();
    const tokenContract: InstaYieldToken = <InstaYieldToken>await ethers.getContractAt("InstaYieldToken", taskArguments.tokenaddress);

    // Determine balance
    console.log("Determining token balance...");
    const balance = await tokenContract.connect(wallet1).balanceOf(wallet1.address);
    console.log("Wallet has a balance of", ethers.utils.formatUnits(balance, 18));

    // Transfer all the tokens
    console.log("Transferring all tokens...");
    await tokenContract.connect(wallet1).transfer(taskArguments.address, balance);
    console.log("Tokens sent to", taskArguments.address);
  });

task("deploy:InstaYieldNFT").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const [wallet1] = await ethers.getSigners();

  console.log("Deploying instaYield V3 NFT");
  const nftFactory: InstaYieldNFT__factory = await ethers.getContractFactory("InstaYieldNFT");
  const nftToken: InstaYieldNFT = <InstaYieldNFT>await nftFactory.connect(wallet1).deploy();
  console.log("-> instaYieldV3 NFT Deployed to", nftToken.address);
});

task("deploy:InstaYieldFTokenFactory").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const [wallet1] = await ethers.getSigners();

  console.log("Deploying instaYield FTokenContractFactory");
  const instaYieldV3fTokenFactory: InstaYieldFTokenFactory__factory = await ethers.getContractFactory("InstaYieldFTokenFactory");
  const instaYieldV3FTokenContract: InstaYieldFTokenFactory = <InstaYieldFTokenFactory>(
    await instaYieldV3fTokenFactory.connect(wallet1).deploy()
  );
  await instaYieldV3FTokenContract.connect(wallet1).deployed();
  console.log("-> instaYield FTokenContractFactory Deployed to", instaYieldV3FTokenContract.address);
});

task("deploy:InstaYieldProtocol")
  .addParam("nftaddress", "The instaYield NFT address")
  .addParam("InstaYieldFTokenFactory", "The instaYield FToken Factory address")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const [wallet1] = await ethers.getSigners();

    console.log("Deploying instaYield V3 Protocol");
    const instaYieldV3ProtocolFactory: InstaYieldProtocol__factory = await ethers.getContractFactory("InstaYieldProtocol");
    const instaYieldV3Protocol: InstaYieldProtocol = <InstaYieldProtocol>(
      await instaYieldV3ProtocolFactory.connect(wallet1).deploy(taskArguments.nftaddress, taskArguments.InstaYieldFTokenFactory)
    );
    await instaYieldV3Protocol.connect(wallet1).deployed();
    console.log("-> instaYield V3 Protocol Deployed to", instaYieldV3Protocol.address);

    console.log("Setting mint fees to 20%");
    await instaYieldV3Protocol.setMintFeeInfo("0x53B51DE1706FC485f389cA3D5B8fE4251F0d769e", 2000);
    console.log("-> done");
  });

task("deploy:TransferNFTOwnership")
  .addParam("nftaddress", "The instaYield NFT address")
  .addParam("InstaYieldProtocoladdress", "The instaYield protocol address")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const [wallet1] = await ethers.getSigners();

    // Retrieve the instaYield NFT contract obj
    const nftToken: InstaYieldNFT = <InstaYieldNFT>await ethers.getContractAt("InstaYieldNFT", taskArguments.nftaddress);

    console.log("Transferring ownership of NFT to instaYield Protocol");
    // Transfer ownership of nft to protocol
    await nftToken.connect(wallet1).transferOwnership(taskArguments.InstaYieldProtocoladdress);
    console.log("-> Done");
  });

task("deploy:TransferFactoryOwnership")
  .addParam("factoryaddress", "The instaYield F Token factory address")
  .addParam("InstaYieldProtocoladdress", "The instaYield protocol address")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const [wallet1] = await ethers.getSigners();

    const factoryContract: InstaYieldFTokenFactory = <InstaYieldFTokenFactory>(
      await ethers.getContractAt("InstaYieldFTokenFactory", taskArguments.factoryaddress)
    );

    console.log("Transferring ownership of factory to instaYield Protocol");
    await factoryContract.connect(wallet1).transferOwnership(taskArguments.InstaYieldProtocoladdress);
    console.log("-> Done");
  });

task("deploy:instaYieldAAVEStrategy")
  .addParam("pooladdress", "The AAVE v2 Pool Address")
  .addParam("principaltokenaddress", "The principal token address - eg DAI, USDC")
  .addParam("interestbearingtokenaddresses", "The AAVE v2 interest bearing token address - eg aDAI")
  .addParam("InstaYieldProtocoladdress", "The instaYield protocol address")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const [wallet1] = await ethers.getSigners();

    // KOVAN
    // const poolAddresses = ["0xE0fBa4Fc209b4948668006B2bE61711b7f465bAe"]
    // const principalTokenAddresses = ["0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD"]
    // const interestBearingTokenAddresses = ["0xdCf0aF9e59C002FA3AA091a46196b37530FD48a8"]

    console.log("Deploying Strategy");
    const strategyAAVEDAIFactory: InstaYieldStrategyAAVEv2__factory = await ethers.getContractFactory("InstaYieldStrategyAAVEv2");
    const InstaYieldStrategyAAVEv2: InstaYieldStrategyAAVEv2 = <InstaYieldStrategyAAVEv2>(
      await strategyAAVEDAIFactory
        .connect(wallet1)
        .deploy(
          taskArguments.pooladdress,
          taskArguments.principaltokenaddress,
          taskArguments.interestbearingtokenaddresses,
          taskArguments.InstaYieldProtocoladdress,
        )
    );
    await InstaYieldStrategyAAVEv2.deployed();
    console.log("-> Strategy Deployed to", InstaYieldStrategyAAVEv2.address);
  });

task("deploy:RegisterStrategy")
  .addParam("InstaYieldProtocoladdress", "The instaYield protocol address")
  .addParam("strategyaddress", "The strategy address")
  .addParam("principaltokenaddress", "The principal token address - eg DAI, USDC")
  .addParam("ftokenname", "The fToken name - eg fDAI Token")
  .addParam("ftokensymbol", "The fToken symbol - eg fDAI")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const [wallet1] = await ethers.getSigners();

    console.log("Registering strategy against InstaYield protocol");
    const InstaYieldProtocolContract: InstaYieldProtocol = <InstaYieldProtocol>(
      await ethers.getContractAt("InstaYieldProtocol", taskArguments.InstaYieldProtocoladdress)
    );

    await InstaYieldProtocolContract
      .connect(wallet1)
      .registerStrategy(
        taskArguments.strategyaddress,
        taskArguments.principaltokenaddress,
        taskArguments.ftokenname,
        taskArguments.ftokensymbol,
      );
    console.log("-> Strategy registered");
  });

task("deploy:InstaYieldBack")
  .addParam("stakingtokenaddress", "The token to be staked")
  .addParam("rewardtokenaddress", "The reward token address")
  .addParam("maxapr", "The maximum APR")
  .addParam("minimumstakeduration", "The minimum amount of seconds the user will need to stake for")
  .addParam("maximumstakeduration", "The maximum number of seconds the user can stake for")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const [wallet1] = await ethers.getSigners();

    console.log("Deploying InstaYieldBack Contract");
    const InstaYieldBackFactory: InstaYieldBack__factory = await ethers.getContractFactory("InstaYieldBack");
    const InstaYieldBack: InstaYieldBack = <InstaYieldBack>(
      await InstaYieldBackFactory
        .connect(wallet1)
        .deploy(
          taskArguments.stakingtokenaddress,
          taskArguments.rewardtokenaddress,
          BigNumber.from(taskArguments.minimumstakeduration),
          BigNumber.from(taskArguments.maximumstakeduration),
        )
    );
    await InstaYieldBack.deployed();
    console.log("-> InstaYieldBack Contract Deployed", InstaYieldBack.address);

    console.log("InstaYieldBack Setting Ratio to:", BigNumber.from(taskArguments.maxapr));
    await InstaYieldBack.connect(wallet1).setMaxAPR(BigNumber.from(taskArguments.maxapr));
    console.log("-> InstaYieldBack Ratio set.");
  });

task("deploy:InstaYieldBackLM")
  .addParam("stakingtokenaddress", "The token to be staked")
  .addParam("rewardtokenaddress", "The reward token address")
  .addParam("minimumstakeduration", "The minimum amount of seconds the user will need to stake for")
  .addParam("maximumstakeduration", "The maximum number of seconds the user can stake for")
  .addParam("maxapr", "Maximum APR")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const [wallet1] = await ethers.getSigners();

    console.log("Deploying InstaYieldBack Contract");
    const InstaYieldBackFactory: InstaYieldBackLM__factory = await ethers.getContractFactory("InstaYieldBackLM");
    const InstaYieldBack: InstaYieldBackLM = <InstaYieldBackLM>(
      await InstaYieldBackFactory
        .connect(wallet1)
        .deploy(
          taskArguments.stakingtokenaddress,
          taskArguments.rewardtokenaddress,
          BigNumber.from(taskArguments.minimumstakeduration),
          BigNumber.from(taskArguments.maximumstakeduration),
        )
    );
    await InstaYieldBack.deployed();
    console.log("-> InstaYieldBackLM Contract Deployed", InstaYieldBack.address);

    console.log("Setting MAX APR to", taskArguments.maxapr);
    await InstaYieldBack.connect(wallet1).setParameters(taskArguments.maxapr, 1, 1);
    console.log("-> done");
  });

task("deploy:UserIncentive")
  .addParam("strategyaddress", "The strategy address we want to incentivise")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const [wallet1] = await ethers.getSigners();

    console.log("Deploying UserIncentive Contract");
    const uiFactory: UserIncentive__factory = await ethers.getContractFactory("UserIncentive");
    const userIncentiveContract: UserIncentive = <UserIncentive>(
      await uiFactory.connect(wallet1).deploy(taskArguments.strategyaddress)
    );
    await userIncentiveContract.deployed();
    console.log("-> UserIncentive Contract Deployed", userIncentiveContract.address);

    console.log("Updating Strategy to use UserIncentive contract");
    const strategyContract: InstaYieldStrategyAAVEv2 = <InstaYieldStrategyAAVEv2>(
      await ethers.getContractAt("InstaYieldStrategyAAVEv2", taskArguments.strategyaddress)
    );
    await strategyContract.connect(wallet1).setUserIncentiveAddress(userIncentiveContract.address);
    console.log("-> Done");
  });
