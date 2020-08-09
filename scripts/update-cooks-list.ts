// SPDX-License-Identifier: MIT

import { TacosCrowdsaleFactory } from "../src/types/TacosCrowdsaleFactory";

const { ethers, network } = require("@nomiclabs/buidler");

require("dotenv").config();

async function main() {

  if (network.name != "ropsten" && network.name != "mainnet") throw Error("Deploy script only works for livenets");

  const CROWDSALE_CONTRACT = "0xE9c5D5b34967c210575ACeE5655A968b05c31749";

  const EARLY_COOKS_LIST = [
    "0x5224130B3E071a09b711CA4F9242F927BEB4E693",
    "0x0214c295E1aE39c3F589cE53811c82c7d10b359d",
    "0x3B453972722b671A5217B811d62cB70F73Bd9E37",
    "0xb51b6c9D16DA4b720d575140E1a3dd4C4a163953",
    "0xb233166aD1E0245b9d5B1428A22912C4CE01f252",
    "0x6cC77465823260A74d9586D816cbE993F0A43229",
    "0xd4a52814797Cd9C6f22eB9A352a58658e36e7Be8",
    "0x45d155808B1c30DF32B3984904669ac80bACc806",
    "0xAE721e7C9974bdDE7682AFF36351F43D6738f2C4",
    "0x9C52D288E14BBAbB90b62a23a318494d30c59DD7",
    "0xDfDfDce77DD4eF074532bc86E6Cb0B5b5bFAa584",
    "0xbb38E1c9e6d61B51F2eF5f9290b29e86d9191FDf",
    "0xbfeceC47dD8bf5F6264A9830A9d26ef387c38A67",
    "0x0fdbd5B41AEe3Ff69DfB6e639EA658675835bc75",
    "0x4530B100BF6400268E22fE64d7548fFaafA8dC39",
    "0xbdDBD3A43F2474147C48CA56dc849edB981145A0",
    "0xe141bD191B02D09703f84667976Ed6Da6969d07C",
    "0x52DE8B421f596edAF028b1FfCB92EC61CB9622A4",
    "0xFc42811DE7689E32FBab66058d682d1Db1d9Cb9E",
    "0x1f8C60B43d2DF5eFC07501bbd164D61cB6AC2913",
    "0x33d66cD7E692Fd0a6dDE083462D7D19363A673eb",
    "0xa34a3411D9834E8FFa5D11D99af80206e0fFb683",
    "0xAb4A4241b0f4e369da4F12818d49A61Af1347803",
    "0xaCc993013812e5524102474Ba78f3a278c6d2eFc",
    "0xBA5489B92259FC0aC440144E769779F34a079cAd",
    "0x584C7A88179C493D12083094b6e335C267d4C41b",
    "0x1aaF5e41c2c73617bc120097547A3410CaF6718A",
    "0xa4B23d8d83a49C324E31229421BC22C280Dc8eFA",
    "0xbC6e474a02D7FFd4C688a66E5bd7EE78E89a42cd",
    "0x2971f195F9b9f2b50FBE9d7C31FED6929E9F4716",
    "0xBf26925f736E90E1715ce4E04cD9c289dD1bc002",
    "0x9cf7a4b50517D0Bf70606Cded915e76E5310520B",
    "0x621f2A5ef987e064E76da1EB378e7193CeFC0baA",
    "0x76B687cF4E5a4e73Fa3950D6cC642bCC64e40B88",
    "0xcA7b598CF47602030ef0b369b6B511dE2853eEBA"
  ];

  const [deployer] = await ethers.getSigners();

  console.log(
    "Updating Cooks list with the account:",
    await deployer.getAddress()
  );
  console.log("Account balance:", ethers.utils.formatEther((await deployer.getBalance())));

  // Deploy TacosCrowdsale
  const tacosCrowdsale = new TacosCrowdsaleFactory(deployer);
  const crowdsaleContract = await tacosCrowdsale.attach(CROWDSALE_CONTRACT);

  // Adding Cook list
  await (await crowdsaleContract.setCooksList(EARLY_COOKS_LIST)).wait(1);
  EARLY_COOKS_LIST.forEach(async (cook) => {
    console.log(
      `${cook} is in Crowdsale Cooklist: `,
      await crowdsaleContract.cookslist(cook)
    );
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });