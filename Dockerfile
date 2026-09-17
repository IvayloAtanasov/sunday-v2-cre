# syntax=docker/dockerfile:1

# ==========================================================================
# CRE toolchain
# ==========================================================================
# The workflow ID that a YieldReceiver is pinned to is a hash of the compiled
# WASM binary and its config, and `setWorkflowId` can be called exactly once.
# Two builds that disagree therefore produce two IDs, of which the receiver
# will accept one and reject the other for the life of every vault bound to it.
#
# That makes the build environment part of the contract, not a convenience, so
# every version below is pinned and the CRE download is checked against the
# hash published with its release. Nothing here is taken from the host.
#
# bun is the entire toolchain: `cre` picks one per workflow language (bun for
# TypeScript, a go toolchain for Go, make for raw WASM) and ours is TypeScript.
# There is no separate node here because nothing asks for one; the base image
# does carry a node shim at /usr/local/bun-node-fallback-bin for any dependency
# that shells out to `node`.

ARG BUN_VERSION=1.4.2
ARG CRE_VERSION=1.34.0

FROM oven/bun:${BUN_VERSION}-debian

ARG CRE_VERSION
ARG TARGETARCH

# From https://github.com/smartcontractkit/cre-cli/releases/download/v1.34.0/checksums.txt
# Update these together with CRE_VERSION; a mismatch fails the build rather
# than silently pinning the receiver to a binary nobody reviewed.
ARG CRE_SHA256_AMD64=e76b7dbb431882838ecc4d866aa5ca6b776c5678dbfff97df226c3de234435e0
ARG CRE_SHA256_ARM64=cfb16ba48142d6dd6279a218d5a54ceb41e5420c0b7a64296519498090cb956a

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl git \
 && rm -rf /var/lib/apt/lists/*

# The default release build needs glibc >= 2.38, which is why this image is
# built on oven/bun:*-debian (trixie, 2.41) rather than a bookworm base.
RUN set -eux; \
    case "${TARGETARCH}" in \
      amd64) sha="${CRE_SHA256_AMD64}" ;; \
      arm64) sha="${CRE_SHA256_ARM64}" ;; \
      *) echo "unsupported architecture: ${TARGETARCH}" >&2; exit 1 ;; \
    esac; \
    url="https://github.com/smartcontractkit/cre-cli/releases/download/v${CRE_VERSION}/cre_linux_${TARGETARCH}.tar.gz"; \
    curl -fsSL "${url}" -o /tmp/cre.tar.gz; \
    echo "${sha}  /tmp/cre.tar.gz" | sha256sum -c -; \
    tar -xzf /tmp/cre.tar.gz -C /tmp; \
    mv "/tmp/cre_v${CRE_VERSION}_linux_${TARGETARCH}" /usr/local/bin/cre; \
    chmod +x /usr/local/bin/cre; \
    rm /tmp/cre.tar.gz; \
    cre version; \
    bun --version

# `bun` is uid 1000 in the base image, which is the usual desktop uid, so files
# the container writes into the bind-mounted project stay editable on the host
# instead of coming back owned by root.
USER bun

# Credentials from `cre login` land here. Compose keeps it as a named volume so
# a rebuilt image does not mean logging in again.
RUN mkdir -p /home/bun/.cre
VOLUME ["/home/bun/.cre"]

WORKDIR /work

# `cre` on its own prints usage, which is the right thing for `docker compose run`
# with no arguments.
ENTRYPOINT ["cre"]
CMD []
