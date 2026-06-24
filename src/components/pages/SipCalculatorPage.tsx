import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Box, Collapse, Container, Grid, IconButton, Slider, Stack,
  Switch, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography,
} from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { MotionReveal } from '../animations/MotionReveal'

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

// ── helpers ──────────────────────────────────────────────────────────────────

function formatPKR(value: number) {
  if (value >= 10_000_000) return `₨ ${(value / 10_000_000).toFixed(2)} Cr`
  if (value >= 100_000) return `₨ ${(value / 100_000).toFixed(2)} L`
  return `₨ ${Math.round(value).toLocaleString('en-PK')}`
}

function formatK(value: number) {
  if (value >= 10_000_000) return `${(value / 10_000_000).toFixed(1)}Cr`
  if (value >= 100_000) return `${(value / 100_000).toFixed(1)}L`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return `${value}`
}

function computeSIP(monthly: number, annualRate: number, years: number, initialAmount: number = 0) {
  const months = years * 12
  const r = annualRate / 100 / 12
  const invested = initialAmount + (monthly * months)
  const fvInitial = initialAmount * Math.pow(1 + r, months)
  let futureValue: number
  if (r === 0) {
    futureValue = invested
  } else {
    futureValue = fvInitial + monthly * ((Math.pow(1 + r, months) - 1) / r) * (1 + r)
  }
  const returns = futureValue - invested
  return { invested, returns, futureValue }
}

// ── constants ─────────────────────────────────────────────────────────────────

const PRIMARY = '#0a2463'
const SECONDARY_LINE = '#1a6640'

// ── component ─────────────────────────────────────────────────────────────────

export function SipCalculatorPage() {
  const [initialAmount, setInitialAmount] = useState(0)
  const [monthly, setMonthly] = useState(10_000)
  const [annualRate, setAnnualRate] = useState(15)
  const [years, setYears] = useState(10)
  const [adjustInflation, setAdjustInflation] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const INFLATION_RATE = 0.09 // 9% assumed long-term PKR inflation

  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  const { invested, returns, futureValue: nominalFutureValue } = useMemo(
    () => computeSIP(monthly, annualRate, years, initialAmount),
    [monthly, annualRate, years, initialAmount],
  )

  const futureValue = useMemo(() => {
    if (!adjustInflation) return nominalFutureValue
    // Discount nominal FV by inflation to get real purchasing power
    return nominalFutureValue / Math.pow(1 + INFLATION_RATE, years)
  }, [nominalFutureValue, adjustInflation, years])

  const realReturns = futureValue - invested

  // Build year-by-year series
  const yearlyData = useMemo(() => {
    const labels: string[] = []
    const investedArr: number[] = []
    const fvArr: number[] = []
    const scheduleRows: { year: number; invested: number; gains: number; balance: number }[] = []
    for (let y = 1; y <= years; y++) {
      labels.push(`Yr ${y}`)
      const d = computeSIP(monthly, annualRate, y, initialAmount)
      const nomFV = Math.round(d.futureValue)
      const realFV = adjustInflation ? Math.round(nomFV / Math.pow(1 + INFLATION_RATE, y)) : nomFV
      investedArr.push(Math.round(d.invested))
      fvArr.push(realFV)
      scheduleRows.push({
        year: y,
        invested: Math.round(d.invested),
        gains: realFV - Math.round(d.invested),
        balance: realFV,
      })
    }
    return { labels, investedArr, fvArr, scheduleRows }
  }, [monthly, annualRate, years, initialAmount, adjustInflation])

  const buildChartOption = useCallback(() => {
    return {
      backgroundColor: 'transparent',
      grid: { left: 60, right: 24, top: 28, bottom: 40 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#ffffff',
        borderColor: '#e2eaf5',
        borderWidth: 1,
        padding: [10, 14],
        textStyle: {
          fontFamily: '"Playfair Display", serif',
          fontSize: 12,
          color: '#253750',
        },
        formatter: (params: { seriesName: string; value: number }[]) => {
          return params
            .map(
              (p) =>
                `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.seriesName === 'Invested' ? PRIMARY : SECONDARY_LINE};margin-right:6px;"></span>` +
                `<b>${p.seriesName}</b>: ${formatPKR(p.value)}`,
            )
            .join('<br/>')
        },
      },
      legend: {
        bottom: 0,
        textStyle: {
          fontFamily: '"Playfair Display", serif',
          fontSize: 11,
          color: '#4a5e78',
        },
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        itemGap: 16,
      },
      xAxis: {
        type: 'category',
        data: yearlyData.labels,
        axisLine: { lineStyle: { color: '#e2eaf5' } },
        axisTick: { show: false },
        axisLabel: {
          fontFamily: '"Playfair Display", serif',
          fontSize: 10,
          color: '#8097b0',
        },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#f0f4fb' } },
        axisTick: { show: false },
        axisLabel: {
          fontFamily: '"Noto Sans Mono", monospace',
          fontSize: 9,
          color: '#8097b0',
          formatter: (v: number) => formatK(v),
        },
      },
      series: [
        {
          name: 'Invested',
          type: 'line',
          data: yearlyData.investedArr,
          smooth: true,
          symbol: 'none',
          lineStyle: { color: PRIMARY, width: 2, type: 'dashed' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(10,36,99,0.12)' },
              { offset: 1, color: 'rgba(10,36,99,0.01)' },
            ]),
          },
        },
        {
          name: 'Portfolio Value',
          type: 'line',
          data: yearlyData.fvArr,
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: { color: SECONDARY_LINE, width: 2.5 },
          itemStyle: { color: SECONDARY_LINE, borderWidth: 2, borderColor: '#fff' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(26,102,64,0.14)' },
              { offset: 1, color: 'rgba(26,102,64,0.01)' },
            ]),
          },
        },
      ],
    }
  }, [yearlyData])

  // Init chart
  useEffect(() => {
    if (!chartRef.current) return
    const chart = echarts.init(chartRef.current, undefined, { renderer: 'canvas' })
    chartInstance.current = chart

    const observer = new ResizeObserver(() => chart.resize())
    observer.observe(chartRef.current)

    return () => {
      observer.disconnect()
      chart.dispose()
      chartInstance.current = null
    }
  }, [])

  // Update chart when data changes
  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.setOption(buildChartOption(), true)
    }
  }, [buildChartOption])

  return (
    <Box
      component="main"
      sx={{
        pt: { xs: 'calc(64px + 2rem)', md: 'calc(72px + 3rem)' },
        pb: { xs: 8, md: 14 },
        bgcolor: '#ffffff',
        minHeight: '100vh',
      }}
    >
      <Container maxWidth="xl" sx={{ maxWidth: '1200px !important', px: { xs: 2.5, md: 5 } }}>
        <Stack spacing={{ xs: 7, md: 10 }}>

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <MotionReveal>
            <Box sx={{ maxWidth: 80 }} />
            <Box sx={{ mt: 3 }}>
              <Typography
                component="span"
                sx={{
                  display: 'block',
                  fontSize: 11,
                  fontFamily: '"Playfair Display", serif',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: PRIMARY,
                  mb: 2,
                }}
              >
                Tools
              </Typography>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.6rem', sm: '3.2rem', md: '3.8rem' },
                  lineHeight: 1.04,
                  letterSpacing: '-0.03em',
                  color: '#080e1a',
                  fontWeight: 700,
                  mb: 1.5,
                }}
              >
                SIP Calculator.
              </Typography>
              <Typography
                sx={{
                  color: '#4a5e78',
                  fontSize: { xs: 15, md: 16.5 },
                  lineHeight: 1.72,
                  maxWidth: 560,
                }}
              >
                Estimate how your systematic investment plan grows over time. Adjust the monthly
                contribution, expected annual return, and investment horizon to see projected wealth.
              </Typography>
            </Box>
          </MotionReveal>

          {/* ── Main layout ────────────────────────────────────────────────── */}
          <Grid container spacing={{ xs: 4, md: 6 }} sx={{ alignItems: 'stretch' }}>

            {/* ── Left — sliders ─────────────────────────────────────────── */}
            <Grid size={{ xs: 12, md: 5 }}>
              <MotionReveal delay={0.05}>
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid #e2eaf5',
                    borderRadius: 1.5,
                    bgcolor: '#fafbfd',
                    p: { xs: 3, md: 3.5 },
                  }}
                >
                  <Stack spacing={4.5} sx={{ flexGrow: 1, justifyContent: 'space-between' }}>

                    {/* Initial Investment */}
                    <SliderField
                      id="initial-investment"
                      label="Initial Investment"
                      value={initialAmount}
                      min={0}
                      max={5_000_000}
                      step={10_000}
                      display={formatPKR(initialAmount)}
                      onChange={(v) => setInitialAmount(v)}
                      marks={[
                        { value: 0, label: '₨0' },
                        { value: 1_000_000, label: '₨10L' },
                        { value: 2_500_000, label: '₨25L' },
                        { value: 5_000_000, label: '₨50L' },
                      ]}
                    />

                    {/* Monthly investment */}
                    <SliderField
                      id="monthly-investment"
                      label="Monthly Investment"
                      value={monthly}
                      min={1_000}
                      max={1_000_000}
                      step={1_000}
                      display={formatPKR(monthly)}
                      onChange={(v) => setMonthly(v)}
                      marks={[
                        { value: 1_000, label: '₨1K' },
                        { value: 250_000, label: '₨2.5L' },
                        { value: 500_000, label: '₨5L' },
                        { value: 750_000, label: '₨7.5L' },
                        { value: 1_000_000, label: '₨10L' },
                      ]}
                    />

                    {/* Annual return */}
                    <Box>
                      <SliderField
                        id="annual-return"
                        label="Expected Annual Return"
                        value={annualRate}
                        min={1}
                        max={50}
                        step={0.1}
                        display={`${annualRate}% p.a.`}
                        onChange={(v) => setAnnualRate(v)}
                        marks={[
                          { value: 1, label: '1%' },
                          { value: 10, label: '10%' },
                          { value: 20, label: '20%' },
                          { value: 30, label: '30%' },
                          { value: 40, label: '40%' },
                          { value: 50, label: '50%' },
                        ]}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 1.2 }}>
                        <InfoOutlinedIcon sx={{ fontSize: 12, color: '#a0b4cc' }} />
                        <Typography sx={{ fontSize: 11, color: '#a0b4cc', lineHeight: 1.5, fontStyle: 'italic' }}>
                          The KSE-100 has historically returned ~14–16% p.a. over a 10-year horizon.
                        </Typography>
                      </Box>
                    </Box>

                    {/* Investment period */}
                    <SliderField
                      id="investment-period"
                      label="Investment Period"
                      value={years}
                      min={1}
                      max={40}
                      step={1}
                      display={`${years} yr${years > 1 ? 's' : ''}`}
                      onChange={(v) => setYears(v)}
                      marks={[
                        { value: 1, label: '1yr' },
                        { value: 10, label: '10yr' },
                        { value: 20, label: '20yr' },
                        { value: 30, label: '30yr' },
                        { value: 40, label: '40yr' },
                      ]}
                    />

                    {/* Inflation toggle */}
                    <Box
                      sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        bgcolor: adjustInflation ? 'rgba(10,36,99,0.04)' : 'transparent',
                        border: '1px solid', borderColor: adjustInflation ? 'rgba(10,36,99,0.14)' : '#e2eaf5',
                        borderRadius: 1.5, px: 2, py: 1.2, transition: 'all 0.2s',
                      }}
                    >
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, mb: 0.3 }}>
                          <Typography sx={{
                            fontSize: 12, fontFamily: '"Playfair Display", serif',
                            letterSpacing: '0.1em', textTransform: 'uppercase',
                            color: adjustInflation ? PRIMARY : '#4a5e78', fontWeight: 600,
                          }}>
                            Adjust for Inflation
                          </Typography>
                          <Tooltip title="Discounts the final portfolio value using an estimated 9% long-term PKR inflation rate, showing real purchasing power." placement="top" arrow>
                            <InfoOutlinedIcon sx={{ fontSize: 13, color: '#a0b4cc', cursor: 'help' }} />
                          </Tooltip>
                        </Box>
                        <Typography sx={{ fontSize: 11, color: '#8097b0', lineHeight: 1.4 }}>
                          {adjustInflation ? `Real value at 9% inflation` : 'Show nominal returns'}
                        </Typography>
                      </Box>
                      <Switch
                        checked={adjustInflation}
                        onChange={(e) => setAdjustInflation(e.target.checked)}
                        size="small"
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: PRIMARY },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: PRIMARY },
                        }}
                      />
                    </Box>

                  </Stack>
                </Box>
              </MotionReveal>
            </Grid>

            {/* ── Right — results + chart ─────────────────────────────────── */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={3} sx={{ height: '100%' }}>

                {/* Summary cards */}
                <MotionReveal delay={0.08}>
                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <SummaryCard label="Invested Amount" value={formatPKR(invested)} accent={false} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <SummaryCard label={adjustInflation ? 'Real Returns' : 'Est. Returns'} value={formatPKR(realReturns)} accent={false} green />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <SummaryCard label={adjustInflation ? 'Real Value (Today ₨)' : 'Total Value'} value={formatPKR(futureValue)} accent />
                    </Grid>
                  </Grid>
                </MotionReveal>

                {/* Chart */}
                <MotionReveal delay={0.12}>
                  <Box
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      flexGrow: 1,
                      border: '1px solid #e2eaf5',
                      borderRadius: 1.5,
                      bgcolor: '#fafbfd',
                      p: { xs: 2.5, md: 3 },
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontFamily: '"Playfair Display", serif',
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: PRIMARY,
                        mb: 2,
                      }}
                    >
                      Wealth Growth Over Time
                    </Typography>
                    <Box ref={chartRef} sx={{ width: '100%', height: { xs: 260, md: 320 } }} />

                    {/* Year-by-Year Schedule Toggle */}
                    <Box
                      onClick={() => setShowSchedule(p => !p)}
                      sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        mt: 2, pt: 2, borderTop: '1px solid #e2eaf5', cursor: 'pointer',
                        '&:hover': { '& .schedule-label': { color: PRIMARY } },
                      }}
                    >
                      <Typography
                        className="schedule-label"
                        sx={{
                          fontSize: 11, fontFamily: '"Playfair Display", serif',
                          letterSpacing: '0.14em', textTransform: 'uppercase',
                          color: '#8097b0', transition: 'color 0.2s',
                        }}
                      >
                        View Detailed Schedule
                      </Typography>
                      {showSchedule
                        ? <KeyboardArrowUpRoundedIcon sx={{ fontSize: 18, color: PRIMARY }} />
                        : <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18, color: '#8097b0' }} />}
                    </Box>

                    <Collapse in={showSchedule} timeout="auto">
                      <Box sx={{ 
                        overflowX: 'auto', 
                        mt: 1.5,
                        maxHeight: 280,
                        overflowY: 'auto',
                        '&::-webkit-scrollbar': { width: '5px', height: '5px' },
                        '&::-webkit-scrollbar-track': { bgcolor: '#f0f4fb', borderRadius: '4px' },
                        '&::-webkit-scrollbar-thumb': { bgcolor: '#c8d6ec', borderRadius: '4px' },
                        '&::-webkit-scrollbar-thumb:hover': { bgcolor: '#a0b4cc' },
                      }}>
                        <Table size="small" sx={{ minWidth: 360 }}>
                          <TableHead>
                            <TableRow>
                              {['Year', 'Amount Invested', 'Wealth Gained', 'Year-End Balance'].map(h => (
                                <TableCell key={h} sx={{
                                  fontSize: 9, fontFamily: '"Playfair Display", serif',
                                  letterSpacing: '0.1em', textTransform: 'uppercase',
                                  color: '#8097b0', borderBottom: '1px solid #e2eaf5', pb: 1,
                                }}>{h}</TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {yearlyData.scheduleRows.map((row) => (
                              <TableRow key={row.year} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                                <TableCell sx={{ fontSize: 12, fontFamily: '"Noto Sans Mono", monospace', color: '#4a5e78', py: 0.8 }}>Yr {row.year}</TableCell>
                                <TableCell sx={{ fontSize: 12, fontFamily: '"Noto Sans Mono", monospace', color: '#4a5e78', py: 0.8 }}>{formatPKR(row.invested)}</TableCell>
                                <TableCell sx={{ fontSize: 12, fontFamily: '"Noto Sans Mono", monospace', color: SECONDARY_LINE, py: 0.8 }}>{formatPKR(row.gains)}</TableCell>
                                <TableCell sx={{ fontSize: 12, fontFamily: '"Noto Sans Mono", monospace', fontWeight: 700, color: PRIMARY, py: 0.8 }}>{formatPKR(row.balance)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Box>
                    </Collapse>
                  </Box>
                </MotionReveal>

              </Stack>
            </Grid>
          </Grid>

          {/* ── Breakdown strip ────────────────────────────────────────────── */}
          <MotionReveal delay={0.04}>
            <Box
              sx={{
                borderTop: '1px solid #e2eaf5',
                pt: 5,
              }}
            >
              <Typography
                sx={{
                  fontSize: 11,
                  fontFamily: '"Playfair Display", serif',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: PRIMARY,
                  mb: 1.5,
                }}
              >
                Return Breakdown
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: 20, md: 24 },
                  fontWeight: 700,
                  color: '#080e1a',
                  letterSpacing: '-0.02em',
                  mb: 4,
                }}
              >
                How your wealth compounds.
              </Typography>

              <Grid container spacing={{ xs: 1.5, md: 2 }}>
                {[
                  {
                    label: 'Capital Contribution',
                    value: formatPKR(invested),
                    pct: Math.round((invested / futureValue) * 100),
                    color: PRIMARY,
                    desc: 'Total amount invested across all instalments.',
                  },
                  {
                    label: 'Est. Wealth Gain',
                    value: formatPKR(returns),
                    pct: Math.round((returns / futureValue) * 100),
                    color: SECONDARY_LINE,
                    desc: `Compounded at ${annualRate}% p.a. over ${years} years.`,
                  },
                  {
                    label: 'Wealth Multiplier',
                    value: `${(futureValue / invested).toFixed(2)}×`,
                    pct: null,
                    color: '#080e1a',
                    desc: 'How many times your invested capital has grown.',
                  },
                ].map((item) => (
                  <Grid key={item.label} size={{ xs: 12, sm: 4 }}>
                    <Box
                      sx={{
                        borderTop: `2px solid ${item.color}`,
                        pt: 2.2,
                        pr: 1,
                        transition: 'box-shadow 0.2s',
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 11,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: '#8097b0',
                          mb: 0.8,
                        }}
                      >
                        {item.label}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: '"Noto Sans Mono", monospace',
                          fontSize: { xs: 22, md: 26 },
                          fontWeight: 700,
                          color: item.color,
                          letterSpacing: '-0.02em',
                          mb: 0.6,
                        }}
                      >
                        {item.value}
                      </Typography>
                      {item.pct !== null && (
                        <Typography
                          sx={{
                            fontSize: 11,
                            color: '#8097b0',
                            mb: 0.6,
                            fontFamily: '"Noto Sans Mono", monospace',
                          }}
                        >
                          {item.pct}% of total portfolio
                        </Typography>
                      )}
                      <Typography sx={{ fontSize: 13, color: '#4a5e78', lineHeight: 1.65 }}>
                        {item.desc}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </MotionReveal>

          {/* ── Why Choose SIP? ─────────────────────────────────────────── */}
          <MotionReveal delay={0.03}>
            <Box sx={{ borderTop: '1px solid #e2eaf5', pt: 5 }}>
              <Typography
                sx={{
                  fontSize: 11, fontFamily: '"Playfair Display", serif',
                  letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: PRIMARY, mb: 1.5,
                }}
              >
                Why Choose SIP?
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: 20, md: 24 }, fontWeight: 700, color: '#080e1a',
                  letterSpacing: '-0.02em', mb: 4,
                }}
              >
                The principles behind compounding wealth.
              </Typography>
              <Grid container spacing={{ xs: 2, md: 3 }}>
                {[
                  {
                    title: 'Rupee Cost Averaging',
                    icon: '⚖️',
                    body: 'By investing a fixed amount every month, you automatically buy more units when prices are low and fewer when they are high — mitigating the impact of short-term market volatility without requiring you to time the market.',
                  },
                  {
                    title: 'Power of Compounding',
                    icon: '📈',
                    body: 'Every rupee of return you earn begins generating its own returns. Starting even 5 years earlier can more than double your final corpus — making the earliest years of a SIP the most valuable ones.',
                  },
                  {
                    title: 'Financial Discipline',
                    icon: '🏦',
                    body: 'A SIP automates your savings decision, removing emotion from investing. By treating investments like a fixed monthly expense, you build wealth systematically and avoid the pitfalls of reactive, lump-sum investing.',
                  },
                ].map((item) => (
                  <Grid key={item.title} size={{ xs: 12, sm: 4 }}>
                    <Box
                      sx={{
                        borderTop: `2px solid ${PRIMARY}`, pt: 2.5, pr: 1,
                        '&:hover': { '& .sip-title': { color: PRIMARY } },
                      }}
                    >
                      <Typography sx={{ fontSize: 22, mb: 1.2 }}>{item.icon}</Typography>
                      <Typography
                        className="sip-title"
                        sx={{
                          fontSize: 14, fontFamily: '"Playfair Display", serif',
                          fontWeight: 700, color: '#080e1a', mb: 1, transition: 'color 0.2s',
                        }}
                      >
                        {item.title}
                      </Typography>
                      <Typography sx={{ fontSize: 13, color: '#4a5e78', lineHeight: 1.78 }}>
                        {item.body}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </MotionReveal>

          {/* ── Disclaimer ─────────────────────────────────────────────────── */}
          <MotionReveal delay={0.02}>
            <Box
              sx={{
                border: '1px solid #e2eaf5',
                borderRadius: 1.5,
                p: { xs: 2.5, md: 3 },
                bgcolor: '#fafbfd',
              }}
            >
              <Typography
                sx={{
                  fontSize: 10,
                  fontFamily: '"Playfair Display", serif',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: PRIMARY,
                  mb: 1,
                }}
              >
                Disclaimer
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#4a5e78', lineHeight: 1.78 }}>
                This calculator is for <strong>educational and illustrative purposes only</strong>. It assumes a
                constant annual return rate which does not reflect real-world market volatility. Actual
                investment returns will vary. Past performance of any market is not indicative of future
                results. Webict Capital does not provide financial advice. Please consult a qualified
                investment advisor before making investment decisions.
              </Typography>
            </Box>
          </MotionReveal>

        </Stack>
      </Container>
    </Box>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SliderField({
  id,
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
  marks,
}: {
  id: string
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  onChange: (v: number) => void
  marks?: { value: number; label: string }[]
}) {
  const handleDecrement = () => {
    onChange(Math.max(min, value - step))
  }

  const handleIncrement = () => {
    onChange(Math.min(max, value + step))
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1.5 }}>
        <Typography
          component="label"
          htmlFor={id}
          sx={{
            fontSize: 12,
            fontFamily: '"Playfair Display", serif',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#4a5e78',
            fontWeight: 600,
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            fontFamily: '"Noto Sans Mono", monospace',
            fontSize: 15,
            fontWeight: 700,
            color: PRIMARY,
            letterSpacing: '-0.01em',
          }}
        >
          {display}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <IconButton
          onClick={handleDecrement}
          disabled={value <= min}
          size="small"
          sx={{
            color: PRIMARY,
            border: '1px solid #dde7f4',
            bgcolor: '#ffffff',
            width: 28,
            height: 28,
            mt: '1px',
            '&:hover': { bgcolor: '#f0f4fb', borderColor: PRIMARY },
            '&.Mui-disabled': { borderColor: '#e2eaf5', color: '#c8d6ec' }
          }}
          aria-label={`Decrease ${label}`}
        >
          <RemoveRoundedIcon sx={{ fontSize: 16 }} />
        </IconButton>

        <Slider
          id={id}
          value={value}
          min={min}
          max={max}
          step={step}
          marks={marks}
          onChange={(_, v) => onChange(v as number)}
          aria-label={label}
          sx={{
            flex: 1,
            mx: 0.5,
            color: PRIMARY,
            height: 4,
            '& .MuiSlider-thumb': {
              width: 14,
              height: 14,
              bgcolor: '#fff',
              border: `2px solid ${PRIMARY}`,
              boxShadow: '0 2px 8px rgba(10,36,99,0.18)',
              '&:hover': { boxShadow: '0 0 0 6px rgba(10,36,99,0.1)' },
            },
            '& .MuiSlider-track': { border: 'none' },
            '& .MuiSlider-rail': { bgcolor: '#e2eaf5', opacity: 1 },
            '& .MuiSlider-mark': { bgcolor: '#c8d6ec', width: 3, height: 3, borderRadius: '50%' },
            '& .MuiSlider-markLabel': {
              fontSize: 9,
              fontFamily: '"Noto Sans Mono", monospace',
              color: '#a0b4cc',
              top: 28,
            },
            '& .MuiSlider-markLabelActive': { color: '#4a5e78' },
          }}
        />

        <IconButton
          onClick={handleIncrement}
          disabled={value >= max}
          size="small"
          sx={{
            color: PRIMARY,
            border: '1px solid #dde7f4',
            bgcolor: '#ffffff',
            width: 28,
            height: 28,
            mt: '1px',
            '&:hover': { bgcolor: '#f0f4fb', borderColor: PRIMARY },
            '&.Mui-disabled': { borderColor: '#e2eaf5', color: '#c8d6ec' }
          }}
          aria-label={`Increase ${label}`}
        >
          <AddRoundedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
    </Box>
  )
}

function SummaryCard({
  label,
  value,
  accent,
  green,
}: {
  label: string
  value: string
  accent?: boolean
  green?: boolean
}) {
  const bg = accent ? PRIMARY : green ? '#f0f9f4' : '#fafbfd'
  const textColor = accent ? '#ffffff' : green ? SECONDARY_LINE : '#080e1a'
  const labelColor = accent ? 'rgba(255,255,255,0.72)' : '#8097b0'
  const borderColor = accent ? PRIMARY : green ? 'rgba(26,102,64,0.2)' : '#e2eaf5'

  return (
    <Box
      sx={{
        border: `1px solid ${borderColor}`,
        borderRadius: 1.5,
        p: { xs: 2, md: 2.4 },
        bgcolor: bg,
        transition: 'box-shadow 0.2s',
        '&:hover': {
          boxShadow: accent
            ? '0 6px 24px rgba(10,36,99,0.2)'
            : '0 4px 16px rgba(10,36,99,0.06)',
        },
      }}
    >
      <Typography
        sx={{
          fontSize: 10,
          fontFamily: '"Playfair Display", serif',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: labelColor,
          mb: 0.8,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontFamily: '"Noto Sans Mono", monospace',
          fontSize: { xs: 14, sm: 15, md: 16 },
          fontWeight: 700,
          color: textColor,
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
        }}
      >
        {value}
      </Typography>
    </Box>
  )
}
