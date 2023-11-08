# File syntax: https://nixos.org/manual/nixos/stable/#sec-nix-syntax-summary
{
  description = "Dependencies";

  inputs.nixpkgs_unstable.url = "github:NixOS/nixpkgs/nixos-unstable";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-23.05";
  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs = { self, nixpkgs, nixpkgs_unstable, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        unstable = nixpkgs_unstable.legacyPackages.${system};
        allOsPackages = with pkgs; [
          # Nix packages: https://search.nixos.org/packages
          unstable.deno # Deno https://deno.land/
          unstable.nushell # Nu Shell https://www.nushell.sh/

          just # Simple make replacement https://just.systems/
          skopeo # Skopeo image copier https://github.com/containers/skopeo
        ];
        linuxOnlyPackages = with pkgs; [ ];
      in {
        devShell = pkgs.mkShell {
          nativeBuildInputs = if pkgs.system == "x86_64-linux" then
            allOsPackages ++ linuxOnlyPackages
          else
            allOsPackages;
          buildInputs = [ ];
        };

      });
}
