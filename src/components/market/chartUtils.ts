import type { SxProps, Theme } from '@mui/material/styles'
import type { MarketChartPalette, MarketTone, TooltipParam } from './types'

export const DEFAULT_PALETTE: MarketChartPalette = {
	primary: '#0a2463',
	success: '#1a6640',
	error: '#b4283a',
	neutral: '#8a9bb0',
	border: '#e2eaf5',
	text: '#080e1a',
	textSecondary: '#4a5e78',
	tooltipBg: 'rgba(255,255,255,0.98)',
}

export function mergeSx(base: SxProps<Theme>, sx?: SxProps<Theme>): SxProps<Theme> {
	if (!sx) return base
	return [base, ...(Array.isArray(sx) ? sx : [sx])] as SxProps<Theme>
}

export function getTooltipPoint(params: TooltipParam | TooltipParam[]): TooltipParam {
	return Array.isArray(params) ? params[0] ?? {} : params
}

export function chartTooltipStyle(palette: MarketChartPalette) {
	return {
		backgroundColor: palette.tooltipBg,
		borderColor: palette.border,
		borderWidth: 1,
		textStyle: { color: palette.text, fontFamily: 'Inter, sans-serif', fontSize: 11 },
		extraCssText: 'box-shadow:0 8px 24px rgba(8,14,26,0.10);border-radius:6px;',
	}
}

export function formatNumber(value: number, maximumFractionDigits = 2): string {
	if (!Number.isFinite(value)) return '-'
	return value.toLocaleString('en-PK', { maximumFractionDigits })
}

export function formatCompactNumber(value: number): string {
	if (!Number.isFinite(value)) return '-'
	const abs = Math.abs(value)
	const sign = value < 0 ? '-' : ''
	if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(2)}B`
	if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(2)}M`
	if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`
	return value.toLocaleString('en-PK')
}

export function formatSignedNumber(value: number, maximumFractionDigits = 2): string {
	if (!Number.isFinite(value)) return '-'
	if (value === 0) return '0'
	const formatted = Math.abs(value).toLocaleString('en-PK', { maximumFractionDigits })
	return `${value > 0 ? '+' : '-'}${formatted}`
}

export function formatPercent(value: number, signed = true): string {
	if (!Number.isFinite(value)) return '-'
	const formatted = Math.abs(value).toLocaleString('en-PK', { maximumFractionDigits: 2 })
	if (!signed || value === 0) return `${formatted}%`
	return `${value > 0 ? '+' : '-'}${formatted}%`
}

export function toneColor(tone: MarketTone, palette: MarketChartPalette): string {
	if (tone === 'positive') return palette.success
	if (tone === 'negative') return palette.error
	return palette.textSecondary
}

function hexToRgb(color: string): [number, number, number] | null {
	const normalized = color.replace('#', '')
	if (normalized.length !== 6) return null
	const value = Number.parseInt(normalized, 16)
	if (!Number.isFinite(value)) return null
	return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

export function colorWithOpacity(color: string, opacity: number): string {
	const rgb = hexToRgb(color)
	if (!rgb) return color
	return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${opacity})`
}

export function heatmapColor(
	changePct: number,
	palette: MarketChartPalette,
	neutralColor = '#eef2f7',
): string {
	if (!Number.isFinite(changePct) || changePct === 0) return neutralColor
	const clamped = Math.min(6, Math.abs(changePct))
	const opacity = 0.24 + (clamped / 6) * 0.62
	return colorWithOpacity(changePct > 0 ? palette.success : palette.error, opacity)
}
