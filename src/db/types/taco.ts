import { Pool } from './pool';
import { Attribute } from './attribute';

export class Taco {
  constructor(
    public name: string,
    public description: string,
    public external_url: string,
    public image: string,
    public attributes: Array<Attribute>,
    public pool: Pool,
  ) {}
}