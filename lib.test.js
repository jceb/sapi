import {
  assert,
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.120.0/testing/asserts.ts";

import { buildURL, S } from "./lib.js";

// Deno.test({
//   name: "Testing validateArgs",
//   fn() {
//     assertEquals(validateArgs([]), false);
//     assertEquals(validateArgs(["get"]), false);
//     assertEquals(validateArgs(["get", "projects"]), true);
//     assertEquals(validateArgs(["get", "projects", "search"]), false);
//     assertEquals(validateArgs(["get", "projects", "search", "flux"]), true);
//     assertEquals(
//       validateArgs(["get", "projects", "search", "flux", "test"]),
//       false,
//     );
//   },
// });

const baseURL = "https://gitlab.com/api/v4";

Deno.test({
  name:
    "Testing buildURL: provide insufficient arguments and get Nothing as URL",
  fn() {
    const incompleteURL_noargs = buildURL(baseURL)([]);
    assert(S.equals(incompleteURL_noargs)(S.Nothing));

    const incompleteURL_onearg = buildURL(baseURL)(["get"]);
    assert(S.equals(incompleteURL_onearg)(S.Nothing));
  },
});

Deno.test({
  name: "Testing buildURL: provide just the first segment",
  fn() {
    const url = buildURL(baseURL)(["get", "projects"]);
    assert(
      S.equals(url)(
        S.Just(S.Pair("get")(S.joinWith("/")([baseURL, "projects"]))),
      ),
    );
  },
});

Deno.test({
  name: "Testing buildURL: provide additional query parameters",
  fn() {
    const urlWithQueryArgs = buildURL(baseURL)([
      "get",
      "projects",
      "search=flux",
    ]);
    assert(
      S.equals(urlWithQueryArgs)(
        S.Just(
          S.Pair("get")(
            S.joinWith("/")([baseURL, "projects?search=flux"]),
          ),
        ),
      ),
    );
    const urlWith2QueryArgs = buildURL(baseURL)([
      "get",
      "projects",
      "search=flux",
      "limit=1",
    ]);
    assert(
      S.equals(urlWith2QueryArgs)(
        S.Just(
          S.Pair("get")(
            S.joinWith("/")([baseURL, "projects?search=flux&limit=1"]),
          ),
        ),
      ),
    );
  },
});

Deno.test({
  name: "Testing fetchURL: provide additional query parameters",
  fn() {
    const urlWithQueryArgs = buildURL(baseURL)([
      "get",
      "projects",
      "search=flux",
    ]);
    assert(
      S.equals(urlWithQueryArgs)(
        S.Just(
          S.Pair("get")(
            S.joinWith("/")([baseURL, "projects?search=flux"]),
          ),
        ),
      ),
    );
    const urlWith2QueryArgs = buildURL(baseURL)([
      "get",
      "projects",
      "search=flux",
      "limit=1",
    ]);
    assert(
      S.equals(urlWith2QueryArgs)(
        S.Just(
          S.Pair("get")(
            S.joinWith("/")([baseURL, "projects?search=flux&limit=1"]),
          ),
        ),
      ),
    );
  },
});
