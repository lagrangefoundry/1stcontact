import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  ACCEPTANCE_KEYS,
  BETA_REQUESTED,
  DOCUMENT,
  NEWSLETTER,
  PREFERENCE,
  PRIVACY_POLICY_ACCEPTED,
  REQUEST,
  T_AND_C_ACCEPTED,
  WHITEPAPERS,
  acceptanceLabel,
  acceptanceType,
  holdsState,
  isAcceptanceKey,
  isRevocable,
  needsDocument,
} from '../apps/control-app/src/builder/acceptances.js'
import { describeAcceptance } from '../apps/control-app/src/builder/people.js'

/**
 * REQ-240 — **the registry is one module, and it is reachable from both sides**.
 *
 * WHAT THIS FILE PROVES, next to its workers sibling. That one proves the writes
 * against real rows inside workerd — which is also where it proves the registry
 * is readable from the Worker, by importing it there. This one proves the other
 * half: that the same module loads OUTSIDE workerd with no build step and no
 * dependency, which is what "a browser panel can read it" means, and that the
 * panel phrases a contact's agreements from it rather than from a second table
 * of its own.
 *
 * THE IMPORT-FREE PROPERTY IS ASSERTED OF THE SOURCE, not inferred from this
 * file happening to load. A single `import` added later would still load here —
 * the test runner resolves whatever it names — and would break the module for a
 * browser that has no import map for it. So the text is read and checked.
 *
 * AND THE WRITE PATH IS NOT A ROUTE, asserted the only way a negative can be:
 * of the router's own source. A UAT can prove a function is callable without a
 * session; it cannot prove no route exists by calling one.
 */

const read = (relative: string): string =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')

describe('REQ-240 — one module, no imports', () => {
  it('test_UAT_FC_REQ-240_the_registry_has_no_imports_of_its_own', () => {
    const source = read('../apps/control-app/src/builder/acceptances.js')
    // The same property `contact-events.js` and `people-axes.js` hold, and for
    // the same reason: the one definition has to be reachable from both sides of
    // the seam. A module with a dependency is a module the browser needs an
    // import map for before it can draw a label.
    expect(source).not.toMatch(/^\s*import\s/m)
    expect(source).not.toMatch(/\brequire\(/)
    expect(source).not.toMatch(/\bfrom\s+['"]/)
  })

  it('test_UAT_FC_REQ-240_every_key_declares_exactly_one_of_the_three_types', () => {
    expect(ACCEPTANCE_KEYS).toEqual([
      T_AND_C_ACCEPTED,
      PRIVACY_POLICY_ACCEPTED,
      NEWSLETTER,
      BETA_REQUESTED,
      WHITEPAPERS,
    ])
    for (const key of ACCEPTANCE_KEYS) {
      expect([DOCUMENT, PREFERENCE, REQUEST]).toContain(acceptanceType(key))
      expect(isAcceptanceKey(key)).toBe(true)
      expect(acceptanceLabel(key)).not.toBe('')
    }

    // THE THREE BEHAVE DIFFERENTLY, AND THE TYPE IS WHAT EVERY WRITER BRANCHES
    // ON. A document is versioned and is not the contact's to revoke; a
    // preference goes both ways; a request has no state to hold at all.
    expect(needsDocument(T_AND_C_ACCEPTED)).toBe(true)
    expect(isRevocable(T_AND_C_ACCEPTED)).toBe(false)
    expect(holdsState(T_AND_C_ACCEPTED)).toBe(true)

    expect(needsDocument(NEWSLETTER)).toBe(false)
    expect(isRevocable(NEWSLETTER)).toBe(true)
    expect(holdsState(NEWSLETTER)).toBe(true)

    expect(holdsState(WHITEPAPERS)).toBe(false)
    expect(isRevocable(WHITEPAPERS)).toBe(false)
  })

  it('test_UAT_FC_REQ-240_beta_requested_does_not_claim_they_are_in_the_beta', () => {
    // They ASKED to be in the beta; whether they are in it is the business's
    // decision and lives in entitlements. A label reading "Beta: on" would be
    // read as "I am in the beta", which may be false.
    expect(acceptanceLabel(BETA_REQUESTED).toLowerCase()).toContain('asked')
    expect(ACCEPTANCE_KEYS).not.toContain('beta_inclusion')
  })

  it('test_UAT_FC_REQ-240_an_undeclared_key_is_not_a_key', () => {
    expect(isAcceptanceKey('news_letter')).toBe(false)
    expect(acceptanceType('news_letter')).toBeNull()
    // Inherited properties are not declarations. `constructor` is on every plain
    // object, and a registry that answered for it would answer for a key nobody
    // wrote.
    expect(isAcceptanceKey('constructor')).toBe(false)
    expect(acceptanceType('constructor')).toBeNull()
    // An unknown key still RENDERS, as itself — a row drawn blank is
    // indistinguishable from a pane that failed to load.
    expect(acceptanceLabel('news_letter')).toBe('news_letter')
  })
})

describe('REQ-240 — what the operator is shown', () => {
  it('test_UAT_FC_REQ-240_the_panel_says_which_way_the_last_act_went', () => {
    const granted = describeAcceptance({
      key: NEWSLETTER,
      granted: true,
      setAt: '2026-09-13T09:30:00.000Z',
    })
    expect(granted.label).toBe(acceptanceLabel(NEWSLETTER))
    expect(granted.value).toBe('Agreed')
    expect(granted.when).toBe('2026-09-13 09:30')

    // WITHDRAWN IS A VALUE AND NOT AN ABSENCE. "Never asked" is a row that does
    // not exist; this row exists and says they said no, and the two must not
    // draw the same.
    const withdrawn = describeAcceptance({
      key: NEWSLETTER,
      granted: false,
      setAt: '2026-09-12T17:05:00.000Z',
    })
    expect(withdrawn.value).toBe('Withdrawn')
  })
})

describe('REQ-240 — a service, not a route', () => {
  it('test_UAT_FC_REQ-240_no_http_route_writes_an_acceptance', () => {
    // §6's property, asserted of the router. The write is a function so that a
    // public self-serve sign-up — which has no builder session — can call it;
    // putting it behind an authenticated route would preclude exactly the thing
    // this round must not preclude.
    const router = read('../apps/control-app/src/router.ts')
    expect(router).not.toContain('recordAcceptance')
    expect(router).not.toMatch(/from '\.\/acceptances'/)
  })
})
