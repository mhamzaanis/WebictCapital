import { deleteWatchlistItem, putWatchlistItem } from './api/portfolio'
import { getRuntimeConfig } from './runtimeConfig'

export async function addSymbolToWatchlist(symbol: string, signal?: AbortSignal): Promise<void> {
  if (getRuntimeConfig().platformMode === 'webict') {
    await putWatchlistItem(symbol, signal)
    return
  }
  const { addToWatchlist } = await import('./stockService')
  await addToWatchlist(symbol)
}

export async function removeSymbolFromWatchlist(symbol: string, signal?: AbortSignal): Promise<void> {
  if (getRuntimeConfig().platformMode === 'webict') {
    await deleteWatchlistItem(symbol, signal)
    return
  }
  const { removeFromWatchlist } = await import('./stockService')
  await removeFromWatchlist(symbol)
}
