import { BigNumberish, formatUnits } from "ethers";
import { useMemo } from "react";

import { ChainIdOrName } from "@/chains";
import { useAssets } from "@/context/assets";
import { raise } from "@/utils/assert";

interface Props {
  chainId: ChainIdOrName;
  denom: string;
  value: BigNumberish;
}

export const AssetValue = ({ chainId, denom, value }: Props) => {
  const { getAsset } = useAssets();

  const { decimals, symbol } = useMemo(() => {
    return getAsset(denom, chainId) || raise(`No asset found for ${denom}`);
  }, [chainId, denom, getAsset]);

  const formattedValue = useMemo(() => {
    const v = formatUnits(value, decimals);
    const w = 9;
    if (v.length > w) return v.slice(0, w) + "…";
    return v;
  }, [decimals, value]);

  return (
    <span className="tabular-nums">
      {formattedValue} {symbol}
    </span>
  );
};