import { UniswapFactoryMockFactory } from '../src/types/UniswapFactoryMockFactory';
import { UniswapV2PairMockFactory } from '../src/types/UniswapV2PairMockFactory';
import { TacoTokenFactory } from "../src/types/TacoTokenFactory";

import { TaconomicsFactory } from '../src/types/TaconomicsFactory';
import { GenesisPoolFactory } from '../src/types/GenesisPoolFactory';

const { ethers, network } = require("@nomiclabs/buidler");

export async function main() {
  if (network.name != "localhost" && network.name != "buidlerevm") throw Error("Deploy script only works for local networks");

  const TOTAL_SUPPLY = "15624000000000000000000000";
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

  // Unpause taco token since we are bypassing the crowdsale
  await tacoToken.unpause();
  console.log("[TacoToken] Unpaused");

  /**
   * DEPLOY NFTS
   */

  const taconomics = await (new TaconomicsFactory(deployer)).deploy(
    "0xa5409ec958c83c3f309868babaca7c86dcb077c1",
    "https://localhost:3000/tacos/",
    "https://localhost:3000/contract/taconomics-erc1155"
  );
  await taconomics.deployed();
  console.log("\n[Taconomics] Deployed Taconomics ERC1155 Contract at:", taconomics.address);

  const genesisPool = await (new GenesisPoolFactory(deployer)).deploy(
    taconomics.address,
    tacoToken.address,
    "0x0000000000000000000000000000000000000000"
  );
  await genesisPool.deployed();
  console.log("\n[Genesis Pool] Deployed at:", genesisPool.address);

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
