export type DateRangeDto = {
  from: string
  to: string
}

export type MarketSummaryDto = {
  tradeDate: string
  prevVolume: number | null
  currVolume: number | null
  advances: number | null
  declines: number | null
  unchanged: number | null
  fluNo: string | null
}

export type MarketTickerDto = {
  symbol: string
  companyName: string | null
  open: number | null
  high: number | null
  low: number | null
  close: number | null
  turnover: number | null
  change: number | null
  section: string | null
}

export type MarketIndexDto = {
  code: string
  displayName: string | null
  prevClose: number | null
  open: number | null
  high: number | null
  low: number | null
  close: number | null
  volume: number | null
  change: number | null
  changePct: number | null
  asOf: string | null
}

export type MarketIndexSnapshotDto = {
  tradeDate: string
  indices: MarketIndexDto[]
}

export type MarketAiSummaryDto = {
  tradeDate?: string
  summaryType?: string
  modelName?: string | null
  promptVersion?: string
  summary: string
  keyPoints: unknown
  topGainers: unknown
  topLosers: unknown
  volumeLeaders: unknown
  sectorActivity: unknown
  generatedAt?: string | null
}

export type MarketSummaryTickersResponse = {
  tradeDate: string
  summary: MarketSummaryDto
  tickers: MarketTickerDto[]
  aiSummary: MarketAiSummaryDto | null
  indexSnapshot: MarketIndexSnapshotDto | null
}

export type TickerQuoteDto = {
  tradeDate: string
  open: number | null
  high: number | null
  low: number | null
  close: number | null
  turnover: number | null
  change: number | null
  marketCap: number | null
  peRatioTtm: number | null
}

export type TickerTechnicalPointDto = {
  tradeDate: string
  return1dPct: number | null
  return5dPct: number | null
  return20dPct: number | null
  sma20: number | null
  sma50: number | null
  sma200: number | null
  ema12: number | null
  ema26: number | null
  rsi14: number | null
  macd: number | null
  macdSignal: number | null
  macdHistogram: number | null
  atr14: number | null
  bollingerMiddle: number | null
  bollingerUpper: number | null
  bollingerLower: number | null
  volumeSma20: number | null
}

export type TickerTechnicalSeriesDto = {
  priceBasis: string
  calculationVersion: string
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
  keyPeople: unknown
}

export type EquityProfileDto = {
  shares: number | null
  freeFloatShares: number | null
  freeFloatPct: number | null
}

export type FinancialStatementDto = {
  fiscalYear: number
  period: string
  sales: number | null
  profitAfterTax: number | null
  eps: number | null
  lineItems: unknown
  validFrom?: string | null
  validTo?: string | null
  isCurrent?: boolean | null
}

export type FinancialRatioDto = {
  fiscalYear: number
  values: unknown
  validFrom?: string | null
  validTo?: string | null
  isCurrent?: boolean | null
}

export type AnnouncementDto = {
  psxDocumentId: string | null
  announcementDate: string | null
  title: string
  category: string | null
  pdfUrl: string | null
  documents: unknown
}

export type CompanyPayoutDto = {
  announcedAt: string
  periodEnded: string | null
  resultType: string | null
  details: string | null
  bookClosureStart: string | null
  bookClosureEnd: string | null
}

export type FinancialReportDto = {
  reportType: string
  periodEndedRaw: string
  normalizedPeriodEnd: string | null
  fiscalYear: number | null
  postingDate: string | null
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
  equity: EquityProfileDto | null
  financialStatements: FinancialStatementDto[]
  ratios: FinancialRatioDto[]
  technicals: TickerTechnicalSeriesDto
}

export type TickerComparisonResponse = {
  requestedRange: DateRangeDto | null
  items: TickerComparisonItemDto[]
}

export type KiborCurvePointDto = {
  tenor: string
  bid: number | null
  offer: number | null
}

export type KiborObservationDto = {
  quoteDate: string
  tenor: string
  bid: number | null
  offer: number | null
}

export type KiborResponseDto = {
  asOfDate: string | null
  tenorOrder: string[]
  latestCurve: KiborCurvePointDto[]
  points: KiborObservationDto[]
}

export type UsdPkrPointDto = {
  quoteDate: string
  rate: number
  effectiveDate: string | null
}

export type UsdPkrResponseDto = {
  pair: string
  rateType: string
  tenor: string
  label: string
  unit: string
  asOf: UsdPkrPointDto | null
  points: UsdPkrPointDto[]
}
