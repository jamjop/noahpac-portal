#!/usr/bin/env bash
set -euo pipefail

# Build LD_LIBRARY_PATH so Playwright's Chromium headless shell can find its
# native dependencies (libgbm.so.1, libudev.so.1, etc.) in the Nix store.
#
# Packages that have a /bin directory appear in HOST_PATH; convert those to
# /lib paths.  Packages that are lib-only (libgbm, udev) never appear in
# HOST_PATH, so we resolve them explicitly with `nix eval`.

LIB_PATHS=""

add_lib() {
  local dir="$1"
  if [ -d "$dir" ]; then
    LIB_PATHS="${LIB_PATHS:+$LIB_PATHS:}$dir"
  fi
}

# Derive lib dirs from HOST_PATH (packages with bin dirs)
if [ -n "${HOST_PATH:-}" ]; then
  IFS=':' read -ra HOST_BINS <<< "$HOST_PATH"
  for bindir in "${HOST_BINS[@]}"; do
    add_lib "${bindir%/bin}/lib"
  done
fi

# Resolve lib-only nix packages by attribute name
for pkg_attr in libgbm udev; do
  pkg_path=$(nix eval --raw "nixpkgs#$pkg_attr" 2>/dev/null || true)
  if [ -n "$pkg_path" ]; then
    add_lib "$pkg_path/lib"
  fi
done

export LD_LIBRARY_PATH="${LIB_PATHS}${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"

exec pnpm exec playwright test "$@"
