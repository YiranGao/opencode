#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
cd "${SCRIPT_DIR}"

# 是否同时删除 docker 镜像（默认不删，传 -i 删除）
REMOVE_IMAGES=0
while getopts "i" opt; do
  case "$opt" in
    i) REMOVE_IMAGES=1 ;;
    *) echo "用法: $0 [-i]   -i 同时删除 docker 镜像" >&2; exit 1 ;;
  esac
done

echo "清理解压目录..."
shopt -s nullglob
for dir in lingxicode-offline-*/; do
  echo "  删除: ${dir}"
  rm -rf "${dir}"
done

echo "清理导出镜像 tar.gz..."
for f in lingxicode-ubuntu_*.tar.gz; do
  echo "  删除: ${f}"
  rm -f "${f}"
done

if [ -f docker-commands.txt ]; then
  echo "  删除: docker-commands.txt"
  rm -f docker-commands.txt
fi
shopt -u nullglob

if [ "${REMOVE_IMAGES}" -eq 1 ]; then
  echo "清理 docker 镜像 lingxicode-ubuntu:22.04-* ..."
  for img in $(docker images --format '{{.Repository}}:{{.Tag}}' | grep '^lingxicode-ubuntu:22.04-' || true); do
    echo "  删除镜像: ${img}"
    docker rmi "${img}" || true
  done
else
  echo "（如需同时删除 docker 镜像，请使用: $0 -i）"
fi

echo "清理完成"
