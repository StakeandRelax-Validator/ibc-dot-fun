import "../styles/globals.css";
import "@interchain-ui/react/styles";

import { wallets as cosmostationWallets } from "@cosmos-kit/cosmostation-extension";
import { wallets as keplrWallets } from "@cosmos-kit/keplr-extension";
import { wallets as leapWallets } from "@cosmos-kit/leap-extension";
import { wallets as metamaskWallets } from "@cosmos-kit/leap-metamask-cosmos-snap";
import { ChainProvider } from "@cosmos-kit/react";
import * as RadixToast from "@radix-ui/react-toast";
import { QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import { assets, chains } from "chain-registry";
import { AppProps } from "next/app";
import Head from "next/head";
import { WagmiConfig } from "wagmi";
import { configureChains, createConfig } from "wagmi";
import { arbitrum, base, mainnet, optimism, polygon, zora } from "wagmi/chains";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { publicProvider } from "wagmi/providers/public";

import MainLayout from "@/components/MainLayout";
import { AssetsProvider } from "@/context/assets";
import { ChainsProvider } from "@/context/chains";
import { ToastProvider } from "@/context/toast";
import { SkipProvider } from "@/solve";
import { queryClient } from "@/utils/query";

const { publicClient } = configureChains(
  [mainnet, polygon, optimism, arbitrum, base, zora],
  [publicProvider()],
);

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [new MetaMaskConnector()],
  publicClient,
});

export default function App({ Component, pageProps }: AppProps) {
  const wallets = [
    ...keplrWallets,
    ...cosmostationWallets,
    ...leapWallets,
    ...metamaskWallets,
  ];

  return (
    <>
      <Head>
        <title>
          ibc.fun | Interchain transfers and swaps on any Cosmos chain
        </title>
        <meta
          name="description"
          content="Interchain transfers and swaps on any Cosmos chain"
        />
      </Head>
      <main>
        <QueryClientProvider client={queryClient}>
          <ChainProvider
            chains={chains}
            assetLists={assets}
            wallets={wallets}
            wrappedWithChakra
            throwErrors={false}
          >
            <WagmiConfig config={wagmiConfig}>
              <SkipProvider>
                <ChainsProvider>
                  <AssetsProvider>
                    <RadixToast.ToastProvider>
                      <ToastProvider>
                        <MainLayout>
                          <Component {...pageProps} />
                        </MainLayout>
                      </ToastProvider>
                      <RadixToast.Viewport className="w-[390px] max-w-[100vw] flex flex-col gap-2 p-6 fixed bottom-0 right-0 z-[999999]" />
                    </RadixToast.ToastProvider>
                  </AssetsProvider>
                </ChainsProvider>
              </SkipProvider>
            </WagmiConfig>
          </ChainProvider>
        </QueryClientProvider>
      </main>
      <Analytics />
    </>
  );
}
