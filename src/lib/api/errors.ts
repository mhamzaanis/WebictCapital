export type ApiErrorKind = 'invalid_request' | 'not_found' | 'network' | 'infrastructure' | 'unknown'

export class MarketApiError extends Error {
  kind: ApiErrorKind
  status: number | null
  title: string | null
  detail: string | null

  constructor({
    kind,
    message,
    status,
    title = null,
    detail = null,
  }: {
    kind: ApiErrorKind
    message: string
    status: number | null
    title?: string | null
    detail?: string | null
  }) {
    super(message)
    this.name = 'MarketApiError'
    this.kind = kind
    this.status = status
    this.title = title
    this.detail = detail
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof MarketApiError) return error.detail ?? error.message
  if (error instanceof Error) return error.message
  return 'Unexpected market API error.'
}
