import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useIsMobile } from './use-mobile'

describe('useIsMobile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return true when is mobile', () => {
    const mql = {
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
    window.matchMedia = vi.fn().mockReturnValue(mql)

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(true)
    // The breakpoint is 768, so query is max-width: 767px
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 767px)')
  })

  it('should return false when is not mobile', () => {
    const mql = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
    window.matchMedia = vi.fn().mockReturnValue(mql)

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)
  })

  it('should update state when media query changes', () => {
    let changeHandler
    const mql = {
      matches: false,
      addEventListener: vi.fn((event, handler) => {
        if (event === 'change') {
          changeHandler = handler
        }
      }),
      removeEventListener: vi.fn(),
    }
    window.matchMedia = vi.fn().mockReturnValue(mql)

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)

    act(() => {
      // Simulate change to mobile
      mql.matches = true
      changeHandler()
    })

    expect(result.current).toBe(true)

    act(() => {
      // Simulate change back to desktop
      mql.matches = false
      changeHandler()
    })

    expect(result.current).toBe(false)
  })

  it('should cleanup event listener on unmount', () => {
    const removeEventListener = vi.fn()
    const mql = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener,
    }
    window.matchMedia = vi.fn().mockReturnValue(mql)

    const { unmount } = renderHook(() => useIsMobile())

    unmount()

    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })
})
