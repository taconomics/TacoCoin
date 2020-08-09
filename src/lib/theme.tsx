import { theme } from "@chakra-ui/core";

// Let's say you want to add custom colors
const customTheme = {
  ...theme,
  fonts: {
    ...theme.fonts,

    primary: "Inter",
    secondary: "Roboto Slab",
    logo: "Taco Salad;",
  },
  colors: {
    ...theme.colors,
    brandBackground: {
      500: "rgba(244, 144, 12, 0.5)",
    },
    primary: {
      500: "rgba(221, 46, 68, 0.9)",
    },
  },
  //   brand: {
  //     900: "#1a365d",
  //     800: "#153e75",
  //     700: "#2a69ac",
  //   },
  // },
};

export default customTheme;
