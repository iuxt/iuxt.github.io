#!/bin/bash
set -euo pipefail

cd $(dirname $0)
echo "git 处理时间开始"

git ls-files -z | while read -d '' path; do touch -d "$(git log -1 --format="@%ct" "$path")" "$path"; done

echo "git 处理时间成功"