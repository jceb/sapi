import sanctuary from "sanctuary";
import $ from "sanctuary-def";
import { env as flutureEnv } from "fluture-sanctuary-types";
import * as Fluture from "fluture";

export const PromiseType = $.NullaryType("Promise")(
  "https://github.com/identinet/identinet#Promise",
)([])((x) => S.type(x).name === "Promise");

export const HTTPMethod = $.NullaryType("HTTPMethod")(
  "https://github.com/identinet/identinet#HTTPMethod",
)([])((x) =>
  typeof x === "string" &&
  ["get", "post", "push", "put", "delete"].includes(x.toLowerCase)
);

export const URLType = $.NullaryType("URL")(
  "https://github.com/identinet/identinet#URL",
)([])((x) => x instanceof URL);

export const ResponseType = $.NullaryType("Response")(
  "https://github.com/identinet/identinet#Response",
)([])((x) => x instanceof Response);

const env = $.env.concat(flutureEnv).concat([
  PromiseType,
  HTTPMethod,
  URLType,
  ResponseType,
]);

export const S = sanctuary.create({
  checkTypes: (typeof process !== "undefined" && process.env &&
    process.env.NODE_ENV !== "production") ||
    (typeof Deno !== "undefined" && Deno.env.get("NODE_ENV") !== "production"),
  env,
});

export const def = $.create({
  checkTypes: (typeof process !== "undefined" && process.env &&
    process.env.NODE_ENV !== "production") ||
    (typeof Deno !== "undefined" && Deno.env.get("NODE_ENV") !== "production"),
  env,
});

// assign all types to S.types, see https://github.com/sanctuary-js/sanctuary/issues/717
S.types = {};
sanctuary.map((t) => (S.types[t.name] = t))(env);

export const F = Fluture;

export const log = (msg) => (value) => {
  console.log(msg, S.show(value));
  return value;
};

// buildURL :: String -> List(String) -> Maybe(Pair(HTTP_Method_String)(URL_String))
export const buildURL = (baseURL) => (args) => {
  if (S.not(S.is($.String)(baseURL)) || S.trim(baseURL).length === 0) {
    return S.Nothing;
  }
  const joinWithBaseURL = (url) =>
    S.joinWith("/")(S.map(S.trim)([baseURL, url]));
  const joinQueryArgs = (queryArgs) =>
    "?" + S.joinWith("&")(S.map(S.trim)(queryArgs));
  const tailNothingIfEmpty = S.pipe([
    S.tail,
    S.ifElse(S.equals(S.Just(S.empty(Array))))(() => S.Nothing)(S.I),
  ]);

  return S.pipe([
    (list) => S.Pair(S.head(list))(S.tail(list)),
    S.map(S.chain(S.pipe([
      (urlSegments) =>
        S.Pair(S.head(urlSegments))(tailNothingIfEmpty(urlSegments)),
      S.map(S.map(joinQueryArgs)),
      S.mapLeft(S.map(joinWithBaseURL)),
      S.pair(S.concat),
      // S.map((url) => new URL(url)),
    ]))),
    S.pair((fst) => (snd) =>
      S.ifElse(
        S.any(S.isNothing),
      )(() => S.Nothing)(([f, s]) =>
        S.Just(S.Pair(S.fromMaybe("")(f))(S.fromMaybe("")(s)))
      )([fst, snd])
    ),
  ])(args);
};

// fetchURL :: StrMap -> Pair(HTTP_Method_String)(URL_String) -> Future(Response)
export const fetchURL = (initAttrs) => (urlPair) => {
  const _fetch = (init) => (method) => (resource) =>
    F.attemptP(() => fetch(resource, { ...init, method }));

  return S.pair(_fetch(initAttrs))(urlPair);
};

// // whenString :: (a -> a) -> a -> a
// const whenString = S.when(S.is($.String));

// whenGetMethod :: (a -> a) -> a -> a
const whenGetMethod = S.when((p) => S.equals("get")(S.toLower(S.fst(p))));

// setDefaultSearchParam :: (String, String) -> URL -> URL
const setSearchParam = (key, value) => (url) => {
  url.searchParams.set(key, value);
  return url;
};

// setDefaultSearchParam :: (String, String) -> URL -> URL
const setDefaultSearchParam = (key, value) =>
  S.when((url) => url.searchParams.get(key) === null)(
    setSearchParam((key, value)),
  );

// toURL :: a -> URL
const toURL = (url) => {
  if (S.is($.String)(url)) {
    return new URL(url);
  }
  return url;
};

// toJSON :: Response -> Object
const toJSON = F.encaseP((response) =>
  response.json().catch(() => {
    console.error("Failed to convert response to JSON:", response.url);
    return response.body;
  })
);

// listOfRemainingPageIndexes :: Response -> Array(Integer)
const listOfRemainingPageIndexes = (response) =>
  S.range(2)(
    S.fromMaybe(1)(
      S.pipe([
        S.parseInt(10),
        S.map((x) => x + 1),
      ])(
        typeof response.headers.get("x-total-pages") === "string"
          ? response.headers.get("x-total-pages")
          : "",
      ),
    ),
  );

// drainURL :: StrMap -> Pair(HTTP_Method_String)(URL_String) -> Future(Response)
const drainURL = (initAttrs) => (urlPair) =>
  S.pipe([
    fetchURL(initAttrs),
    S.chain(
      (response) =>
        S.pipe([
          listOfRemainingPageIndexes,
          S.map((pageidx) =>
            S.map((url) =>
              setSearchParam("page", new String(pageidx))(new URL(url))
            )(urlPair)
          ),
          S.map(fetchURL(initAttrs)),
          S.concat([F.resolve(response)]),
          F.parallel(5),
        ])(response),
    ),
    S.chain(S.pipe([
      S.map(toJSON),
      F.parallel(5),
    ])),
    S.map((results) => {
      if (results.length > 1) {
        return S.join(results);
      } else {
        return results[0];
      }
    }),
  ])(urlPair);

// gitLabFetch :: token -> Pair(HTTP_Method_String)(URL_String) -> Future(Response)
export const gitLabFetch = (fetch_one) => (token) => (urlPair) => {
  const initAttrs = { headers: { "PRIVATE-TOKEN": token } };

  return S.pipe([
    S.map(toURL),
    whenGetMethod(S.map(setDefaultSearchParam("per_page", "100"))),
    S.ifElse((urlPair) =>
      fetch_one ||
      S.not(S.equals("get")(S.toLower(S.fst(urlPair))))
    )(S.pipe([
      fetchURL(initAttrs),
      S.chain(toJSON),
    ]))(
      drainURL(initAttrs),
    ),
  ])(urlPair);
};
