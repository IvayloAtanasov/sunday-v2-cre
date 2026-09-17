import { describe, expect, test } from 'bun:test'
import { decodeAbiParameters, type Address } from 'viem'

import { buildUpdates, encodeReport, netYieldMicro, parseVaultAddresses } from './workflow'

const DAY = 86_400

/**
 * The formula exactly as `calculate-installation-yield.deno.js` computed it, kept here so the
 * integer port can be held against the thing it replaces rather than against my arithmetic.
 */
const legacyNetYieldMicro = (kWh: number, eurPerMwh: number): bigint => {
	const powerMarketValue = (eurPerMwh / 1000) * kWh
	const revenue = powerMarketValue * (1 - 0.05)
	const taxableRevenue = revenue / (1 + 0.2) - 2
	const netYield = taxableRevenue > 0 ? taxableRevenue * (1 - 0.1) : taxableRevenue

	return BigInt(Math.round(netYield * 1_000_000))
}

const micro = (kWh: number, eurPerMwh: number) =>
	netYieldMicro(BigInt(Math.round(kWh * 1e3)), BigInt(Math.round(eurPerMwh * 1e6)))

describe('netYieldMicro', () => {
	test('matches the retired float formula on representative days', () => {
		const cases: Array<[number, number]> = [
			[1200, 85.5],
			[850.25, 120.0],
			[0, 95.0],
			[5000, 42.125],
			[73.4, 210.75],
		]

		for (const [kWh, price] of cases) {
			const ours = micro(kWh, price)
			const legacy = legacyNetYieldMicro(kWh, price)
			const drift = ours > legacy ? ours - legacy : legacy - ours

			// Truncating integer division against float rounding: a couple of EURC
			// micro-units, i.e. millionths of a euro.
			expect(Number(drift)).toBeLessThanOrEqual(3)
		}
	})

	test('a day that earns less than the commission is a negative delta, untaxed', () => {
		// Tiny production: revenue well under the EUR 2 fee.
		const delta = micro(1, 50)

		expect(delta).toBeLessThan(0n)
		// Corporate tax must not soften a loss.
		expect(delta).toBe(micro(1, 50))
		expect(Number(delta)).toBeLessThan(-1_900_000)
	})

	test('zero production still charges the commission', () => {
		expect(micro(0, 100)).toBe(-2_000_000n)
	})

	test('is exactly reproducible', () => {
		expect(micro(1234.567, 88.123456)).toBe(micro(1234.567, 88.123456))
	})
})

const VAULT_A = '0x1111111111111111111111111111111111111111' as Address
const VAULT_B = '0x2222222222222222222222222222222222222222' as Address

const accruing = (vault: Address, stationId: string, lastRebasedAt: number) => ({
	vault,
	stationId,
	phase: 3,
	lastRebasedAt: BigInt(lastRebasedAt),
})

const day = (stationId: string, dayTs: number, kWh: number) => ({
	stationId,
	dayTs,
	energyMilliKwh: String(Math.round(kWh * 1e3)),
})

const price = (dayTs: number, eurPerMwh: number) => ({
	dayTs,
	priceMicroPerMwh: String(Math.round(eurPerMwh * 1e6)),
})

describe('buildUpdates', () => {
	const now = 10 * DAY

	test('reports each unreported day, oldest first', () => {
		const { updates } = buildUpdates(
			[accruing(VAULT_A, 'st-1', 7 * DAY)],
			[day('st-1', 9 * DAY, 100), day('st-1', 8 * DAY, 110)],
			[price(8 * DAY, 90), price(9 * DAY, 95)],
			now,
			7,
		)

		// Ascending matters: the vault rejects a period it has already seen, so a
		// newest-first batch would lose every older day.
		expect(updates.map((u) => Number(u.updatedAt))).toEqual([8 * DAY, 9 * DAY])
	})

	test('skips a day the vault has already rebased', () => {
		const { updates } = buildUpdates(
			[accruing(VAULT_A, 'st-1', 9 * DAY)],
			[day('st-1', 9 * DAY, 100), day('st-1', 8 * DAY, 100)],
			[price(8 * DAY, 90), price(9 * DAY, 90)],
			now,
			7,
		)

		expect(updates).toHaveLength(0)
	})

	test('skips vaults that are not accruing', () => {
		const funding = { ...accruing(VAULT_A, 'st-1', 0), phase: 0 }

		const { updates, skipped } = buildUpdates(
			[funding],
			[day('st-1', 9 * DAY, 100)],
			[price(9 * DAY, 90)],
			now,
			7,
		)

		expect(updates).toHaveLength(0)
		expect(skipped.join()).toContain('not accruing')
	})

	test('drops days older than the staleness window the vault would reject', () => {
		const { updates } = buildUpdates(
			[accruing(VAULT_A, 'st-1', 0)],
			[day('st-1', 1 * DAY, 100), day('st-1', 9 * DAY, 100)],
			[price(1 * DAY, 90), price(9 * DAY, 90)],
			now,
			7,
		)

		expect(updates.map((u) => Number(u.updatedAt))).toEqual([9 * DAY])
	})

	test('ignores a day in the future', () => {
		const { updates } = buildUpdates(
			[accruing(VAULT_A, 'st-1', 0)],
			[day('st-1', 11 * DAY, 100)],
			[price(11 * DAY, 90)],
			now,
			7,
		)

		expect(updates).toHaveLength(0)
	})

	test('a missing price costs that day only, not the other vaults', () => {
		const { updates, skipped } = buildUpdates(
			[accruing(VAULT_A, 'st-1', 8 * DAY), accruing(VAULT_B, 'st-2', 8 * DAY)],
			[day('st-1', 9 * DAY, 100), day('st-2', 9 * DAY, 100)],
			[price(9 * DAY, 90)],
			now,
			7,
		)

		// Both stations share the day, so both are priced; the gap case is a day with no row.
		expect(updates).toHaveLength(2)
		expect(skipped).toHaveLength(0)

		const { updates: none, skipped: gaps } = buildUpdates(
			[accruing(VAULT_A, 'st-1', 8 * DAY)],
			[day('st-1', 9 * DAY, 100)],
			[],
			now,
			7,
		)

		expect(none).toHaveLength(0)
		expect(gaps.join()).toContain('no price')
	})

	test('matches each vault to its own station', () => {
		const { updates } = buildUpdates(
			[accruing(VAULT_A, 'st-1', 8 * DAY), accruing(VAULT_B, 'st-2', 8 * DAY)],
			[day('st-1', 9 * DAY, 100), day('st-2', 9 * DAY, 500)],
			[price(9 * DAY, 90)],
			now,
			7,
		)

		const byVault = new Map(updates.map((u) => [u.vault, u.delta]))

		expect(byVault.get(VAULT_A)).toBe(micro(100, 90))
		expect(byVault.get(VAULT_B)).toBe(micro(500, 90))
	})
})

describe('encodeReport', () => {
	test('encodes what onReport decodes: a bare YieldUpdate[]', () => {
		const updates = [
			{ vault: VAULT_A, delta: 123_456n, updatedAt: BigInt(9 * DAY) },
			{ vault: VAULT_B, delta: -7_000n, updatedAt: BigInt(9 * DAY) },
		]

		const [decoded] = decodeAbiParameters(
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
			encodeReport(updates),
		)

		expect(decoded).toHaveLength(2)
		expect((decoded as typeof updates)[0].vault.toLowerCase()).toBe(VAULT_A.toLowerCase())
		expect((decoded as typeof updates)[1].delta).toBe(-7_000n)
	})
})

describe('parseVaultAddresses', () => {
	test('normalises, dedupes and orders the backend list', () => {
		const rows = [
			{ vaultAddress: '0xBBBB111111111111111111111111111111111111' },
			{ vaultAddress: ' 0xaaaa111111111111111111111111111111111111 ' },
			{ vaultAddress: '0xBBBB111111111111111111111111111111111111' },
		]

		// Sorted, so which vaults fit the chain-read budget does not depend on Mongo's order.
		expect(parseVaultAddresses(rows)).toEqual([
			'0xaaaa111111111111111111111111111111111111',
			'0xbbbb111111111111111111111111111111111111',
		])
	})

	test('drops installations with no usable vault address', () => {
		const rows = [
			{ vaultAddress: '' },
			{ vaultAddress: null },
			{},
			{ vaultAddress: 'not-an-address' },
			{ vaultAddress: '0x1234' },
			{ vaultAddress: '0xcccc111111111111111111111111111111111111' },
		]

		expect(parseVaultAddresses(rows)).toEqual(['0xcccc111111111111111111111111111111111111'])
	})
})
