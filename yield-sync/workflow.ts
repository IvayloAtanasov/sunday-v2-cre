import {
	consensusIdenticalAggregation,
	CronCapability,
	EVMClient,
	getNetwork,
	handler,
	HTTPClient,
	ok,
	type CronPayload,
	type HTTPSendRequester,
	type Runtime,
	TxStatus,
	bytesToHex,
} from '@chainlink/cre-sdk'
import { encodeAbiParameters, type Address, type Hex } from 'viem'
import { YieldReceiver } from './contracts/evm/ts/generated/YieldReceiver'

/**
 * Daily PV yield sync.
 *
 * Reads the vault registry from `YieldReceiver`, prices each vault's unreported days from
 * Sunday's API, and writes one batched report back to the receiver.
 *
 * Two properties this file exists to preserve:
 *
 *   - **The formula is the contract.** The receiver pins a workflow ID, which is a hash of this
 *     compiled binary and its config, and pins it exactly once. Every rate below therefore lives
 *     here rather than in the API, where it could be changed without the change being visible to
 *     a lender reading the chain.
 *   - **Every node must agree exactly.** Past-day production and prices do not change, so the
 *     aggregation is `identical`, not `median`. That means no wall-clock reads, no floating
 *     point in the money path, and no ordering that depends on anything but the data.
 */

export type Config = {
	/**
	 * Six fields, leading one is SECONDS — `0 0 11 * * *` is 11:00 UTC daily, whereas the
	 * five-field `0 11 * * *` would silently mean 11 minutes past every hour.
	 *
	 * Must finish before the backend's blockchain-indexer run at 12:00 UTC.
	 */
	schedule: string
	/** Chain the receiver lives on, as `cre workflow supported-chains` names it. */
	chainSelectorName: string
	isTestnet: boolean
	receiverAddress: string
	/** Origin of Sunday's API, no trailing slash. */
	apiBaseUrl: string
	/**
	 * Most vaults one run will read state for.
	 *
	 * A CRE execution gets a fixed number of chain reads and this costs one per vault, so the
	 * cap is a budget, not a preference. Vaults beyond it keep their days until a later run,
	 * which is why the order is deterministic rather than whatever the backend returned.
	 */
	maxVaultsPerRun: number
	/** Price country key, as stored by the price collector. */
	country: string
	/**
	 * How far back to look for unreported days. The vault rejects anything older than its own
	 * `maxStaleness` (7 days), and the API refuses a window wider than 7 days, so this is
	 * bounded by both ends.
	 */
	lookbackDays: number
	gasLimit: string
}

// ---------------------------------------------------------------------------
// The formula. Integer-only, in EURC minor units (6 dp), which is also micro-EUR.
// ---------------------------------------------------------------------------

/** Electricity trader's cut off the day-ahead market price, by contract. 5%. */
const BUYER_DISCOUNT_NUM = 95n
const BUYER_DISCOUNT_DEN = 100n

/** Bulgarian VAT, stripped out of the gross revenue. 20%. */
const VAT_NUM = 100n
const VAT_DEN = 120n

/** Flat fee covering gas, in micro-EUR. EUR 2. */
const SUNDAY_COMMISSION_MICRO = 2_000_000n

/** Bulgarian corporate tax, applied to profit only. 10%. */
const CORPORATE_TAX_NUM = 90n
const CORPORATE_TAX_DEN = 100n

const SECONDS_PER_DAY = 86_400

/**
 * One vault-day of measured profit, matching `YieldReceiver.YieldUpdate`.
 */
type YieldUpdate = {
	vault: Address
	delta: bigint
	updatedAt: bigint
}

/** A production reading, reduced to integers at the edge. */
type StationDay = {
	stationId: string
	/** Day bucket, epoch seconds, exactly as the collector wrote it. */
	dayTs: number
	/** kWh x 1e3, so the money path never sees a float. */
	energyMilliKwh: string
}

/** A day-ahead price, reduced to integers at the edge. */
type PriceDay = {
	dayTs: number
	/** EUR per MWh x 1e6. */
	priceMicroPerMwh: string
}

/**
 * Net yield for one vault-day, in EURC minor units.
 *
 * Mirrors the retired `calculate-installation-yield.deno.js` step for step, but in integers:
 * floats are reproducible in principle, and unreadable in review when the result has to match
 * bit-for-bit across nodes.
 */
export const netYieldMicro = (energyMilliKwh: bigint, priceMicroPerMwh: bigint): bigint => {
	// price is per MWh and energy is in kWh, so the 1/1000 is folded into the scale below:
	//   (priceMicro / 1e6 / 1000) EUR/kWh  x  (energyMilli / 1e3) kWh  x  1e6 micro/EUR
	// = priceMicro * energyMilli / 1e6
	const marketValueMicro = (priceMicroPerMwh * energyMilliKwh) / 1_000_000n

	const revenueMicro = (marketValueMicro * BUYER_DISCOUNT_NUM) / BUYER_DISCOUNT_DEN
	const taxableMicro = (revenueMicro * VAT_NUM) / VAT_DEN - SUNDAY_COMMISSION_MICRO

	// Tax applies to profit only; a loss-making day is carried at its full negative value.
	return taxableMicro > 0n ? (taxableMicro * CORPORATE_TAX_NUM) / CORPORATE_TAX_DEN : taxableMicro
}

// ---------------------------------------------------------------------------
// Fetching. Runs per node; the reduced result is what consensus compares.
// ---------------------------------------------------------------------------

const requireOk = (response: { statusCode: number }, what: string) => {
	if (!ok(response as never)) {
		throw new Error(`${what} request failed with status ${response.statusCode}`)
	}
}

const bodyOf = (response: { body: Uint8Array }): unknown =>
	JSON.parse(Buffer.from(response.body).toString('utf-8'))

/**
 * Scale a JSON number to an integer string without going through float arithmetic that
 * could differ in its last bit. `toFixed` rounds half-away-from-zero identically everywhere.
 */
const scaled = (value: number, decimals: number): string => {
	if (!Number.isFinite(value)) {
		throw new Error(`non-finite numeric value in API response: ${value}`)
	}
	const fixed = value.toFixed(decimals)
	const negative = fixed.startsWith('-')
	const [whole, fraction = ''] = (negative ? fixed.slice(1) : fixed).split('.')
	const digits = `${whole}${fraction.padEnd(decimals, '0')}`.replace(/^0+(?=\d)/, '')
	return `${negative && digits !== '0' ? '-' : ''}${digits}`
}

const dayBucket = (iso: string): number => {
	const ms = Date.parse(iso)
	if (Number.isNaN(ms)) {
		throw new Error(`unparseable date in API response: ${iso}`)
	}
	// Floor to the UTC day with integer arithmetic — `Intl` is not dependable in WASM.
	return Math.floor(Math.floor(ms / 1000) / SECONDS_PER_DAY) * SECONDS_PER_DAY
}

type Window = { fromISO: string; toISO: string; country: string; apiBaseUrl: string }

/**
 * Both endpoints are global rather than per station, so a run costs two calls at any vault
 * count, and both require an explicit window — a now-relative default would hand each node a
 * different one.
 */
const fetchStationDays = (sendRequester: HTTPSendRequester, window: Window): StationDay[] => {
	const url = `${window.apiBaseUrl}/pv-metrics?from=${encodeURIComponent(window.fromISO)}&to=${encodeURIComponent(window.toISO)}`
	const response = sendRequester.sendRequest({ method: 'GET', url }).result()
	requireOk(response, 'pv-metrics')

	const rows = bodyOf(response) as Array<{
		stationId: string
		date: string
		totalProductPower: number
	}>

	return rows
		.map((row) => ({
			stationId: row.stationId,
			dayTs: dayBucket(row.date),
			energyMilliKwh: scaled(row.totalProductPower, 3),
		}))
		.sort((a, b) => a.dayTs - b.dayTs || a.stationId.localeCompare(b.stationId))
}

/**
 * The vault addresses to price, from the backend's installation list.
 *
 * Deliberately the same list the indexer and the app read, rather than a second enumeration off
 * the chain: an installation missing here already breaks those, so one source fails visibly
 * instead of two sources drifting apart. It is only a list — every vault's station binding,
 * phase and watermark still come from `vaultState`, and `onReport` rejects anything the receiver
 * does not know, so a bad row here costs a vault its day but cannot misprice one.
 */
export const parseVaultAddresses = (rows: Array<{ vaultAddress?: string | null }>): string[] => {
	const addresses = rows
		.map((row) => (row.vaultAddress ?? '').trim().toLowerCase())
		.filter((address) => /^0x[0-9a-f]{40}$/.test(address))

	// Deduplicated and sorted so the read budget always spends itself on the same vaults,
	// whatever order Mongo returned.
	return [...new Set(addresses)].sort()
}

const fetchVaultAddresses = (sendRequester: HTTPSendRequester, window: Window): string[] => {
	const response = sendRequester
		.sendRequest({ method: 'GET', url: `${window.apiBaseUrl}/installations` })
		.result()
	requireOk(response, 'installations')

	return parseVaultAddresses(bodyOf(response) as Array<{ vaultAddress?: string | null }>)
}

const fetchPriceDays = (sendRequester: HTTPSendRequester, window: Window): PriceDay[] => {
	const url = `${window.apiBaseUrl}/energy-prices?from=${encodeURIComponent(window.fromISO)}&to=${encodeURIComponent(window.toISO)}`
	const response = sendRequester.sendRequest({ method: 'GET', url }).result()
	requireOk(response, 'energy-prices')

	const rows = bodyOf(response) as Array<{
		country: string
		timestampISO: string
		price: number
	}>

	return rows
		.filter((row) => row.country === window.country)
		.map((row) => ({
			dayTs: dayBucket(row.timestampISO),
			priceMicroPerMwh: scaled(row.price, 6),
		}))
		.sort((a, b) => a.dayTs - b.dayTs)
}

// ---------------------------------------------------------------------------
// Assembling the batch
// ---------------------------------------------------------------------------

/** `LendingVault.Phase.Accruing`. Only this phase accepts a rebase. */
const PHASE_ACCRUING = 3

type VaultState = {
	vault: Address
	stationId: string
	phase: number
	lastRebasedAt: bigint
}

/**
 * Which vault-days to report, in the order the receiver must apply them.
 *
 * Ascending `updatedAt` per vault is required, not cosmetic: the vault rejects a period it has
 * already seen (R-25), so a batch that ran newest-first would have every older day rejected.
 */
export const buildUpdates = (
	states: readonly VaultState[],
	stationDays: readonly StationDay[],
	priceDays: readonly PriceDay[],
	nowTs: number,
	lookbackDays: number,
): { updates: YieldUpdate[]; skipped: string[] } => {
	const priceByDay = new Map(priceDays.map((p) => [p.dayTs, BigInt(p.priceMicroPerMwh)]))
	const updates: YieldUpdate[] = []
	const skipped: string[] = []

	const oldestAllowed = nowTs - lookbackDays * SECONDS_PER_DAY

	for (const state of states) {
		if (state.phase !== PHASE_ACCRUING) {
			skipped.push(`${state.vault}: phase ${state.phase}, not accruing`)
			continue
		}

		const days = stationDays
			.filter((day) => day.stationId === state.stationId)
			// The vault's own rules, applied here so a doomed update never costs a report slot:
			// already seen, still in the future, or too stale to be accepted.
			.filter((day) => BigInt(day.dayTs) > state.lastRebasedAt)
			.filter((day) => day.dayTs <= nowTs && day.dayTs >= oldestAllowed)
			.sort((a, b) => a.dayTs - b.dayTs)

		for (const day of days) {
			const price = priceByDay.get(day.dayTs)

			if (price === undefined) {
				// One missing price must not cost the other vaults their day.
				skipped.push(`${state.vault}: no price for day ${day.dayTs}`)
				continue
			}

			updates.push({
				vault: state.vault,
				delta: netYieldMicro(BigInt(day.energyMilliKwh), price),
				updatedAt: BigInt(day.dayTs),
			})
		}
	}

	return { updates, skipped }
}

/**
 * `abi.encode(YieldUpdate[])`, which is what `onReport` decodes.
 *
 * Deliberately not `encodeFunctionData`: the generated `writeReportFromOnReport` helper would
 * wrap this in a selector and four-byte-offset calldata, and `onReport` would fail to decode it.
 */
export const encodeReport = (updates: readonly YieldUpdate[]): Hex =>
	encodeAbiParameters(
		[
			{
				type: 'tuple[]',
				components: [
					{ name: 'vault', type: 'address' },
					{ name: 'delta', type: 'int256' },
					{ name: 'updatedAt', type: 'uint64' },
				],
			},
		],
		[updates as YieldUpdate[]],
	)

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

const receiverFor = (config: Config) => {
	const network = getNetwork({
		chainFamily: 'evm',
		chainSelectorName: config.chainSelectorName,
		isTestnet: config.isTestnet,
	})

	if (!network) {
		throw new Error(`no network for chain selector name ${config.chainSelectorName}`)
	}

	const evmClient = new EVMClient(network.chainSelector.selector)

	return new YieldReceiver(evmClient, config.receiverAddress as Address)
}

export const onCronTrigger = (runtime: Runtime<Config>, payload: CronPayload): string => {
	const config = runtime.config

	// The trigger's scheduled time, not a wall clock: it is the same number on every node,
	// which `runtime.now()` need not be.
	if (!payload.scheduledExecutionTime) {
		throw new Error('cron payload carried no scheduled execution time')
	}
	const nowTs = Number(payload.scheduledExecutionTime.seconds)

	const receiver = receiverFor(config)

	const window: Window = {
		fromISO: new Date((nowTs - config.lookbackDays * SECONDS_PER_DAY) * 1000).toISOString(),
		toISO: new Date(nowTs * 1000).toISOString(),
		country: config.country,
		apiBaseUrl: config.apiBaseUrl,
	}

	const http = new HTTPClient()

	const allAddresses = http
		.sendRequest(runtime, fetchVaultAddresses, consensusIdenticalAggregation<string[]>())(window)
		.result()

	if (allAddresses.length === 0) {
		runtime.log('no installations with a vault address, nothing to report')
		return 'no vaults'
	}

	const addresses = allAddresses.slice(0, config.maxVaultsPerRun)

	if (allAddresses.length > addresses.length) {
		// Loud, because the dropped vaults accrue nothing until the budget or the cadence changes.
		runtime.log(
			`WARNING: ${allAddresses.length} vaults listed but only ${addresses.length} fit the ` +
			`chain-read budget; ${allAddresses.length - addresses.length} will not be reported this run`,
		)
	}

	// One read per vault. Chain state, not Mongo, is the record of what has been synced: a day
	// that failed on-chain must not look done.
	const states: VaultState[] = []

	for (const address of addresses) {
		const state = receiver.vaultState(runtime, address as Address)

		if (!state.registered) {
			// Listed by the backend but never registered here, so this receiver would reject it.
			runtime.log(`skipped ${address}: not registered with this receiver`)
			continue
		}

		states.push({
			vault: address as Address,
			stationId: state.stationId,
			phase: state.phase,
			lastRebasedAt: state.lastRebasedAt,
		})
	}

	if (states.length === 0) {
		runtime.log('no registered vaults among the listed installations')
		return 'no vaults'
	}

	// Consensus over the reduced rows rather than the raw bodies: `_id`, `__v` and key order
	// are noise that would only ever make identical aggregation fail.
	const stationDays = http
		.sendRequest(runtime, fetchStationDays, consensusIdenticalAggregation<StationDay[]>())(window)
		.result()

	const priceDays = http
		.sendRequest(runtime, fetchPriceDays, consensusIdenticalAggregation<PriceDay[]>())(window)
		.result()

	const { updates, skipped } = buildUpdates(
		states,
		stationDays,
		priceDays,
		nowTs,
		config.lookbackDays,
	)

	for (const reason of skipped) {
		runtime.log(`skipped ${reason}`)
	}

	if (updates.length === 0) {
		runtime.log('nothing to report this run')
		return 'no updates'
	}

	runtime.log(`reporting ${updates.length} vault-day(s)`)

	const response = receiver.writeReport(runtime, encodeReport(updates), {
		gasLimit: config.gasLimit,
	})

	if (response.txStatus !== TxStatus.SUCCESS) {
		throw new Error(`writeReport failed: ${response.errorMessage || response.txStatus}`)
	}

	runtime.log(`reported at ${bytesToHex(response.txHash || new Uint8Array(32))}`)

	return `reported ${updates.length}`
}

export const initWorkflow = (config: Config) => {
	const cron = new CronCapability()

	return [handler(cron.trigger({ schedule: config.schedule }), onCronTrigger)]
}
