import type { ProblemDetails } from './types'

export type ApiErrorKind =
  | 'invalid_request'
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'writes_unavailable'
  | 'network'
  | 'infrastructure'
  | 'unknown'

export class MarketApiError extends Error {
  kind: ApiErrorKind
  status: number | null
  title: string | null
  detail: string | null
  problem: ProblemDetails | null

  constructor({
    kind,
    message,
    status,
    title = null,
    detail = null,
    problem = null,
  }: {
    kind: ApiErrorKind
    message: string
    status: number | null
    title?: string | null
    detail?: string | null
    problem?: ProblemDetails | null
  }) {
    super(message)
    this.name = 'MarketApiError'
    this.kind = kind
    this.status = status
    this.title = title
    this.detail = detail
    this.problem = problem
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof MarketApiError) return error.detail ?? error.message
  if (error instanceof Error) return error.message
  return 'Unexpected market API error.'
}
