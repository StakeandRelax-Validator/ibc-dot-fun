import { Asset, AssetList, Chain } from "@graz-sh/types";
import pMap from "p-map";

import { concurrency } from "./_constants";
import { Variables } from "./_types";
import { parseAssetListJson } from "./parse-asset-list-json";
import { parseChainJson } from "./parse-chain-json";

interface Args {
  registryPath: string;
  chainPaths: string[];
}

export async function parseChainPaths({
  registryPath,
  chainPaths,
}: Args): Promise<Variables> {
  const chains: Chain[] = [];
  const assetlists: AssetList[] = [];

  const chainIds: string[] = [];
  const chainNames: string[] = [];

  const chainIdToName: Record<string, string> = {};
  const chainNameToId: Record<string, string> = {};
  const chainRecord: Record<string, Chain> = {};
  const assetsRecord: Record<string, Asset[]> = {};

  async function loadChainPath(chainPath: string) {
    const [assetlist, chain] = await Promise.all([
      parseAssetListJson({ registryPath, chainPath }),
      parseChainJson({ registryPath, chainPath }),
    ]);

    chains.push(chain);
    assetlists.push(assetlist);

    chainIds.push(chain.chain_id);
    chainNames.push(chain.chain_name);

    chainIdToName[chain.chain_id] = chain.chain_name;
    chainIdToName[chain.chain_name] = chain.chain_name;

    chainNameToId[chain.chain_name] = chain.chain_id;
    chainNameToId[chain.chain_id] = chain.chain_id;

    chainRecord[chain.chain_id] = chain;
    assetsRecord[chain.chain_id] = assetlist.assets;
  }

  await pMap(chainPaths, loadChainPath, { concurrency });

  return {
    chains,
    assetlists,
    chainIds,
    chainNames,
    chainIdToName,
    chainNameToId,
    chainRecord,
    assetsRecord,
  };
}
