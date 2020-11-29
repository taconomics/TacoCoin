import { tacos } from '../../../db/tacos';

export default (req: any, res: any) => {
  res.status(200).json(tacos);
}