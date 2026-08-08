import { MarketApiError } from '../api/errors'
import { stringifyLosslessJson } from '../api/json'
import type { Uuid } from '../api/types'

export type MutationCommandStatus =
  | 'ready'
  | 'sending'
  | 'unknown_outcome'
  | 'conflict'
  | 'writes_unavailable'
  | 'failed'
  | 'succeeded'

export type MutationCommand<TBody extends { mutationId: Uuid }, TResult> = {
  readonly body: Readonly<TBody>
  readonly serializedBody: string
  readonly status: MutationCommandStatus
  readonly result: TResult | null
  readonly error: unknown
  execute(): Promise<TResult>
  retryUnknownOutcome(): Promise<TResult>
}

export type ReconciliationOutcome =
  | { kind: 'succeeded' }
  | { kind: 'conflict'; error: MarketApiError }
  | { kind: 'writes_unavailable'; error: MarketApiError }
  | { kind: 'unknown_outcome'; error: unknown }
  | { kind: 'failed'; error: unknown }

export async function executeWithReconciliation<TBody extends { mutationId: Uuid }, TResult>(
  command: MutationCommand<TBody, TResult>,
  retry: boolean,
  refresh: () => Promise<unknown>,
): Promise<ReconciliationOutcome> {
  try {
    if (retry) await command.retryUnknownOutcome()
    else await command.execute()
    await refresh()
    return { kind: 'succeeded' }
  } catch (error) {
    if (error instanceof MarketApiError && error.status === 409) {
      try {
        await refresh()
      } catch (refreshError) {
        return { kind: 'failed', error: refreshError }
      }
      return { kind: 'conflict', error }
    }
    if (error instanceof MarketApiError && error.status === 503) return { kind: 'writes_unavailable', error }
    if (error instanceof MarketApiError && error.kind === 'network') return { kind: 'unknown_outcome', error }
    return { kind: 'failed', error }
  }
}

export function createMutationCommand<TBody extends { mutationId: Uuid }, TResult>(
  makeBody: (mutationId: Uuid) => TBody,
  transport: (body: Readonly<TBody>) => Promise<TResult>,
): MutationCommand<TBody, TResult> {
  const mutationId = crypto.randomUUID() as Uuid
  const body = Object.freeze(makeBody(mutationId))
  const serializedBody = stringifyLosslessJson(body)
  let status: MutationCommandStatus = 'ready'
  let result: TResult | null = null
  let error: unknown = null

  async function attempt(): Promise<TResult> {
    status = 'sending'
    error = null
    try {
      result = await transport(body)
      status = 'succeeded'
      return result
    } catch (reason) {
      error = reason
      if (reason instanceof MarketApiError && reason.status === 409) status = 'conflict'
      else if (reason instanceof MarketApiError && reason.status === 503) status = 'writes_unavailable'
      else if (reason instanceof MarketApiError && reason.kind === 'network') status = 'unknown_outcome'
      else status = 'failed'
      throw reason
    }
  }

  return {
    body,
    serializedBody,
    get status() { return status },
    get result() { return result },
    get error() { return error },
    execute() {
      if (status !== 'ready') throw new Error('This mutation command has already been attempted.')
      return attempt()
    },
    retryUnknownOutcome() {
      if (status !== 'unknown_outcome') {
        throw new Error('Only an unknown-outcome mutation can be retried with the same UUID and body.')
      }
      if (stringifyLosslessJson(body) !== serializedBody) {
        throw new Error('The frozen mutation body changed and cannot be retried.')
      }
      return attempt()
    },
  }
}
