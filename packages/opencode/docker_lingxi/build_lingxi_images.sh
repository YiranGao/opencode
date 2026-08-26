#!/usr/bin/env bash
set -euo pipefail

# 脚本所在目录，便于从任意位置调用
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
# 归档目录：docker_lingxi/../../../artifacts/kylin-x64/release
RELEASE_DIR="${SCRIPT_DIR}/../../../artifacts/kylin-x64/release"

# 在 release 目录下查找最新的 lingxicode-offline-*.tar.gz 归档（按版本号排序）
shopt -s nullglob
archives=("${RELEASE_DIR}"/lingxicode-offline-*.tar.gz)
shopt -u nullglob
[ ${#archives[@]} -gt 0 ] || { echo "未在 ${RELEASE_DIR} 找到 lingxicode-offline-*.tar.gz" >&2; exit 1; }
TARBALL=$(printf '%s\n' "${archives[@]}" | sort -V | tail -n 1)

LINGXICODE_RELEASE_DIR=$(basename "${TARBALL}" .tar.gz)
TAG=lingxicode-ubuntu:22.04-${LINGXICODE_RELEASE_DIR}

echo "使用归档: ${TARBALL}"
echo "LINGXICODE_RELEASE_DIR=${LINGXICODE_RELEASE_DIR}"
echo "TAG=${TAG}"

# 扫描 DIR 各段，识别架构标识：x64/amd64/x86_64->amd64, arm64/aarch64->arm64
PLATFORM_ARCH=
for seg in ${LINGXICODE_RELEASE_DIR//-/ }; do
  case "$seg" in
    x64|amd64|x86_64) PLATFORM_ARCH=amd64 ;;
    arm64|aarch64)    PLATFORM_ARCH=arm64 ;;
  esac
done
echo "PLATFORM_ARCH=${PLATFORM_ARCH}"
[ -n "${PLATFORM_ARCH}" ] || { echo "无法识别架构: ${LINGXICODE_RELEASE_DIR}" >&2; exit 1; }

# 解压归档到脚本目录下的同名目录（Dockerfile-lingxi 通过 COPY ${LINGXICODE_RELEASE_DIR} 引用）
EXTRACT_DIR="${SCRIPT_DIR}/${LINGXICODE_RELEASE_DIR}"
reextract=1
if [ -d "${EXTRACT_DIR}" ]; then
  read -p "已存在解压目录 ${EXTRACT_DIR}，是否删除后重新解压？[y/N] " confirm
  if [[ ! "${confirm}" =~ ^[Yy]$ ]]; then
    reextract=0
    echo "跳过解压，沿用现有目录: ${EXTRACT_DIR}"
  else
    echo "清理旧解压目录: ${EXTRACT_DIR}"
    rm -rf "${EXTRACT_DIR}"
  fi
fi
if [ "${reextract}" -eq 1 ]; then
  mkdir -p "${EXTRACT_DIR}"
  tar -zxf "${TARBALL}" -C "${EXTRACT_DIR}"
fi

cd "${SCRIPT_DIR}"
docker buildx build \
  --platform linux/${PLATFORM_ARCH} \
  -t ${TAG} \
  --build-arg LINGXICODE_RELEASE_DIR=${LINGXICODE_RELEASE_DIR} \
  -f Dockerfile-lingxi \
  .

docker save ${TAG} | gzip > ${TAG//:/_}.tar.gz
echo "# 加载镜像
docker load -i ${TAG//:/_}.tar.gz

# 运行容器
docker run --rm -it -v \$(pwd):/workspace -w /workspace ${TAG}
" > docker-commands.txt
echo "已生成 docker-commands.txt"