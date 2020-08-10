import React, { useEffect, useRef } from "react";
import { ethers } from "ethers";
import moment from "moment";
import { BigNumber } from "ethers/utils";
import { TacoTokenFactory } from "../types/TacoTokenFactory";
import { TacosCrowdsaleFactory } from "../types/TacosCrowdsaleFactory";
import { TacoToken } from "../types/TacoToken";
import { TacosCrowdsale } from "../types/TacosCrowdsale";
import {
  Flex,
  Button,
  Stack,
  Text,
  Image,
  Divider,
  Spinner,
  Progress,
  Badge,
  StatGroup,
  StatLabel,
  StatHelpText,
  StatNumber,
  Stat,
  Input,
} from "@chakra-ui/core";
import LoadingTacos from "../components/LoadingTacos";
import { Global } from "@emotion/core";
import customTheme from "../lib/theme";
import Head from "next/head";
import { TransactionResponse } from "ethers/providers";

const fetchInterval = 5000; // 5 seconds

export type TaqueroStat = {
  address: string;
  timesCrunched: BigNumber;
  tacosCrunched: BigNumber;
  0: BigNumber;
  1: BigNumber;
};

const truncate = (str, maxDecimalDigits) => {
  if (str.includes(".")) {
    const parts = str.split(".");
    return parts[0] + "." + parts[1].slice(0, maxDecimalDigits);
  }
  return str;
};

const truncateAddress = (str) => {
  return str.slice(0, 5) + "..." + str.slice(38, 42);
};

const variantColorForRound = (round) => {
  if (round == "Cooks") {
    return "purple";
  } else if (round == "Karma") {
    return "blue";
  } else {
    return "green";
  }
};

function useInterval(callback: Function, delay: number) {
  const savedCallback = useRef<any>();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback?.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

const Crowdsale = () => {
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isFetching, setIsFetching] = React.useState<boolean>(false);
  const [isFetchingFirstTime, setIsFetchingFirstTime] = React.useState<boolean>(true);
  const [isPurchasing, setIsPurchasing] = React.useState<boolean>(false);

  const [provider, setProvider] = React.useState<ethers.providers.Web3Provider>(null);
  const [signer, setSigner] = React.useState<ethers.providers.JsonRpcSigner>(null);
  const [address, setAddress] = React.useState<string>("0x0");
  const [ethBalance, setEthBalance] = React.useState<string>("0");
  const [tacosCrowdsale, setTacosCrowdsale] = React.useState<TacosCrowdsale | null>(null);
  const [tacoToken, setTacoToken] = React.useState<TacoToken | null>(null);

  const [tacoBalance, setTacoBalance] = React.useState<string>("0");
  const [amountToBuy, setAmountToBuy] = React.useState<string>(0);
  const [hardcap, setHardcap] = React.useState<string>("");
  const [weiRaised, setWeiRaised] = React.useState<string>("");
  const [capPerAddress, setCapPerAddress] = React.useState<string>("");
  const [contributions, setContributions] = React.useState<string>("");
  const [currentRound, setCurrentRound] = React.useState<string>("");
  const [tacosPerEth, setTacosPerEth] = React.useState<number>(0);
  const [liquidityLocked, setLiquidityLocked] = React.useState<boolean>(false);

  const handleFirstLoad = async () => {
    await (window as any).ethereum.enable();
    const provider = new ethers.providers.Web3Provider((window as any).web3.currentProvider);
    // ⭐️ After user is successfully authenticated
    setProvider(provider);
    const signer = provider.getSigner();
    setSigner(signer);
    const address = await signer.getAddress();
    setAddress(address);

    const tacosCrowdsale = await TacosCrowdsaleFactory.connect(
      process.env.NEXT_PUBLIC_TACOSCROWDSALE_CONTRACT_ADDRESS,
      signer
    );
    setTacosCrowdsale(tacosCrowdsale);

    const tacoToken = await TacoTokenFactory.connect(process.env.NEXT_PUBLIC_TACOTOKEN_CONTRACT_ADDRESS, signer);
    setTacoToken(tacoToken);

    setIsLoading(false);
    setIsFetching(true);
  };

  const handleFetchCrowdsaleData = React.useCallback(async () => {
    if (isFetching) {
      const ethBalance = await signer.getBalance();
      setEthBalance(truncate(ethers.utils.formatEther(ethBalance), 2));

      const balance = await tacoToken.balanceOf(address);
      setTacoBalance(truncate(ethers.utils.formatEther(balance), 2));

      const hardcap = await tacosCrowdsale.ROUND_3_CAP();
      setHardcap(truncate(ethers.utils.formatEther(hardcap), 2));

      const weiRaised = await tacosCrowdsale.weiRaised();
      setWeiRaised(truncate(ethers.utils.formatEther(weiRaised), 2));

      const capAddy = await tacosCrowdsale.CAP_PER_ADDRESS();
      setCapPerAddress(truncate(ethers.utils.formatEther(capAddy), 2));

      const contribution = await tacosCrowdsale.contributions(address);
      setContributions(truncate(ethers.utils.formatEther(contribution), 2));

      setCurrentRound(await tacosCrowdsale.getCurrentRound());

      setTacosPerEth((await tacosCrowdsale.tacosPerEth()).toNumber());

      setLiquidityLocked(await tacosCrowdsale.liquidityLocked());

      setIsFetching(false);
      setIsFetchingFirstTime(false);
    }
  }, [isFetching]);

  React.useEffect(() => {
    handleFirstLoad();
  }, []);

  React.useEffect(() => {
    handleFetchCrowdsaleData();
  }, [handleFetchCrowdsaleData]);

  useInterval(() => {
    if (!isPurchasing) {
      setIsFetching(true);
    }
  }, fetchInterval);

  if (isLoading) {
    return <LoadingTacos variant="Crowdsale"></LoadingTacos>;
  }

  const handleTokensPurchase = async () => {
    try {
      // console.log(tacoToken);
      console.info("Trying to buy from the crowdsale");
      setIsPurchasing(true);
      const gasPrice = await provider.getGasPrice();
      const result = await signer.sendTransaction({
        to: process.env.NEXT_PUBLIC_TACOSCROWDSALE_CONTRACT_ADDRESS,
        value: ethers.utils.parseEther(amountToBuy),
        gasPrice,
      });
      console.info("Transaction sent...waiting for confirmation");
      await result.wait(1);
      console.info("Transaction confirmed");
      setIsPurchasing(false);
      setIsFetching(true);
    } catch (err) {
      console.error(err);
      setIsPurchasing(false);
    }
  };

  const handleAmountToBuyInput = (event) => setAmountToBuy(event.target.value);

  return (
    <Stack justifyContent="center" alignItems="center" direction="column" py={10}>
      <Head>
        <title>Taco Crowdsale</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter&family=Roboto+Slab&display=swap"
          rel="stylesheet"
        ></link>
      </Head>
      <Global styles={{ body: { background: customTheme.colors.brandBackground[500] } }}></Global>
      <Flex mb={5} flexDirection="column" justifyContent="center" alignItems="center">
        <Text mb={2} color="primary.500" fontFamily="primary" fontSize="2xl">
          Welcome to the Taco stand!
        </Text>
        <Image src="/static/logo.png" height={60} width={85} />
      </Flex>

      <Stack mt={5} direction="column" justifyContent="center" alignItems="center">
        <Text fontFamily="primary" fontSize={"lg"}>
          Your address: {truncateAddress(address)} <br />
        </Text>
        <Text>
          Current Round: <Badge variantColor={variantColorForRound(currentRound)}>{currentRound}</Badge>
        </Text>
        <Divider orientation="horizontal" width={"100%"} background="black" height={"2px"}></Divider>
        {isPurchasing || isFetchingFirstTime ? (
          <p>
            <Spinner />
          </p>
        ) : (
          <Button width={300} onClick={handleTokensPurchase} variantColor="green">
            BUY INTO CROWDSALE: {amountToBuy || 0} ETH
          </Button>
        )}
        <Text fontFamily="primary" fontSize={"lg"}>
          ETH AMOUNT TO BUY
        </Text>
        <Input placeholder={"0.1 to 2"} type="text" onChange={handleAmountToBuyInput} autoFocus focusBorderColor="pink.400"/>
        <br />
        <div>
          Total Raised: {weiRaised} of {hardcap} ETH
          <br />
          {isPurchasing || isFetchingFirstTime ? (
            <Progress hasStripe isAnimated value="100" />
          ) : (
            <Progress hasStripe value={(weiRaised / hardcap) * 100} />
          )}
        </div>
        <br />
        <div>
          Your contributions {contributions} of {capPerAddress} ETH
          <br />
          {isPurchasing || isFetchingFirstTime ? (
            <Progress hasStripe isAnimated color="red" value="100" />
          ) : (
            <Progress hasStripe color="red" value={(contributions / capPerAddress) * 100} />
          )}
        </div>
        <Divider orientation="horizontal" width={"100%"} background="black" height={"2px"}></Divider>
        <StatGroup>
          <Stat>
            <StatLabel>Balance</StatLabel>
            <StatNumber>{isPurchasing || isFetchingFirstTime ? <Spinner /> : tacoBalance}</StatNumber>
            <StatHelpText>Tacos</StatHelpText>
          </Stat>

          <Stat>
            <StatLabel>&nbsp;</StatLabel>
            <StatNumber>{isPurchasing || isFetchingFirstTime ? <Spinner /> : truncate(ethBalance, 2)}</StatNumber>
            <StatHelpText>ETH</StatHelpText>
          </Stat>
        </StatGroup>
        <Divider orientation="horizontal" width={"100%"} background="black" height={"2px"}></Divider>
        <Stack direction="column" justifyContent="center" alignItems="center">
          <p>
            <b>1 ETH = {isPurchasing || isFetchingFirstTime ? <Spinner /> : tacosPerEth} TACO</b>
          </p>
          {liquidityLocked ? <p>Liquidity locked!</p> : <p>Liquidity hasn't been locked yet. </p>}
        </Stack>
      </Stack>
      <Stack>
      <Divider orientation="horizontal" width={"100%"} background="black" height={"2px"}></Divider>
      <Text>
          DISCLAIMER: $TACO token is not an official KARMA DAO project. $TACO token is purely entertainment,
          not an investment. Purely an experimental GAME. Before purchasing $TACO tokens, you must ensure
          that the nature, complexity and risks inherent in the trading of cryptocurrency are suitable for
          your objectives in light of your circumstances and financial position. You should only purchase
          $TACO to have fun and to experience this experimental game with us. Many factors outside of the
          control of $TACO Token will effect the market price, including, but not limited to, national and
          international economic, financial, regulatory, political, terrorist, military, and other events,
          adverse or positive news events and publicity, and generally extreme, uncertain, and volatile market
          conditions. Extreme changes in price may occur at any time, resulting in a potential loss of value,
          complete or partial loss of purchasing power, and difficulty or a complete inability to sell or
          exchange your digital currency. $TACO Token shall be under no obligation to purchase or to broker
          the purchase back from you of your cryptocurrency in circumstances where there is no viable market
          for the purchase of the same. None of the content published on this site constitutes a recommendation
          that any particular cryptocurrency, portfolio of cryptocurrencies, transaction or investment strategy
          is suitable for any specific person. None of the information providers or their affiliates will advise
          you personally concerning the nature, potential, value or suitability of any particular cryptocurrency,
          portfolio of cryptocurrencies, transaction, investment strategy or other matter. The products and
          services presented on this website may only be purchased in jurisdictions in which their marketing
          and distribution are authorized. Play at your own risk and may the odds be ever in your favor.
        </Text>
      </Stack>
    </Stack>
  );
};

export default Crowdsale;
