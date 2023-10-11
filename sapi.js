#!/usr/bin/env -S deno run --allow-env=P,TOKEN,URL,NODE_ENV --allow-net

import { buildURL, F, gitLabFetch, log, S } from "./lib.js";

F.fork(console.error)(console.log)(
  S.pipe([
    buildURL(Deno.env.get("URL")),
    S.map(S.pipe([
      gitLabFetch(Boolean(Deno.env.get("P")))(
        Deno.env.get("TOKEN"),
      ),
      S.map((res) => JSON.stringify(res)),
    ])),
    S.fromMaybe(
      F.reject(
        "Insufficient arguments provided\n\tURL, TOKEN and P (number of pages to fetch) must be set\n\tUsage: URL=https://... TOKEN=xyz P=1 sapi HTTPVERB PATH_OF_URL",
      ),
    ),
    // log("nix mehr?"),
    // x => F.reject('Insufficient arguments provided')
  ])(Deno.args),
);

// vi: ft=javascript
