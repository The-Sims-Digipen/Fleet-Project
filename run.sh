#!/usr/bin/env bash
set -euo pipefail

# Bootstrap only the runtime here; both launchers share the Node-based runner.
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd -- "$project_dir"

fail() { printf 'Fleet Project: %s\n' "$*" >&2; exit 1; }

[[ "$(uname -s)" == Linux ]] || fail 'run.sh targets Ubuntu 24.04. On Windows, use run.bat.'
case "$(uname -m)" in
  x86_64) arch=x64 ;;
  aarch64|arm64) arch=arm64 ;;
  *) fail 'Supported CPU architectures are x64 and ARM64.' ;;
esac

node_major="$(tr -d '[:space:]' < .nvmrc)"
[[ "$node_major" =~ ^[0-9]+$ ]] || fail '.nvmrc must contain a Node.js major version.'
tools_dir="$project_dir/.tools"
node_dir="$tools_dir/node-$node_major-linux-$arch"
node_bin="$node_dir/bin/node"
bootstrap_dir=''

cleanup() {
  if [[ -n "$bootstrap_dir" ]]; then rm -rf -- "$bootstrap_dir"; fi
}
trap cleanup EXIT

if [[ ! -x "$node_bin" ]]; then
  [[ ! -e "$node_dir" ]] || fail "Incomplete Node installation. Remove $node_dir and run again."
  for tool in tar gzip sha256sum mktemp; do
    command -v "$tool" >/dev/null || fail "Missing Ubuntu utility: $tool."
  done
  if command -v curl >/dev/null; then
    download() { curl --fail --location --retry 3 --connect-timeout 20 --proto '=https' --tlsv1.2 --output "$2" "$1"; }
  elif command -v wget >/dev/null; then
    download() { wget --https-only --tries=3 --timeout=30 --output-document="$2" "$1"; }
  elif [[ -x /usr/lib/apt/apt-helper ]]; then
    download() { /usr/lib/apt/apt-helper download-file "$1" "$2"; }
  else
    fail 'A download tool is required: curl, wget, or the standard Ubuntu APT helper.'
  fi

  mkdir -p -- "$tools_dir"
  bootstrap_dir="$(mktemp -d "$tools_dir/node-install.XXXXXXXX")"
  printf '\nDownloading portable Node.js %s (%s)...\n' "$node_major" "$arch"
  download "https://nodejs.org/dist/latest-v$node_major.x/SHASUMS256.txt" "$bootstrap_dir/SHASUMS256.txt"
  entry="$(awk -v pattern="^node-v$node_major[.][0-9]+[.][0-9]+-linux-$arch[.]tar[.]gz$" '$2 ~ pattern { print $1, $2; exit }' "$bootstrap_dir/SHASUMS256.txt")"
  read -r checksum archive <<< "$entry"
  [[ "$checksum" =~ ^[a-fA-F0-9]{64}$ && "$archive" =~ ^node-v[0-9]+\.[0-9]+\.[0-9]+-linux-(x64|arm64)\.tar\.gz$ ]] || fail 'No matching Node archive found in the official checksums.'
  node_version="${archive#node-}"
  node_version="${node_version%-linux-*}"
  download "https://nodejs.org/dist/$node_version/$archive" "$bootstrap_dir/$archive"
  printf '%s  %s\n' "$checksum" "$bootstrap_dir/$archive" | sha256sum --check --status || fail 'Node download failed its SHA-256 check.'
  tar -xzf "$bootstrap_dir/$archive" -C "$bootstrap_dir"
  extracted_dir="$bootstrap_dir/${archive%.tar.gz}"
  [[ "$("$extracted_dir/bin/node" --version)" == "$node_version" ]] || fail 'Downloaded Node could not run.'
  mv -T -- "$extracted_dir" "$node_dir"
fi

version="$("$node_bin" --version)"
[[ "$version" == v"$node_major".* ]] || fail "Cached Node version $version does not match .nvmrc."
printf '\nUsing Node.js %s from %s\n' "$version" "$node_dir"
export PATH="$node_dir/bin:$PATH"
cleanup
bootstrap_dir=''
exec "$node_bin" "$project_dir/scripts/run.mjs"
