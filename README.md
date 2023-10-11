# sapi

`sapi` is a Swiss Army Knife for interacting with APIs. The goal is to make it
easy to get JSON data from APIs for further processing on the CLI.

Currently, `sapi` supports
[GitLab's API](https://docs.gitlab.com/ee/api/api_resources.html).

## Install

```bash
deno install -n sapi --allow-env=P,TOKEN,URL,NODE_ENV --allow-net https://deno.land/x/sapi@v0.0.6/sapi.js
```

## Usage

```bash
export URL=https://gitlab.com/api/v4
export TOKEN=YOUR_TOKEN # Obtain from https://gitlab.com/-/profile/personal_access_tokens
export P=1 # If you want to limit results to one page
# sapi HTTP_METHOD RESOURCE [QUERY_PARAMETER] [QUERY_PARAMETER...]
# HTTP_METHOD: get post put ...
# RESOURCE: projects, projects/123/repository/branches, etc. See https://docs.gitlab.com/ee/api/api_resources.html
# QUERY_PARAMETER: per_page=1, etc. See https://docs.gitlab.com/ee/api/api_resources.html
```

## Examples

List all projects:

```bash
sapi get projects | jq .
```

List one project:

```bash
P=1 sapi get projects per_page=1 | jq .
```

Clone all git repositories:

```bash
sapi get projects | jq -r '.[] | (.ssh_url_to_repo, (.path_with_namespace | gsub("/"; "_")))' -c | parallel -N 2 -j 8 git clone
# or with xargs
sapi get projects | jq -r '.[] | (.ssh_url_to_repo, (.path_with_namespace | gsub("/"; "_")))' -c | xargs -n 2 -p 8 git clone
```

Clone new git repositories:

```bash
sapi get projects | jq -r '.[] | (.ssh_url_to_repo, (.path_with_namespace | gsub("/"; "_")))' -c | parallel -N 2 -j 8 'bash -c "[ ! -e {2} ] && git clone {1} {2}"'
```

Create a new `stage` branch in all repositories and protect it:

```bash
sapi get projects | jq -r '.[].id' -c | parallel -N 1 -- 'sapi post projects/{1}/repository/branches branch=stage ref=main; sapi post projects/{1}/protected_branches name=stage;' | jq .
```
