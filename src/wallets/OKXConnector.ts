import { InjectedConnector } from "@wagmi/core";

export const OKXConnector = new InjectedConnector({
  options: {
    name: "OKX Wallet",
    shimDisconnect: true,
    getProvider: () => {
      if (typeof window === "undefined") return;

      if (typeof window.okexchain === "undefined") return;

      if (typeof window.ethereum !== "undefined") return window.ethereum;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isOkxWallet = (ethereum?: any) => !!ethereum?.isOkxWallet;

      if (isOkxWallet(window.okexchain.ethereum))
        return window.okexchain.ethereum;

      if (window.okexchain.ethereum?.providers) {
        return window.okexchain.ethereum.providers.find(isOkxWallet);
      }

      return window["okexchain"]["ethereum"] ?? null;
    },
  },
});