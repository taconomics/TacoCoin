import { tacos } from '../../../db/tacos';

export default (req: any, res: any) => {
  const {
    query: { tacoId },
  } = req
  const taco = tacos[tacoId - 1];
  if (taco) {
    res.status(200).json(taco);
  } else {
    res.status(404).json({
      "error": `TACO id ${tacoId} not found`
    });
  }
}