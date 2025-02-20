import { rest } from "msw";
import { setupServer } from "msw/node";

import { API_URL } from "@/constants/api";
import { act, fireEvent, render, screen, waitFor, within } from "@/test";

import { ASSETS_RESPONSE } from "../../../fixtures/assets";
import { CHAINS_RESPONSE } from "../../../fixtures/chains";
import { SwapWidget } from "../SwapWidget";

const handlers = [
  rest.get(`${API_URL}/v1/info/chains`, (_, res, ctx) => {
    return res(ctx.status(200), ctx.json(CHAINS_RESPONSE));
  }),
  rest.get(`${API_URL}/v1/fungible/assets`, (_, res, ctx) => {
    return res(ctx.status(200), ctx.json(ASSETS_RESPONSE));
  }),
  rest.post(`${API_URL}/v2/fungible/route`, (_, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        source_asset_denom: "uatom",
        source_asset_chain_id: "cosmoshub-4",
        dest_asset_denom: "untrn",
        dest_asset_chain_id: "neutron-1",
        amount_in: "1000000",
        operations: [
          {
            transfer: {
              port: "transfer",
              channel: "channel-569",
              chain_id: "cosmoshub-4",
              pfm_enabled: true,
              dest_denom: "ibc/C4CFF46FD6DE35CA4CF4CE031E643C8FDC9BA4B99AE598E9B0ED98FE3A2319F9",
              supports_memo: true,
            },
          },
          {
            swap: {
              swap_in: {
                swap_venue: {
                  name: "neutron-astroport",
                  chain_id: "neutron-1",
                },
                swap_operations: [
                  {
                    pool: "neutron1e22zh5p8meddxjclevuhjmfj69jxfsa8uu3jvht72rv9d8lkhves6t8veq",
                    denom_in: "ibc/C4CFF46FD6DE35CA4CF4CE031E643C8FDC9BA4B99AE598E9B0ED98FE3A2319F9",
                    denom_out: "untrn",
                  },
                ],
                swap_amount_in: "1000000",
              },
              estimated_affiliate_fee: "0untrn",
            },
          },
        ],
        chain_ids: ["cosmoshub-4", "neutron-1"],
        does_swap: true,
        estimated_amount_out: "25329854",
        amount_out: "25329854",
        swap_venue: {
          name: "neutron-astroport",
          chain_id: "neutron-1",
        },
      }),
    );
  }),
];

const server = setupServer(...handlers);

describe.skip("SwapWidget", () => {
  // Establish API mocking before all tests.
  beforeAll(() => server.listen());

  // Clean up after the tests are finished.
  afterAll(() => server.close());

  beforeEach(() => {
    localStorage.clear();
  });

  // Reset any request handlers that we may add during the tests,
  // so they don't affect other tests.
  afterEach(() => server.resetHandlers());

  it("can select source chain", async () => {
    await act(async () => {
      render(<SwapWidget />);
    });

    const sourceAssetSection = await screen.findByTestId("source");

    // Source chain should be Cosmos Hub by default
    const sourceChainButton = await within(sourceAssetSection).findByText("Cosmos Hub");
    expect(sourceChainButton).toBeInTheDocument();

    // Source asset should be selected
    const sourceAssetButton = await within(sourceAssetSection).findByText("ATOM");
    expect(sourceAssetButton).toBeInTheDocument();

    // Update amount in
    const inputAmountElement = within(sourceAssetSection).getByRole("textbox");
    fireEvent.change(inputAmountElement, { target: { value: "1" } });

    // Select new source chain
    fireEvent.click(sourceChainButton);
    fireEvent.click(await within(sourceAssetSection).findByText("Osmosis"));

    // Source chain is now Osmosis
    expect(sourceChainButton).toHaveTextContent("Osmosis");

    // Source chain is stored in local storage
    // expect(localStorage.getItem(LAST_SOURCE_CHAIN_KEY)).toEqual("osmosis-1");

    // Source asset is now OSMO
    expect(await within(sourceAssetSection).findByText("OSMO")).toBeInTheDocument();

    // Amount in is now empty
    expect(inputAmountElement).toHaveValue("");
  });

  it("can select source asset", async () => {
    await act(async () => {
      render(<SwapWidget />);
    });

    const sourceAssetSection = await screen.findByTestId("source");

    // Source asset should be ATOM initially
    const sourceAssetButton = await within(sourceAssetSection).findByText("ATOM");
    expect(sourceAssetButton).toBeInTheDocument();

    // Select new asset
    fireEvent.click(sourceAssetButton);
    fireEvent.click(await within(sourceAssetSection).findByText("NTRN"));

    // Source asset is now NTRN
    await waitFor(() => expect(sourceAssetButton).toHaveTextContent("NTRN"));
  });

  it("can select destination chain", async () => {
    await act(async () => {
      render(<SwapWidget />);
    });

    const destinationAssetSection = await screen.findByTestId("destination");

    // Destination chain should be undefined initially
    const destinationChainButton = await within(destinationAssetSection).findByText("Select Chain");
    expect(destinationChainButton).toBeInTheDocument();

    // Select new destination chain
    fireEvent.click(destinationChainButton);
    fireEvent.click(await within(destinationAssetSection).findByText("Neutron"));

    // Destination chain is now Neutron
    expect(destinationChainButton).toHaveTextContent("Neutron");

    // Destination asset should be selected
    const destinationAssetButton = await within(destinationAssetSection).findByText("NTRN");
    expect(destinationAssetButton).toBeInTheDocument();

    // Select new destination chain
    fireEvent.click(destinationChainButton);
    fireEvent.click(await within(destinationAssetSection).findByText("Osmosis"));

    // Destination chain is now Osmosis
    expect(destinationChainButton).toHaveTextContent("Osmosis");

    // Destination asset should now be OSMO
    await waitFor(async () => expect(await within(destinationAssetSection).findByText("OSMO")).toBeInTheDocument());
  });

  it("can select destination asset", async () => {
    await act(async () => {
      render(<SwapWidget />);
    });

    const destinationAssetSection = await screen.findByTestId("destination");

    const destinationChainButton = await within(destinationAssetSection).findByText("Select Chain");
    expect(destinationChainButton).toBeInTheDocument();

    // Select Osmosis as destination chain
    fireEvent.click(destinationChainButton);
    fireEvent.click(await within(destinationAssetSection).findByText("Osmosis"));

    // Destination asset should be OSMO initially
    const destinationAssetButton = await within(destinationAssetSection).findByText("OSMO");
    expect(destinationAssetButton).toBeInTheDocument();

    // Select new asset
    fireEvent.click(destinationAssetButton);
    fireEvent.click(await within(destinationAssetSection).findByText("CMDX"));

    // Destination asset is now CMDX
    await waitFor(() => expect(destinationAssetButton).toHaveTextContent("CMDX"));
  });

  it("can select destination asset before selecting destination chain", async () => {
    await act(async () => {
      render(<SwapWidget />);
    });

    const destinationAssetSection = await screen.findByTestId("destination");

    // Destination chain should be undefined
    const destinationChainButton = await within(destinationAssetSection).findByText("Select Chain");
    expect(destinationChainButton).toBeInTheDocument();

    const destinationAssetButton = await within(destinationAssetSection).findByText("Select Token");
    expect(destinationAssetButton).toBeInTheDocument();

    // Select destination asset
    fireEvent.click(destinationAssetButton);
    fireEvent.click(await within(destinationAssetSection).findByText("ATOM"));

    // Destination chain is now Cosmos Hub
    await waitFor(() => expect(destinationChainButton).toHaveTextContent("Cosmos Hub"));

    // Destination asset is now ATOM
    await waitFor(() => within(destinationAssetSection).findByText("ATOM"));

    // Select new destination chain
    fireEvent.click(destinationChainButton);
    fireEvent.click(await within(destinationAssetSection).findByText("Osmosis"));

    // Destination chain is now Osmosis
    expect(destinationChainButton).toHaveTextContent("Osmosis");

    // Destination asset should still be ATOM
    await waitFor(() => within(destinationAssetSection).findByText("ATOM"));
  });

  it("can swap source and destination", async () => {
    await act(async () => {
      render(<SwapWidget />);
    });

    const sourceAssetSection = await screen.findByTestId("source");
    const destinationAssetSection = await screen.findByTestId("destination");

    // Source chain should be selected
    const sourceChainButton = await within(sourceAssetSection).findByText("Cosmos Hub");
    expect(sourceChainButton).toBeInTheDocument();

    // Source asset should be selected
    const sourceAssetButton = await within(sourceAssetSection).findByText("ATOM");
    expect(sourceAssetButton).toBeInTheDocument();

    const destinationChainButton = await within(destinationAssetSection).findByText("Select Chain");

    fireEvent.click(destinationChainButton);
    fireEvent.click(await within(destinationAssetSection).findByText("Neutron"));

    // Destination chain should be selected
    expect(destinationChainButton).toHaveTextContent("Neutron");

    // Destination asset should be selected
    const destinationAssetButton = await within(destinationAssetSection).findByText("NTRN");
    expect(destinationAssetButton).toBeInTheDocument();

    const swapButton = await screen.findByTestId("swap-button");
    fireEvent.click(swapButton);

    // Source chain should be Neutron
    expect(sourceChainButton).toHaveTextContent("Neutron");

    // Source asset should be NTRN
    expect(sourceAssetButton).toHaveTextContent("NTRN");

    // Destination chain should be Cosmos Hub
    expect(destinationChainButton).toHaveTextContent("Cosmos Hub");

    // Destination asset should be ATOM
    expect(destinationAssetButton).toHaveTextContent("ATOM");
  });

  it("fetches a route and displays an amount out", async () => {
    await act(async () => {
      render(<SwapWidget />);
    });

    const sourceAssetSection = await screen.findByTestId("source");
    const destinationAssetSection = await screen.findByTestId("destination");

    // Source chain should be selected
    const sourceChainButton = await within(sourceAssetSection).findByText("Cosmos Hub");
    expect(sourceChainButton).toBeInTheDocument();

    // Source asset should be selected
    const sourceAssetButton = await within(sourceAssetSection).findByText("ATOM");
    expect(sourceAssetButton).toBeInTheDocument();

    const destinationChainButton = await within(destinationAssetSection).findByText("Select Chain");

    fireEvent.click(destinationChainButton);
    fireEvent.click(await within(destinationAssetSection).findByText("Neutron"));

    // Destination chain should be selected
    expect(destinationChainButton).toHaveTextContent("Neutron");

    // Destination asset should be selected
    const destinationAssetButton = await within(destinationAssetSection).findByText("NTRN");
    expect(destinationAssetButton).toBeInTheDocument();

    // Update amount in
    const inputAmountElement = within(sourceAssetSection).getByRole("textbox");
    fireEvent.change(inputAmountElement, { target: { value: "1" } });

    const outputAmountElement = within(destinationAssetSection).getByTestId("amount");

    await waitFor(() => expect(outputAmountElement).toHaveTextContent("25.329854"));
  });

  it("does not show the connect destination wallet button if the source chain and destination chain are the same chain type", async () => {
    await act(async () => {
      render(<SwapWidget />);
    });

    const sourceAssetSection = await screen.findByTestId("source");
    const destinationAssetSection = await screen.findByTestId("destination");

    const sourceChainButton = within(sourceAssetSection).getByText("Cosmos Hub");

    const destinationChainButton = within(destinationAssetSection).getByText("Select Chain");

    // select Cosmos Hub and Neutron
    await act(() => {
      fireEvent.click(sourceChainButton);
    });
    fireEvent.click(
      await within(sourceAssetSection).findByRole("button", {
        name: /cosmos hub/i,
      }),
    );

    await act(() => {
      fireEvent.click(destinationChainButton);
    });
    fireEvent.click(
      await within(destinationAssetSection).findByRole("button", {
        name: /neutron/i,
      }),
    );

    expect(screen.queryByTestId("destination-wallet-btn")).not.toBeInTheDocument();
  });

  it("displays the connect destination wallet button if the source chain and destination chain are not the same chain type", async () => {
    await act(async () => {
      render(<SwapWidget />);
    });

    const sourceAssetSection = await screen.findByTestId("source");
    const destinationAssetSection = await screen.findByTestId("destination");

    const sourceChainButton = within(sourceAssetSection).getByText("Cosmos Hub");

    const destinationChainButton = within(destinationAssetSection).getByText("Select Chain");

    // select Arbitrum and Osmosis
    await act(() => {
      fireEvent.click(sourceChainButton);
    });
    fireEvent.click(
      await within(sourceAssetSection).findByRole("button", {
        name: /arbitrum/i,
      }),
    );

    await act(() => {
      fireEvent.click(destinationChainButton);
    });
    fireEvent.click(
      await within(destinationAssetSection).findByRole("button", {
        name: /osmosis/i,
      }),
    );

    expect(screen.queryByTestId("destination-wallet-btn")).toBeInTheDocument();

    // select Osmosis and Polygon
    await act(() => {
      fireEvent.click(sourceChainButton);
    });
    fireEvent.click(
      await within(sourceAssetSection).findByRole("button", {
        name: /osmosis/i,
      }),
    );

    await act(() => {
      fireEvent.click(destinationChainButton);
    });
    fireEvent.click(
      await within(destinationAssetSection).findByRole("button", {
        name: /polygon/i,
      }),
    );

    expect(screen.queryByTestId("destination-wallet-btn")).toBeInTheDocument();
  }, 10000);
});
