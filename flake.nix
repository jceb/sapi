# Documentation: https://nixos.wiki/wiki/Flakes
{
  description = "sapi service";
  inputs.nixpkgs.url = "github:nixos/nixpkgs/nixos-23.05";
  inputs.nixpkgs-unstable.url = "github:nixos/nixpkgs/nixos-unstable";
  inputs.flake-utils.url = "github:numtide/flake-utils";
  # https://github.com/SnO2WMaN/deno2nix
  # inputs.deno2nix.url = "github:SnO2WMaN/deno2nix";
  inputs.deno2nix.url = "github:jceb/deno2nix";
  # inputs.deno2nix.url = "/home/jceb/Documents/Software/deno2nix";

  # Currently broken because of https://github.com/SnO2WMaN/deno2nix/issues/7
  outputs = { self, deno2nix, nixpkgs, nixpkgs-unstable, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        # inherit (pkgs) deno2nix;
        # pkgs = import nixpkgs { inherit system; };
        # pkgs = nixpkgs.legacyPackages.${system};
        pkgs = import nixpkgs {
          inherit system;
          overlays = [
            deno2nix.overlays.default
            (final: prev: { deno = unstable.deno; })
          ];
        };
        unstable = nixpkgs-unstable.legacyPackages.${system};
        package = pkgs.lib.importJSON ./package.json;
      in with pkgs; rec {
        # Development environment: nix develop
        devShells.default = mkShell {
          name = "${package.name}";
          nativeBuildInputs = [
            unstable.deno # Deno https://deno.land/
            unstable.nushell # Nu Shell https://www.nushell.sh/
            just # Simple make replacement https://just.systems/
            skopeo # Skopeo image copier https://github.com/containers/skopeo
          ];
        };

        # # Runtime package
        # sapiSource = {
        #   pname = "${package.name}";
        #   version = "${package.version}";
        #   src = ./.;
        # };
        # packages.sapi = pkgs.stdenvNoCC.mkDerivation rec {
        # packages.sapi = derivation rec {
        # inherit system stdenv;
        # packages.sapi = pkgs.deno2nix.mkBundled rec {
        packages.sapi = pkgs.deno2nix.mkExecutable {
          # name = "${package.name}-${package.version}";
          pname = "${package.name}";
          version = "${package.version}";
          src = ./.;
          # src = sapiSource.src;
          bin = "sapi";

          config = "deno.json";
          lockfile = "deno.lock";
          entrypoint = "./sapi.js";
          # additionalDenoFlags = "--allow-net --allow-env=P,TOKEN,URL,NODE_ENV";
          allow = {
            # env = "P,TOKEN,URL,NODE_ENV";
            env = true;
            net = true;
          };
          # additionalDenoFlags = "--allow-net --allow-env --allow-read";

          # nativeBuildInputs = [ unstable.deno pkgs.curl pkgs.bash ];
          # builder = ./builder.sh;
          # fetcher = ./fetcher.sh;

          # outputHashAlgo = "sha256";
          # outputHashMode = "recursive";
          # outputHash = lib.fakeSha256;
          # buildPhase = ''
          #   set -x
          #   export DENO_DIR="/tmp/cache"
          #   mkdir -p $DENO_DIR
          #   curl https://heise.de/
          #   # deno bundle --no-lock sapi.js ${pname}
          #   # deno cache --lock=deno.lock --import-map import_map.json sapi.js
          #   # deno compile --lock=deno.lock --output=${pname} --import-map import_map.json --allow-net --allow-env sapi.js
          #   # chmod a+x ${pname}
          #   set +x
          # '';
          # installPhase = ''
          #   mkdir -p $out/bin
          #   cp ${pname} $out/bin
          # '';

        };

        nuDirenvHook = writeText "nuDirenvHook" ''
          # Source: https://www.nushell.sh/cookbook/direnv.html
          $env.config = {
            hooks: {
              pre_prompt: [{ ||
                if (which direnv | is-empty) {
                  return
                }
                direnv export json | from json | default {} | load-env
              }]
            }
          }
        '';

        packages.dockerSapi = pkgs.dockerTools.streamLayeredImage {
          name = "${package.registry}/${package.name}";
          tag = "${package.version}";
          # created = "now";
          contents = with pkgs.dockerTools; [
            usrBinEnv
            binSh
            caCertificates
            fakeNss
            pkgs.coreutils
            unstable.nushell # Nu Shell https://www.nushell.sh/
            pkgs.curl
            unstable.direnv
            packages.sapi
          ];
          fakeRootCommands = ''
            mkdir /data
            mkdir /tmp
            chmod 1777 /tmp
            mkdir -p /tmp/nobody/.config/nushell
            touch /tmp/nobody/.config/nushell/config.nu
            ln -s ${nuDirenvHook} /tmp/nobody/.config/nushell/env.nu
            chown -R 65534:65534 /tmp/nobody/
          '';
          enableFakechroot = true;
          config = {
            # Valid values, see: https://github.com/moby/moby/blob/master/image/spec/v1.2.md#image-json-field-descriptions
            Cmd = [ "${pkgs.nushell}/bin/nu" ];
            Env = [ "HOME=/tmp/nobody" ];
            # User and group noboby
            User = "65534";
            Group = "65534";
            WorkingDir = "/data";
            Volumes = { "/data" = { }; };
          };
        };

        # The default package when a specific package name isn't specified: nix build
        defaultPackage = packages.sapi;
      });
}
