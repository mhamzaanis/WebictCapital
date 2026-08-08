import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { latestActualObservations } from './marketIndexes'

function response(points: string[]) {
  return {
    code: 'KSEALL', displayName: 'KSE All Share',
    availableRange: { from: '2021-01-01', to: '2026-08-01' },
    requestedRange: { from: '2021-01-01', to: '2026-08-01' },
    appliedRange: { from: '2021-01-01', to: '2026-08-01' },
    asOf: null,
    points: points.map((tradeDate, index) => ({ tradeDate, open: null, high: null, low: null, close: new Decimal(index), volume: BigInt(index), change: null, changePct: null })),
  } as never
}

describe('market index history adapter', () => {
  it('keeps ascending observations and selects the latest 252 actual rows', () => {
    const dates = Array.from({ length: 300 }, (_, index) => `2025-${String(Math.floor(index / 28) + 1).padStart(2, '0')}-${String(index % 28 + 1).padStart(2, '0')}`)
    const selected = latestActualObservations(response(dates))
    expect(selected).toHaveLength(252)
    expect(selected[0].tradeDate).toBe(dates[48])
    expect(selected.at(-1)?.tradeDate).toBe(dates.at(-1))
  })

  it('accepts valid empty ranges and rejects descending backend points', () => {
    expect(latestActualObservations(response([]))).toEqual([])
    expect(() => latestActualObservations(response(['2026-01-02', '2026-01-01']))).toThrow(/ascending/)
  })
})
