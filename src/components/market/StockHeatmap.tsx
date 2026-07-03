import ReactECharts from 'echarts-for-react'
import { useMemo } from 'react'
import {
	DEFAULT_PALETTE,
	chartTooltipStyle,
	formatCompactNumber,
	formatPercent,
	heatmapColor,
} from './chartUtils'
import { EmptyChart } from './EmptyChart'
import { MarketChartCard } from './MarketChartCard'
import type { HeatmapItem, HeatmapTooltipParam, MarketChartFrameProps, MarketChartPalette } from './types'

type HeatmapColors = {
	positive?: string
	negative?: string
	neutral?: string
}

type StockHeatmapProps = MarketChartFrameProps & {
	data: HeatmapItem[]
	emptyLabel?: string
	colors?: HeatmapColors
	palette?: MarketChartPalette
}

export function StockHeatmap({
	data,
	emptyLabel = 'Heatmap data is unavailable.',
	colors,
	palette = DEFAULT_PALETTE,
	...frameProps
}: StockHeatmapProps) {
	const heatmapPalette = useMemo(
		() => ({
			...palette,
			success: colors?.positive ?? palette.success,
			error: colors?.negative ?? palette.error,
		}),
		[colors?.negative, colors?.positive, palette],
	)

	const option = useMemo(
		() => ({
			animation: true,
			animationDuration: 900,
			animationEasing: 'cubicOut',
			tooltip: {
				formatter: (param: HeatmapTooltipParam) => {
					const item = param.data
					return `${item?.name ?? ''}<br/>${item?.company ?? ''}<br/>Move ${formatPercent(item?.changePct ?? NaN)}<br/>Volume ${formatCompactNumber(item?.value ?? NaN)}`
				},
				...chartTooltipStyle(palette),
			},
			series: [
				{
					type: 'treemap',
					roam: false,
					nodeClick: false,
					breadcrumb: { show: false },
					squareRatio: 1.15,
					top: 4,
					left: 4,
					right: 4,
					bottom: 4,
					itemStyle: {
						borderColor: '#ffffff',
						borderWidth: 2,
						gapWidth: 2,
					},
					label: {
						show: true,
						formatter: '{b}',
						fontFamily: 'JetBrains Mono, monospace',
						fontSize: 11,
						fontWeight: 800,
					},
					upperLabel: { show: false },
					data: data.map((item) => ({
						name: item.label,
						value: Math.max(1, item.value),
						company: item.company,
						changePct: item.changePct,
						itemStyle: { color: item.color ?? heatmapColor(item.changePct ?? NaN, heatmapPalette, colors?.neutral) },
						label: {
							color: Number.isFinite(item.changePct) && Math.abs(item.changePct ?? 0) > 2 ? '#ffffff' : palette.text,
						},
					})),
				},
			],
		}),
		[colors?.neutral, data, heatmapPalette, palette],
	)

	return (
		<MarketChartCard {...frameProps}>
			{data.length === 0 ? (
				<EmptyChart label={emptyLabel} />
			) : (
				<ReactECharts style={{ height: '100%', width: '100%' }} opts={{ renderer: 'canvas' }} option={option} notMerge lazyUpdate />
			)}
		</MarketChartCard>
	)
}
