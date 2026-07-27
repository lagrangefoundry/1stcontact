/**
 * BUG-28 — `contact-form` only enhances submissions it can actually enhance.
 *
 * `assertSafeUrl` accepts `mailto:` and `tel:` actions, but `fetch()` cannot send
 * to either. `client.js` intercepted unconditionally — `preventDefault()` then
 * `fetch(action)` — so those forms rejected, reported "could not reach the
 * server", and could not fall back, because the native submit they would have
 * worked by had already been cancelled. The module's own `isolation` obligation
 * promises the opposite: that a failure degrades to the no-JS post baseline.
 *
 * The scheme already carries the answer, so no config field was added for it
 * (DOC-25 §2 — a dial for something the data determines is the wrong shape).
 */
import { describe, expect, it } from 'vitest'

describe('BUG-28 — a non-fetchable action keeps its native submit', () => {
  /** The guard as shipped in `contact-form/client.js`. */
  const canEnhance = (action: string): boolean => {
    try {
      const scheme = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(String(action).trim())
      return !scheme || /^https?$/i.test(scheme[1])
    } catch {
      return false
    }
  }

  it('test_UAT_FC_BUG-28_mailto_and_tel_are_not_intercepted', () => {
    // These validate through `assertSafeUrl` but fetch() cannot send to them, so
    // intercepting produced "could not reach the server" on a form that would
    // have worked by native submit — and preventDefault had already cancelled it.
    expect(canEnhance('mailto:hello@xgd.dev')).toBe(false)
    expect(canEnhance('tel:+441234567890')).toBe(false)
  })

  it('test_UAT_FC_BUG-28_http_and_relative_actions_still_enhance', () => {
    expect(canEnhance('https://api.example.com/lead')).toBe(true)
    expect(canEnhance('http://localhost:8787/lead')).toBe(true)
    expect(canEnhance('/api/lead')).toBe(true)
    expect(canEnhance('')).toBe(true) // post to self
  })

  it('test_UAT_FC_BUG-28_any_other_scheme_falls_back_to_the_browser', () => {
    // The guard is an allowlist, not a mailto/tel denylist: anything fetch() may
    // not be able to send to keeps its native submit.
    for (const action of ['ftp://host/x', 'sms:+44', 'file:///tmp/x']) {
      expect(canEnhance(action)).toBe(false)
    }
    // A schemeless string is a *relative* URL, which fetch handles — so it
    // enhances, and no defensive branch should mistake it for unparseable.
    expect(canEnhance('::::')).toBe(true)
  })
})
