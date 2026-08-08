import { deleteWatchlistItem, putWatchlistItem } from './api/portfolio'
import { addToWatchlist, removeFromWatchlist } from './stockService'
import { getRuntimeConfig } from './runtimeConfig'

export async function addSymbolToWatchlist(symbol: string, signal?: AbortSignal): Promise<void> {
  if (getRuntimeConfig().platformMode === 'webict') {
    await putWatchlistItem(symbol, signal)
    return
  }
  await addToWatchlist(symbol)
}

export async function removeSymbolFromWatchlist(symbol: string, signal?: AbortSignal): Promise<void> {
  if (getRuntimeConfig().platformMode === 'webict') {
    await deleteWatchlistItem(symbol, signal)
    return
  }
  await removeFromWatchlist(symbol)
}
