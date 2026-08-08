type ResetPrivateState = () => void

const resetHandlers = new Set<ResetPrivateState>()
const privateRequestControllers = new Set<AbortController>()

export function registerPrivateStateReset(handler: ResetPrivateState): () => void {
  resetHandlers.add(handler)
  return () => resetHandlers.delete(handler)
}

export function registerPrivateRequest(controller: AbortController): () => void {
  privateRequestControllers.add(controller)
  return () => privateRequestControllers.delete(controller)
}

export function clearAllPrivateState(): void {
  for (const controller of privateRequestControllers) controller.abort()
  privateRequestControllers.clear()
  for (const handler of resetHandlers) handler()
}
