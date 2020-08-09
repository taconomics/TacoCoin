import { KarmaTokenMockFactory } from "../src/types/KarmaTokenMockFactory";
import { UniswapFactoryMockFactory } from "../src/types/UniswapFactoryMockFactory";
import { UniswapV2PairMockFactory } from "../src/types/UniswapV2PairMockFactory";
import { UniswapRouterMockFactory } from "../src/types/UniswapRouterMockFactory";
import { TacoTokenFactory } from "../src/types/TacoTokenFactory";
import { TacosCrowdsaleFactory } from "../src/types/TacosCrowdsaleFactory";

const { ethers, network } = require("@nomiclabs/buidler");

export async function main() {
  if (network.name != "localhost" && network.name != "buidlerevm") throw Error("Deploy script only works for local networks");

  // Total Supply:          15,624,000 $TACO   (100%)
  //  - Circulating Supply:   14,530,320 $TACO    (93%)
  //    - Uniswap Pool:         7,265,160 $TACO     (46.5%)
  //    - Pre-sale:             7,265,160 $TACO     (46.5%)
  //  - Remainder:            1,093,680 $TACO     (7%)
  //    - Marketing:            312,480 $TACO       (2%)
  //    - Future Development:   781,200 $TACO       (5%)

  const EARLY_BAKERS_LIST = [
    "0x5585738127d12542a8fd6C71c19d2E4CECDaB08a"
  ];
  const TOTAL_SUPPLY = "15624000000000000000000000";
  const CIRCULATING_SUPPLY = "14530320000000000000000000";
  const TACOS_PER_ETH = 34596;
  const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

  const [deployer, karmaWhale, karmaMember, karmaHolder] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", await deployer.getAddress());
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Set Karma Mock
  const karmaTokenFactory = new KarmaTokenMockFactory(deployer);
  const karmaToken = await karmaTokenFactory.deploy();

  await karmaToken.deployed();
  console.log("\nKarmaToken[Mock] deployed to:", karmaToken.address);

  const karmaWhaleAddress = await karmaWhale.getAddress();
  console.log("\nkarmaWhale Address:", karmaWhaleAddress);
  const karmaMemberAddress = await karmaMember.getAddress();
  console.log("karmaMember Address:", karmaMemberAddress);
  const karmaHolderAddress = await karmaHolder.getAddress();
  console.log("karmaHolder Address:", karmaHolderAddress);

  await karmaToken.setKarmaWhale(karmaWhaleAddress);
  console.info("\nsetKarmaWhale!");
  await karmaToken.setKarmaMember(karmaMemberAddress);
  console.info("setKarmaMember!");
  await karmaToken.setKarmaHolderNotMember(karmaHolderAddress);
  console.info("setKarmaHolderNotMember!");

  const karmaWhaleBalance = await karmaToken.balanceOf(karmaWhaleAddress);
  const karmaMemberBalance = await karmaToken.balanceOf(karmaMemberAddress);
  const karmaHolderBalance = await karmaToken.balanceOf(karmaHolderAddress);
  console.log(`\nKarmaToken[Mock]: balance of ${karmaWhaleAddress} = ${karmaWhaleBalance}`);
  console.log(`KarmaToken[Mock]: balance of ${karmaMemberAddress} = ${karmaMemberBalance}`);
  console.log(`KarmaToken[Mock]: balance of ${karmaHolderAddress} = ${karmaHolderBalance}`);

  // Set Uniswap Factory Mock
  const uniswapV2PairFactory = new UniswapV2PairMockFactory(deployer);
  const uniswapPool = await uniswapV2PairFactory.deploy();
  await uniswapPool.deployed();
  console.log("\nUniswapV2Pair[Mock] deployed to:", uniswapPool.address);
  const uniswapFactoryMockFactory = new UniswapFactoryMockFactory(deployer);
  const uniswapFactory = await uniswapFactoryMockFactory.deploy(uniswapPool.address);
  await uniswapFactory.deployed();
  console.log("UniswapFactory[Mock] deployed to:", uniswapPool.address);

  // Deploy TacoToken
  const tacoTokenFactory = new TacoTokenFactory(deployer);
  const tacoToken = await tacoTokenFactory.deploy(TOTAL_SUPPLY, uniswapFactory.address, WETH_ADDRESS);

  await tacoToken.deployed();
  console.log("\nTacoToken deployed to:", tacoToken.address);

  // Initialize Uniswap Pool
  await tacoToken.setUniswapPool();
  console.log("[TacoToken] Uniswap Pool set");

  // Set Uniswap Router Mock
  const uniswapRouterFactory = new UniswapRouterMockFactory(deployer);
  const uniswapRouterContract = await uniswapRouterFactory.deploy();

  await uniswapRouterContract.deployed();
  console.log("\nUniswapRouter[Mock] deployed to:", uniswapRouterContract.address);

  // Deploy TacosCrowdsale
  const tacosCrowdsale = new TacosCrowdsaleFactory(deployer);
  const crowdsaleContract = await tacosCrowdsale.deploy(
    tacoToken.address,
    karmaToken.address,
    TACOS_PER_ETH,
    uniswapRouterContract.address
  );

  await crowdsaleContract.deployed();
  console.log("\n[TacosCrowdsale] deployed to:", crowdsaleContract.address);
  console.log("[TacosCrowdsale] adding bakerlist");
  await crowdsaleContract.setBakersList(EARLY_BAKERS_LIST);
  EARLY_BAKERS_LIST.forEach(async (baker) => {
    console.log(
      `${baker} is in Crowdsale Bakerlist: `,
      await crowdsaleContract.bakersList(baker)
    );
  });

  // Look at the deployer $TACO balance
  const deployerAddress = await deployer.getAddress();
  const deployerTacoBalance = await tacoToken.balanceOf(deployerAddress);
  console.log("\n[TacoToken] Deployer $TACOs balance:", deployerTacoBalance.toString());

  // Seed the CrowdsaleContract with $TACO
  await tacoToken.transfer(crowdsaleContract.address, CIRCULATING_SUPPLY);
  const crowdsaleTacoBalance = await tacoToken.balanceOf(crowdsaleContract.address);
  console.log("\n[TacoToken] CrowdsaleContract $TACOs balance:", crowdsaleTacoBalance.toString());
  const deployerTacoBalanceAfter = await tacoToken.balanceOf(deployerAddress);
  console.log("[TacoToken] Deployer $TACOs balance:", deployerTacoBalanceAfter.toString());

  // Set the CrowdsaleContract as the TacoToken#Pauser
  const originalPauser = await tacoToken.pauser();
  console.log("\nDeployer address: ", deployerAddress);
  console.log("[TacoToken] Original Pauser: ", originalPauser);
  await tacoToken.setPauser(crowdsaleContract.address);
  const newPauser = await tacoToken.pauser();
  console.log("\nCrowdsale contract address: ", crowdsaleContract.address);
  console.log("[TacoToken] New Pauser: ", newPauser);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => {
    console.info("\n///////////////");
    console.info("SUCCESS");
    console.info("///////////////");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nERROR");
    // console.error(error);
    process.exit(1);
  });
