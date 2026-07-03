import type { SxProps, Theme } from '@mui/material/styles'
import type { ReactNode } from 'react'

export type MarketTone = 'positive' | 'negative' | 'neutral'

export type MarketChartPalette = {
	primary: string
	success: string
	error: string
	neutral: string
	border: string
	text: string
	textSecondary: string
	tooltipBg: string
}

export type MarketChartFrameProps = {
	heading: string
	detail: string
	icon: ReactNode
	height?: number
	sx?: SxProps<Theme>
	contentSx?: SxProps<Theme>
}

export type DonutChartItem = {
	name: string
	value: number
	color?: string
}

export type BarChartItem = {
	id?: string
	label: string
	value: number
	color?: string
	tooltipLabel?: string
}

export type LineChartPoint = {
	label: string
	value: number
}

export type HeatmapItem = {
	id?: string
	label: string
	value: number
	company?: string
	changePct?: number
	color?: string
}

export type MarketLeaderItem = {
	id?: string
	symbol: string
	company: string
	price: number
	change: number
	changePct?: number
	volume?: number
	low?: number
	high?: number
	rangePct?: number
}

export type SectorActivityItem = {
	id?: string
	label: string
	turnover: number
	count?: number
	gainers?: number
	losers?: number
	unchanged?: number
	avgChangePct?: number
}

export type TooltipParam = {
	name?: string
	value?: string | number | Array<string | number>
}

export type HeatmapTooltipParam = {
	data?: {
		name?: string
		company?: string
		value?: number
		changePct?: number
	}
}
