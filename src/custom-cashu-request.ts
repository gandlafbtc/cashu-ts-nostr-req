import { NDKEvent, NDKPrivateKeySigner, NostrEvent } from "@nostr-dev-kit/ndk";
import ndk, { ndkConnected } from "./ndk";
import { generateSecretKey, getPublicKey, nip44 } from "nostr-tools";

const kind = 23338;

type RequestArgs = {
  endpoint: string;
  requestBody?: Record<string, unknown>;
  headers?: Record<string, string>;
};

type RequestOptions = RequestArgs & Omit<RequestInit, "body" | "headers">;

async function _customCashuRequest({
  endpoint,
  requestBody,
  ...options
}: RequestOptions) {
  if (!ndkConnected) {
    throw new Error("NDK not connected");
  }

  const mintPubkey = endpoint.split("/")[0];
  console.log("mintPubkey", mintPubkey);
  if (mintPubkey.length !== 64) {
    throw new Error("Mints public key should be a 32-byte hex string");
  }
  const path = endpoint.slice(64);
  console.log("path", path);

  const method = options.method || "GET";

  const requestContent = {
    method,
    path,
    body: requestBody,
  };

  // random key for each request to make the request harder to track
  const randomKey = generateSecretKey();
  const publicKey = getPublicKey(randomKey);

  const convoKey = nip44.getConversationKey(randomKey, mintPubkey);
  const encryptedContent = nip44.encrypt(
    JSON.stringify(requestContent),
    convoKey
  );

  const requestEvent = new NDKEvent(ndk, {
    kind,
    content: encryptedContent,
    tags: [["p", mintPubkey]],
  } as NostrEvent);

  await requestEvent.sign(new NDKPrivateKeySigner(randomKey));

  const responseFilter = {
    authors: [mintPubkey],
    kinds: [kind],
    "#p": [publicKey],
  };

  return new Promise((resolve, reject) => {
    const responseSub = ndk.subscribe(responseFilter);

    responseSub.on("event", (event) => {
      const decryptedContent = nip44.decrypt(event.content, convoKey);
      const responseContent = JSON.parse(decryptedContent);
      responseSub.stop();
      console.log("responseContent", responseContent);
      resolve(responseContent);
    });

    try {
      console.log("PUBLISHING", requestEvent.rawEvent());
      requestEvent.publish();
    } catch (error: unknown) {
      console.error("Error publishing event", error);
      reject(error);
    }
  });
}

export default async function request<T>(options: RequestOptions): Promise<T> {
  const data = await _customCashuRequest({ ...options });
  return data as T;
}
