import { cn } from '../utils'

describe('cn utility function', () => {
  it('merges class names correctly', () => {
    const result = cn('class1', 'class2')
    expect(result).toContain('class1')
    expect(result).toContain('class2')
  })

  it('handles conditional classes', () => {
    const result = cn('base', true && 'included', false && 'excluded')
    expect(result).toContain('base')
    expect(result).toContain('included')
    expect(result).not.toContain('excluded')
  })

  it('handles undefined and null values', () => {
    const result = cn('class1', undefined, null, 'class2')
    expect(result).toContain('class1')
    expect(result).toContain('class2')
  })

  it('handles empty strings', () => {
    const result = cn('class1', '', 'class2')
    expect(result).toContain('class1')
    expect(result).toContain('class2')
  })

  it('merges Tailwind classes correctly', () => {
    // Test that conflicting Tailwind classes are properly merged
    const result = cn('px-2 py-1', 'px-4')
    // Should keep px-4 (the later one) and py-1
    expect(result).toContain('px-4')
    expect(result).toContain('py-1')
    expect(result).not.toContain('px-2')
  })

  it('handles array of classes', () => {
    const result = cn(['class1', 'class2'], 'class3')
    expect(result).toContain('class1')
    expect(result).toContain('class2')
    expect(result).toContain('class3')
  })

  it('handles object with conditional classes', () => {
    const result = cn({
      'always-included': true,
      'conditionally-excluded': false,
      'conditionally-included': true
    })
    expect(result).toContain('always-included')
    expect(result).toContain('conditionally-included')
    expect(result).not.toContain('conditionally-excluded')
  })

  it('returns empty string for no arguments', () => {
    const result = cn()
    expect(result).toBe('')
  })
})
