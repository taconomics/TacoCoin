import { UniswapFactoryMockFactory } from '../src/types/UniswapFactoryMockFactory';
import { UniswapV2PairMockFactory } from '../src/types/UniswapV2PairMockFactory';
import { TacoTokenFactory } from "../src/types/TacoTokenFactory";

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

  const TOTAL_SUPPLY = "15624000000000000000000000";
  const CIRCULATING_SUPPLY = "14530320000000000000000000";
  const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", await deployer.getAddress());
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Set Uniswap Mock
  const uniswapV2PairFactory = new UniswapV2PairMockFactory(deployer);
  const uniswapPool = await uniswapV2PairFactory.deploy();
  await uniswapPool.deployed();
  console.log("\nUniswapV2Pair[Mock] deployed to:", uniswapPool.address);
  const uniswapFactoryMockFactory = new UniswapFactoryMockFactory(deployer);
  const uniswapFactory= await uniswapFactoryMockFactory.deploy(uniswapPool.address);
  await uniswapFactory.deployed();
  console.log("UniswapFactory[Mock] deployed to:", uniswapPool.address);

  // Deploy Taco Token Contract
  const tacoTokenFactory = new TacoTokenFactory(deployer);
  const tacoToken = await tacoTokenFactory.deploy(TOTAL_SUPPLY, uniswapFactory.address, WETH_ADDRESS);

  await tacoToken.deployed();
  console.log("\nTacoToken deployed to:", tacoToken.address);

  // Initialize Uniswap Pool
  await tacoToken.setUniswapPool();
  console.log("[TacoToken] Uniswap Pool set");

  // View the Deployer balance
  const deployerAddress = await deployer.getAddress();
  const deployerTacoBalance = await tacoToken.balanceOf(deployerAddress);
  console.log("[TacoToken] Deployer $TACOs balance:", deployerTacoBalance.toString());

  // Transfer $TACO to the Uniswap Pool (This is to bypass the crowdsale stage and test token)
  await tacoToken.transfer(uniswapPool.address, CIRCULATING_SUPPLY);
  const poolTacoBalance = await tacoToken.balanceOf(uniswapPool.address);
  console.log("\n[TacoToken] UniswapPool $TACOs balance:", poolTacoBalance.toString());
  const deployerTacoBalanceAfter = await tacoToken.balanceOf(deployerAddress);
  console.log("[TacoToken] Deployer $TACOs balance:", deployerTacoBalanceAfter.toString());

  // Unpause taco token since we are bypassing the crowdsale
  await tacoToken.unpause();
  console.log("[TacoToken] Unpaused");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => {
    console.info("///////////////");
    console.info("SUCCESS");
    console.info("///////////////");
    process.exit(0);
  })
  .catch((error) => {
    console.error("ERROR");
    // console.error(error);
    process.exit(1);
  });
