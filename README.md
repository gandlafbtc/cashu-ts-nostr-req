# Cashu-ts plugin for requests proxied through [proxley]() [based on cashu-proxy by @gudnuf](https://github.com/gudnuf/cashu-proxy)

Extracted and refactored to work as a module from [here](https://github.com/gudnuf/cashu-proxy-tester)

## Build

```
deno install
./_build_npm.ts 0.0.1
```

### Bonus

Along with the custom request, cashu-ts allows us to use any string as a `mintUrl`, so we can just initialize a mint with their pubkey in place of a URL.

This means tokens can be created with a pubkey in place of the mint url. Then when this token is sent the recipient can just query nostr for the corresponding kind `11111`
