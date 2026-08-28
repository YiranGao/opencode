#!/usr/bin/env bash
set -euo pipefail

# 脚本所在目录，便于从任意位置调用
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)

# 支持构建的 release 变体（artifacts/ 下的子目录名）
RELEASE_VARIANTS=(
  "kylin-x64"
  "kylin-x64-baseline"
)

build_variant() {
  local variant="$1"
  local release_dir="${SCRIPT_DIR}/../../../artifacts/${variant}/release"

  echo "===== 处理变体: ${variant} ====="
  echo "归档目录: ${release_dir}"

  # 查找最新 lingxicode-offline-*.tar.gz 归档（按版本号排序）
  shopt -s nullglob
  local archives=("${release_dir}"/lingxicode-offline-*.tar.gz)
  shopt -u nullglob
  if [ ${#archives[@]} -eq 0 ]; then
    echo "未在 ${release_dir} 找到 lingxicode-offline-*.tar.gz，跳过该变体" >&2
    return 1
  fi
  local tarball
  tarball=$(printf '%s\n' "${archives[@]}" | sort -V | tail -n 1)
  local release_name tag
  release_name=$(basename "${tarball}" .tar.gz)
  tag="lingxicode-ubuntu:22.04-${release_name}"

  echo "使用归档: ${tarball}"
  echo "LINGXICODE_RELEASE_DIR=${release_name}"
  echo "TAG=${tag}"

  # 扫描 release_name 各段，识别架构：x64/amd64/x86_64->amd64, arm64/aarch64->arm64
  local platform_arch=
  for seg in ${release_name//-/ }; do
    case "$seg" in
      x64|amd64|x86_64) platform_arch=amd64 ;;
      arm64|aarch64)    platform_arch=arm64 ;;
    esac
  done
  echo "PLATFORM_ARCH=${platform_arch}"
  [ -n "${platform_arch}" ] || { echo "无法识别架构: ${release_name}" >&2; return 1; }

  # 解压归档到脚本目录下的同名目录（Dockerfile-lingxi 通过 COPY ${release_name} 引用）
  local extract_dir="${SCRIPT_DIR}/${release_name}"
  local reextract=1
  if [ -d "${extract_dir}" ]; then
    read -p "已存在解压目录 ${extract_dir}，是否删除后重新解压？[y/N] " confirm
    if [[ ! "${confirm}" =~ ^[Yy]$ ]]; then
      reextract=0
      echo "跳过解压，沿用现有目录: ${extract_dir}"
    else
      echo "清理旧解压目录: ${extract_dir}"
      rm -rf "${extract_dir}"
    fi
  fi
  if [ "${reextract}" -eq 1 ]; then
    mkdir -p "${extract_dir}"
    tar -zxf "${tarball}" -C "${extract_dir}"
  fi

  cd "${SCRIPT_DIR}"
  docker buildx build \
    --platform linux/${platform_arch} \
    -t ${tag} \
    --build-arg LINGXICODE_RELEASE_DIR=${release_name} \
    -f Dockerfile-lingxi \
    .

  docker save ${tag} | gzip > ${tag//:/_}.tar.gz

  echo "# 加载镜像
docker load -i ${tag//:/_}.tar.gz

# 运行容器
docker run --rm -it -v \$(pwd):/workspace -w /workspace ${tag}
" > "docker-commands-${variant}.txt"
  echo "已生成 docker-commands-${variant}.txt"

  echo "===== ${variant} 完成 ====="
}

for variant in "${RELEASE_VARIANTS[@]}"; do
  build_variant "${variant}" || echo "跳过 ${variant}"
done

echo "全部完成"
