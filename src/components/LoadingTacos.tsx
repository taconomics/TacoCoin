import { Box, Flex, Text, Image } from "@chakra-ui/core";
import Head from "next/head";
import { Global } from "@emotion/core";
import customTheme from "../lib/theme";

const LoadingTacos: React.FC<{ variant?: "Crowdsale" }> = ({ variant = "Portal" }) => (
  <Box>
    <Head>
      <title>Taco {variant}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter&family=Roboto+Slab&display=swap"
        rel="stylesheet"
      ></link>
    </Head>
    <Global styles={{ body: { background: customTheme.colors.brandBackground[500] } }}></Global>
    <Flex flexDirection="column" height={"100vh"} width={"100vw"} justifyContent="center" alignItems="center">
      <Text mb={2} color="white" fontFamily="secondary" fontSize="2xl">
        Loading your Tacos!
      </Text>
      <Image src="/static/logo.png" height={60} width={85} />
    </Flex>
  </Box>
);

export default LoadingTacos;
