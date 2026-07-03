import { Box, Typography } from '@mui/material'

export function EmptyChart({ label }: { label: string }) {
	return (
		<Box
			sx={{
				height: '100%',
				minHeight: 180,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				border: '1px dashed var(--wc-divider)',
				borderRadius: 1,
				bgcolor: 'var(--wc-paper)',
			}}
		>
			<Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 12 }}>
				{label}
			</Typography>
		</Box>
	)
}
