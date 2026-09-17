// Code generated — DO NOT EDIT.
import type { Address } from 'viem'
import { addContractMock, type ContractMock, type EvmMock } from '@chainlink/cre-sdk/test'

import { YieldReceiverABI } from './YieldReceiver'

export type YieldReceiverMock = {
  forwarder?: () => `0x${string}`
  isRegistered?: (vault: `0x${string}`) => boolean
  owner?: () => `0x${string}`
  stationIdOf?: (vault: `0x${string}`) => string
  supportsInterface?: (interfaceId: `0x${string}`) => boolean
  vaultAt?: (index: bigint) => `0x${string}`
  vaultCount?: () => bigint
  vaultStates?: () => readonly { vault: `0x${string}`; stationId: string; phase: number; lastRebasedAt: bigint }[]
  workflowId?: () => `0x${string}`
} & Pick<ContractMock<typeof YieldReceiverABI>, 'writeReport'>

export function newYieldReceiverMock(address: Address, evmMock: EvmMock): YieldReceiverMock {
  return addContractMock(evmMock, { address, abi: YieldReceiverABI }) as YieldReceiverMock
}

