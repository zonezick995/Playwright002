#!/bin/sh
set -eu

if [ "${1:-}" = "shell" ]; then
  shift
  exec /bin/bash "$@"
fi

exec node /app/dist/cli.js "$@"
