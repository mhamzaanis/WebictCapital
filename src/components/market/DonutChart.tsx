import ReactECharts from 'echarts-for-react'
import { useMemo } from 'react'
import {
	DEFAULT_PALETTE,
	chartTooltipStyle,
} from './chartUtils'
import { EmptyChart } from './EmptyChart'
import { MarketChartCard } from './MarketChartCard'
import type { DonutChartItem, MarketChartFrameProps, MarketChartPalette } from './types'

type DonutChartProps = MarketChartFrameProps & {
	data: DonutChartItem[]
	centerText?: string
	centerSubtext?: string
	emptyLabel?: string
	colors?: string[]
	palette?: MarketChartPalette
}

export function DonutChart({
	data,
	centerText,
	centerSubtext = 'items',
	emptyLabel = 'Donut chart data is unavailable.',
	colors,
	palette = DEFAULT_PALETTE,
	...frameProps
}: DonutChartProps) {
	const total = data.reduce((sum, item) => sum + item.value, 0)
	const option = useMemo(() => {
		const resolvedColors = data
			.map((item, index) => item.color ?? colors?.[index])
			.filter((color): color is string => Boolean(color))

		return {
			animation: true,
			animationDuration: 700,
			animationEasing: 'cubicOut',
			color: resolvedColors.length > 0 ? resolvedColors : undefined,
			tooltip: {
				trigger: 'item',
				formatter: '{b}: {c} ({d}%)',
				...chartTooltipStyle(palette),
			},
			legend: {
				bottom: 0,
				left: 'center',
				icon: 'circle',
				itemWidth: 8,
				itemHeight: 8,
				textStyle: { color: palette.textSecondary, fontFamily: 'JetBrains Mono, monospace', fontSize: 10 },
			},
			series: [
				{
					type: 'pie',
					radius: ['58%', '78%'],
					center: ['50%', '43%'],
					avoidLabelOverlap: true,
					itemStyle: { borderColor: '#ffffff', borderWidth: 2 },
					label: {
						color: palette.textSecondary,
						fontFamily: 'JetBrains Mono, monospace',
						fontSize: 10,
						formatter: '{d}%',
					},
					labelLine: { length: 8, length2: 6 },
					data,
				},
			],
			graphic: [
				{
					type: 'text',
					left: 'center',
					top: '38%',
					style: {
						text: centerText ?? total.toLocaleString('en-PK'),
						fill: palette.text,
						font: '700 20px JetBrains Mono',
						textAlign: 'center',
					},
				},
				{
					type: 'text',
					left: 'center',
					top: '49%',
					style: {
						text: centerSubtext,
						fill: palette.textSecondary,
						font: '500 10px JetBrains Mono',
						textAlign: 'center',
					},
				},
			],
		}
	}, [centerSubtext, centerText, colors, data, palette, total])

	return (
		<MarketChartCard {...frameProps}>
			{total <= 0 ? (
				<EmptyChart label={emptyLabel} />
			) : (
				<ReactECharts style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} option={option} notMerge lazyUpdate />
			)}
		</MarketChartCard>
	)
}
