# sapi

## Install

```bash
deno install -n sapi --allow-env=P,TOKEN,URL,NODE_ENV --allow-net https://deno.land/x/sapi
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
