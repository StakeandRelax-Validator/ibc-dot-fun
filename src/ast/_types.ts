import { Asset, AssetList, Chain, Explorer } from "@graz-sh/types";

export interface Variables {
  assetlists: AssetList[];
  chains: Chain[];

  chainIds: string[];
  chainNames: string[];

  chainIdToName: Record<string, string>;
  chainIdToPrettyName: Record<string, string>;
  chainNameToId: Record<string, string>;

  chainRecord: Record<string, Chain>;
  assetsRecord: Record<string, Asset[]>;
  explorersRecord: Record<string, Explorer[]>;
}
