import Decimal from 'decimal.js'
import { describe, expect, it, vi } from 'vitest'
import { MarketApiError } from '../api/errors'
import type { NativeTradeRequest, Uuid } from '../api/types'
import { createMutationCommand, executeWithReconciliation } from './mutationCommand'

describe('mutation command', () => {
  it('retains one UUID and the exact frozen body across an unknown-outcome retry', async () => {
    const bodies: Readonly<NativeTradeRequest>[] = []
    const transport = vi.fn(async (body: Readonly<NativeTradeRequest>) => {
      bodies.push(body)
      if (bodies.length === 1) throw new MarketApiError({ kind: 'network', status: null, message: 'lost response' })
      return { ok: true }
    })
    const command = createMutationCommand<NativeTradeRequest, { ok: boolean }>(
      (mutationId: Uuid) => ({ mutationId, symbol: 'HBL', quantity: 9_007_199_254_740_993n, unitPrice: new Decimal('12.345678'), tradeDate: '2026-08-01' as never, expectedPortfolioVersion: 7n }),
      transport,
    )
    await expect(command.execute()).rejects.toThrow('lost response')
    await expect(command.retryUnknownOutcome()).resolves.toEqual({ ok: true })
    expect(bodies[0]).toBe(bodies[1])
    expect(bodies[0].mutationId).toBe(bodies[1].mutationId)
    expect(command.serializedBody).toContain('"quantity":9007199254740993')
  })

  it('does not permit automatic retry after a conflict', async () => {
    const command = createMutationCommand(
      (mutationId) => ({ mutationId }),
      async () => { throw new MarketApiError({ kind: 'conflict', status: 409, message: 'stale' }) },
    )
    await expect(command.execute()).rejects.toThrow('stale')
    expect(() => command.retryUnknownOutcome()).toThrow(/Only an unknown-outcome/)
  })

  it('refreshes all portfolio state before reporting a 409 reconciliation', async () => {
    const refresh = vi.fn(async () => undefined)
    const command = createMutationCommand(
      (mutationId) => ({ mutationId }),
      async () => { throw new MarketApiError({ kind: 'conflict', status: 409, message: 'stale' }) },
    )
    await expect(executeWithReconciliation(command, false, refresh)).resolves.toMatchObject({ kind: 'conflict' })
    expect(refresh).toHaveBeenCalledOnce()
  })

  it('reports 503 without hiding or refreshing authenticated read state', async () => {
    const refresh = vi.fn(async () => undefined)
    const command = createMutationCommand(
      (mutationId) => ({ mutationId }),
      async () => { throw new MarketApiError({ kind: 'writes_unavailable', status: 503, message: 'gate closed' }) },
    )
    await expect(executeWithReconciliation(command, false, refresh)).resolves.toMatchObject({ kind: 'writes_unavailable' })
    expect(refresh).not.toHaveBeenCalled()
  })
})
