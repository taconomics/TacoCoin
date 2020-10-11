export default (req: any, res: any) => {
  res.status(200).json({
    name: "Taconomics",
    description:
      `Taconomics is an experimental protocol mashing up some of the most
      exciting innovations in DeFi and crypto collectibles.
      Put your $TACO to work, earn Salsa, and use it to mint exclusive NFT Taco Art.`,
    image: "https://game.taconomics.io/taconomics-banner@2x.jpg",
    external_link: "https://taconomics.io"
  });
}