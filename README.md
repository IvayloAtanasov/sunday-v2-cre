# sunday-v2-cre

The Chainlink CRE workflow that measures each vault's daily PV yield and reports it
to `YieldReceiver` on Arc. Phase 3 of [CRE_MIGRATION.md](../CRE_MIGRATION.md).

## Why the toolchain is in a container

`YieldReceiver.setWorkflowId` can be called exactly once, and the workflow ID it
freezes is a hash of the compiled WASM binary and its config. A build that differs
by a byte is a different ID, and the receiver rejects it for the life of every vault
bound to it — with no way to correct it short of deploying a new receiver and new
vaults.

So the build environment is part of the contract. Everything is pinned:

| | Pinned in | Version |
|---|---|---|
| `cre` CLI | `Dockerfile` (+ SHA-256 from the release's `checksums.txt`) | v1.34.0 |
| bun | `Dockerfile`, via `oven/bun:<version>-debian` | 1.4.2 |
| `@chainlink/cre-sdk` and its tree | `yield-sync/bun.lock` (committed) | 1.21.1 |

Two consecutive builds of the same source produce the same binary hash, which is the
property the freeze depends on.

bun is the whole toolchain — `cre` selects one per workflow language (bun for
TypeScript, a Go toolchain for Go, `make` for raw WASM), and ours is TypeScript.
There is no Node in the image because nothing asks for one.

**Docker is the only thing you need on your machine.** No `cre`, no bun, no Node.

## From a fresh clone

The first `./cre` call builds the image, so there is no separate setup step.

```sh
cd sunday-v2-cre
./cre login                                                      # browser, once
docker compose run --rm --entrypoint bun cre install --cwd ./yield-sync --frozen-lockfile
./cre workflow build yield-sync
```

`--frozen-lockfile` installs exactly what `bun.lock` records and fails rather than
resolving something newer, which is what keeps the binary hash stable across machines.

Deploying also needs deployment access for the organisation, once, from anyone:

```sh
./cre account access
```

## Usage

`./cre` takes the same arguments as the real CLI and runs it in the pinned image:

```sh
./cre login                          # once; see below
./cre workflow build yield-sync      # compile to WASM
./cre workflow hash yield-sync       # the ID to freeze into the receiver
./cre workflow simulate yield-sync
```

Changing a dependency is the one case that updates the lockfile, so it drops the
`--frozen-lockfile` above:

```sh
docker compose run --rm --entrypoint bun cre install --cwd ./yield-sync
```

Commit the resulting `bun.lock`. It is what keeps the SDK version — and therefore
the binary hash — from drifting.

### Logging in

`cre login` needs a browser, which the container does not have. It prints a URL and
waits on a callback at `http://localhost:53682/callback`; open the URL in your own
browser and the flow completes.

That callback is why `login` is a separate service in `docker-compose.yml`. The
server binds the loopback interface *inside* the container, which a published port
cannot reach — Docker forwards to the container's `eth0`, where nothing is
listening, and the redirect is refused. The `login` service uses
`network_mode: host` so the container's loopback is the host's own.

On Docker Desktop (macOS, Windows) the host network is the VM's rather than your
machine's, so this does not work. Log in with a `cre` installed on the host there
and copy its `~/.cre/cre.yaml` into the `cre-credentials` volume.

Credentials are stored in the `cre-credentials` Docker volume rather than the image,
so they survive a rebuild. To sign out for good: `./cre logout`, or
`docker volume rm sunday-v2-cre_cre-credentials`.

Deploy access is not part of this: it belongs to the organisation on Chainlink's side,
so `./cre account access` is requested once and applies to everyone.

## Layout

```
Dockerfile           pinned cre + bun
docker-compose.yml   project mount, credential volume, login callback port
cre                  wrapper: ./cre <args> == cre <args>, in the container
project.yaml         per-target chain RPCs
yield-sync/
  main.ts            entry point
  workflow.ts        cron handler, yield formula, report construction
  workflow.yaml      workflow name and artifact paths per target
  config.*.json      chain, receiver address, API host, schedule
  bun.lock           committed: pins the SDK tree
```
