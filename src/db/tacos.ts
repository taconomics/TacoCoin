import { Pool } from './types/pool';
import { Attribute } from './types/attribute';
import { Taco } from './types/taco';

const tacos: Array<Taco> = [];
tacos.push(new Taco(
  "Light Eater",
  "Achievement for Crunching TACO 1 time",
  "https://game.taconomics.io/api/tacos/1",
  "https://game.taconomics.io/static/nfts/1.jpg",
  [
    new Attribute("Rarity", "Common"),
    new Attribute("Set", "Cruncher Achievements"),
    new Attribute("Max Supply", "1000"),
  ],
  new Pool("Genesis", 10000)
));

export { tacos };