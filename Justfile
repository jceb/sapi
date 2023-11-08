# Documentation: https://just.systems/man/en/

set shell := ["nu", "-c"]

# Print this help
help:
    @just -l

# Format Justfile
format:
    @just --fmt --unstable

# Build application
build:
    nix build .#sapi

# Build docker image
build-docker:
    nix build .#dockerSapi

# Load docker image
load-docker: build-docker
    ./result | docker load

# Update cache
cache:
    deno cache --import-map ./import_map.json -r sapi.js

# Push database configuration
release: build-docker
    #!/usr/bin/env nu
    let name = (open package.json | get name)
    let version = (open package.json | get version)
    let registry = (open package.json | get registry)
    ./result | skopeo copy docker-archive:/dev/stdin --dest-tls-verify=true $"docker://($registry)/($name):($version)"
