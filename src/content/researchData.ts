export type ResearchRow = {
  label: string
  value: string
  context: string
}

export type ResearchScenario = {
  item: string
  operatingBase: string
  scenarioA: string
  scenarioB: string
}

export type ResearchValuation = {
  scenario: string
  eps: string
  pe: string
  fairValue12x: string
  fairValue14x: string
}

export type ResearchNote = {
  id: string
  company: string
  ticker: string
  date: string
  title: string
  subtitle: string
  summary: string
  tags: string[]
  overview: string[]
  operatingMetrics: ResearchRow[]
  investmentThesis: string[]
  investmentIncome: ResearchRow[]
  earningsScenarios: ResearchScenario[]
  valuations: ResearchValuation[]
  watchItems: string[]
  disclaimer: string
}

export const researchNotes: ResearchNote[] = [
  {
    id: 'zal-fy2026-annual-earnings-preview',
    company: 'Zarea Limited',
    ticker: 'PSX: ZAL',
    date: '18 September 2026',
    title: 'FY2026 Annual Earnings Preview',
    subtitle: 'Pre-results note | Balance sheet date: 30 June 2026',
    summary:
      'Zarea’s operating momentum remains intact, while the recovery in short-term investment income is the central variable for FY2026 earnings.',
    tags: ['Equity Research', 'Pre-results Note', 'Pakistan Stock Exchange'],
    overview: [
      "Zarea Limited (ZAL) is Pakistan's first B2B e-commerce marketplace, listed on the PSX in February 2025. The platform digitizes bulk commodity trading across agricultural produce, industrial inputs, and traded goods, connecting buyers and sellers through a structured, technology-driven exchange.",
      'ZAL qualifies under Pakistan’s IT and startup tax exemption regime, with zero tax expense confirmed in its financial statements. Alongside marketplace commissions, Zarea manages a short-term investment portfolio in PSX equities, mutual funds, and fixed-income securities. This “Other Income” is the central FY2026 earnings variable.',
    ],
    operatingMetrics: [
      { label: '9M Revenue', value: 'Rs. 2,108 mn', context: '+162% YoY' },
      { label: '9M Operating PAT (excl. Other Income)', value: 'Rs. 334 mn', context: 'Zero tax applied' },
      { label: 'Annualised Operating PAT (÷3 × 4)', value: 'Rs. 445 mn', context: 'Full-year operating base' },
      { label: 'Stock ATH / Current Price', value: 'Rs. 79.50 / Rs. 39', context: '~50% below ATH' },
      { label: 'Tax Expense', value: 'Nil', context: 'IT/startup exempt — confirmed in FS' },
    ],
    investmentThesis: [
      'Listed at Rs. 14 in February 2025, Zarea rapidly re-rated to an all-time high of Rs. 79.50 in FY2026, approximately 5× its IPO price. The stock currently trades near Rs. 39, around 50% below its all-time high, presenting a potentially compelling entry ahead of the FY2026 annual results.',
      'The portfolio generated Rs. 909 mn in Other Income in Q1 and Q2 FY2026. In Q3 (January–March 2026), the US-Iran conflict triggered a sharp PSX sell-off from its all-time high of 191,032, and the portfolio recorded a Rs. 396 mn loss. This brought 9M net Other Income to Rs. 513 mn.',
      'Critically, Q3 marketplace revenue of Rs. 841 mn was the highest quarterly revenue on record, confirming the core business was unaffected. The KSE-100 recovered to 180,301.70 by 30 June 2026, the annual balance sheet date, up 43.52% for FY2025–26.',
    ],
    investmentIncome: [
      { label: 'Q1 FY2026 (Jul–Sep 2025)', value: '+Rs. 455 mn', context: 'KSE-100 rally — strong portfolio gains' },
      { label: 'Q2 FY2026 (Oct–Dec 2025)', value: '+Rs. 454 mn', context: 'Continued market gains' },
      { label: 'Q1 + Q2 Combined (actual)', value: '+Rs. 909 mn', context: 'Confirmed in 9M financial statements' },
      { label: 'Q3 FY2026 (Jan–Mar 2026)', value: '(Rs. 396 mn)', context: 'US-Iran conflict → PSX crash from ATH 191,032' },
      { label: '9M Net Other Income', value: 'Rs. 513 mn', context: 'Rs. 909 mn − Rs. 396 mn' },
      { label: 'KSE-100 on 30 June 2026', value: '180,301.70', context: '+43.52% FY2025–26 | Annual balance sheet date' },
    ],
    earningsScenarios: [
      { item: '9M Operating PAT (actual)', operatingBase: 'Rs. 334 mn', scenarioA: 'Rs. 334 mn', scenarioB: 'Rs. 334 mn' },
      { item: 'Annualised Operating PAT (÷3 × 4)', operatingBase: 'Rs. 445 mn', scenarioA: 'Rs. 445 mn', scenarioB: 'Rs. 445 mn' },
      { item: 'Full-Year Other Income', operatingBase: 'Zero', scenarioA: 'Rs. 750 mn', scenarioB: 'Rs. 900 mn' },
      { item: 'Tax Expense', operatingBase: 'Nil', scenarioA: 'Nil', scenarioB: 'Nil' },
      { item: 'Full-Year PAT', operatingBase: 'Rs. 445 mn', scenarioA: 'Rs. 1,195 mn', scenarioB: 'Rs. 1,345 mn' },
      { item: 'EPS (Rs.)', operatingBase: '1.70', scenarioA: '4.55', scenarioB: '5.12' },
    ],
    valuations: [
      { scenario: 'Ops Only — Zero Other Income', eps: '1.70', pe: '22.9×', fairValue12x: 'Rs. 20.4', fairValue14x: 'Rs. 23.8' },
      { scenario: 'Scenario A — Rs. 750 mn (Base)', eps: '4.55', pe: '8.57×', fairValue12x: 'Rs. 54.6', fairValue14x: 'Rs. 63.7' },
      { scenario: 'Scenario B — Rs. 900 mn (Conviction)', eps: '5.12', pe: '7.61×', fairValue12x: 'Rs. 61.4', fairValue14x: 'Rs. 71.7' },
    ],
    watchItems: [
      'Examine “Other Income / Income from Short-Term Investments” in the annual profit and loss statement.',
      'Q4 Other Income above Rs. 350 mn confirms Scenario B: EPS of Rs. 5.12, P/E of 7.7×, and fair value of Rs. 71.7 at 14×.',
      'Q4 Other Income above Rs. 237 mn confirms Scenario A: EPS of Rs. 4.55, P/E of 8.6×, and fair value of Rs. 63.7 at 14×.',
      'The KSE-100 closed at 180,301.70 on 30 June 2026, up 43.52% for FY2025–26, supporting a Q4 recovery.',
      'The operating business, with 162% revenue growth, grows independently of investment income.',
    ],
    disclaimer:
      'This note is prepared by Webict Capital for educational and informational purposes only. It does not constitute investment advice or a solicitation to buy or sell any securities. All projections are illustrative estimates based on publicly available financial data. Past performance is not indicative of future results. Consult a SECP-licensed financial advisor before making any investment decision.',
  },
]
