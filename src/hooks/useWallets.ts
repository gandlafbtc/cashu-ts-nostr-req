import useNostr from "./useNostr.js";
import { useEffect, useState } from "react";
import {
  CashuMint,
  CashuWallet,
  getDecodedToken,
  getEncodedToken,
  MintQuoteResponse,
  MintQuoteState,
  Proof,
} from "@cashu/cashu-ts";
import kind23338Request from "../custom-cashu-request.js";
import { Transport } from "../types.js";
import { useLocalStorage } from "react-use";
import {
  getEncodedTokenV4,
  sumProofs,
} from "@cashu/cashu-ts/dist/lib/es5/utils.js";

const useWallets = () => {
  const { lookupSupportedTransports } = useNostr();
  const [mintPubkeys, setMintPubkeys] = useLocalStorage<string[]>(
    "mint-pubkeys",
    []
  );
  const [proofs, setProofs] = useLocalStorage<Array<Proof>>("proofs", []);
  const [mintTransports, setMintTransports] = useState<
    Record<string, Array<Transport>>
  >({});
  const [selectedTransports, setSelectedTransports] = useState<
    Record<string, string>
  >({});
  const [mints, setMints] = useState<Record<string, CashuMint>>({});

  useEffect(() => {
    /* Look up supported transports for each mint pubkey */
    const loadTransports = async () => {
      if (!mintPubkeys) return;
      console.log("Loading transports for mints:", mintPubkeys);

      const transports: Record<string, Array<Transport>> = {};

      for (const pubkey of mintPubkeys) {
        const supported = await lookupSupportedTransports(pubkey);
        transports[pubkey] = supported;
      }

      setMintTransports(transports);
    };

    loadTransports();
  }, [mintPubkeys, lookupSupportedTransports]);

  const createMintFromTransport = (transport: string) => {
    /* Check if transport is a URL by attempting to parse it */
    let isUrl = false;
    try {
      new URL(transport);
      isUrl = true;
    } catch {
      isUrl = false;
    }

    const customRequest = isUrl ? undefined : kind23338Request;
    return new CashuMint(transport, customRequest);
  };

  useEffect(() => {
    /* Initialize mints when transports are selected */
    const newMints: Record<string, CashuMint> = {};
    console.log("Initializing mints with transports:", selectedTransports);

    for (const [pubkey, transport] of Object.entries(selectedTransports)) {
      newMints[pubkey] = createMintFromTransport(transport);
    }

    setMints(newMints);
  }, [selectedTransports]);

  const selectTransport = (mintPubkey: string, transport: string) => {
    setSelectedTransports((prev) => ({
      ...prev,
      [mintPubkey]: transport,
    }));
  };

  const addWallet = (pubkey: string) => {
    setMintPubkeys((prev) => {
      if (!prev) return [pubkey];
      if (prev.includes(pubkey)) return prev;
      return [...prev, pubkey];
    });
  };

  const fetchMintQuote = async (
    mint: CashuMint,
    amount: number
  ): Promise<MintQuoteResponse> => {
    const wallet = new CashuWallet(mint);
    const mintQuote = await wallet.createMintQuote(amount);

    console.log("Invoice:", mintQuote.request);

    return mintQuote;
  };

  useEffect(() => {
    const allProofToken = getEncodedTokenV4({
      proofs: proofs || [],
      mint: "https://stablenut.umint.cash",
      unit: "sat",
    });
    console.log("allProofToken", allProofToken);
    return () => {};
  }, []);

  const createTokenFromLightningPayment = async (
    mintQuote: MintQuoteResponse,
    amount: number,
    mint: CashuMint
  ) => {
    const wallet = new CashuWallet(mint);
    const invoice = mintQuote.request;

    /* Poll status until paid or timeout */
    let status = await wallet.checkMintQuote(mintQuote.quote);
    let attempts = 0;
    const maxAttempts = 60; // 1 minute timeout

    while (status.state === MintQuoteState.UNPAID && attempts < maxAttempts) {
      console.log("Waiting for payment...", invoice);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      status = await wallet.checkMintQuote(mintQuote.quote);
      attempts++;
    }

    if (status.state === MintQuoteState.UNPAID) {
      throw new Error("Payment timeout");
    }

    if (status.state === MintQuoteState.PAID) {
      let proofs: Proof[] | undefined;
      try {
        const result = await wallet.mintProofs(amount, mintQuote.quote);
        proofs = result.proofs;
      } catch (e: unknown) {
        console.error("Minting error:", e);
      }

      if (!proofs) {
        throw new Error("Minting timeout");
      }

      const token = getEncodedToken({
        proofs,
        mint: mint.mintUrl,
        unit: "sat",
      });
      return token;
    }
  };

  const claimProofs = async (mint: CashuMint, token: string) => {
    const wallet = new CashuWallet(mint);
    const { proofs: receivedProofs } = getDecodedToken(token);
    const { keep, send } = await wallet.swap(
      sumProofs(receivedProofs),
      receivedProofs
    );
    setProofs([...(proofs || []), ...keep, ...send]);
  };

  const balance = proofs ? sumProofs(proofs) : 0;

  return {
    mintTransports,
    selectedTransports,
    mints,
    selectTransport,
    addWallet,
    mintPubkeys,
    createTokenFromLightningPayment,
    claimProofs,
    balance,
    createMintFromTransport,
    fetchMintQuote,
  };
};

export default useWallets;
