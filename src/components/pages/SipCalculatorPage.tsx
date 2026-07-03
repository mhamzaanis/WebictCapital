import { useCallback, useEffect, useMemo, useRef, useState, type ElementType } from 'react'
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import DonutLargeRoundedIcon from '@mui/icons-material/DonutLargeRounded'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import {
  Box,
  Button,
  Collapse,
  Container,
  Slider,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { MotionReveal } from '../animations/MotionReveal'

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

type SliderMark = {
  value: number
  label: string
}

type MetricCardProps = {
  label: string
  value: string
  icon: ElementType
  variant?: 'default' | 'positive' | 'dark'
}

type Principle = {
  title: string
  body: string
  icon: ElementType
}

const PRIMARY = '#0a2463'
const SUCCESS = '#0f8a55'
const DISPLAY_FONT = 'var(--wc-font-display)'
const MONO_FONT = 'var(--wc-font-mono)'
const ECHART_BODY_FONT = 'Inter, sans-serif'
const ECHART_MONO_FONT = 'JetBrains Mono, monospace'
const INFLATION_RATE = 0.09
const START_DATE = new Date(2025, 4, 1)

const PRINCIPLES: Principle[] = [
  {
    title: 'Rupee Cost Averaging',
    body: 'Invest a fixed amount regularly. When prices are low, you invest in more units; when higher, in fewer - balancing your average cost.',
    icon: SavingsOutlinedIcon,
  },
  {
    title: 'Power of Compounding',
    body: 'Returns generate more returns over time. The earlier you start, the more time your money has to grow.',
    icon: CalendarMonthOutlinedIcon,
  },
  {
    title: 'Financial Discipline',
    body: 'SIP builds a habit of saving and investing regularly. It removes emotion from investing and helps you stay consistent.',
    icon: ShowChartRoundedIcon,
  },
]

function computeSIP(monthly: number, annualRate: number, years: number, initialAmount = 0) {
  const months = years * 12
  const r = annualRate / 100 / 12
  const invested = initialAmount + monthly * months
  const fvInitial = initialAmount * Math.pow(1 + r, months)
  const futureValue =
    r === 0
      ? invested
      : fvInitial + monthly * ((Math.pow(1 + r, months) - 1) / r) * (1 + r)
  const returns = futureValue - invested

  return { invested, returns, futureValue }
}

function roundToStep(value: number, step: number) {
  const decimals = (step.toString().split('.')[1] || '').length
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

function formatPKR(value: number) {
  if (!Number.isFinite(value)) return 'Rs -'
  return `Rs ${Math.round(value).toLocaleString('en-PK')}`
}

function formatAxisValue(value: number) {
  const abs = Math.abs(value)
  if (abs >= 10_000_000) return `${Math.round(value / 100_000)}L`
  if (abs >= 100_000) return `${Math.round(value / 100_000)}L`
  if (abs >= 1_000) return `${Math.round(value / 1_000)}K`
  return `${value}`
}

function formatMonthYear(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function addYears(date: Date, years: number) {
  const next = new Date(date)
  next.setFullYear(next.getFullYear() + years)
  return next
}

function percentOf(part: number, total: number) {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) return 0
  return Math.round((part / total) * 100)
}

export function SipCalculatorPage() {
  const [monthly, setMonthly] = useState(10_000)
  const [annualRate, setAnnualRate] = useState(15)
  const [years, setYears] = useState(10)
  const [adjustInflation, setAdjustInflation] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)

  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  const { invested, futureValue: nominalFutureValue } = useMemo(
    () => computeSIP(monthly, annualRate, years),
    [monthly, annualRate, years],
  )

  const futureValue = useMemo(() => {
    if (!adjustInflation) return nominalFutureValue
    return nominalFutureValue / Math.pow(1 + INFLATION_RATE, years)
  }, [adjustInflation, nominalFutureValue, years])

  const wealthGain = futureValue - invested
  const startDateLabel = formatMonthYear(START_DATE)
  const endDateLabel = formatMonthYear(addYears(START_DATE, years))

  const yearlyData = useMemo(() => {
    const labels: string[] = []
    const investedArr: number[] = []
    const valueArr: number[] = []
    const scheduleRows: { year: number; invested: number; gains: number; balance: number }[] = []

    for (let y = 1; y <= years; y += 1) {
      const yearly = computeSIP(monthly, annualRate, y)
      const nominal = Math.round(yearly.futureValue)
      const value = adjustInflation ? Math.round(nominal / Math.pow(1 + INFLATION_RATE, y)) : nominal
      const investedValue = Math.round(yearly.invested)

      labels.push(`Yr ${y}`)
      investedArr.push(investedValue)
      valueArr.push(value)
      scheduleRows.push({
        year: y,
        invested: investedValue,
        gains: value - investedValue,
        balance: value,
      })
    }

    return { labels, investedArr, valueArr, scheduleRows }
  }, [adjustInflation, annualRate, monthly, years])

  const resetCalculator = () => {
    setMonthly(10_000)
    setAnnualRate(15)
    setYears(10)
    setAdjustInflation(false)
    setShowSchedule(false)
  }

  const buildChartOption = useCallback(() => {
    return {
      backgroundColor: 'transparent',
      animationDuration: 600,
      grid: { left: 48, right: 18, top: 18, bottom: 34 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#ffffff',
        borderColor: '#e2eaf5',
        borderWidth: 1,
        padding: [10, 14],
        textStyle: {
          fontFamily: ECHART_BODY_FONT,
          fontSize: 12,
          color: '#253750',
        },
        formatter: (params: { seriesName: string; value: number; color: string }[]) =>
          params
            .map(
              (item) =>
                `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${item.color};margin-right:6px;"></span>` +
                `<b>${item.seriesName}</b>: ${formatPKR(item.value)}`,
            )
            .join('<br/>'),
      },
      xAxis: {
        type: 'category',
        data: yearlyData.labels,
        axisLine: { lineStyle: { color: '#e2eaf5' } },
        axisTick: { show: false },
        axisLabel: {
          fontFamily: ECHART_MONO_FONT,
          fontSize: 11,
          color: '#4a5e78',
        },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#e2eaf5' } },
        axisTick: { show: false },
        axisLabel: {
          fontFamily: ECHART_MONO_FONT,
          fontSize: 11,
          color: '#4a5e78',
          formatter: (value: number) => formatAxisValue(value),
        },
      },
      series: [
        {
          name: 'Total value (Rs)',
          type: 'line',
          data: yearlyData.valueArr,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: SUCCESS, width: 3 },
          itemStyle: { color: SUCCESS, borderColor: '#ffffff', borderWidth: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(15,138,85,0.18)' },
              { offset: 1, color: 'rgba(15,138,85,0.02)' },
            ]),
          },
        },
        {
          name: 'Total invested (Rs)',
          type: 'line',
          data: yearlyData.investedArr,
          smooth: true,
          symbol: 'none',
          lineStyle: { color: PRIMARY, width: 2, type: 'dashed' },
        },
      ],
    }
  }, [yearlyData])

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

  useEffect(() => {
    chartInstance.current?.setOption(buildChartOption(), true)
  }, [buildChartOption])

  return (
    <Box
      component="main"
      sx={{
        pt: { xs: 'calc(64px + 2.6rem)', md: 'calc(72px + 3.8rem)' },
        pb: { xs: 7, md: 10 },
        bgcolor: 'var(--wc-bg)',
        minHeight: '100vh',
      }}
    >
      <Container maxWidth="xl" sx={{ maxWidth: '1200px !important', px: { xs: 2.5, md: 5 } }}>
        <Stack spacing={{ xs: 4.8, md: 5.6 }}>
          <MotionReveal>
            <Box sx={{ maxWidth: 560 }}>

              <Typography
                variant="h1"
                sx={{
                  color: 'var(--wc-text-primary)',
                  fontFamily: DISPLAY_FONT,
                  fontSize: { xs: '3rem', sm: '4rem', md: '4.8rem' },
                  fontWeight: 700,
                  lineHeight: 0.98,
                  letterSpacing: 0,
                }}
              >
                SIP{' '}
                <Box component="span" sx={{ color: PRIMARY }}>
                  Calculator.
                </Box>
              </Typography>
              <Typography sx={{ mt: 2.5, color: 'var(--wc-text-secondary)', fontSize: { xs: 15, md: 16 }, lineHeight: 1.8, maxWidth: 520 }}>
                Estimate how your systematic investment plan grows over time. Adjust the inputs to see potential
                returns and track your path to long-term wealth.
              </Typography>
            </Box>
          </MotionReveal>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(320px, 0.68fr) minmax(0, 1fr)' },
              gap: 2,
              height: { xs: 'auto', lg: 700 },
              alignItems: 'stretch',
              '& > div': {
                minHeight: 0,
                height: { lg: '100%' },
              },
              '& > div > div': {
                height: { lg: '100%' },
              },
            }}
          >
            <MotionReveal delay={0.04}>
              <InputPanel
                monthly={monthly}
                annualRate={annualRate}
                years={years}
                adjustInflation={adjustInflation}
                onMonthlyChange={setMonthly}
                onAnnualRateChange={setAnnualRate}
                onYearsChange={setYears}
                onAdjustInflationChange={setAdjustInflation}
                onReset={resetCalculator}
              />
            </MotionReveal>

            <MotionReveal delay={0.08}>
              <Box
                sx={{
                  height: '100%',
                  // border: '1px solid var(--wc-divider)',
                  borderRadius: '7px',
	                  bgcolor: 'var(--wc-bg)',
	                  p: { xs: 2, md: 2.8 },
	                  // boxShadow: '0 18px 42px rgba(10,36,99,0.025)',
	                  display: 'flex',
	                  flexDirection: 'column',
	                  minHeight: 0,
	                  overflow: 'hidden',
	                }}
	              >
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
                    gap: 1.2,
                    mb: 2.8,
                  }}
                >
                  <MetricCard label="Invested amount" value={formatPKR(invested)} icon={AccountBalanceWalletOutlinedIcon} />
                  <MetricCard label="Est. returns" value={formatPKR(wealthGain)} icon={TrendingUpRoundedIcon} variant="positive" />
                  <MetricCard label="Total value" value={formatPKR(futureValue)} icon={DonutLargeRoundedIcon} variant="dark" />
                </Box>

	                <Box
	                  sx={{
	                    flex: 1,
	                    minHeight: 0,
	                    overflowX: 'hidden',
	                    overflowY: { xs: 'visible', lg: 'auto' },
	                    pr: { lg: 1 },
	                    mr: { lg: -1 },
	                    scrollbarWidth: 'thin',
	                    scrollbarColor: 'rgba(10,36,99,0.22) transparent',
	                    '&::-webkit-scrollbar': { width: 6 },
	                    '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
	                    '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(10,36,99,0.22)', borderRadius: 999 },
	                  }}
	                >
	                  <Typography sx={{ color: 'var(--wc-text-primary)', fontSize: 15, fontWeight: 800, mb: 2.2 }}>
	                    Wealth growth over time
	                  </Typography>
	                  <Stack direction="row" spacing={3} sx={{ alignItems: 'center', mb: 1.2, flexWrap: 'wrap' }}>
	                    <ChartLegend color={SUCCESS} label="Total value (Rs)" />
	                    <ChartLegend color={PRIMARY} label="Total invested (Rs)" dashed />
	                  </Stack>

	                  <Box ref={chartRef} sx={{ width: '100%', height: { xs: 300, md: 310 } }} />

	                  <Box
	                    sx={{
	                      display: 'grid',
	                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
	                      gap: 1.2,
	                      mt: 1.8,
	                    }}
	                  >
	                    <DateCard label="SIP start date" value={startDateLabel} />
	                    <DateCard label="End date" value={endDateLabel} />
	                  </Box>

	                  <Box sx={{ textAlign: 'center', mt: 2 }}>
	                    <Button
	                      onClick={() => setShowSchedule((open) => !open)}
	                      endIcon={<KeyboardArrowDownRoundedIcon sx={{ transform: showSchedule ? 'rotate(180deg)' : 'none', transition: 'transform 180ms ease' }} />}
	                      sx={{
	                        color: PRIMARY,
	                        fontSize: 13,
	                        fontWeight: 700,
	                        textTransform: 'none',
	                        '&:hover': { bgcolor: 'var(--wc-primary-light)' },
	                      }}
	                    >
	                      View yearly breakdown
	                    </Button>
	                  </Box>

	                  <Collapse in={showSchedule} timeout="auto">
	                    <ScheduleTable rows={yearlyData.scheduleRows} />
	                  </Collapse>
	                </Box>
	              </Box>
            </MotionReveal>
          </Box>

          <ReturnBreakdown
            invested={invested}
            wealthGain={wealthGain}
            futureValue={futureValue}
            annualRate={annualRate}
            years={years}
          />

          <WhySip />

          <Disclaimer />
        </Stack>
      </Container>
    </Box>
  )
}

function InputPanel({
  monthly,
  annualRate,
  years,
  adjustInflation,
  onMonthlyChange,
  onAnnualRateChange,
  onYearsChange,
  onAdjustInflationChange,
  onReset,
}: {
  monthly: number
  annualRate: number
  years: number
  adjustInflation: boolean
  onMonthlyChange: (value: number) => void
  onAnnualRateChange: (value: number) => void
  onYearsChange: (value: number) => void
  onAdjustInflationChange: (value: boolean) => void
  onReset: () => void
}) {
  return (
    <Box
      sx={{
        height: '100%',
        border: '1px solid var(--wc-divider)',
        borderRadius: '7px',
        bgcolor: 'var(--wc-bg)',
        p: { xs: 2.2, md: 3 },
        boxShadow: '0 18px 42px rgba(10,36,99,0.025)',
      }}
    >
      <Typography sx={{ color: 'var(--wc-text-primary)', fontSize: 16, fontWeight: 800, mb: 2.6 }}>
        Your SIP inputs
      </Typography>

      <Stack spacing={{ xs: 3.8, md: 4.4 }}>
        <SliderField
          id="monthly-investment"
          label="Monthly investment"
          value={monthly}
          min={500}
          max={100_000}
          step={500}
          display={formatPKR(monthly)}
          onChange={onMonthlyChange}
          marks={[
            { value: 500, label: 'Rs 500' },
            { value: 25_000, label: 'Rs 25K' },
            { value: 50_000, label: 'Rs 50K' },
            { value: 75_000, label: 'Rs 75K' },
            { value: 100_000, label: 'Rs 100k' },
          ]}
        />

        <SliderField
          id="annual-return"
          label="Expected annual return"
          value={annualRate}
          min={0}
          max={30}
          step={0.5}
          display={`${annualRate}% p.a.`}
          onChange={onAnnualRateChange}
          marks={[
            { value: 0, label: '0%' },
            { value: 5, label: '5%' },
            { value: 10, label: '10%' },
            { value: 15, label: '15%' },
            { value: 20, label: '20%' },
            { value: 25, label: '25%' },
            { value: 30, label: '30%' },
          ]}
        />

        <SliderField
          id="investment-period"
          label="Investment period"
          value={years}
          min={1}
          max={30}
          step={1}
          display={`${years} year${years === 1 ? '' : 's'}`}
          onChange={onYearsChange}
          marks={[
            { value: 1, label: '1 yr' },
            { value: 5, label: '5 yrs' },
            { value: 10, label: '10 yrs' },
            { value: 15, label: '15 yrs' },
            { value: 20, label: '20 yrs' },
            { value: 30, label: '30 yrs' },
          ]}
        />

        <Box
          sx={{
            border: '1px solid var(--wc-divider)',
            borderRadius: '7px',
            bgcolor: 'var(--wc-paper)',
            px: 1.8,
            py: 1.6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box>
            <Stack direction="row" spacing={0.7} sx={{ alignItems: 'center' }}>
              <Typography sx={{ color: 'var(--wc-text-primary)', fontSize: 13, fontWeight: 800 }}>
                Adjust for inflation
              </Typography>
              {/* <Tooltip title="Shows estimated returns in today's value using a 9% inflation assumption." arrow>
              </Tooltip> */}
            </Stack>
            <Typography sx={{ mt: 0.35, color: 'var(--wc-text-secondary)', fontSize: 11.5 }}>
              Show returns in today's value
            </Typography>
          </Box>
          <Switch
            checked={adjustInflation}
            onChange={(event) => onAdjustInflationChange(event.target.checked)}
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': { color: '#ffffff' },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: PRIMARY, opacity: 1 },
            }}
          />
        </Box>

        <Button
          onClick={onReset}
          startIcon={<RestartAltRoundedIcon sx={{ fontSize: 17 }} />}
          sx={{
            alignSelf: 'flex-start',
            color: PRIMARY,
            fontSize: 12.5,
            fontWeight: 800,
            textTransform: 'none',
            px: 0,
            '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
          }}
        >
          Reset all
        </Button>
      </Stack>
    </Box>
  )
}

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
  onChange: (value: number) => void
  marks: SliderMark[]
}) {
  return (
    <Box>
      <Stack direction="row" spacing={1.4} sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.4 }}>
        <Stack direction="row" spacing={0.7} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Typography component="label" htmlFor={id} sx={{ color: 'var(--wc-text-primary)', fontSize: 12.5, fontWeight: 800 }}>
            {label}
          </Typography>
        </Stack>
        <Typography sx={{ color: PRIMARY, fontFamily: MONO_FONT, fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap' }}>
          {display}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>

        <Slider
          id={id}
          value={value}
          min={min}
          max={max}
          step={step}
          marks={marks}
          onChange={(_, sliderValue) => onChange(roundToStep(sliderValue as number, step))}
          aria-label={label}
          sx={{
            flex: 1,
            color: PRIMARY,
            height: 4,
            mt: 1.2,
            mx: 0.4,
            '& .MuiSlider-thumb': {
              width: 16,
              height: 16,
              bgcolor: '#ffffff',
              border: `3px solid ${PRIMARY}`,
              boxShadow: '0 2px 9px rgba(10,36,99,0.22)',
              '&:hover': { boxShadow: '0 0 0 7px rgba(10,36,99,0.1)' },
            },
            '& .MuiSlider-track': { border: 'none', height: 4 },
            '& .MuiSlider-rail': { bgcolor: '#e2eaf5', height: 4, opacity: 1 },
            '& .MuiSlider-mark': { bgcolor: '#c8d6ec', width: 3, height: 3, borderRadius: '50%' },
            '& .MuiSlider-markLabel': {
              color: '#6f819b',
              fontFamily: MONO_FONT,
              fontSize: 10,
              top: 25,
              whiteSpace: 'nowrap',
            },
          }}
        />
      </Stack>
    </Box>
  )
}


function MetricCard({ label, value, icon: Icon, variant = 'default' }: MetricCardProps) {
  const isDark = variant === 'dark'
  const isPositive = variant === 'positive'

  return (
    <Box
      sx={{
        minHeight: 82,
        border: '1px solid',
        borderColor: isDark ? PRIMARY : isPositive ? 'rgba(15,138,85,0.16)' : 'var(--wc-divider)',
        borderRadius: '7px',
        bgcolor: isDark ? PRIMARY : isPositive ? 'rgba(15,138,85,0.07)' : 'var(--wc-paper)',
        color: isDark ? '#ffffff' : isPositive ? SUCCESS : 'var(--wc-text-primary)',
        p: 1.7,
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        gap: 1.2,
        alignItems: 'center',
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ color: isDark ? 'rgba(255,255,255,0.72)' : 'var(--wc-text-secondary)', fontSize: 11.5, lineHeight: 1.2 }}>
          {label}
        </Typography>
        <Typography
          sx={{
            mt: 0.65,
            color: 'inherit',
            fontFamily: MONO_FONT,
            fontSize: { xs: 16, md: 17 },
            fontWeight: 800,
            lineHeight: 1.18,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {value}
        </Typography>
      </Box>
      <Icon sx={{ color: isDark ? '#4d73d9' : isPositive ? SUCCESS : PRIMARY, fontSize: 29 }} />
    </Box>
  )
}

function ChartLegend({ color, label, dashed = false }: { color: string; label: string; dashed?: boolean }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Box sx={{ width: 30, borderTop: dashed ? `2px dashed ${color}` : `3px solid ${color}` }} />
      <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 11.5 }}>{label}</Typography>
    </Stack>
  )
}

function DateCard({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        border: '1px solid var(--wc-divider)',
        borderRadius: '7px',
        bgcolor: 'var(--wc-bg)',
        px: 1.6,
        py: 1.3,
        display: 'flex',
        alignItems: 'center',
        gap: 1.3,
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: '7px',
          border: '1px solid var(--wc-divider)',
          bgcolor: 'var(--wc-primary-light)',
          color: PRIMARY,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <CalendarMonthOutlinedIcon sx={{ fontSize: 21 }} />
      </Box>
      <Box>
        <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 11 }}>{label}</Typography>
        <Typography sx={{ color: 'var(--wc-text-primary)', fontSize: 12, fontWeight: 800 }}>{value}</Typography>
      </Box>
    </Box>
  )
}

function ScheduleTable({
  rows,
}: {
  rows: { year: number; invested: number; gains: number; balance: number }[]
}) {
  return (
    <Box sx={{ overflowX: 'auto', mt: 1.4, borderTop: '1px solid var(--wc-divider)', pt: 1.4 }}>
      <Table size="small" sx={{ minWidth: 520 }}>
        <TableHead>
          <TableRow>
            {['Year', 'Amount invested', 'Wealth gained', 'Year-end balance'].map((heading) => (
              <TableCell
                key={heading}
                sx={{
                  color: 'var(--wc-text-secondary)',
                  fontSize: 10.5,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  borderBottom: '1px solid var(--wc-divider)',
                }}
              >
                {heading}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.year} sx={{ '&:last-child td': { borderBottom: 0 } }}>
              <TableCell sx={{ color: 'var(--wc-text-secondary)', fontFamily: MONO_FONT, fontSize: 12 }}>Yr {row.year}</TableCell>
              <TableCell sx={{ color: 'var(--wc-text-secondary)', fontFamily: MONO_FONT, fontSize: 12 }}>{formatPKR(row.invested)}</TableCell>
              <TableCell sx={{ color: SUCCESS, fontFamily: MONO_FONT, fontSize: 12 }}>{formatPKR(row.gains)}</TableCell>
              <TableCell sx={{ color: PRIMARY, fontFamily: MONO_FONT, fontSize: 12, fontWeight: 800 }}>{formatPKR(row.balance)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}

function ReturnBreakdown({
  invested,
  wealthGain,
  futureValue,
  annualRate,
  years,
}: {
  invested: number
  wealthGain: number
  futureValue: number
  annualRate: number
  years: number
}) {
  const breakdown = [
    {
      label: 'Capital contribution',
      value: formatPKR(invested),
      sub: `${percentOf(invested, futureValue)}% of total value`,
      detail: 'Total amount invested across all instalments.',
      color: PRIMARY,
    },
    {
      label: 'Est. wealth gain',
      value: formatPKR(wealthGain),
      sub: `${percentOf(wealthGain, futureValue)}% of total value`,
      detail: `Compounded at ${annualRate}% p.a. over ${years} years.`,
      color: SUCCESS,
    },
    {
      label: 'Wealth multiplier',
      value: `${futureValue > 0 && invested > 0 ? (futureValue / invested).toFixed(2) : '0.00'}x`,
      sub: '',
      detail: 'How many times your invested capital has grown.',
      color: 'var(--wc-text-primary)',
    },
  ]

  return (
    <MotionReveal delay={0.04}>
      <Box
        sx={{
          border: '1px solid var(--wc-divider)',
          borderRadius: '7px',
          bgcolor: 'var(--wc-bg)',
          p: { xs: 2.2, md: 2.8 },
          boxShadow: '0 18px 42px rgba(10,36,99,0.025)',
        }}
      >
        <Typography sx={{ color: 'var(--wc-text-primary)', fontSize: 16, fontWeight: 800 }}>
          Return breakdown
        </Typography>
        <Typography sx={{ mt: 0.6, color: 'var(--wc-text-secondary)', fontSize: 12.5 }}>
          A snapshot of your projected wealth.
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
            gap: { xs: 2.2, md: 0 },
            mt: 2.6,
          }}
        >
          {breakdown.map((item, index) => (
            <Box
              key={item.label}
              sx={{
                px: { md: index === 0 ? 0 : 4 },
                borderLeft: { md: index === 0 ? 'none' : '1px solid var(--wc-divider)' },
              }}
            >
              <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 12 }}>{item.label}</Typography>
              <Typography sx={{ mt: 0.7, color: item.color, fontFamily: MONO_FONT, fontSize: { xs: 23, md: 26 }, fontWeight: 800, lineHeight: 1.15 }}>
                {item.value}
              </Typography>
              {item.sub && (
                <Typography sx={{ mt: 0.75, color: 'var(--wc-text-secondary)', fontFamily: MONO_FONT, fontSize: 11 }}>
                  {item.sub}
                </Typography>
              )}
              <Typography sx={{ mt: 0.55, color: 'var(--wc-text-secondary)', fontSize: 11.5, lineHeight: 1.55 }}>
                {item.detail}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </MotionReveal>
  )
}

function WhySip() {
  return (
    <MotionReveal delay={0.03}>
      <Box>
        <Box sx={{ textAlign: 'center', mb: 2.5 }}>
          <Typography
            variant="h2"
            sx={{
              color: 'var(--wc-text-primary)',
              fontFamily: DISPLAY_FONT,
              fontSize: { xs: 25, md: 31 },
              fontWeight: 700,
              lineHeight: 1.12,
            }}
          >
            Why SIP?
          </Typography>
          <Typography sx={{ mt: 1, color: 'var(--wc-text-secondary)', fontSize: 13 }}>
            The principles behind compounding wealth.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
            gap: 2,
          }}
        >
          {PRINCIPLES.map((item) => {
            const Icon = item.icon

            return (
              <Box
                key={item.title}
                sx={{
                  border: '1px solid var(--wc-divider)',
                  borderRadius: '7px',
                  bgcolor: 'var(--wc-bg)',
                  p: { xs: 2.2, md: 2.6 },
                  display: 'grid',
                  gridTemplateColumns: '46px minmax(0, 1fr)',
                  gap: 1.7,
                  minHeight: 146,
                  boxShadow: '0 18px 42px rgba(10,36,99,0.025)',
                }}
              >
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    bgcolor: 'var(--wc-primary-light)',
                    color: PRIMARY,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon sx={{ fontSize: 23 }} />
                </Box>
                <Box>
                  <Typography sx={{ color: 'var(--wc-text-primary)', fontSize: 14, fontWeight: 800 }}>
                    {item.title}
                  </Typography>
                  <Typography sx={{ mt: 1, color: 'var(--wc-text-secondary)', fontSize: 12.2, lineHeight: 1.65 }}>
                    {item.body}
                  </Typography>
                </Box>
              </Box>
            )
          })}
        </Box>
      </Box>
    </MotionReveal>
  )
}

function Disclaimer() {
  return (
    <MotionReveal delay={0.02}>
      <Box
        sx={{
          border: '1px solid var(--wc-divider)',
          borderRadius: '7px',
          bgcolor: 'var(--wc-bg)',
          p: { xs: 2.2, md: 2.6 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '58px minmax(0, 1fr)' },
          gap: 1.8,
          alignItems: 'center',
          boxShadow: '0 18px 42px rgba(10,36,99,0.025)',
        }}
      >
        <Box
          sx={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            bgcolor: 'var(--wc-primary-light)',
            color: PRIMARY,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ShieldOutlinedIcon sx={{ fontSize: 31 }} />
        </Box>
        <Box>
          <Typography sx={{ color: 'var(--wc-text-primary)', fontSize: 15, fontWeight: 800 }}>
            Disclaimer
          </Typography>
          <Typography sx={{ mt: 0.75, color: 'var(--wc-text-secondary)', fontSize: 12.6, lineHeight: 1.65 }}>
            This calculator is for educational and illustrative purposes only. It assumes a constant annual return
            rate which does not reflect real-world market volatility. Actual investment returns will vary. Past
            performance is not indicative of future results. Webict Capital does not provide financial advice.
            Please consult a qualified investment advisor before making investment decisions.
          </Typography>
        </Box>
      </Box>
    </MotionReveal>
  )
}
