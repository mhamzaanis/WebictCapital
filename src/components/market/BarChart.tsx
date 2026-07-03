import ReactECharts from 'echarts-for-react'
import { useMemo } from 'react'
import {
	DEFAULT_PALETTE,
	chartTooltipStyle,
	formatCompactNumber,
	getTooltipPoint,
} from './chartUtils'
import { EmptyChart } from './EmptyChart'
import { MarketChartCard } from './MarketChartCard'
import type { BarChartItem, MarketChartFrameProps, MarketChartPalette, TooltipParam } from './types'

type BarChartProps = MarketChartFrameProps & {
	data: BarChartItem[]
	left?: number
	barWidth?: number
	emptyLabel?: string
	color?: string
	colors?: string[]
	palette?: MarketChartPalette
}

export function BarChart({
	data,
	left = 52,
	barWidth = 14,
	emptyLabel = 'Bar chart data is unavailable.',
	color,
	colors,
	palette = DEFAULT_PALETTE,
	...frameProps
}: BarChartProps) {
	const option = useMemo(
		() => ({
			animation: true,
			animationDuration: 800,
			animationEasing: 'quarticOut',
			grid: { left, right: 18, top: 12, bottom: 28 },
			tooltip: {
				trigger: 'axis',
				axisPointer: { type: 'shadow' },
				formatter: (params: TooltipParam | TooltipParam[]) => {
					const point = getTooltipPoint(params)
					const label = data.find((item) => item.label === point.name)?.tooltipLabel ?? 'Value'
					return `${point.name ?? ''}<br/>${label} ${formatCompactNumber(Number(point.value ?? 0))}`
				},
				...chartTooltipStyle(palette),
			},
			xAxis: {
				type: 'value',
				axisLine: { show: false },
				axisTick: { show: false },
				splitLine: { lineStyle: { color: palette.border } },
				axisLabel: {
					color: palette.textSecondary,
					fontFamily: 'JetBrains Mono, monospace',
					fontSize: 10,
					formatter: (value: number) => formatCompactNumber(value),
				},
			},
			yAxis: {
				type: 'category',
				inverse: true,
				data: data.map((item) => item.label),
				axisLine: { show: false },
				axisTick: { show: false },
				axisLabel: {
					color: palette.text,
					fontFamily: 'JetBrains Mono, monospace',
					fontSize: 10,
					fontWeight: 700,
					width: Math.max(52, left - 14),
					overflow: 'truncate',
				},
			},
			series: [
				{
					type: 'bar',
					data: data.map((item, index) => ({
						value: item.value,
						itemStyle: { color: item.color ?? colors?.[index] ?? color ?? palette.primary },
					})),
					barWidth,
					itemStyle: { borderRadius: [0, 5, 5, 0] },
				},
			],
		}),
		[barWidth, color, colors, data, left, palette],
	)

	return (
		<MarketChartCard {...frameProps}>
			{data.length === 0 ? (
				<EmptyChart label={emptyLabel} />
			) : (
				<ReactECharts style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} option={option} notMerge lazyUpdate />
			)}
		</MarketChartCard>
	)
}
