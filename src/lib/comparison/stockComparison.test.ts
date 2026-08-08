import { describe, expect, it } from 'vitest'
import {
  BENCHMARK_SERIES_COLORS,
  buildComparisonSearchParams,
  canToggleBenchmark,
} from './stockComparison'

describe('ticker comparison contract', () => {
  it('allows two distinct benchmarks but rejects a third', () => {
    expect(canToggleBenchmark([], 'KSE100')).toBe(true)
    expect(canToggleBenchmark(['KSE100'], 'KSE30')).toBe(true)
    expect(canToggleBenchmark(['KSE100', 'KSE30'], 'KMI30')).toBe(false)
    expect(canToggleBenchmark(['KSE100', 'KSE30'], 'KSE100')).toBe(true)
  })

  it('has two distinct benchmark colors', () => {
    expect(BENCHMARK_SERIES_COLORS).toHaveLength(2)
    expect(new Set(BENCHMARK_SERIES_COLORS).size).toBe(2)
  })

  it('serializes repeated parameters in requested order', () => {
    const params = buildComparisonSearchParams({
      symbols: ['MEBL', 'HBL'],
      benchmarks: ['KSEALL', 'KSE100'],
      from: '2025-01-01',
      to: '2026-01-01',
    })
    expect(params.getAll('symbols')).toEqual(['MEBL', 'HBL'])
    expect(params.getAll('benchmarks')).toEqual(['KSEALL', 'KSE100'])
  })
})
