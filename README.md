# sunday-v2-cre

Chainlink CRE workflow that prices each vault's daily PV yield and reports it to
`YieldReceiver` on Arc.

Docker is the only prerequisite — `cre`, bun and the SDK are pinned in the image.

## Setup

```sh
cd sunday-v2-cre
./cre login                                                      # browser, once
docker compose run --rm --entrypoint bun cre install --cwd ./yield-sync --frozen-lockfile
./cre workflow build yield-sync
```

Deploying additionally needs organisation deploy access, requested once with
`./cre account access`.

## Commands

`./cre <args>` runs the pinned CLI against this project.

| | |
|---|---|
| `./cre workflow build yield-sync` | compile to WASM, print the binary hash |
| `./cre workflow hash yield-sync` | workflow ID to freeze into the receiver |
| `./cre workflow simulate yield-sync` | run against the mock forwarder |
| `./cre workflow deploy yield-sync` | deploy to the registry |
| `docker compose run --rm --entrypoint bun cre test --cwd ./yield-sync` | tests |
| `docker compose run --rm --entrypoint bun cre run --cwd ./yield-sync typecheck` | types |

Adding a dependency drops `--frozen-lockfile` from the install above; commit the
resulting `bun.lock`.

Regenerating bindings after a `YieldReceiver` change:

```sh
jq '{abi: .abi}' ../sunday-v2-blockchain/out/YieldReceiver.sol/YieldReceiver.json \
  > yield-sync/contracts/evm/src/abi/YieldReceiver.json
./cre generate-bindings evm --language typescript --project-root yield-sync
```

## Layout

```
Dockerfile           pinned cre + bun
docker-compose.yml   cre service, plus a host-network login service
cre                  wrapper: ./cre <args> runs in the container
project.yaml         per-target chain RPCs
yield-sync/
  main.ts            entry point
  workflow.ts        cron handler, yield formula, report construction
  workflow.test.ts   tests
  workflow.yaml      workflow name and artifact paths per target
  config.*.json      schedule, chain, receiver address, API host
  contracts/         YieldReceiver ABI and generated bindings
  bun.lock           committed; pins the SDK tree
```

`onCronTrigger` reads the registry via one `vaultStates()` call, fetches production and
prices in two HTTP calls, prices every unreported vault-day, and writes one batched report.

## Operational notes

- The workflow ID hashes the binary **and** the config, and `setWorkflowId` is one-shot.
  Any edit to `config.*.json` — schedule included — needs a new receiver and new vaults.
- `schedule` is six fields, leading field seconds: `0 0 11 * * *` is 11:00 UTC daily. It
  must finish before the backend indexer's 12:00 UTC run.
- `login` uses `network_mode: host` for its callback on port 53682, so it is Linux-only.
  Credentials persist in the `cre-credentials` volume.
- No secrets: the workflow holds no key and the API is public.
