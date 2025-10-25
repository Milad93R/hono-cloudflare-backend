#!/usr/bin/env bash
set -euo pipefail

sleep 5

latest_run_line=$(gh run list --limit 1)
echo "${latest_run_line}"

run_id=$(gh run list --limit 1 --json databaseId --jq '.[0].databaseId')

if [[ -z "${run_id}" ]]; then
  echo "Unable to determine latest run ID" >&2
  exit 1
fi

gh run watch "${run_id}" --exit-status
gh run view "${run_id}" --log | tail -n 100
