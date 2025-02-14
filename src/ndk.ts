import NDK from "@nostr-dev-kit/ndk";
import { RELAYS } from "./env";

const ndk = new NDK({ explicitRelayUrls: RELAYS });

let ndkConnected = false;

ndk.connect().then(() => {
  console.log("connected to relays");
  ndkConnected = true;
});

export { ndkConnected };
export default ndk;
