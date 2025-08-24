{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let pkgs = nixpkgs.legacyPackages.${system};
      in {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            #
            fish
            bun
            nodejs
          ];

          shellHook = ''
            echo "🐟 Development environment loaded"

            export BUN_INSTALL="$HOME/.bun"

            export SHELL=${pkgs.fish}/bin/fish
            exec ${pkgs.fish}/bin/fish
          '';
        };
      });
}

