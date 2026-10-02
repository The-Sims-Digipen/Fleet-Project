#!/bin/sh
set -eu

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install Node.js 24 LTS, then run this script again." >&2
  exit 1
fi

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
exec node "$script_dir/scripts/run.mjs"
