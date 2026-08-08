import { describe, expect, it, vi } from 'vitest'
import { clearAllPrivateState, registerPrivateRequest, registerPrivateStateReset } from './privateState'

describe('private state privacy', () => {
  it('aborts in-flight requests and removes prior-user state immediately', () => {
    const reset = vi.fn()
    const controller = new AbortController()
    const unregisterReset = registerPrivateStateReset(reset)
    registerPrivateRequest(controller)
    clearAllPrivateState()
    expect(controller.signal.aborted).toBe(true)
    expect(reset).toHaveBeenCalledOnce()
    unregisterReset()
  })
})
