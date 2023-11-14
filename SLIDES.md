---
# Metadata about the presentation:
title: sapi
author: Jan Christoph Ebersbach
date: 2023-11-14
keywords: nu nushell sapi api rest

# Presentation settings:
# URL to favicon
favicon: /favicon.svg
# Theme, list of supported themes: https://github.com/slidesdown/slidesdown/tree/main/docs/reveal.js/dist/theme
theme: white
# Code highlighting theme, list of supported themes: https://github.com/slidesdown/slidesdown/tree/main/docs/reveal.js/plugin/highlight
highlight-theme: tokyo-night-dark
# Load font awesome pro icons (only works on domain slidesdown.github.io) free icons work everywhere. If both are enabled the pro icons are loaded
fontawesomePro: true
fontawesomeFree: false

# Show progress bar
progress: true
# Show controls
controls: true
# Center presentation
center: true
# Create separate pages for fragments
pdfSeparateFragments: false
# Full list of supported settings: https://revealjs.com/config/ or
# https://github.com/hakimel/reveal.js/blob/master/js/config.js
---

# sapi

Author: Jan Christoph Ebersbach

<!-- generated with
!deno run --unstable --allow-read --allow-write https://deno.land/x/remark_format_cli@v0.1.0/remark-format.js --maxdepth 2 %
-->

## Agenda

1. [Get sapi working](#get-sapi-working)
2. [The Nu Way](#the-nu-way)
3. [GitLab API](#gitlab-api)

## Get sapi working

1. Create personal access token: `TOKEN=XXX`
2. Store tocken in `.env.local`: `TOKEN=XXX`
3. Start container: `docker run -it --rm -v $PWD:/data jceb/sapi:0.0.8`
4. Load environment variables: `direnv allow`

### Get sapi working

Run `sapi`: `P=1 sapi get projects`

## The Nu Way

[nushell.sh](https://www.nushell.sh/)

Stuck? Try: `help <TOPIC>`

### Data Structures

Built-in:

- String: `"mystring"`
- String template: `$"--- (1 + 1) ---"`
- Integer: `1`
- Float: `1.0`
- Bool: `true`
- Duration: 21min
- Date: `date`
- List: `[ true 1 1.0 "mystring" ]`
- Record: `{ foo: "bar" }`

Notice: nice preview!

### Field Access

- List: `[ true 1 1.0 "mystring" ].1`
- Record: `{ foo: "bar" }.foo`
- Via variable: `{ foo: "bar" } | $in.foo`
- Via command: `{ foo: "bar" } | get foo`
- Ignore error: `{ foo: "bar" } | get -i foo`
- Set default: `{ foo: "bar" } | default "hello" baz | get baz`

### Variables

- Immutuable: `let foo = "bar"`
  - `print $foo`
  - Error: `$foo = "baz"`
- Mutuable: `mut foo = "bar"`
  - ✅: `$foo = "baz"`

### Load data from

What if data could be loaded from a file or a string?

- `help from`
- `help open`

### Tasks

1. Load JSON from `P=1 sapi get projects`
2. Pick only the projects' `id` and `name` fields with the `select` command
3. Iterate over all intries and concatenate the `name` and `id` with the `each`
   command

### Convert data to

What if data could be converted into any output format?

- `help to`
- `help save`

### Other important topics ..

.. that we don't have much time for.

- Define a function: `def my-fn [p: string = "hello"] { print $p }`
- HTTP client: `http get https://heise.de`
- Environment variables: `$env`
- External commands: `^kubectl`
- Data conversion: `into ...`
- Debugging: `[1, 2, 3, {a: "b"}] | describe`

### Other important topics 2 ..

- Combine Nu and CLI commands (`touch` in this example):

```nu
["a" "b" "c"] | each {|it|
  let file = $"/tmp/($it)"
  touch $file
  $file
}
```

## GitLab API

[GitLab Projects API](https://docs.gitlab.com/ee/api/projects.html)

(there are so many API resources - projects are most important to us)

### sapi

What does `sapi` do?

- Simplifies URLs: `https://gitlab.com/api/v4/projects` → `projects`
- Adds the authentication header
- Loads all pages → `P=0 sapi`
  - Loads only one page: `P=1 sapi`

Not perfect: `sapi` doesn't support a method body, yet. So it's only good for
`GET` requests 😟

### Simple Report

1. Retrieve the list of projects
2. Take the `id` of every project and retrieve the list of branches
3. Create a record for each project that containes the project's `name`, `id`
   and the list of all branches joined with `,`

---

<h2>The End</h2>

Thank you for your time.
