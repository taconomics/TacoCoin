import React, { Fragment, useEffect, useRef } from "react";
import { TacoTokenFactory } from "../types/TacoTokenFactory";
import { ethers } from "ethers";
import { TacoToken } from "../types/TacoToken";
import moment from "moment";
import { BigNumber } from "ethers/utils";
import { Box, useTheme, Flex, Icon, Text, Stack, Divider, PseudoBox, Image, Spinner } from "@chakra-ui/core";
import { Global } from "@emotion/core";
import customTheme from "../lib/theme";
import Head from "next/head";
import LoadingTacos from "../components/LoadingTacos";

const fetchInterval = 3000; // 3 seconds

export type TaqueroStat = {
  address: string;
  timesCrunched: BigNumber;
  tacosCrunched: BigNumber;
  0: BigNumber;
  1: BigNumber;
};

export type InfoFor = {
  balance: BigNumber;
  poolBalance: BigNumber;
  totalSupply: BigNumber;
  totalTacosCrunched: BigNumber;
  crunchableTacos: BigNumber;
  lastCrunchAt: BigNumber;
  timesCrunched: BigNumber;
  tacosCrunched: BigNumber;
  tacoTuesday: boolean;
  tacosCrunchRate: BigNumber;
  taqueroRewardRate: BigNumber;
  tacoTuesdayMultiplier: BigNumber;
};

function truncate(str, maxDecimalDigits) {
  if (str.includes(".")) {
    const parts = str.split(".");
    return parts[0] + "." + parts[1].slice(0, maxDecimalDigits);
  }
  return str;
}

const truncateAddress = (str) => {
  return str.slice(0, 5) + "..." + str.slice(38, 42);
};

function HomePage() {
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isFetching, setIsFetching] = React.useState<boolean>(false);
  const [isFetchingFirstTime, setIsFetchingFirstTime] = React.useState<boolean>(true);
  const [isCrunchLoading, setIsCrunchLoading] = React.useState<boolean>(false);
  // const [isPurchasing, setIsPurchasing] = React.useState<boolean>(false);

  const [provider, setProvider] = React.useState<ethers.providers.Web3Provider>(null);
  const [signer, setSigner] = React.useState<ethers.providers.JsonRpcSigner>(null);
  const [address, setAddress] = React.useState<string>("0x0");

  const [tacoToken, setTacoToken] = React.useState<TacoToken | null>(null);
  const [isTacoTuesday, setIsTacoTuesday] = React.useState<boolean>(false);
  const [rewardMultiplier, setRewardMultiplier] = React.useState<number>(1);
  const [lastCrunchTime, setLastCrunchTime] = React.useState<number>(0);
  const [tacosCrunchedleaderboard, setTacosCrunchedLeaderboard] = React.useState<TaqueroStat[]>([]);
  const [timesCrunchedLeaderboard, setTimesCrunchedLeaderboard] = React.useState<TaqueroStat[]>([]);
  const [infoFor, setInfoFor] = React.useState<InfoFor | null>(null);
  const [isOwner, setIsOwner] = React.useState<boolean>(false);

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

  const handleFirstLoad = async () => {
    window.addEventListener("load", async () => {
      try {
        // Request full provider if needed
        // Full provider exposed
        await (window as any).ethereum.enable();
        const provider = new ethers.providers.Web3Provider((window as any).web3.currentProvider);
        // ⭐️ After user is successfully authenticated

        setProvider(provider);
        const signer = provider.getSigner();
        setSigner(signer);
        const address = await signer.getAddress();
        setAddress(address);

        const tacoToken = await TacoTokenFactory.connect(process.env.NEXT_PUBLIC_TACOTOKEN_CONTRACT_ADDRESS, signer);
        setTacoToken(tacoToken);

        setIsLoading(false);
        setIsFetching(true);
      } catch (error) {
        console.error(error);
        // User denied full provider access
      }
    });
  };

  const handleFetchTacoData = React.useCallback(async () => {
    if (isFetching && tacoToken) {
      const isTacoTuesday = await tacoToken.isTacoTuesday();
      setIsTacoTuesday(isTacoTuesday);
      console.log("isTacoTuesday : ", isTacoTuesday);

      const rewardMult = await tacoToken.rewardMultiplier();
      setRewardMultiplier(rewardMult.div(10).toNumber());

      const crunchTime = await tacoToken.lastCrunchTime();
      setLastCrunchTime(crunchTime.toNumber());

      const taqueros = await tacoToken.getTaqueros();

      const leaderboardQuery = Promise.all(taqueros.map((taquero) => tacoToken.getTaqueroStats(taquero)));
      const leaderboard = await leaderboardQuery;
      const sortedTacosCrunchedLeaderboard = leaderboard
        .map((taqueroStats, index) => ({ ...taqueroStats, address: taqueros[index] }))
        .sort((a, b) => (a.tacosCrunched.lt(b.tacosCrunched) ? 1 : -1));
      setTacosCrunchedLeaderboard(sortedTacosCrunchedLeaderboard);
      const sortedTimesCrunchedLeaderboard = leaderboard
        .map((taqueroStats, index) => ({ ...taqueroStats, address: taqueros[index] }))
        .sort((a, b) => (a.timesCrunched.lt(b.timesCrunched) ? 1 : -1));
      setTimesCrunchedLeaderboard(sortedTimesCrunchedLeaderboard);

      const info = await tacoToken.getInfoFor(address);
      Object.keys(info).map(function(key, index) {
        info[key] = info[key].toString();
      });
      setInfoFor(info);

      const owner = await tacoToken.owner();
      const isOwner = address === owner;
      setIsOwner(isOwner);

      setIsFetching(false);
      setIsFetchingFirstTime(false);
    }
  }, [isFetching, tacoToken]);

  React.useEffect(() => {
    handleFirstLoad();
  }, []);

  useInterval(() => {
    if (!isCrunchLoading) {
      setIsFetching(true);
    }
    handleFetchTacoData();
  }, fetchInterval);

  const handleCrunch = async () => {
    if (isCrunchLoading) return;
    try {
      console.log(tacoToken);
      console.info("trying to crunch pool");
      setIsCrunchLoading(true);
      const result = await tacoToken.crunchPool();
      await result.wait(1);
      console.log(result);
      setIsCrunchLoading(false);
      setIsFetching(true);
    } catch (err) {
      console.error(err);
      setIsCrunchLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingTacos></LoadingTacos>;
  }

  return (
    <Box pb={10}>
      <Head>
        <title>Taco Portal</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter&family=Roboto+Slab&display=swap"
          rel="stylesheet"
        ></link>
      </Head>
      <Global styles={{ body: { background: customTheme.colors.brandBackground[500] } }}></Global>

      {/* Nav */}
      <Flex py={3} px={5} alignItems="center" justifyContent="space-between">
        <Image src="/static/logo.png" height={60} width={85} />

        <Text textTransform="uppercase" fontSize="lg" fontWeight="bold" fontFamily="primary" color="white">
          Taco Portal
        </Text>
      </Flex>

      {/* Content */}
      <Stack mt={[3, 8]} alignItems="center" direction={"column"} spacing={5}>
        {/* Top Flex */}
        <Stack direction={"row"} spacing={[0, 0, 3]} justifyContent="center" flexWrap="wrap">
          {/* Get Spicy */}
          <PseudoBox
            _hover={{ boxShadow: isCrunchLoading ? "" : customTheme.shadows.xl }}
            as={Stack}
            minWidth="350px"
            cursor={isCrunchLoading ? "" : "pointer"}
            borderRadius={8}
            p={5}
            // @ts-ignore
            spacing={3}
            alignItems="center"
            direction="column"
            bg={"primary.500"}
            mb={[3, 3, 0]}
            onClick={handleCrunch}
          >
            {isCrunchLoading ? (
              <Fragment>
                <Text color="white" fontFamily="primary" fontSize="lg">
                  LOADING CRUNCH...
                </Text>
                <Text color="white" fontFamily="primary" fontSize="lg">
                  APPROVE TRANSACTION YO
                </Text>
              </Fragment>
            ) : (
              <Fragment>
                {isTacoTuesday ? (
                  <Text fontWeight="bold" fontSize="xl" fontFamily="primary" color="white">
                    IT'S TACO TUESDAY
                  </Text>
                ) : null}
                <Text fontWeight="500" fontSize="lg" fontFamily="primary" color="white">
                  {isTacoTuesday ? `IT'S DOUBLE CRUNCH TIME!` : `IT'S CRUNCH TIME!`}
                </Text>
                <Text fontWeight="bold" fontSize="xl" fontFamily="primary" color="white">
                  {isCrunchLoading || isFetchingFirstTime ? (
                    <Spinner />
                  ) : (
                    `${truncate(ethers.utils.formatEther(infoFor?.crunchableTacos), 4)} $TACO`
                  )}
                </Text>
                <Text fontWeight="bold" fontSize="md" fontFamily="primary" color="white">
                  Crunch to claim a{" "}
                  {isCrunchLoading || isFetchingFirstTime ? <Spinner /> : infoFor.taqueroRewardRate * rewardMultiplier}%
                  reward
                </Text>
              </Fragment>
            )}
          </PseudoBox>
          {/* Top Taquero */}
          <Stack
            minWidth="350px"
            borderRadius={8}
            p={5}
            spacing={3}
            alignItems="center"
            direction="column"
            bg={"primary.500"}
          >
            <Text textTransform="uppercase" fontWeight="500" fontSize="lg" fontFamily="primary" color="white">
              Top Taquero
            </Text>
            <Text fontFamily="secondary" color="white" fontSize="lg">
              {tacosCrunchedleaderboard?.[0]?.address ?? "None yet, will you be the first?"}
            </Text>
          </Stack>
        </Stack>

        {/* Middle Flex */}
        <Stack justifyContent="center" flexWrap="wrap" direction={"row"} spacing={2}>
          {/* Total Crunched */}
          <Stack p={5} width="350px" spacing={3} justifyContent="center" alignItems="center" direction="column">
            <Text fontFamily="primary" fontWeight="500" fontSize="lg">
              Total Crunched
            </Text>
            <Text fontFamily="primary" fontWeight="bold" fontSize="xl" color="white">
              {isCrunchLoading || isFetchingFirstTime ? (
                <Spinner />
              ) : (
                `${truncate(ethers.utils.formatEther(infoFor?.totalTacosCrunched), 4)} $TACO`
              )}
            </Text>
            {/* <Text fontFamily="primary" fontWeight="bold" fontSize="l" color="white">
              {`$ amount`}
            </Text> */}
          </Stack>
          {/* Last Crunch Time */}
          <Stack p={5} width="350px" spacing={3} justifyContent="center" alignItems="center" direction="column">
            <Text fontFamily="primary" fontWeight="500" fontSize="lg">
              Last Crunch Time
            </Text>
            <Text fontFamily="primary" fontWeight="bold" fontSize="xl" color="white">
              {isCrunchLoading || isFetchingFirstTime ? <Spinner /> : moment.unix(lastCrunchTime).fromNow()}
            </Text>
          </Stack>
        </Stack>

        {/* My Rewards */}
        <Stack justifyContent="center" flexWrap="wrap" direction={"row"} spacing={2}>
          <Stack p={5} width="350px" spacing={3} justifyContent="center" alignItems="center" direction="column">
            <Text fontFamily="primary" fontWeight="500" fontSize="lg">
              My Rewards
            </Text>
            <Text fontFamily="primary" fontWeight="bold" fontSize="xl" color="white">
              {isCrunchLoading || isFetchingFirstTime ? (
                <Spinner />
              ) : (
                `${truncate(ethers.utils.formatEther(infoFor?.tacosCrunched), 4)} $TACO`
              )}
            </Text>
            {/* <Text fontFamily="primary" fontWeight="bold" fontSize="l" color="white">{`$ amount`}</Text> */}
          </Stack>
          {/* My Wallet */}
          <Stack p={5} width="350px" spacing={3} justifyContent="center" alignItems="center" direction="column">
            <Text fontFamily="primary" fontWeight="500" fontSize="lg">
              My Wallet
            </Text>
            <Text fontFamily="primary" fontWeight="bold" fontSize="xl" color="white">
              {isCrunchLoading || isFetchingFirstTime ? (
                <Spinner />
              ) : (
                `${truncate(ethers.utils.formatEther(infoFor?.balance), 4)} $TACO`
              )}
            </Text>
            {/* <Text fontFamily="primary" fontWeight="bold" fontSize="l" color="white">{`$ amount`}</Text> */}
          </Stack>
        </Stack>

        <Divider orientation="horizontal" width={"100%"} background="black" height={"2px"}></Divider>

        {/* Leaderboard */}
        <Stack justifyContent="center" flexWrap="wrap" direction={"row"} spacing={[0, 0, 5]}>
          {/* Most Crunches */}
          <Stack width="500px" mb={[3, 3, 0]} justifyContent="center">
            <Text
              color="primary.500"
              textTransform="uppercase"
              fontFamily="primary"
              fontWeight="900"
              fontSize="xl"
              textAlign="center"
              alignSelf="center"
            >
              Most Crunches
            </Text>
            <Flex direction="column" alignItems="center">
              {timesCrunchedLeaderboard.length ? (
                timesCrunchedLeaderboard.map((taqueroStats) => (
                  <Text fontFamily="secondary" fontWeight="lg" color="white">
                    {taqueroStats.timesCrunched.toNumber()} --- {truncateAddress(taqueroStats.address)}
                  </Text>
                ))
              ) : (
                <Text fontFamily="secondary" color="white" fontSize="lg">
                  <Spinner />
                </Text>
              )}
            </Flex>
          </Stack>
          {/* Most Tacos */}
          <Stack width="500px" alignItems="center">
            <Text
              color="primary.500"
              textTransform="uppercase"
              fontFamily="primary"
              fontWeight="900"
              fontSize="xl"
              textAlign="center"
            >
              Most Tacos Crunched
            </Text>
            <Flex direction="column" alignItems="center">
              {tacosCrunchedleaderboard.length ? (
                tacosCrunchedleaderboard.map((taqueroStats) => (
                  <Text fontFamily="secondary" fontWeight="lg" color="white">
                    {truncate(ethers.utils.formatEther(taqueroStats.tacosCrunched), 4)} ---{" "}
                    {truncateAddress(taqueroStats.address)}
                  </Text>
                ))
              ) : (
                <Text fontFamily="secondary" color="white" fontSize="lg">
                  <Spinner />
                </Text>
              )}
            </Flex>
          </Stack>
        </Stack>

        {isOwner ? (
          <Fragment>
            <Divider orientation="horizontal" width={"100%"} background="black" height={"2px"}></Divider>
            <Stack direction="column" spacing={3}>
              <Flex>Hidden naughty stuff 1</Flex>
              <Flex>Hidden naughty stuff 2</Flex>
            </Stack>
          </Fragment>
        ) : null}
      </Stack>
    </Box>
  );
}

export default HomePage;
