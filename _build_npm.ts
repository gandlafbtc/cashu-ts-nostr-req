#!/usr/bin/env -S deno run --allow-read --allow-write --allow-net --allow-env --allow-run
// Copyright 2018-2022 the oak authors. All rights reserved. MIT license.

/**
 * This is the build script for building npm package.
 *
 * @module
 */

import { build, emptyDir } from "https://deno.land/x/dnt@0.38.1/mod.ts";

async function start() {
  await emptyDir("./npm");

  await build({
    entryPoints: [
      "./src/index.ts",
    ],
    outDir: "./npm",
    shims: {},
    test: false,
    typeCheck: "both",
    compilerOptions: {
      importHelpers: false,
      sourceMap: true,
      target: "ES2021",
      lib: ["esnext", "dom", "dom.iterable"],
    },
    package: {
      name: "@gandlaf21/cashu-ts-nostr-req",
      version: Deno.args[0],
      description: "Custom request for proxying requests through nostr relays",
      license: "MIT",
      keywords: ["cashu", "cashu-ts", "nostr"],
      engines: {
        node: ">=8.0.0",
      },
      repository: {
        type: "git",
        url: "git+https://github.com/gandlafbtc/cashu-ts-nostr-req", 
      },
      bugs: {
        url: "https://github.com/gandlafbtc/cashu-ts-nostr-req/issues", 
      },
      dependencies: {
        "@nostr-dev-kit/ndk": "*", // change me
        "nostr-tools": "*", // change me
      },
      devDependencies: {},
    },
  });

  await Deno.copyFile("README.md", "npm/README.md");
}

start();
