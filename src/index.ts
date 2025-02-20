import kind23338Request from "./custom-cashu-request.ts";
import { ndk } from "./ndk.ts";

export let ndkConnected = false

export const createKind23338Request = (transport: string, relays?: string[]) => {
  /* Check if transport is a URL by attempting to parse it */
  let isUrl = false;
  try {
    new URL(transport);
    isUrl = true;
  } catch {
    isUrl = false;
    if (!relays || relays.length === 0) {
      throw new Error("No relays provided");
      
    }
    if (!ndk.explicitRelayUrls || ndk.explicitRelayUrls.length === 0) {
      for (const relay of relays) {
        ndk.addExplicitRelay(relay)
      }
    }
    
    ndk.connect().then(() => {
      console.log("connected to relays");
      ndkConnected = true;
    });
  }
  return isUrl ? undefined : kind23338Request;
};