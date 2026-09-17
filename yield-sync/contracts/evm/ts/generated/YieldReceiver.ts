// Code generated — DO NOT EDIT.
import {
  decodeEventLog,
  decodeFunctionResult,
  encodeEventTopics,
  encodeFunctionData,
  zeroAddress,
} from 'viem'
import type { Address, Hex } from 'viem'
import {
  bytesToHex,
  encodeCallMsg,
  EVMClient,
  hexToBase64,
  LAST_FINALIZED_BLOCK_NUMBER,
  prepareReportRequest,
  type EVMLog,
  type Runtime,
} from '@chainlink/cre-sdk'

export interface DecodedLog<T> extends Omit<EVMLog, 'data'> { data: T }

const encodeTopicValue = (t: Hex | Hex[] | null): string[] => {
  if (t == null) return []
  if (Array.isArray(t)) return t.map(hexToBase64)
  return [hexToBase64(t)]
}





/**
 * Filter params for OwnershipTransferred. Only indexed fields can be used for filtering.
 * Indexed string/bytes must be passed as keccak256 hash (Hex).
 */
export type OwnershipTransferredTopics = {
  user?: `0x${string}`
  newOwner?: `0x${string}`
}

/**
 * Decoded OwnershipTransferred event data.
 */
export type OwnershipTransferredDecoded = {
  user: `0x${string}`
  newOwner: `0x${string}`
}


/**
 * Filter params for RebaseFailed. Only indexed fields can be used for filtering.
 * Indexed string/bytes must be passed as keccak256 hash (Hex).
 */
export type RebaseFailedTopics = {
  vault?: `0x${string}`
}

/**
 * Decoded RebaseFailed event data.
 */
export type RebaseFailedDecoded = {
  vault: `0x${string}`
  updatedAt: bigint
  reason: `0x${string}`
}


/**
 * Filter params for Rebased. Only indexed fields can be used for filtering.
 * Indexed string/bytes must be passed as keccak256 hash (Hex).
 */
export type RebasedTopics = {
  vault?: `0x${string}`
}

/**
 * Decoded Rebased event data.
 */
export type RebasedDecoded = {
  vault: `0x${string}`
  delta: bigint
  updatedAt: bigint
}


/**
 * Filter params for UnregisteredVault. Only indexed fields can be used for filtering.
 * Indexed string/bytes must be passed as keccak256 hash (Hex).
 */
export type UnregisteredVaultTopics = {
  vault?: `0x${string}`
}

/**
 * Decoded UnregisteredVault event data.
 */
export type UnregisteredVaultDecoded = {
  vault: `0x${string}`
  updatedAt: bigint
}


/**
 * Filter params for VaultRegistered. Only indexed fields can be used for filtering.
 * Indexed string/bytes must be passed as keccak256 hash (Hex).
 */
export type VaultRegisteredTopics = {
  vault?: `0x${string}`
}

/**
 * Decoded VaultRegistered event data.
 */
export type VaultRegisteredDecoded = {
  vault: `0x${string}`
  stationId: string
}


/**
 * Filter params for WorkflowIdSet. Only indexed fields can be used for filtering.
 * Indexed string/bytes must be passed as keccak256 hash (Hex).
 */
export type WorkflowIdSetTopics = {
}

/**
 * Decoded WorkflowIdSet event data.
 */
export type WorkflowIdSetDecoded = {
  workflowId: `0x${string}`
}


export const YieldReceiverABI = [{"type":"constructor","inputs":[{"name":"forwarderAddress","type":"address","internalType":"address"},{"name":"operator","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},{"type":"function","name":"forwarder","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"isRegistered","inputs":[{"name":"vault","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"bool","internalType":"bool"}],"stateMutability":"view"},{"type":"function","name":"onReport","inputs":[{"name":"metadata","type":"bytes","internalType":"bytes"},{"name":"report","type":"bytes","internalType":"bytes"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"owner","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"registerVault","inputs":[{"name":"vault","type":"address","internalType":"address"},{"name":"stationId","type":"string","internalType":"string"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"setWorkflowId","inputs":[{"name":"id","type":"bytes32","internalType":"bytes32"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"stationIdOf","inputs":[{"name":"vault","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"string","internalType":"string"}],"stateMutability":"view"},{"type":"function","name":"supportsInterface","inputs":[{"name":"interfaceId","type":"bytes4","internalType":"bytes4"}],"outputs":[{"name":"","type":"bool","internalType":"bool"}],"stateMutability":"pure"},{"type":"function","name":"transferOwnership","inputs":[{"name":"newOwner","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"vaultAt","inputs":[{"name":"index","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"vaultCount","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"vaultState","inputs":[{"name":"vault","type":"address","internalType":"address"}],"outputs":[{"name":"state","type":"tuple","internalType":"structYieldReceiver.VaultState","components":[{"name":"registered","type":"bool","internalType":"bool"},{"name":"stationId","type":"string","internalType":"string"},{"name":"phase","type":"uint8","internalType":"uint8"},{"name":"lastRebasedAt","type":"uint64","internalType":"uint64"}]}],"stateMutability":"view"},{"type":"function","name":"workflowId","inputs":[],"outputs":[{"name":"","type":"bytes32","internalType":"bytes32"}],"stateMutability":"view"},{"type":"event","name":"OwnershipTransferred","inputs":[{"name":"user","type":"address","indexed":true,"internalType":"address"},{"name":"newOwner","type":"address","indexed":true,"internalType":"address"}],"anonymous":false},{"type":"event","name":"RebaseFailed","inputs":[{"name":"vault","type":"address","indexed":true,"internalType":"address"},{"name":"updatedAt","type":"uint64","indexed":false,"internalType":"uint64"},{"name":"reason","type":"bytes","indexed":false,"internalType":"bytes"}],"anonymous":false},{"type":"event","name":"Rebased","inputs":[{"name":"vault","type":"address","indexed":true,"internalType":"address"},{"name":"delta","type":"int256","indexed":false,"internalType":"int256"},{"name":"updatedAt","type":"uint64","indexed":false,"internalType":"uint64"}],"anonymous":false},{"type":"event","name":"UnregisteredVault","inputs":[{"name":"vault","type":"address","indexed":true,"internalType":"address"},{"name":"updatedAt","type":"uint64","indexed":false,"internalType":"uint64"}],"anonymous":false},{"type":"event","name":"VaultRegistered","inputs":[{"name":"vault","type":"address","indexed":true,"internalType":"address"},{"name":"stationId","type":"string","indexed":false,"internalType":"string"}],"anonymous":false},{"type":"event","name":"WorkflowIdSet","inputs":[{"name":"workflowId","type":"bytes32","indexed":false,"internalType":"bytes32"}],"anonymous":false},{"type":"error","name":"AdapterMismatch","inputs":[{"name":"vault","type":"address","internalType":"address"},{"name":"adapter","type":"address","internalType":"address"}]},{"type":"error","name":"AlreadyRegistered","inputs":[{"name":"vault","type":"address","internalType":"address"}]},{"type":"error","name":"EmptyStationId","inputs":[]},{"type":"error","name":"InvalidMetadata","inputs":[]},{"type":"error","name":"NotForwarder","inputs":[{"name":"caller","type":"address","internalType":"address"}]},{"type":"error","name":"UnexpectedWorkflow","inputs":[{"name":"workflowId","type":"bytes32","internalType":"bytes32"}]},{"type":"error","name":"WorkflowIdFrozen","inputs":[]},{"type":"error","name":"WorkflowIdNotSet","inputs":[]},{"type":"error","name":"ZeroAddress","inputs":[]}] as const

export class YieldReceiver {
  constructor(
    private readonly client: EVMClient,
    public readonly address: Address,
  ) {}

  forwarder(
    runtime: Runtime<unknown>,
  ): `0x${string}` {
    const callData = encodeFunctionData({
      abi: YieldReceiverABI,
      functionName: 'forwarder' as const,
    })

    const result = this.client
      .callContract(runtime, {
        call: encodeCallMsg({ from: zeroAddress, to: this.address, data: callData }),
        blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
      })
      .result()

    return decodeFunctionResult({
      abi: YieldReceiverABI,
      functionName: 'forwarder' as const,
      data: bytesToHex(result.data),
    }) as `0x${string}`
  }

  isRegistered(
    runtime: Runtime<unknown>,
    vault: `0x${string}`,
  ): boolean {
    const callData = encodeFunctionData({
      abi: YieldReceiverABI,
      functionName: 'isRegistered' as const,
      args: [vault],
    })

    const result = this.client
      .callContract(runtime, {
        call: encodeCallMsg({ from: zeroAddress, to: this.address, data: callData }),
        blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
      })
      .result()

    return decodeFunctionResult({
      abi: YieldReceiverABI,
      functionName: 'isRegistered' as const,
      data: bytesToHex(result.data),
    }) as boolean
  }

  owner(
    runtime: Runtime<unknown>,
  ): `0x${string}` {
    const callData = encodeFunctionData({
      abi: YieldReceiverABI,
      functionName: 'owner' as const,
    })

    const result = this.client
      .callContract(runtime, {
        call: encodeCallMsg({ from: zeroAddress, to: this.address, data: callData }),
        blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
      })
      .result()

    return decodeFunctionResult({
      abi: YieldReceiverABI,
      functionName: 'owner' as const,
      data: bytesToHex(result.data),
    }) as `0x${string}`
  }

  stationIdOf(
    runtime: Runtime<unknown>,
    vault: `0x${string}`,
  ): string {
    const callData = encodeFunctionData({
      abi: YieldReceiverABI,
      functionName: 'stationIdOf' as const,
      args: [vault],
    })

    const result = this.client
      .callContract(runtime, {
        call: encodeCallMsg({ from: zeroAddress, to: this.address, data: callData }),
        blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
      })
      .result()

    return decodeFunctionResult({
      abi: YieldReceiverABI,
      functionName: 'stationIdOf' as const,
      data: bytesToHex(result.data),
    }) as string
  }

  supportsInterface(
    runtime: Runtime<unknown>,
    interfaceId: `0x${string}`,
  ): boolean {
    const callData = encodeFunctionData({
      abi: YieldReceiverABI,
      functionName: 'supportsInterface' as const,
      args: [interfaceId],
    })

    const result = this.client
      .callContract(runtime, {
        call: encodeCallMsg({ from: zeroAddress, to: this.address, data: callData }),
        blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
      })
      .result()

    return decodeFunctionResult({
      abi: YieldReceiverABI,
      functionName: 'supportsInterface' as const,
      data: bytesToHex(result.data),
    }) as boolean
  }

  vaultAt(
    runtime: Runtime<unknown>,
    index: bigint,
  ): `0x${string}` {
    const callData = encodeFunctionData({
      abi: YieldReceiverABI,
      functionName: 'vaultAt' as const,
      args: [index],
    })

    const result = this.client
      .callContract(runtime, {
        call: encodeCallMsg({ from: zeroAddress, to: this.address, data: callData }),
        blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
      })
      .result()

    return decodeFunctionResult({
      abi: YieldReceiverABI,
      functionName: 'vaultAt' as const,
      data: bytesToHex(result.data),
    }) as `0x${string}`
  }

  vaultCount(
    runtime: Runtime<unknown>,
  ): bigint {
    const callData = encodeFunctionData({
      abi: YieldReceiverABI,
      functionName: 'vaultCount' as const,
    })

    const result = this.client
      .callContract(runtime, {
        call: encodeCallMsg({ from: zeroAddress, to: this.address, data: callData }),
        blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
      })
      .result()

    return decodeFunctionResult({
      abi: YieldReceiverABI,
      functionName: 'vaultCount' as const,
      data: bytesToHex(result.data),
    }) as bigint
  }

  vaultState(
    runtime: Runtime<unknown>,
    vault: `0x${string}`,
  ): { registered: boolean; stationId: string; phase: number; lastRebasedAt: bigint } {
    const callData = encodeFunctionData({
      abi: YieldReceiverABI,
      functionName: 'vaultState' as const,
      args: [vault],
    })

    const result = this.client
      .callContract(runtime, {
        call: encodeCallMsg({ from: zeroAddress, to: this.address, data: callData }),
        blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
      })
      .result()

    return decodeFunctionResult({
      abi: YieldReceiverABI,
      functionName: 'vaultState' as const,
      data: bytesToHex(result.data),
    }) as { registered: boolean; stationId: string; phase: number; lastRebasedAt: bigint }
  }

  workflowId(
    runtime: Runtime<unknown>,
  ): `0x${string}` {
    const callData = encodeFunctionData({
      abi: YieldReceiverABI,
      functionName: 'workflowId' as const,
    })

    const result = this.client
      .callContract(runtime, {
        call: encodeCallMsg({ from: zeroAddress, to: this.address, data: callData }),
        blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
      })
      .result()

    return decodeFunctionResult({
      abi: YieldReceiverABI,
      functionName: 'workflowId' as const,
      data: bytesToHex(result.data),
    }) as `0x${string}`
  }

  writeReportFromOnReport(
    runtime: Runtime<unknown>,
    metadata: `0x${string}`,
    report: `0x${string}`,
    gasConfig?: { gasLimit?: string },
  ) {
    const callData = encodeFunctionData({
      abi: YieldReceiverABI,
      functionName: 'onReport' as const,
      args: [metadata, report],
    })

    const reportResponse = runtime
      .report(prepareReportRequest(callData))
      .result()

    return this.client
      .writeReport(runtime, {
        receiver: this.address,
        report: reportResponse,
        gasConfig,
      })
      .result()
  }

  writeReportFromRegisterVault(
    runtime: Runtime<unknown>,
    vault: `0x${string}`,
    stationId: string,
    gasConfig?: { gasLimit?: string },
  ) {
    const callData = encodeFunctionData({
      abi: YieldReceiverABI,
      functionName: 'registerVault' as const,
      args: [vault, stationId],
    })

    const reportResponse = runtime
      .report(prepareReportRequest(callData))
      .result()

    return this.client
      .writeReport(runtime, {
        receiver: this.address,
        report: reportResponse,
        gasConfig,
      })
      .result()
  }

  writeReportFromSetWorkflowId(
    runtime: Runtime<unknown>,
    id: `0x${string}`,
    gasConfig?: { gasLimit?: string },
  ) {
    const callData = encodeFunctionData({
      abi: YieldReceiverABI,
      functionName: 'setWorkflowId' as const,
      args: [id],
    })

    const reportResponse = runtime
      .report(prepareReportRequest(callData))
      .result()

    return this.client
      .writeReport(runtime, {
        receiver: this.address,
        report: reportResponse,
        gasConfig,
      })
      .result()
  }

  writeReportFromTransferOwnership(
    runtime: Runtime<unknown>,
    newOwner: `0x${string}`,
    gasConfig?: { gasLimit?: string },
  ) {
    const callData = encodeFunctionData({
      abi: YieldReceiverABI,
      functionName: 'transferOwnership' as const,
      args: [newOwner],
    })

    const reportResponse = runtime
      .report(prepareReportRequest(callData))
      .result()

    return this.client
      .writeReport(runtime, {
        receiver: this.address,
        report: reportResponse,
        gasConfig,
      })
      .result()
  }

  writeReport(
    runtime: Runtime<unknown>,
    callData: Hex,
    gasConfig?: { gasLimit?: string },
  ) {
    const reportResponse = runtime
      .report(prepareReportRequest(callData))
      .result()

    return this.client
      .writeReport(runtime, {
        receiver: this.address,
        report: reportResponse,
        gasConfig,
      })
      .result()
  }

  /**
   * Creates a log trigger for OwnershipTransferred events.
   * The returned trigger's adapt method decodes the raw log into OwnershipTransferredDecoded,
   * so the handler receives typed event data directly.
   * When multiple filters are provided, topic values are merged with OR semantics (match any).
   */
  logTriggerOwnershipTransferred(
    filters?: OwnershipTransferredTopics[],
  ) {
    let topics: { values: string[] }[]
    if (!filters || filters.length === 0) {
      const encoded = encodeEventTopics({
        abi: YieldReceiverABI,
        eventName: 'OwnershipTransferred' as const,
      })
      topics = encoded.map((t) => ({ values: encodeTopicValue(t) }))
    } else if (filters.length === 1) {
      const f = filters[0]
      const args = {
        user: f.user,
        newOwner: f.newOwner,
      }
      const encoded = encodeEventTopics({
        abi: YieldReceiverABI,
        eventName: 'OwnershipTransferred' as const,
        args,
      })
      topics = encoded.map((t) => ({ values: encodeTopicValue(t) }))
    } else {
      const allEncoded = filters.map((f) => {
        const args = {
          user: f.user,
          newOwner: f.newOwner,
        }
        return encodeEventTopics({
          abi: YieldReceiverABI,
          eventName: 'OwnershipTransferred' as const,
          args,
        })
      })
      topics = allEncoded[0].map((_, i) => ({
        values: [...new Set(allEncoded.flatMap((row) => encodeTopicValue(row[i])))],
      }))
    }
    const baseTrigger = this.client.logTrigger({
      addresses: [hexToBase64(this.address)],
      topics,
    })
    const contract = this
    return {
      capabilityId: () => baseTrigger.capabilityId(),
      method: () => baseTrigger.method(),
      outputSchema: () => baseTrigger.outputSchema(),
      configAsAny: () => baseTrigger.configAsAny(),
      adapt: (rawOutput: EVMLog): DecodedLog<OwnershipTransferredDecoded> => contract.decodeOwnershipTransferred(rawOutput),
    }
  }

  /**
   * Decodes a log into OwnershipTransferred data, preserving all log metadata.
   */
  decodeOwnershipTransferred(log: EVMLog): DecodedLog<OwnershipTransferredDecoded> {
    const decoded = decodeEventLog({
      abi: YieldReceiverABI,
      data: bytesToHex(log.data),
      topics: log.topics.map((t) => bytesToHex(t)) as [Hex, ...Hex[]],
    })
    const { data: _, ...rest } = log
    return { ...rest, data: decoded.args as unknown as OwnershipTransferredDecoded }
  }

  /**
   * Creates a log trigger for RebaseFailed events.
   * The returned trigger's adapt method decodes the raw log into RebaseFailedDecoded,
   * so the handler receives typed event data directly.
   * When multiple filters are provided, topic values are merged with OR semantics (match any).
   */
  logTriggerRebaseFailed(
    filters?: RebaseFailedTopics[],
  ) {
    let topics: { values: string[] }[]
    if (!filters || filters.length === 0) {
      const encoded = encodeEventTopics({
        abi: YieldReceiverABI,
        eventName: 'RebaseFailed' as const,
      })
      topics = encoded.map((t) => ({ values: encodeTopicValue(t) }))
    } else if (filters.length === 1) {
      const f = filters[0]
      const args = {
        vault: f.vault,
      }
      const encoded = encodeEventTopics({
        abi: YieldReceiverABI,
        eventName: 'RebaseFailed' as const,
        args,
      })
      topics = encoded.map((t) => ({ values: encodeTopicValue(t) }))
    } else {
      const allEncoded = filters.map((f) => {
        const args = {
          vault: f.vault,
        }
        return encodeEventTopics({
          abi: YieldReceiverABI,
          eventName: 'RebaseFailed' as const,
          args,
        })
      })
      topics = allEncoded[0].map((_, i) => ({
        values: [...new Set(allEncoded.flatMap((row) => encodeTopicValue(row[i])))],
      }))
    }
    const baseTrigger = this.client.logTrigger({
      addresses: [hexToBase64(this.address)],
      topics,
    })
    const contract = this
    return {
      capabilityId: () => baseTrigger.capabilityId(),
      method: () => baseTrigger.method(),
      outputSchema: () => baseTrigger.outputSchema(),
      configAsAny: () => baseTrigger.configAsAny(),
      adapt: (rawOutput: EVMLog): DecodedLog<RebaseFailedDecoded> => contract.decodeRebaseFailed(rawOutput),
    }
  }

  /**
   * Decodes a log into RebaseFailed data, preserving all log metadata.
   */
  decodeRebaseFailed(log: EVMLog): DecodedLog<RebaseFailedDecoded> {
    const decoded = decodeEventLog({
      abi: YieldReceiverABI,
      data: bytesToHex(log.data),
      topics: log.topics.map((t) => bytesToHex(t)) as [Hex, ...Hex[]],
    })
    const { data: _, ...rest } = log
    return { ...rest, data: decoded.args as unknown as RebaseFailedDecoded }
  }

  /**
   * Creates a log trigger for Rebased events.
   * The returned trigger's adapt method decodes the raw log into RebasedDecoded,
   * so the handler receives typed event data directly.
   * When multiple filters are provided, topic values are merged with OR semantics (match any).
   */
  logTriggerRebased(
    filters?: RebasedTopics[],
  ) {
    let topics: { values: string[] }[]
    if (!filters || filters.length === 0) {
      const encoded = encodeEventTopics({
        abi: YieldReceiverABI,
        eventName: 'Rebased' as const,
      })
      topics = encoded.map((t) => ({ values: encodeTopicValue(t) }))
    } else if (filters.length === 1) {
      const f = filters[0]
      const args = {
        vault: f.vault,
      }
      const encoded = encodeEventTopics({
        abi: YieldReceiverABI,
        eventName: 'Rebased' as const,
        args,
      })
      topics = encoded.map((t) => ({ values: encodeTopicValue(t) }))
    } else {
      const allEncoded = filters.map((f) => {
        const args = {
          vault: f.vault,
        }
        return encodeEventTopics({
          abi: YieldReceiverABI,
          eventName: 'Rebased' as const,
          args,
        })
      })
      topics = allEncoded[0].map((_, i) => ({
        values: [...new Set(allEncoded.flatMap((row) => encodeTopicValue(row[i])))],
      }))
    }
    const baseTrigger = this.client.logTrigger({
      addresses: [hexToBase64(this.address)],
      topics,
    })
    const contract = this
    return {
      capabilityId: () => baseTrigger.capabilityId(),
      method: () => baseTrigger.method(),
      outputSchema: () => baseTrigger.outputSchema(),
      configAsAny: () => baseTrigger.configAsAny(),
      adapt: (rawOutput: EVMLog): DecodedLog<RebasedDecoded> => contract.decodeRebased(rawOutput),
    }
  }

  /**
   * Decodes a log into Rebased data, preserving all log metadata.
   */
  decodeRebased(log: EVMLog): DecodedLog<RebasedDecoded> {
    const decoded = decodeEventLog({
      abi: YieldReceiverABI,
      data: bytesToHex(log.data),
      topics: log.topics.map((t) => bytesToHex(t)) as [Hex, ...Hex[]],
    })
    const { data: _, ...rest } = log
    return { ...rest, data: decoded.args as unknown as RebasedDecoded }
  }

  /**
   * Creates a log trigger for UnregisteredVault events.
   * The returned trigger's adapt method decodes the raw log into UnregisteredVaultDecoded,
   * so the handler receives typed event data directly.
   * When multiple filters are provided, topic values are merged with OR semantics (match any).
   */
  logTriggerUnregisteredVault(
    filters?: UnregisteredVaultTopics[],
  ) {
    let topics: { values: string[] }[]
    if (!filters || filters.length === 0) {
      const encoded = encodeEventTopics({
        abi: YieldReceiverABI,
        eventName: 'UnregisteredVault' as const,
      })
      topics = encoded.map((t) => ({ values: encodeTopicValue(t) }))
    } else if (filters.length === 1) {
      const f = filters[0]
      const args = {
        vault: f.vault,
      }
      const encoded = encodeEventTopics({
        abi: YieldReceiverABI,
        eventName: 'UnregisteredVault' as const,
        args,
      })
      topics = encoded.map((t) => ({ values: encodeTopicValue(t) }))
    } else {
      const allEncoded = filters.map((f) => {
        const args = {
          vault: f.vault,
        }
        return encodeEventTopics({
          abi: YieldReceiverABI,
          eventName: 'UnregisteredVault' as const,
          args,
        })
      })
      topics = allEncoded[0].map((_, i) => ({
        values: [...new Set(allEncoded.flatMap((row) => encodeTopicValue(row[i])))],
      }))
    }
    const baseTrigger = this.client.logTrigger({
      addresses: [hexToBase64(this.address)],
      topics,
    })
    const contract = this
    return {
      capabilityId: () => baseTrigger.capabilityId(),
      method: () => baseTrigger.method(),
      outputSchema: () => baseTrigger.outputSchema(),
      configAsAny: () => baseTrigger.configAsAny(),
      adapt: (rawOutput: EVMLog): DecodedLog<UnregisteredVaultDecoded> => contract.decodeUnregisteredVault(rawOutput),
    }
  }

  /**
   * Decodes a log into UnregisteredVault data, preserving all log metadata.
   */
  decodeUnregisteredVault(log: EVMLog): DecodedLog<UnregisteredVaultDecoded> {
    const decoded = decodeEventLog({
      abi: YieldReceiverABI,
      data: bytesToHex(log.data),
      topics: log.topics.map((t) => bytesToHex(t)) as [Hex, ...Hex[]],
    })
    const { data: _, ...rest } = log
    return { ...rest, data: decoded.args as unknown as UnregisteredVaultDecoded }
  }

  /**
   * Creates a log trigger for VaultRegistered events.
   * The returned trigger's adapt method decodes the raw log into VaultRegisteredDecoded,
   * so the handler receives typed event data directly.
   * When multiple filters are provided, topic values are merged with OR semantics (match any).
   */
  logTriggerVaultRegistered(
    filters?: VaultRegisteredTopics[],
  ) {
    let topics: { values: string[] }[]
    if (!filters || filters.length === 0) {
      const encoded = encodeEventTopics({
        abi: YieldReceiverABI,
        eventName: 'VaultRegistered' as const,
      })
      topics = encoded.map((t) => ({ values: encodeTopicValue(t) }))
    } else if (filters.length === 1) {
      const f = filters[0]
      const args = {
        vault: f.vault,
      }
      const encoded = encodeEventTopics({
        abi: YieldReceiverABI,
        eventName: 'VaultRegistered' as const,
        args,
      })
      topics = encoded.map((t) => ({ values: encodeTopicValue(t) }))
    } else {
      const allEncoded = filters.map((f) => {
        const args = {
          vault: f.vault,
        }
        return encodeEventTopics({
          abi: YieldReceiverABI,
          eventName: 'VaultRegistered' as const,
          args,
        })
      })
      topics = allEncoded[0].map((_, i) => ({
        values: [...new Set(allEncoded.flatMap((row) => encodeTopicValue(row[i])))],
      }))
    }
    const baseTrigger = this.client.logTrigger({
      addresses: [hexToBase64(this.address)],
      topics,
    })
    const contract = this
    return {
      capabilityId: () => baseTrigger.capabilityId(),
      method: () => baseTrigger.method(),
      outputSchema: () => baseTrigger.outputSchema(),
      configAsAny: () => baseTrigger.configAsAny(),
      adapt: (rawOutput: EVMLog): DecodedLog<VaultRegisteredDecoded> => contract.decodeVaultRegistered(rawOutput),
    }
  }

  /**
   * Decodes a log into VaultRegistered data, preserving all log metadata.
   */
  decodeVaultRegistered(log: EVMLog): DecodedLog<VaultRegisteredDecoded> {
    const decoded = decodeEventLog({
      abi: YieldReceiverABI,
      data: bytesToHex(log.data),
      topics: log.topics.map((t) => bytesToHex(t)) as [Hex, ...Hex[]],
    })
    const { data: _, ...rest } = log
    return { ...rest, data: decoded.args as unknown as VaultRegisteredDecoded }
  }

  /**
   * Creates a log trigger for WorkflowIdSet events.
   * The returned trigger's adapt method decodes the raw log into WorkflowIdSetDecoded,
   * so the handler receives typed event data directly.
   * When multiple filters are provided, topic values are merged with OR semantics (match any).
   */
  logTriggerWorkflowIdSet(
    filters?: WorkflowIdSetTopics[],
  ) {
    let topics: { values: string[] }[]
    if (!filters || filters.length === 0) {
      const encoded = encodeEventTopics({
        abi: YieldReceiverABI,
        eventName: 'WorkflowIdSet' as const,
      })
      topics = encoded.map((t) => ({ values: encodeTopicValue(t) }))
    } else if (filters.length === 1) {
      const f = filters[0]
      const args = {
      }
      const encoded = encodeEventTopics({
        abi: YieldReceiverABI,
        eventName: 'WorkflowIdSet' as const,
        args,
      })
      topics = encoded.map((t) => ({ values: encodeTopicValue(t) }))
    } else {
      const allEncoded = filters.map((f) => {
        const args = {
        }
        return encodeEventTopics({
          abi: YieldReceiverABI,
          eventName: 'WorkflowIdSet' as const,
          args,
        })
      })
      topics = allEncoded[0].map((_, i) => ({
        values: [...new Set(allEncoded.flatMap((row) => encodeTopicValue(row[i])))],
      }))
    }
    const baseTrigger = this.client.logTrigger({
      addresses: [hexToBase64(this.address)],
      topics,
    })
    const contract = this
    return {
      capabilityId: () => baseTrigger.capabilityId(),
      method: () => baseTrigger.method(),
      outputSchema: () => baseTrigger.outputSchema(),
      configAsAny: () => baseTrigger.configAsAny(),
      adapt: (rawOutput: EVMLog): DecodedLog<WorkflowIdSetDecoded> => contract.decodeWorkflowIdSet(rawOutput),
    }
  }

  /**
   * Decodes a log into WorkflowIdSet data, preserving all log metadata.
   */
  decodeWorkflowIdSet(log: EVMLog): DecodedLog<WorkflowIdSetDecoded> {
    const decoded = decodeEventLog({
      abi: YieldReceiverABI,
      data: bytesToHex(log.data),
      topics: log.topics.map((t) => bytesToHex(t)) as [Hex, ...Hex[]],
    })
    const { data: _, ...rest } = log
    return { ...rest, data: decoded.args as unknown as WorkflowIdSetDecoded }
  }
}

