#!/usr/bin/env bash
set -euo pipefail

# Edit these values to bump the version, switch arch, or relocate the source.
VERSION=v1.18.18
ARCH=amd64
SRCDIR=/Users/hkyudong/images

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

TAG="lingxicode-ubuntu:${VERSION}-${ARCH}"
TARFILE="${TAG//:/_}.tar.gz"

docker buildx build \
  --platform "linux/${ARCH}" \
  --build-arg "VERSION=${VERSION}" \
  --load \
  -t "${TAG}" \
  -f "${SCRIPT_DIR}/Dockerfile-lingxi" \
  "${SRCDIR}"

docker save "${TAG}" | gzip > "${TARFILE}"
echo "Saved ${TARFILE}"

# docker load -i "${TARFILE}"
# docker run --rm -it -v "$(pwd):/workspace" -w /workspace "${TAG}"
