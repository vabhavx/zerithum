import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('should merge class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2')
  })

  it('should handle conditional classes', () => {
    expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3')
    expect(cn('class1', true && 'class2', 'class3')).toBe('class1 class2 class3')
    expect(cn('class1', null, undefined, 'class3')).toBe('class1 class3')
  })

  it('should handle tailwind conflicts', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    expect(cn('px-2 py-1', 'p-4')).toBe('p-4')
  })

  it('should handle arrays and objects', () => {
    expect(cn(['class1', 'class2'])).toBe('class1 class2')
    expect(cn({ 'class1': true, 'class2': false })).toBe('class1')
    expect(cn(['class1'], { 'class2': true })).toBe('class1 class2')
  })

  it('should handle empty inputs', () => {
      expect(cn()).toBe('')
      expect(cn(null)).toBe('')
      expect(cn(undefined)).toBe('')
  })
})

describe('isIframe', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should be true when window.self !== window.top', async () => {
    vi.stubGlobal('window', { self: 'foo', top: 'bar' })
    const { isIframe } = await import('./utils')
    expect(isIframe).toBe(true)
  })

  it('should be false when window.self === window.top', async () => {
    const mockWindow = { }
    mockWindow.self = mockWindow
    mockWindow.top = mockWindow

    vi.stubGlobal('window', mockWindow)
    const { isIframe } = await import('./utils')
    expect(isIframe).toBe(false)
  })
})
