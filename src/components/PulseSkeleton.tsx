import { Skeleton } from '@mui/material'
import type { SkeletonProps } from '@mui/material'

const baseSkeletonSx = {
  bgcolor: 'var(--wc-primary-light, rgba(10,36,99,0.12))',
}

type PulseSkeletonProps = Omit<SkeletonProps, 'animation'> & {
  shape?: SkeletonProps['variant']
  borderRadius?: number | string
}

export function PulseSkeleton({
  shape,
  variant,
  width,
  height,
  borderRadius,
  sx,
  ...rest
}: PulseSkeletonProps) {
  const resolvedVariant = variant ?? shape ?? 'rounded'

  return (
    <Skeleton
      animation="pulse"
      variant={resolvedVariant}
      width={width}
      height={height}
      sx={[baseSkeletonSx, borderRadius != null ? { borderRadius } : null, sx]}
      {...rest}
    />
  )
}
