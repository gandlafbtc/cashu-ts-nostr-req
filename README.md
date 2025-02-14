# Tester for [cashu-proxy](https://github.com/gudnuf/cashu-proxy)

This is a demo cashu wallet that can lookup Cashu mints by their pubkey and then talk to the mint via the cashu-proxy.

The most interesting thing here is I implemented a [custom request](https://github.com/gudnuf/cashu-proxy-tester/blob/master/src/custom-cashu-request.ts) that a `CashuMint` can be initialized with. This custom request will send kind `23338` events to mints.

A mint could support various transports like 'clearnet' or 'tor' or '[nipxx](https://github.com/gudnuf/cashu-proxy/tree/master#nip-xx)' and then the user can choose.

### Bonus

Along with the custom request, cashu-ts allows us to use any string as a `mintUrl`, so we can just initialize a mint with their pubkey in place of a URL.

This means tokens can be created with a pubkey in place of the mint url. Then when this token is sent the recipient can just query nostr for the corresponding kind `11111`
