import {
  expectArray,
  expectBoolean,
  expectDate,
  expectDecimal,
  expectInstant,
  expectInt32,
  expectInt64,
  expectJsonValue,
  expectNullableBoolean,
  expectNullableDate,
  expectNullableDecimal,
  expectNullableInstant,
  expectNullableInt32,
  expectNullableInt64,
  expectNullableString,
  expectObject,
  expectRequired,
  expectString,
  expectUuid,
  DtoValidationError,
} from './json'
import type {
  AnnouncementDto,
  AuthMeResponse,
  BenchmarkComparisonItemDto,
  BenchmarkPointDto,
  CompanyPayoutDto,
  CompanyProfileDto,
  CsrfResponse,
  DateRangeDto,
  EquityProfileDto,
  FinancialRatioDto,
  FinancialReportDto,
  FinancialStatementDto,
  HoldingResponse,
  KiborCurvePointDto,
  KiborObservationDto,
  KiborResponseDto,
  LatestAnnualEpsDto,
  LotCorrectionResponse,
  MarketAiSummaryDto,
  MarketIndexDto,
  MarketIndexHistoryRequestedRangeDto,
  MarketIndexHistoryResponseDto,
  MarketIndexSnapshotDto,
  MarketSummaryDto,
  MarketSummaryTickersResponse,
  MarketTickerDto,
  PortfolioActivityResponse,
  PortfolioMutationResponse,
  PortfolioSummaryResponse,
  PositionLotResponse,
  ProblemDetails,
  TickerComparisonItemDto,
  TickerComparisonResponse,
  TickerDetailResponse,
  TickerQuoteDto,
  TickerTechnicalPointDto,
  TickerTechnicalSeriesDto,
  TickerValuationDto,
  UsdPkrPointDto,
  UsdPkrResponseDto,
  WatchlistItemResponse,
} from './types'

export type Decoder<T> = (value: unknown, path?: string) => T

function required(object: Record<string, unknown>, key: string, path: string) {
  return expectRequired(object, key, path)
}

function nullableObject<T>(
  value: unknown,
  decoder: (value: unknown, path: string) => T,
  path: string,
): T | null {
  return value === null ? null : decoder(value, path)
}

function optional<T>(
  object: Record<string, unknown>,
  key: string,
  decoder: (value: unknown, path: string) => T,
  path: string,
): T | undefined {
  return Object.prototype.hasOwnProperty.call(object, key)
    ? decoder(object[key], `${path}.${key}`)
    : undefined
}

export function decodeDateRange(value: unknown, path = '$'): DateRangeDto {
  const object = expectObject(value, path)
  return {
    from: expectDate(required(object, 'from', path), `${path}.from`),
    to: expectDate(required(object, 'to', path), `${path}.to`),
  }
}

export function decodeTickerQuote(value: unknown, path = '$'): TickerQuoteDto {
  const object = expectObject(value, path)
  return {
    tradeDate: expectDate(required(object, 'tradeDate', path), `${path}.tradeDate`),
    open: expectNullableDecimal(required(object, 'open', path), `${path}.open`),
    high: expectNullableDecimal(required(object, 'high', path), `${path}.high`),
    low: expectNullableDecimal(required(object, 'low', path), `${path}.low`),
    close: expectNullableDecimal(required(object, 'close', path), `${path}.close`),
    turnover: expectNullableInt64(required(object, 'turnover', path), `${path}.turnover`),
    change: expectNullableDecimal(required(object, 'change', path), `${path}.change`),
    marketCap: expectNullableDecimal(required(object, 'marketCap', path), `${path}.marketCap`),
    peRatioTtm: expectNullableDecimal(required(object, 'peRatioTtm', path), `${path}.peRatioTtm`),
  }
}

export function decodeTickerValuation(value: unknown, path = '$'): TickerValuationDto {
  const object = expectObject(value, path)
  return {
    asOf: expectDate(required(object, 'asOf', path), `${path}.asOf`),
    marketCap: expectNullableDecimal(required(object, 'marketCap', path), `${path}.marketCap`),
    peRatioTtm: expectNullableDecimal(required(object, 'peRatioTtm', path), `${path}.peRatioTtm`),
  }
}

export function decodeTechnicalPoint(value: unknown, path = '$'): TickerTechnicalPointDto {
  const object = expectObject(value, path)
  const decimal = (key: keyof TickerTechnicalPointDto) =>
    expectNullableDecimal(required(object, key, path), `${path}.${key}`)
  return {
    tradeDate: expectDate(required(object, 'tradeDate', path), `${path}.tradeDate`),
    return1dPct: decimal('return1dPct'),
    return5dPct: decimal('return5dPct'),
    return20dPct: decimal('return20dPct'),
    sma20: decimal('sma20'),
    sma50: decimal('sma50'),
    sma200: decimal('sma200'),
    ema12: decimal('ema12'),
    ema26: decimal('ema26'),
    rsi14: decimal('rsi14'),
    macd: decimal('macd'),
    macdSignal: decimal('macdSignal'),
    macdHistogram: decimal('macdHistogram'),
    atr14: decimal('atr14'),
    bollingerMiddle: decimal('bollingerMiddle'),
    bollingerUpper: decimal('bollingerUpper'),
    bollingerLower: decimal('bollingerLower'),
    volumeSma20: decimal('volumeSma20'),
  }
}

export function decodeTechnicalSeries(value: unknown, path = '$'): TickerTechnicalSeriesDto {
  const object = expectObject(value, path)
  const priceBasis = expectString(required(object, 'priceBasis', path), `${path}.priceBasis`)
  const calculationVersion = expectString(
    required(object, 'calculationVersion', path),
    `${path}.calculationVersion`,
  )
  if (priceBasis !== 'raw') throw new DtoValidationError('expected literal "raw"', `${path}.priceBasis`)
  if (calculationVersion !== 'ta_raw_v1') {
    throw new DtoValidationError('expected literal "ta_raw_v1"', `${path}.calculationVersion`)
  }
  return {
    priceBasis,
    calculationVersion,
    asOf: nullableObject(required(object, 'asOf', path), decodeTechnicalPoint, `${path}.asOf`),
    points: expectArray(required(object, 'points', path), decodeTechnicalPoint, `${path}.points`),
  }
}

function decodeCompanyProfile(value: unknown, path: string): CompanyProfileDto {
  const object = expectObject(value, path)
  return {
    sector: expectNullableString(required(object, 'sector', path), `${path}.sector`),
    businessDescription: expectNullableString(required(object, 'businessDescription', path), `${path}.businessDescription`),
    address: expectNullableString(required(object, 'address', path), `${path}.address`),
    website: expectNullableString(required(object, 'website', path), `${path}.website`),
    registrar: expectNullableString(required(object, 'registrar', path), `${path}.registrar`),
    auditor: expectNullableString(required(object, 'auditor', path), `${path}.auditor`),
    fiscalYearEnd: expectNullableString(required(object, 'fiscalYearEnd', path), `${path}.fiscalYearEnd`),
    keyPeople: required(object, 'keyPeople', path) === null
      ? null
      : expectJsonValue(object.keyPeople, `${path}.keyPeople`),
  }
}

function decodeEquity(value: unknown, path: string): EquityProfileDto {
  const object = expectObject(value, path)
  return {
    shares: expectNullableInt64(required(object, 'shares', path), `${path}.shares`),
    freeFloatShares: expectNullableInt64(required(object, 'freeFloatShares', path), `${path}.freeFloatShares`),
    freeFloatPct: expectNullableDecimal(required(object, 'freeFloatPct', path), `${path}.freeFloatPct`),
  }
}

function decodeFinancialStatement(value: unknown, path: string): FinancialStatementDto {
  const object = expectObject(value, path)
  return {
    fiscalYear: expectInt32(required(object, 'fiscalYear', path), `${path}.fiscalYear`),
    period: expectString(required(object, 'period', path), `${path}.period`),
    sales: expectNullableDecimal(required(object, 'sales', path), `${path}.sales`),
    profitAfterTax: expectNullableDecimal(required(object, 'profitAfterTax', path), `${path}.profitAfterTax`),
    eps: expectNullableDecimal(required(object, 'eps', path), `${path}.eps`),
    lineItems: required(object, 'lineItems', path) === null
      ? null
      : expectJsonValue(object.lineItems, `${path}.lineItems`),
    validFrom: optional(object, 'validFrom', expectNullableDate, path),
    validTo: optional(object, 'validTo', expectNullableDate, path),
    isCurrent: optional(object, 'isCurrent', expectNullableBoolean, path),
  }
}

function decodeFinancialRatio(value: unknown, path: string): FinancialRatioDto {
  const object = expectObject(value, path)
  return {
    fiscalYear: expectInt32(required(object, 'fiscalYear', path), `${path}.fiscalYear`),
    values: expectJsonValue(required(object, 'values', path), `${path}.values`),
    validFrom: optional(object, 'validFrom', expectNullableDate, path),
    validTo: optional(object, 'validTo', expectNullableDate, path),
    isCurrent: optional(object, 'isCurrent', expectNullableBoolean, path),
  }
}

function decodeLatestAnnualEps(value: unknown, path: string): LatestAnnualEpsDto {
  const object = expectObject(value, path)
  return {
    fiscalYear: expectInt32(required(object, 'fiscalYear', path), `${path}.fiscalYear`),
    period: expectString(required(object, 'period', path), `${path}.period`),
    eps: expectNullableDecimal(required(object, 'eps', path), `${path}.eps`),
  }
}

function decodeAnnouncement(value: unknown, path: string): AnnouncementDto {
  const object = expectObject(value, path)
  return {
    psxDocumentId: expectNullableString(required(object, 'psxDocumentId', path), `${path}.psxDocumentId`),
    announcementDate: expectNullableDate(required(object, 'announcementDate', path), `${path}.announcementDate`),
    title: expectString(required(object, 'title', path), `${path}.title`),
    category: expectNullableString(required(object, 'category', path), `${path}.category`),
    pdfUrl: expectNullableString(required(object, 'pdfUrl', path), `${path}.pdfUrl`),
    documents: expectJsonValue(required(object, 'documents', path), `${path}.documents`),
  }
}

function decodePayout(value: unknown, path: string): CompanyPayoutDto {
  const object = expectObject(value, path)
  return {
    announcedAt: expectInstant(required(object, 'announcedAt', path), `${path}.announcedAt`),
    periodEnded: expectNullableDate(required(object, 'periodEnded', path), `${path}.periodEnded`),
    resultType: expectNullableString(required(object, 'resultType', path), `${path}.resultType`),
    details: expectNullableString(required(object, 'details', path), `${path}.details`),
    bookClosureStart: expectNullableDate(required(object, 'bookClosureStart', path), `${path}.bookClosureStart`),
    bookClosureEnd: expectNullableDate(required(object, 'bookClosureEnd', path), `${path}.bookClosureEnd`),
  }
}

function decodeFinancialReport(value: unknown, path: string): FinancialReportDto {
  const object = expectObject(value, path)
  return {
    reportType: expectString(required(object, 'reportType', path), `${path}.reportType`),
    periodEndedRaw: expectString(required(object, 'periodEndedRaw', path), `${path}.periodEndedRaw`),
    normalizedPeriodEnd: expectNullableDate(required(object, 'normalizedPeriodEnd', path), `${path}.normalizedPeriodEnd`),
    fiscalYear: expectNullableInt32(required(object, 'fiscalYear', path), `${path}.fiscalYear`),
    postingDate: expectNullableDate(required(object, 'postingDate', path), `${path}.postingDate`),
    psxDocumentId: expectNullableString(required(object, 'psxDocumentId', path), `${path}.psxDocumentId`),
    url: expectNullableString(required(object, 'url', path), `${path}.url`),
  }
}

export function decodeTickerDetail(value: unknown, path = '$'): TickerDetailResponse {
  const object = expectObject(value, path)
  return {
    symbol: expectString(required(object, 'symbol', path), `${path}.symbol`),
    companyName: expectNullableString(required(object, 'companyName', path), `${path}.companyName`),
    availableQuoteRange: nullableObject(required(object, 'availableQuoteRange', path), decodeDateRange, `${path}.availableQuoteRange`),
    requestedRange: nullableObject(required(object, 'requestedRange', path), decodeDateRange, `${path}.requestedRange`),
    asOfQuote: nullableObject(required(object, 'asOfQuote', path), decodeTickerQuote, `${path}.asOfQuote`),
    quotes: expectArray(required(object, 'quotes', path), decodeTickerQuote, `${path}.quotes`),
    profile: nullableObject(required(object, 'profile', path), decodeCompanyProfile, `${path}.profile`),
    equity: nullableObject(required(object, 'equity', path), decodeEquity, `${path}.equity`),
    valuation: nullableObject(required(object, 'valuation', path), decodeTickerValuation, `${path}.valuation`),
    financialStatements: expectArray(required(object, 'financialStatements', path), decodeFinancialStatement, `${path}.financialStatements`),
    ratios: expectArray(required(object, 'ratios', path), decodeFinancialRatio, `${path}.ratios`),
    announcements: expectArray(required(object, 'announcements', path), decodeAnnouncement, `${path}.announcements`),
    payouts: expectArray(required(object, 'payouts', path), decodePayout, `${path}.payouts`),
    financialReports: expectArray(required(object, 'financialReports', path), decodeFinancialReport, `${path}.financialReports`),
    technicals: nullableObject(required(object, 'technicals', path), decodeTechnicalSeries, `${path}.technicals`),
  }
}

export function decodeBenchmarkPoint(value: unknown, path = '$'): BenchmarkPointDto {
  const object = expectObject(value, path)
  return {
    tradeDate: expectDate(required(object, 'tradeDate', path), `${path}.tradeDate`),
    open: expectNullableDecimal(required(object, 'open', path), `${path}.open`),
    high: expectNullableDecimal(required(object, 'high', path), `${path}.high`),
    low: expectNullableDecimal(required(object, 'low', path), `${path}.low`),
    close: expectNullableDecimal(required(object, 'close', path), `${path}.close`),
    volume: expectNullableInt64(required(object, 'volume', path), `${path}.volume`),
    change: expectNullableDecimal(required(object, 'change', path), `${path}.change`),
    changePct: expectNullableDecimal(required(object, 'changePct', path), `${path}.changePct`),
  }
}

function decodeComparisonItem(value: unknown, path: string): TickerComparisonItemDto {
  const object = expectObject(value, path)
  return {
    symbol: expectString(required(object, 'symbol', path), `${path}.symbol`),
    companyName: expectNullableString(required(object, 'companyName', path), `${path}.companyName`),
    availableQuoteRange: nullableObject(required(object, 'availableQuoteRange', path), decodeDateRange, `${path}.availableQuoteRange`),
    asOfQuote: nullableObject(required(object, 'asOfQuote', path), decodeTickerQuote, `${path}.asOfQuote`),
    quotes: expectArray(required(object, 'quotes', path), decodeTickerQuote, `${path}.quotes`),
    profile: nullableObject(required(object, 'profile', path), decodeCompanyProfile, `${path}.profile`),
    equity: nullableObject(required(object, 'equity', path), decodeEquity, `${path}.equity`),
    valuation: nullableObject(required(object, 'valuation', path), decodeTickerValuation, `${path}.valuation`),
    financialStatements: expectArray(required(object, 'financialStatements', path), decodeFinancialStatement, `${path}.financialStatements`),
    latestAnnualEps: nullableObject(required(object, 'latestAnnualEps', path), decodeLatestAnnualEps, `${path}.latestAnnualEps`),
    ratios: expectArray(required(object, 'ratios', path), decodeFinancialRatio, `${path}.ratios`),
    technicals: nullableObject(required(object, 'technicals', path), decodeTechnicalSeries, `${path}.technicals`),
  }
}

function decodeBenchmark(value: unknown, path: string): BenchmarkComparisonItemDto {
  const object = expectObject(value, path)
  return {
    code: expectString(required(object, 'code', path), `${path}.code`),
    displayName: expectNullableString(required(object, 'displayName', path), `${path}.displayName`),
    availableRange: nullableObject(required(object, 'availableRange', path), decodeDateRange, `${path}.availableRange`),
    asOf: nullableObject(required(object, 'asOf', path), decodeBenchmarkPoint, `${path}.asOf`),
    points: expectArray(required(object, 'points', path), decodeBenchmarkPoint, `${path}.points`),
  }
}

export function decodeTickerComparison(value: unknown, path = '$'): TickerComparisonResponse {
  const object = expectObject(value, path)
  return {
    requestedRange: nullableObject(required(object, 'requestedRange', path), decodeDateRange, `${path}.requestedRange`),
    items: expectArray(required(object, 'items', path), decodeComparisonItem, `${path}.items`),
    benchmarks: expectArray(required(object, 'benchmarks', path), decodeBenchmark, `${path}.benchmarks`),
  }
}

function decodeMarketSummary(value: unknown, path: string): MarketSummaryDto {
  const object = expectObject(value, path)
  return {
    tradeDate: expectDate(required(object, 'tradeDate', path), `${path}.tradeDate`),
    prevVolume: expectNullableInt64(required(object, 'prevVolume', path), `${path}.prevVolume`),
    currVolume: expectNullableInt64(required(object, 'currVolume', path), `${path}.currVolume`),
    advances: expectNullableInt32(required(object, 'advances', path), `${path}.advances`),
    declines: expectNullableInt32(required(object, 'declines', path), `${path}.declines`),
    unchanged: expectNullableInt32(required(object, 'unchanged', path), `${path}.unchanged`),
    fluNo: expectNullableString(required(object, 'fluNo', path), `${path}.fluNo`),
  }
}

function decodeMarketTicker(value: unknown, path: string): MarketTickerDto {
  const object = expectObject(value, path)
  return {
    symbol: expectString(required(object, 'symbol', path), `${path}.symbol`),
    companyName: expectNullableString(required(object, 'companyName', path), `${path}.companyName`),
    open: expectNullableDecimal(required(object, 'open', path), `${path}.open`),
    high: expectNullableDecimal(required(object, 'high', path), `${path}.high`),
    low: expectNullableDecimal(required(object, 'low', path), `${path}.low`),
    close: expectNullableDecimal(required(object, 'close', path), `${path}.close`),
    turnover: expectNullableInt64(required(object, 'turnover', path), `${path}.turnover`),
    change: expectNullableDecimal(required(object, 'change', path), `${path}.change`),
    section: expectNullableString(required(object, 'section', path), `${path}.section`),
  }
}

function decodeMarketIndex(value: unknown, path: string): MarketIndexDto {
  const object = expectObject(value, path)
  return {
    code: expectString(required(object, 'code', path), `${path}.code`),
    displayName: expectNullableString(required(object, 'displayName', path), `${path}.displayName`),
    prevClose: expectNullableDecimal(required(object, 'prevClose', path), `${path}.prevClose`),
    open: expectNullableDecimal(required(object, 'open', path), `${path}.open`),
    high: expectNullableDecimal(required(object, 'high', path), `${path}.high`),
    low: expectNullableDecimal(required(object, 'low', path), `${path}.low`),
    close: expectNullableDecimal(required(object, 'close', path), `${path}.close`),
    volume: expectNullableInt64(required(object, 'volume', path), `${path}.volume`),
    change: expectNullableDecimal(required(object, 'change', path), `${path}.change`),
    changePct: expectNullableDecimal(required(object, 'changePct', path), `${path}.changePct`),
    asOf: expectNullableInstant(required(object, 'asOf', path), `${path}.asOf`),
  }
}

function decodeIndexSnapshot(value: unknown, path: string): MarketIndexSnapshotDto {
  const object = expectObject(value, path)
  return {
    tradeDate: expectDate(required(object, 'tradeDate', path), `${path}.tradeDate`),
    indices: expectArray(required(object, 'indices', path), decodeMarketIndex, `${path}.indices`),
  }
}

function decodeAiSummary(value: unknown, path: string): MarketAiSummaryDto {
  const object = expectObject(value, path)
  return {
    summary: expectString(required(object, 'summary', path), `${path}.summary`),
    keyPoints: expectJsonValue(required(object, 'keyPoints', path), `${path}.keyPoints`),
    topGainers: expectJsonValue(required(object, 'topGainers', path), `${path}.topGainers`),
    topLosers: expectJsonValue(required(object, 'topLosers', path), `${path}.topLosers`),
    volumeLeaders: expectJsonValue(required(object, 'volumeLeaders', path), `${path}.volumeLeaders`),
    sectorActivity: expectJsonValue(required(object, 'sectorActivity', path), `${path}.sectorActivity`),
  }
}

export function decodeMarketSummaryTickers(value: unknown, path = '$'): MarketSummaryTickersResponse {
  const object = expectObject(value, path)
  return {
    tradeDate: expectDate(required(object, 'tradeDate', path), `${path}.tradeDate`),
    summary: decodeMarketSummary(required(object, 'summary', path), `${path}.summary`),
    tickers: expectArray(required(object, 'tickers', path), decodeMarketTicker, `${path}.tickers`),
    aiSummary: nullableObject(required(object, 'aiSummary', path), decodeAiSummary, `${path}.aiSummary`),
    indexSnapshot: nullableObject(required(object, 'indexSnapshot', path), decodeIndexSnapshot, `${path}.indexSnapshot`),
  }
}

export function decodeMarketIndexHistory(value: unknown, path = '$'): MarketIndexHistoryResponseDto {
  const object = expectObject(value, path)
  const requestedPath = `${path}.requestedRange`
  const requested = expectObject(required(object, 'requestedRange', path), requestedPath)
  const requestedRange: MarketIndexHistoryRequestedRangeDto = {
    from: expectNullableDate(required(requested, 'from', requestedPath), `${requestedPath}.from`),
    to: expectNullableDate(required(requested, 'to', requestedPath), `${requestedPath}.to`),
  }
  return {
    code: expectString(required(object, 'code', path), `${path}.code`),
    displayName: expectNullableString(required(object, 'displayName', path), `${path}.displayName`),
    availableRange: decodeDateRange(required(object, 'availableRange', path), `${path}.availableRange`),
    requestedRange,
    appliedRange: decodeDateRange(required(object, 'appliedRange', path), `${path}.appliedRange`),
    asOf: nullableObject(required(object, 'asOf', path), decodeBenchmarkPoint, `${path}.asOf`),
    points: expectArray(required(object, 'points', path), decodeBenchmarkPoint, `${path}.points`),
  }
}

function decodeKiborCurvePoint(value: unknown, path: string): KiborCurvePointDto {
  const object = expectObject(value, path)
  return {
    tenor: expectString(required(object, 'tenor', path), `${path}.tenor`),
    bid: expectNullableDecimal(required(object, 'bid', path), `${path}.bid`),
    offer: expectNullableDecimal(required(object, 'offer', path), `${path}.offer`),
  }
}

function decodeKiborObservation(value: unknown, path: string): KiborObservationDto {
  const object = expectObject(value, path)
  return {
    quoteDate: expectDate(required(object, 'quoteDate', path), `${path}.quoteDate`),
    tenor: expectString(required(object, 'tenor', path), `${path}.tenor`),
    bid: expectNullableDecimal(required(object, 'bid', path), `${path}.bid`),
    offer: expectNullableDecimal(required(object, 'offer', path), `${path}.offer`),
  }
}

export function decodeKiborResponse(value: unknown, path = '$'): KiborResponseDto {
  const object = expectObject(value, path)
  return {
    asOfDate: expectNullableDate(required(object, 'asOfDate', path), `${path}.asOfDate`),
    tenorOrder: expectArray(required(object, 'tenorOrder', path), expectString, `${path}.tenorOrder`),
    latestCurve: expectArray(required(object, 'latestCurve', path), decodeKiborCurvePoint, `${path}.latestCurve`),
    points: expectArray(required(object, 'points', path), decodeKiborObservation, `${path}.points`),
  }
}

function decodeUsdPkrPoint(value: unknown, path: string): UsdPkrPointDto {
  const object = expectObject(value, path)
  return {
    quoteDate: expectDate(required(object, 'quoteDate', path), `${path}.quoteDate`),
    rate: expectDecimal(required(object, 'rate', path), `${path}.rate`),
    effectiveDate: expectNullableDate(required(object, 'effectiveDate', path), `${path}.effectiveDate`),
  }
}

export function decodeUsdPkrResponse(value: unknown, path = '$'): UsdPkrResponseDto {
  const object = expectObject(value, path)
  return {
    pair: expectString(required(object, 'pair', path), `${path}.pair`),
    rateType: expectString(required(object, 'rateType', path), `${path}.rateType`),
    tenor: expectString(required(object, 'tenor', path), `${path}.tenor`),
    label: expectString(required(object, 'label', path), `${path}.label`),
    unit: expectString(required(object, 'unit', path), `${path}.unit`),
    asOf: nullableObject(required(object, 'asOf', path), decodeUsdPkrPoint, `${path}.asOf`),
    points: expectArray(required(object, 'points', path), decodeUsdPkrPoint, `${path}.points`),
  }
}

export function decodeAuthMe(value: unknown, path = '$'): AuthMeResponse {
  const object = expectObject(value, path)
  return {
    id: expectUuid(required(object, 'id', path), `${path}.id`),
    email: expectNullableString(required(object, 'email', path), `${path}.email`),
    emailVerified: expectBoolean(required(object, 'emailVerified', path), `${path}.emailVerified`),
    displayName: expectNullableString(required(object, 'displayName', path), `${path}.displayName`),
    avatarUrl: expectNullableString(required(object, 'avatarUrl', path), `${path}.avatarUrl`),
  }
}

export function decodeCsrf(value: unknown, path = '$'): CsrfResponse {
  const object = expectObject(value, path)
  const headerName = expectString(required(object, 'headerName', path), `${path}.headerName`)
  if (headerName !== 'X-CSRF-TOKEN') {
    throw new DtoValidationError('expected literal "X-CSRF-TOKEN"', `${path}.headerName`)
  }
  return {
    headerName,
    token: expectString(required(object, 'token', path), `${path}.token`),
  }
}

export function decodePortfolioSummary(value: unknown, path = '$'): PortfolioSummaryResponse {
  const object = expectObject(value, path)
  return {
    id: expectUuid(required(object, 'id', path), `${path}.id`),
    name: expectString(required(object, 'name', path), `${path}.name`),
    baseCurrency: expectString(required(object, 'baseCurrency', path), `${path}.baseCurrency`),
    status: expectString(required(object, 'status', path), `${path}.status`),
    isDefault: expectBoolean(required(object, 'isDefault', path), `${path}.isDefault`),
    version: expectInt64(required(object, 'version', path), `${path}.version`),
    holdingsMarketValue: expectDecimal(required(object, 'holdingsMarketValue', path), `${path}.holdingsMarketValue`),
    unpricedHoldingCount: expectInt32(required(object, 'unpricedHoldingCount', path), `${path}.unpricedHoldingCount`),
    createdAt: expectInstant(required(object, 'createdAt', path), `${path}.createdAt`),
    updatedAt: expectInstant(required(object, 'updatedAt', path), `${path}.updatedAt`),
  }
}

export function decodePositionLot(value: unknown, path = '$'): PositionLotResponse {
  const object = expectObject(value, path)
  return {
    id: expectUuid(required(object, 'id', path), `${path}.id`),
    securityId: expectInt64(required(object, 'securityId', path), `${path}.securityId`),
    symbol: expectString(required(object, 'symbol', path), `${path}.symbol`),
    quantity: expectInt64(required(object, 'quantity', path), `${path}.quantity`),
    unitCost: expectDecimal(required(object, 'unitCost', path), `${path}.unitCost`),
    acquisitionDate: expectDate(required(object, 'acquisitionDate', path), `${path}.acquisitionDate`),
    origin: expectString(required(object, 'origin', path), `${path}.origin`),
    version: expectInt64(required(object, 'version', path), `${path}.version`),
    sourceCreatedAt: expectNullableInstant(required(object, 'sourceCreatedAt', path), `${path}.sourceCreatedAt`),
    createdAt: expectInstant(required(object, 'createdAt', path), `${path}.createdAt`),
    updatedAt: expectInstant(required(object, 'updatedAt', path), `${path}.updatedAt`),
  }
}

export function decodeHolding(value: unknown, path = '$'): HoldingResponse {
  const object = expectObject(value, path)
  return {
    securityId: expectInt64(required(object, 'securityId', path), `${path}.securityId`),
    symbol: expectString(required(object, 'symbol', path), `${path}.symbol`),
    companyName: expectNullableString(required(object, 'companyName', path), `${path}.companyName`),
    quantity: expectInt64(required(object, 'quantity', path), `${path}.quantity`),
    totalCost: expectDecimal(required(object, 'totalCost', path), `${path}.totalCost`),
    averageUnitCost: expectDecimal(required(object, 'averageUnitCost', path), `${path}.averageUnitCost`),
    latestPrice: expectNullableDecimal(required(object, 'latestPrice', path), `${path}.latestPrice`),
    latestPriceDate: expectNullableDate(required(object, 'latestPriceDate', path), `${path}.latestPriceDate`),
    marketValue: expectNullableDecimal(required(object, 'marketValue', path), `${path}.marketValue`),
  }
}

export function decodePortfolioActivity(value: unknown, path = '$'): PortfolioActivityResponse {
  const object = expectObject(value, path)
  return {
    id: expectUuid(required(object, 'id', path), `${path}.id`),
    securityId: expectInt64(required(object, 'securityId', path), `${path}.securityId`),
    symbol: expectString(required(object, 'symbol', path), `${path}.symbol`),
    activityType: expectString(required(object, 'activityType', path), `${path}.activityType`),
    sourceKind: expectString(required(object, 'sourceKind', path), `${path}.sourceKind`),
    side: expectNullableString(required(object, 'side', path), `${path}.side`),
    positionEffect: expectString(required(object, 'positionEffect', path), `${path}.positionEffect`),
    quantity: expectInt64(required(object, 'quantity', path), `${path}.quantity`),
    unitPrice: expectNullableDecimal(required(object, 'unitPrice', path), `${path}.unitPrice`),
    tradeDate: expectDate(required(object, 'tradeDate', path), `${path}.tradeDate`),
    legacySupabaseTradeId: expectNullableInt64(required(object, 'legacySupabaseTradeId', path), `${path}.legacySupabaseTradeId`),
    sourceCreatedAt: expectNullableInstant(required(object, 'sourceCreatedAt', path), `${path}.sourceCreatedAt`),
    allocationMethod: expectNullableString(required(object, 'allocationMethod', path), `${path}.allocationMethod`),
    hasReliableLotAllocation: expectNullableBoolean(required(object, 'hasReliableLotAllocation', path), `${path}.hasReliableLotAllocation`),
    createdAt: expectInstant(required(object, 'createdAt', path), `${path}.createdAt`),
    reason: expectNullableString(required(object, 'reason', path), `${path}.reason`),
    beforeQuantity: expectNullableInt64(required(object, 'beforeQuantity', path), `${path}.beforeQuantity`),
    afterQuantity: expectNullableInt64(required(object, 'afterQuantity', path), `${path}.afterQuantity`),
    beforeUnitCost: expectNullableDecimal(required(object, 'beforeUnitCost', path), `${path}.beforeUnitCost`),
    afterUnitCost: expectNullableDecimal(required(object, 'afterUnitCost', path), `${path}.afterUnitCost`),
    beforeAcquisitionDate: expectNullableDate(required(object, 'beforeAcquisitionDate', path), `${path}.beforeAcquisitionDate`),
    afterAcquisitionDate: expectNullableDate(required(object, 'afterAcquisitionDate', path), `${path}.afterAcquisitionDate`),
    portfolioVersionBefore: expectNullableInt64(required(object, 'portfolioVersionBefore', path), `${path}.portfolioVersionBefore`),
    portfolioVersionAfter: expectNullableInt64(required(object, 'portfolioVersionAfter', path), `${path}.portfolioVersionAfter`),
    lotVersionBefore: expectNullableInt64(required(object, 'lotVersionBefore', path), `${path}.lotVersionBefore`),
    lotVersionAfter: expectNullableInt64(required(object, 'lotVersionAfter', path), `${path}.lotVersionAfter`),
  }
}

export function decodeWatchlistItem(value: unknown, path = '$'): WatchlistItemResponse {
  const object = expectObject(value, path)
  return {
    securityId: expectInt64(required(object, 'securityId', path), `${path}.securityId`),
    symbol: expectString(required(object, 'symbol', path), `${path}.symbol`),
    companyName: expectNullableString(required(object, 'companyName', path), `${path}.companyName`),
    latestPrice: expectNullableDecimal(required(object, 'latestPrice', path), `${path}.latestPrice`),
    latestPriceDate: expectNullableDate(required(object, 'latestPriceDate', path), `${path}.latestPriceDate`),
    createdAt: expectInstant(required(object, 'createdAt', path), `${path}.createdAt`),
    updatedAt: expectInstant(required(object, 'updatedAt', path), `${path}.updatedAt`),
  }
}

export function decodePortfolioMutation(value: unknown, path = '$'): PortfolioMutationResponse {
  const object = expectObject(value, path)
  return {
    activityId: expectUuid(required(object, 'activityId', path), `${path}.activityId`),
    portfolioVersion: expectInt64(required(object, 'portfolioVersion', path), `${path}.portfolioVersion`),
  }
}

export function decodeLotCorrection(value: unknown, path = '$'): LotCorrectionResponse {
  const object = expectObject(value, path)
  return {
    activityId: expectUuid(required(object, 'activityId', path), `${path}.activityId`),
    portfolioVersion: expectInt64(required(object, 'portfolioVersion', path), `${path}.portfolioVersion`),
    lotVersion: expectInt64(required(object, 'lotVersion', path), `${path}.lotVersion`),
  }
}

export function decodeProblemDetails(value: unknown, path = '$'): ProblemDetails {
  const object = expectObject(value, path)
  const result: ProblemDetails = {}
  if ('type' in object) result.type = expectString(object.type, `${path}.type`)
  if ('title' in object) result.title = expectString(object.title, `${path}.title`)
  if ('status' in object) result.status = expectInt32(object.status, `${path}.status`)
  if ('detail' in object) result.detail = expectString(object.detail, `${path}.detail`)
  if ('instance' in object) result.instance = expectString(object.instance, `${path}.instance`)
  if ('errors' in object) {
    const errors = expectObject(object.errors, `${path}.errors`)
    result.errors = Object.fromEntries(
      Object.entries(errors).map(([key, messages]) => [
        key,
        expectArray(messages, expectString, `${path}.errors.${key}`),
      ]),
    )
  }
  return result
}

export const decodePositionLots = (value: unknown, path = '$') =>
  expectArray(value, decodePositionLot, path)
export const decodeHoldings = (value: unknown, path = '$') =>
  expectArray(value, decodeHolding, path)
export const decodePortfolioActivities = (value: unknown, path = '$') =>
  expectArray(value, decodePortfolioActivity, path)
export const decodeWatchlist = (value: unknown, path = '$') =>
  expectArray(value, decodeWatchlistItem, path)
