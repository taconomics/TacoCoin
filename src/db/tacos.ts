import { Pool } from './types/pool';
import { Attribute } from './types/attribute';
import { Taco } from './types/taco';

const tacos: Array<Taco> = [];
tacos.push(new Taco(
  "Taquito",
  "Taquito for everyone",
  "game",
  "image",
  [
    new Attribute("birthday", "balue")
  ],
  new Pool("genesis", 10)
));

export { tacos };