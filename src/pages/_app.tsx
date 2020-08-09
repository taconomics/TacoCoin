// import App from 'next/app'
import React from "react";
import { ThemeProvider, CSSReset } from "@chakra-ui/core";
import customTheme from "../lib/theme";

// Use at the root of your app

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider theme={customTheme}>
      <CSSReset />
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default MyApp;
