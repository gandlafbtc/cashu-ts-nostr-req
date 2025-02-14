import { useState } from "react";
import "./App.css";
import { ndkConnected } from "./ndk";
import useWallets from "./hooks/useWallets.js";
import { getDecodedToken, GetInfoResponse } from "@cashu/cashu-ts";
import { shortenString } from "./utils.js";
import { nip19 } from "nostr-tools";
import useNostr from "./hooks/useNostr.js";
import { QRCodeSVG } from "qrcode.react";

function App() {
  const {
    mintTransports,
    selectedTransports,
    mints,
    selectTransport,
    addWallet,
    createTokenFromLightningPayment,
    claimProofs,
    createMintFromTransport,
    balance,
    fetchMintQuote,
  } = useWallets();
  const { lookupSupportedTransports } = useNostr();

  const [mintInfo, setMintInfo] = useState<GetInfoResponse | undefined>();
  const [newWalletInput, setNewWalletInput] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [tokenTransports, setTokenTransports] = useState<
    Array<[string, string]>
  >([]);
  const [invoiceToPay, setInvoiceToPay] = useState("");
  const [selectedTokenTransport, setSelectedTokenTransport] = useState("");
  const [createdToken, setCreatedToken] = useState("");

  const handleGetMintInfo = (mintPubkey: string) => {
    const mint = mints[mintPubkey];
    mint
      .getInfo()
      .then(setMintInfo)
      .catch((e) => {
        console.error(e);
      });
  };

  const handleAddWallet = () => {
    /* Validate input is either 32-byte hex or starts with npub */
    const hexRegex = /^[0-9a-f]{64}$/i;
    if (!newWalletInput.startsWith("npub") && !hexRegex.test(newWalletInput)) {
      alert("Please enter a valid 32-byte public key or npub");
      return;
    }

    /* If npub, convert to hex */
    const pubkey = newWalletInput.startsWith("npub")
      ? (nip19.decode(newWalletInput).data as string)
      : newWalletInput;

    addWallet(pubkey);
    setNewWalletInput("");
  };

  const handleCreateToken = async (mintPubkey: string) => {
    const mint = mints[mintPubkey];
    const amount = 10;
    const quote = await fetchMintQuote(mint, amount);
    setInvoiceToPay(quote.request);
    const token = await createTokenFromLightningPayment(
      quote,
      amount,
      mints[mintPubkey]
    );
    console.log("Token:", token);
    setInvoiceToPay("");
    if (token) {
      setCreatedToken(token);
    }
  };

  const handleTokenInput = async (token: string) => {
    setTokenInput(token);
    if (!token) {
      setTokenTransports([]);
      setSelectedTokenTransport("");
      return;
    }

    try {
      /* Extract mint pubkey from token */
      const { mint: mintPubkey } = getDecodedToken(tokenInput);

      /* Look up supported transports */
      const transports = await lookupSupportedTransports(mintPubkey);
      setTokenTransports(transports);
    } catch (e) {
      console.error("Invalid token:", e);
      setTokenTransports([]);
    }
  };

  const handleClaimToken = async () => {
    if (!selectedTokenTransport || !tokenInput) return;

    const mint = createMintFromTransport(selectedTokenTransport);
    await claimProofs(mint, tokenInput);

    /* Reset form */
    setTokenInput("");
    setTokenTransports([]);
    setSelectedTokenTransport("");
  };

  if (!ndkConnected) {
    return (
      <>
        <div>NDK Not Connected</div>
      </>
    );
  }
  return (
    <div className="min-h-screen max-w-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-2xl font-bold">Balance: {balance} sats</div>

        {/* Add Wallet Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex gap-4">
            <input
              type="text"
              value={newWalletInput}
              onChange={(e) => setNewWalletInput(e.target.value)}
              placeholder="Mint pubkey"
              className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddWallet}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Add Wallet
            </button>
          </div>
        </div>

        {/* Invoice QR Code */}
        {invoiceToPay && (
          <div className="bg-white p-6 rounded-lg shadow-md space-y-4 flex flex-col items-center">
            <h3 className="text-lg font-semibold">Scan to Pay Invoice</h3>
            <div className="p-4 border-8 border-white bg-gray-100 rounded-lg">
              <QRCodeSVG value={invoiceToPay} size={256} />
            </div>
            <div className="text-sm text-gray-500 break-all w-2/3 ">
              {invoiceToPay}
            </div>
          </div>
        )}

        {createdToken && (
          <div className="w-2/3 whitespace-nowrap overflow-x-auto">
            {createdToken}
          </div>
        )}

        {/* Claim Token Section */}
        <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Enter token to claim"
              className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => handleTokenInput(tokenInput)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Lookup Transports
            </button>
          </div>

          {tokenTransports.length > 0 && (
            <select
              value={selectedTokenTransport}
              onChange={(e) => setSelectedTokenTransport(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select transport</option>
              {tokenTransports.map(([network, address]) => (
                <option key={network} value={address}>
                  {network}: {shortenString(address, 10)}
                </option>
              ))}
            </select>
          )}

          {selectedTokenTransport && (
            <button
              onClick={handleClaimToken}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              Claim Token
            </button>
          )}
        </div>

        {/* Mints Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <h2 className="text-2xl underline">Added Mints</h2>
          {Object.entries(mintTransports).map(([mintPubkey, transports]) => (
            <div
              key={mintPubkey}
              className="bg-white p-6 rounded-lg shadow-md space-y-4"
            >
              <h3 className="text-lg font-semibold">
                Mint {shortenString(mintPubkey, 10)}
              </h3>
              <select
                value={selectedTransports[mintPubkey] || ""}
                onChange={(e) => selectTransport(mintPubkey, e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select transport</option>
                {transports.map(([network, address]) => (
                  <option key={network} value={address}>
                    {network}: {shortenString(address, 10)}
                  </option>
                ))}
              </select>

              {selectedTransports[mintPubkey] && (
                <div className="flex gap-4">
                  <button
                    onClick={() => handleGetMintInfo(mintPubkey)}
                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                  >
                    Get mint info
                  </button>
                  <button
                    onClick={() => handleCreateToken(mintPubkey)}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Mint 10 sats
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mint Info Section */}
        {mintInfo && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Mint info:</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(mintInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
