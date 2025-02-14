import { useCallback } from "react";
import ndk from "../ndk";
import { Transport } from "../types.js";

const useNostr = () => {
  const lookupSupportedTransports = useCallback(
    async (pubkey: string): Promise<Array<Transport>> => {
      const filter = {
        kinds: [11111],
        authors: [pubkey],
      };
      const transportAnnouncement = await ndk.fetchEvent(filter);
      if (transportAnnouncement) {
        return transportAnnouncement.tags as Array<Transport>;
      } else {
        return [];
      }
    },
    []
  );

  return {
    lookupSupportedTransports,
  };
};

export default useNostr;
