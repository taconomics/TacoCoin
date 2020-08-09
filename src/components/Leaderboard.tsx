import * as React from "react";
import { ethers } from "ethers";
import { TaqueroStat } from "../pages/index";

interface IProps {
  stats: TaqueroStat[];
}

const Leaderboard: React.FunctionComponent<IProps> = (props) => (
  <div>
    <p>Leaderboard</p>
    {props.stats?.map((taquero) => (
      <div>
        <p>{`Address: ${taquero.address}`}</p>
        <p>{`Times crunched: ${taquero.timesCrunched.toString()}`}</p>
        <p>{`Tacos crunched: ${ethers.utils.formatEther(taquero.tacosCrunched)}`}</p>
      </div>
    ))}
  </div>
);

export default Leaderboard;
