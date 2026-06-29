import { Button, type ButtonProps } from '@mui/material'

const baseSx = {
  textTransform: 'none',
  px: 3.2,
  py: 1.2,
  borderRadius: 1,
  fontSize: 14.5,
  fontWeight: 500,
  letterSpacing: '0.01em',
}

const containedSx = {
  bgcolor: 'var(--wc-text-primary)',
  color: '#ffffff',
  '&:hover': { bgcolor: 'var(--wc-primary)' },
}

const outlinedSx = {
  borderColor: 'var(--wc-divider)',
  color: 'var(--wc-primary)',
  '&:hover': { borderColor: 'var(--wc-primary)', bgcolor: 'var(--wc-primary-light)' },
}

type CustomButtonProps = Omit<ButtonProps, 'sx'> & {
  tone?: 'default' | 'light'
}

export function CustomButton({
  variant = 'contained',
  disableElevation = true,
  tone = 'default',
  ...props
}: CustomButtonProps) {
  const toneSx =
    tone === 'light'
      ? {
          bgcolor: '#ffffff',
          color: 'var(--wc-text-primary)',
          '&:hover': { bgcolor: 'var(--wc-primary-light)' },
        }
      : {}

  return (
    <Button
      {...props}
      variant={variant}
      disableElevation={disableElevation}
      sx={{
        ...baseSx,
        ...(variant === 'outlined' ? outlinedSx : containedSx),
        ...toneSx,
      }}
    />
  )
}
