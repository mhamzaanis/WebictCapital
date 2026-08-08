import type Decimal from 'decimal.js'

declare const brand: unique symbol
export type Branded<T, Name extends string> = T & { readonly [brand]: Name }

export type Uuid = Branded<string, 'Uuid'>
export type IsoDate = Branded<string, 'IsoDate'>
export type IsoInstant = Branded<string, 'IsoInstant'>
export type Int64 = bigint
export type DecimalValue = Decimal

export type JsonValue =
  | null
  | boolean
  | string
  | DecimalValue
  | JsonValue[]
  | { [key: string]: JsonValue }

export type ProblemDetails = {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  errors?: Record<string, string[]>
}

export type DateRangeDto = { from: IsoDate; to: IsoDate }
export type NullableDateRangeDto = { from: IsoDate | null; to: IsoDate | null }

export type MarketSummaryDto = {
  tradeDate: IsoDate
  prevVolume: Int64 | null
  currVolume: Int64 | null
  advances: number | null
  declines: number | null
  unchanged: number | null
  fluNo: string | null
}

export type MarketTickerDto = {
  symbol: string
  companyName: string | null
  open: DecimalValue | null
  high: DecimalValue | null
  low: DecimalValue | null
  close: DecimalValue | null
  turnover: Int64 | null
  change: DecimalValue | null
  section: string | null
}

export type MarketIndexDto = {
  code: string
  displayName: string | null
  prevClose: DecimalValue | null
  open: DecimalValue | null
  high: DecimalValue | null
  low: DecimalValue | null
  close: DecimalValue | null
  volume: Int64 | null
  change: DecimalValue | null
  changePct: DecimalValue | null
  asOf: IsoInstant | null
}

export type MarketIndexSnapshotDto = { tradeDate: IsoDate; indices: MarketIndexDto[] }

export type MarketAiSummaryDto = {
  summary: string
  keyPoints: JsonValue
  topGainers: JsonValue
  topLosers: JsonValue
  volumeLeaders: JsonValue
  sectorActivity: JsonValue
}

export type MarketSummaryTickersResponse = {
  tradeDate: IsoDate
  summary: MarketSummaryDto
  tickers: MarketTickerDto[]
  aiSummary: MarketAiSummaryDto | null
  indexSnapshot: MarketIndexSnapshotDto | null
}

export type TickerQuoteDto = {
  tradeDate: IsoDate
  open: DecimalValue | null
  high: DecimalValue | null
  low: DecimalValue | null
  close: DecimalValue | null
  turnover: Int64 | null
  change: DecimalValue | null
  marketCap: DecimalValue | null
  peRatioTtm: DecimalValue | null
}

export type TickerValuationDto = {
  asOf: IsoDate
  marketCap: DecimalValue | null
  peRatioTtm: DecimalValue | null
}

export type TickerTechnicalPointDto = {
  tradeDate: IsoDate
  return1dPct: DecimalValue | null
  return5dPct: DecimalValue | null
  return20dPct: DecimalValue | null
  sma20: DecimalValue | null
  sma50: DecimalValue | null
  sma200: DecimalValue | null
  ema12: DecimalValue | null
  ema26: DecimalValue | null
  rsi14: DecimalValue | null
  macd: DecimalValue | null
  macdSignal: DecimalValue | null
  macdHistogram: DecimalValue | null
  atr14: DecimalValue | null
  bollingerMiddle: DecimalValue | null
  bollingerUpper: DecimalValue | null
  bollingerLower: DecimalValue | null
  volumeSma20: DecimalValue | null
}

export type TickerTechnicalSeriesDto = {
  priceBasis: 'raw'
  calculationVersion: 'ta_raw_v1'
  asOf: TickerTechnicalPointDto | null
  points: TickerTechnicalPointDto[]
}

export type CompanyProfileDto = {
  sector: string | null
  businessDescription: string | null
  address: string | null
  website: string | null
  registrar: string | null
  auditor: string | null
  fiscalYearEnd: string | null
  keyPeople: JsonValue | null
}

export type EquityProfileDto = {
  shares: Int64 | null
  freeFloatShares: Int64 | null
  freeFloatPct: DecimalValue | null
}

export type FinancialStatementDto = {
  fiscalYear: number
  period: string
  sales: DecimalValue | null
  profitAfterTax: DecimalValue | null
  eps: DecimalValue | null
  lineItems: JsonValue | null
  validFrom?: IsoDate | null
  validTo?: IsoDate | null
  isCurrent?: boolean | null
}

export type FinancialRatioDto = {
  fiscalYear: number
  values: JsonValue
  validFrom?: IsoDate | null
  validTo?: IsoDate | null
  isCurrent?: boolean | null
}

export type LatestAnnualEpsDto = {
  fiscalYear: number
  period: string
  eps: DecimalValue | null
}

export type AnnouncementDto = {
  psxDocumentId: string | null
  announcementDate: IsoDate | null
  title: string
  category: string | null
  pdfUrl: string | null
  documents: JsonValue
}

export type CompanyPayoutDto = {
  announcedAt: IsoInstant
  periodEnded: IsoDate | null
  resultType: string | null
  details: string | null
  bookClosureStart: IsoDate | null
  bookClosureEnd: IsoDate | null
}

export type FinancialReportDto = {
  reportType: string
  periodEndedRaw: string
  normalizedPeriodEnd: IsoDate | null
  fiscalYear: number | null
  postingDate: IsoDate | null
  psxDocumentId: string | null
  url: string | null
}

export type TickerDetailResponse = {
  symbol: string
  companyName: string | null
  availableQuoteRange: DateRangeDto | null
  requestedRange: DateRangeDto | null
  asOfQuote: TickerQuoteDto | null
  quotes: TickerQuoteDto[]
  profile: CompanyProfileDto | null
  equity: EquityProfileDto | null
  valuation: TickerValuationDto | null
  financialStatements: FinancialStatementDto[]
  ratios: FinancialRatioDto[]
  announcements: AnnouncementDto[]
  payouts: CompanyPayoutDto[]
  financialReports: FinancialReportDto[]
  technicals: TickerTechnicalSeriesDto | null
}

export type TickerComparisonItemDto = {
  symbol: string
  companyName: string | null
  availableQuoteRange: DateRangeDto | null
  asOfQuote: TickerQuoteDto | null
  quotes: TickerQuoteDto[]
  profile: CompanyProfileDto | null
  equity: EquityProfileDto | null
  valuation: TickerValuationDto | null
  financialStatements: FinancialStatementDto[]
  latestAnnualEps: LatestAnnualEpsDto | null
  ratios: FinancialRatioDto[]
  technicals: TickerTechnicalSeriesDto | null
}

export type BenchmarkPointDto = {
  tradeDate: IsoDate
  open: DecimalValue | null
  high: DecimalValue | null
  low: DecimalValue | null
  close: DecimalValue | null
  volume: Int64 | null
  change: DecimalValue | null
  changePct: DecimalValue | null
}

export type BenchmarkComparisonItemDto = {
  code: string
  displayName: string | null
  availableRange: DateRangeDto | null
  asOf: BenchmarkPointDto | null
  points: BenchmarkPointDto[]
}

export type TickerComparisonResponse = {
  requestedRange: DateRangeDto | null
  items: TickerComparisonItemDto[]
  benchmarks: BenchmarkComparisonItemDto[]
}

export type MarketIndexHistoryRequestedRangeDto = { from: IsoDate | null; to: IsoDate | null }
export type MarketIndexHistoryResponseDto = {
  code: string
  displayName: string | null
  availableRange: DateRangeDto
  requestedRange: MarketIndexHistoryRequestedRangeDto
  appliedRange: DateRangeDto
  asOf: BenchmarkPointDto | null
  points: BenchmarkPointDto[]
}

export type KiborCurvePointDto = { tenor: string; bid: DecimalValue | null; offer: DecimalValue | null }
export type KiborObservationDto = { quoteDate: IsoDate; tenor: string; bid: DecimalValue | null; offer: DecimalValue | null }
export type KiborResponseDto = {
  asOfDate: IsoDate | null
  tenorOrder: string[]
  latestCurve: KiborCurvePointDto[]
  points: KiborObservationDto[]
}

export type UsdPkrPointDto = { quoteDate: IsoDate; rate: DecimalValue; effectiveDate: IsoDate | null }
export type UsdPkrResponseDto = {
  pair: string
  rateType: string
  tenor: string
  label: string
  unit: string
  asOf: UsdPkrPointDto | null
  points: UsdPkrPointDto[]
}

export type AuthMeResponse = {
  id: Uuid
  email: string | null
  emailVerified: boolean
  displayName: string | null
  avatarUrl: string | null
}

export type CsrfResponse = { headerName: 'X-CSRF-TOKEN'; token: string }

export type NativeTradeRequest = {
  mutationId: Uuid
  symbol: string
  quantity: Int64
  unitPrice: DecimalValue
  tradeDate: IsoDate
  expectedPortfolioVersion: Int64
}

export type LotCorrectionRequest = {
  mutationId: Uuid
  quantity: Int64
  unitCost: DecimalValue
  acquisitionDate: IsoDate
  correctionDate: IsoDate
  expectedLotVersion: Int64
  expectedPortfolioVersion: Int64
  reason: string
}

export type PositionRemovalRequest = {
  mutationId: Uuid
  effectiveDate: IsoDate
  expectedPortfolioVersion: Int64
  reason: string
}

export type PortfolioSummaryResponse = {
  id: Uuid
  name: string
  baseCurrency: string
  status: string
  isDefault: boolean
  version: Int64
  holdingsMarketValue: DecimalValue
  unpricedHoldingCount: number
  createdAt: IsoInstant
  updatedAt: IsoInstant
}

export type PositionLotResponse = {
  id: Uuid
  securityId: Int64
  symbol: string
  quantity: Int64
  unitCost: DecimalValue
  acquisitionDate: IsoDate
  origin: string
  version: Int64
  sourceCreatedAt: IsoInstant | null
  createdAt: IsoInstant
  updatedAt: IsoInstant
}

export type HoldingResponse = {
  securityId: Int64
  symbol: string
  companyName: string | null
  quantity: Int64
  totalCost: DecimalValue
  averageUnitCost: DecimalValue
  latestPrice: DecimalValue | null
  latestPriceDate: IsoDate | null
  marketValue: DecimalValue | null
}

export type PortfolioActivityResponse = {
  id: Uuid
  securityId: Int64
  symbol: string
  activityType: string
  sourceKind: string
  side: string | null
  positionEffect: string
  quantity: Int64
  unitPrice: DecimalValue | null
  tradeDate: IsoDate
  legacySupabaseTradeId: Int64 | null
  sourceCreatedAt: IsoInstant | null
  allocationMethod: string | null
  hasReliableLotAllocation: boolean | null
  createdAt: IsoInstant
  reason: string | null
  beforeQuantity: Int64 | null
  afterQuantity: Int64 | null
  beforeUnitCost: DecimalValue | null
  afterUnitCost: DecimalValue | null
  beforeAcquisitionDate: IsoDate | null
  afterAcquisitionDate: IsoDate | null
  portfolioVersionBefore: Int64 | null
  portfolioVersionAfter: Int64 | null
  lotVersionBefore: Int64 | null
  lotVersionAfter: Int64 | null
}

export type WatchlistItemResponse = {
  securityId: Int64
  symbol: string
  companyName: string | null
  latestPrice: DecimalValue | null
  latestPriceDate: IsoDate | null
  createdAt: IsoInstant
  updatedAt: IsoInstant
}

export type PortfolioMutationResponse = { activityId: Uuid; portfolioVersion: Int64 }
export type LotCorrectionResponse = { activityId: Uuid; portfolioVersion: Int64; lotVersion: Int64 }
