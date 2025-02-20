import kind23338Request from "./custom-cashu-request.ts";
import { ndk } from "./ndk.ts";

export let ndkConnected = false
export let requestTimeout = 60000

export const createKind23338Request =async (relays: string[], options?: {timeout: number}) => {
    if (options?.timeout) {
      requestTimeout = options.timeout
    }
    for (const relay of relays) {
      if (!ndk.explicitRelayUrls.find(r=> r===relay)) {
        ndk.addExplicitRelay(relay)
      }
    }
    await ndk.connect()
    if (!ndkConnected) {
      //TODO how to get rid of this? currently first connection will fail without this delay
      await new Promise(resolve => setTimeout(resolve, 100)); 
    }
    console.log("connected to relays");
    ndkConnected = true;
  return kind23338Request;
};