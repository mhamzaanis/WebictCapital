import ReactECharts from 'echarts-for-react'
import { useMemo } from 'react'
import {
	DEFAULT_PALETTE,
	FONT_FAMILY,
	chartTooltipStyle,
	colorWithOpacity,
	formatPercent,
	getTooltipPoint,
} from './chartUtils'
import { EmptyChart } from './EmptyChart'
import { MarketChartCard } from './MarketChartCard'
import type { LineChartPoint, MarketChartFrameProps, MarketChartPalette, TooltipParam } from './types'

type LineChartProps = MarketChartFrameProps & {
	data: LineChartPoint[]
	emptyLabel?: string
	color?: string
	areaColor?: string
	palette?: MarketChartPalette
}

export function LineChart({
	data,
	emptyLabel = 'Line chart needs more data.',
	color,
	areaColor,
	palette = DEFAULT_PALETTE,
	...frameProps
}: LineChartProps) {
	const lineColor = color ?? palette.primary
	const option = useMemo(
		() => ({
			animation: true,
			animationDuration: 850,
			animationEasing: 'cubicOut',
			grid: { left: 42, right: 18, top: 18, bottom: 50 },
			tooltip: {
				trigger: 'axis',
				formatter: (params: TooltipParam | TooltipParam[]) => {
					const point = getTooltipPoint(params)
					return `${point.name ?? ''}<br/>Move ${formatPercent(Number(point.value ?? 0))}`
				},
				...chartTooltipStyle(palette),
			},
			xAxis: {
				type: 'category',
				boundaryGap: false,
				data: data.map((point) => point.label),
				axisLine: { lineStyle: { color: palette.border } },
				axisTick: { show: false },
				axisLabel: {
					color: palette.textSecondary,
					fontFamily: FONT_FAMILY.echartsData,
					fontSize: 11,
					interval: 0,
					rotate: 32,
				},
			},
			yAxis: {
				type: 'value',
				axisLine: { show: false },
				axisTick: { show: false },
				splitLine: { lineStyle: { color: palette.border } },
				axisLabel: {
					color: palette.textSecondary,
					fontFamily: FONT_FAMILY.echartsData,
					fontSize: 11,
					formatter: (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`,
				},
			},
			series: [
				{
					type: 'line',
					smooth: true,
					showSymbol: true,
					symbolSize: 6,
					data: data.map((point) => Number.isFinite(point.value) ? Number(point.value.toFixed(2)) : 0),
					lineStyle: { color: lineColor, width: 2 },
					itemStyle: { color: lineColor },
					areaStyle: { color: areaColor ?? colorWithOpacity(lineColor, 0.08) },
					markLine: {
						symbol: 'none',
						lineStyle: { color: palette.border, type: 'dashed' },
						label: { show: false },
						data: [{ yAxis: 0 }],
					},
				},
			],
		}),
		[areaColor, data, lineColor, palette],
	)

	return (
		<MarketChartCard {...frameProps}>
			{data.length < 2 ? (
				<EmptyChart label={emptyLabel} />
			) : (
				<ReactECharts style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} option={option} notMerge lazyUpdate />
			)}
		</MarketChartCard>
	)
}
