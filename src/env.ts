// if (!import.meta.env.VITE_MINT_PUBKEYS) {
//   throw new Error("MINT_PUBKEY not found in environment variables");
// }
if (!import.meta.env.VITE_RELAYS) {
  throw new Error("RELAYS not found in environment variables");
}

// export const MINT_PUBKEYS = import.meta.env.VITE_MINT_PUBKEYS.split(
//   ","
// ) as string[];
export const RELAYS = import.meta.env.VITE_RELAYS.split(",") as string[];
