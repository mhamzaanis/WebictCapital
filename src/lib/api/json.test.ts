import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { decodeHolding, decodeMarketSummaryTickers } from './decoders'
import {
  DtoValidationError,
  expectDate,
  parseLosslessJson,
  stringifyLosslessJson,
} from './json'

describe('lossless JSON boundary', () => {
  it('decodes int64 above 2^53 and exact decimals', () => {
    const holding = decodeHolding(parseLosslessJson(`{
      "securityId":9007199254740993,
      "symbol":"HBL",
      "companyName":null,
      "quantity":9007199254740995,
      "totalCost":123456789012345.678901,
      "averageUnitCost":12.3400,
      "latestPrice":null,
      "latestPriceDate":null,
      "marketValue":null
    }`))
    expect(holding.securityId).toBe(9_007_199_254_740_993n)
    expect(holding.quantity).toBe(9_007_199_254_740_995n)
    expect(holding.totalCost.toString()).toBe('123456789012345.678901')
    expect(holding.averageUnitCost.toString()).toBe('12.34')
  })

  it('serializes bigint and Decimal as unquoted numeric tokens', () => {
    const body = stringifyLosslessJson({ id: 9_007_199_254_740_993n, price: new Decimal('0.100000000000000001') })
    expect(body).toBe('{"id":9007199254740993,"price":0.100000000000000001}')
    expect(body).not.toContain('"9007199254740993"')
  })

  it('rejects missing required keys and wrong nullability', () => {
    expect(() => decodeMarketSummaryTickers(parseLosslessJson('{"tradeDate":"2026-08-01"}'))).toThrow(DtoValidationError)
    expect(() => decodeHolding(parseLosslessJson(`{
      "securityId":1,"symbol":null,"companyName":null,"quantity":1,"totalCost":1,
      "averageUnitCost":1,"latestPrice":null,"latestPriceDate":null,"marketValue":null
    }`))).toThrow(/symbol/)
  })

  it('validates date-only values without timezone conversion', () => {
    expect(expectDate('2026-01-01', 'date')).toBe('2026-01-01')
    expect(() => expectDate('2026-02-30', 'date')).toThrow(/invalid ISO calendar date/)
  })
})
