// @vitest-environment jsdom
/**
 * [[REQ-297]] — **the operator console's gate, and the path its flag travels**.
 *
 * WHAT THIS FILE STILL PROVES, AND WHAT [[REQ-298]] TOOK. REQ-297 built the
 * console as a DIALOG holding a LEAGUE of tenants with rows that expanded in
 * place. REQ-298 explicitly superseded all three of those — the container, the
 * content, and the registry's subject — so the cases that asserted them were
 * deleted rather than left beside their replacements. They are not gone from the
 * matrix: `test_UAT_FC_REQ-298_console_view` asserts the container and
 * `test_UAT_FC_REQ-298_console_panes` asserts the content, both against the
 * shipped modules.
 *
 * WHAT SURVIVED IS EVERYTHING REQ-298 SAID IT REUSED UNCHANGED:
 *
 *   1. THE ACTION IS GATED ON OWNING THE PLATFORM BUSINESS, and never on an
 *      admin level — `platform_operator` keeps `scope.ts` as its only reader.
 *   2. THE FACT IT IS GATED ON TRAVELS, from the endpoint that answers it,
 *      through the reader the browser calls, to the chrome that renders on it.
 *      This is the seam that was once broken with every part of it working.
 *   3. THE TWO METER PATHS THE CLIENT USES ARE THE ROUTER'S OWN.
 *   4. MONEY AND WINDOWS ARE FORMATTED IN ONE PLACE, and an absence is a dash
 *      and never `$0.00`.
 *
 * All four are statements about the METER and the GATE rather than about the
 * surface, which is exactly the boundary REQ-298 drew when it replaced the
 * container: *a change of container and content, not of meter*.
 */

import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { consoleActions } from '../apps/control-app/src/builder/console.js'
import { fetchBusinesses } from '../apps/control-app/src/builder/api.js'
import { dollars, periodOfDays } from '../apps/control-app/src/builder/tenant-cost.js'
import * as CONFIG from '../apps/control-app/src/builder/config.js'

const REPO = path.resolve(__dirname, '..')
const BUILDER = path.join(REPO, 'apps/control-app/src/builder')
const settle = () => new Promise((r) => setTimeout(r, 0))

const NOW = Date.parse('2026-09-22T12:00:00.000Z')
const DAY = 24 * 60 * 60 * 1000

beforeEach(() => {
  document.body.replaceChildren()
})

// ── the gate ─────────────────────────────────────────────────────────────────

describe('REQ-297 — the action is gated on owning the platform business', () => {
  it('test_UAT_FC_REQ-297_a_session_that_owns_nothing_here_gets_no_action_at_all', () => {
    // NOT A DISABLED CONTROL AND NOT A DIFFERENT-LOOKING REFUSAL. A caller who
    // does not own the 1st Contact business gets the same chrome they would get
    // if the console did not exist.
    expect(consoleActions({ ownsPlatformBusiness: false })).toEqual([])
    expect(consoleActions({})).toEqual([])

    const [action] = consoleActions({ ownsPlatformBusiness: true, open: () => {} })
    expect(action.id).toBe(CONFIG.CONSOLE_ACTION_ID)
    expect(action.ariaLabel).toBe(CONFIG.CONSOLE_LABEL)
    // It is an ACTION and never a tab: the tab strip is uniformly
    // business-scoped and this console is about every tenant at once. [[REQ-298]]
    // replaced what the action opens and left this untouched.
    expect(CONFIG.TABS.map((t: { id: string }) => t.id)).not.toContain(CONFIG.CONSOLE_ACTION_ID)
  })

  it('test_UAT_FC_REQ-297_the_gate_is_ownership_and_never_the_platform_operator_column', () => {
    // [[DOC-42]] §7 and `identity.ts`, in the form that survives a refactor.
    // `scope.ts` is `platform_operator`'s only reader and must stay so — a
    // surface that appeared "because you are an admin" is [[DOC-40]] §2.1 rule
    // 1's named failure mode, and this console is the surface most likely to
    // acquire it.
    //
    // THE FILE LIST GREW WITH [[REQ-298]]. The console's body and its sections
    // are new surfaces behind the same gate, so they are held to the same rule —
    // a check that only covered the modules REQ-297 happened to write would stop
    // being the claim it is every time the console gains a part.
    for (const file of ['console.js', 'platform-sites.js', 'tenant-cost.js', 'app.js']) {
      const source = fs.readFileSync(path.join(BUILDER, file), 'utf8')
      const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
      expect(code, `${file} must not read platform_operator`).not.toContain('platform_operator')
      expect(code, `${file} must not gate on an admin level`).not.toMatch(/\bisAdmin\b|\blevel\b/)
    }
  })

  it('test_UAT_FC_REQ-297_the_two_meter_paths_the_control_reads_are_the_routers_own', () => {
    // THE LITERALS ARE DUPLICATED AND A UAT PINS THEM. `api.js` is browser
    // JavaScript and cannot import the Worker's TypeScript — the same
    // constraint `SIGN_OUT_HREF` lives under — so the two are held equal here
    // rather than by an import. A typo would otherwise be a 404 that looks
    // exactly like the console's own refusal.
    const client = fs.readFileSync(path.join(BUILDER, 'api.js'), 'utf8')
    const router = fs.readFileSync(path.join(REPO, 'apps/control-app/src/router.ts'), 'utf8')
    for (const declared of [
      "export const ADMIN_SPEND_PATH = '/api/admin/spend'",
      "export const ADMIN_BUSINESS_SPEND_PATH = '/api/admin/spend/businesses'",
    ]) {
      expect(router).toContain(declared)
      expect(client).toContain(declared.split("'")[1])
    }
  })
})

// ── the flag arrives ─────────────────────────────────────────────────────────

/**
 * A `/api/businesses` response, exactly as the route composes it.
 *
 * THE THIRD FIELD IS THE POINT. A fixture carrying only what a case reads would
 * be a fixture that cannot catch a reader dropping a field, which is the defect
 * these cases exist for.
 */
const businessesResponse = (ownsPlatformBusiness: boolean) => ({
  ok: true,
  status: 200,
  json: async () => ({
    person: { name: 'Martin', email: 'operator@example.test' },
    businesses: [{ id: 'biz_platform', name: '1st Contact', selectable: true, lapse: null }],
    ownsPlatformBusiness,
  }),
})

describe('REQ-297 — the flag reaches the chrome that renders on it', () => {
  it('test_UAT_FC_REQ-297_the_reader_carries_ownership_through_to_the_mount', async () => {
    // THE SEAM, AND WHY IT NEEDS A CASE OF ITS OWN. Every case above hands the
    // gate a flag that is already in hand. `fetchBusinesses` rebuilds its result
    // from NAMED fields, so a fact the endpoint answers and that list does not
    // name is dropped between a server saying `true` and a gate that is correct
    // — which is a console that is missing with every part of it working.
    const owner = await fetchBusinesses((async () => businessesResponse(true)) as never)
    expect(owner.ownsPlatformBusiness).toBe(true)
    // The two facts that were always carried are still carried: this is a third
    // field, not a replacement shape.
    expect(owner.person).toEqual({ name: 'Martin', email: 'operator@example.test' })
    expect(owner.businesses).toHaveLength(1)

    // AND IT IS THE SESSION'S ANSWER, not a constant: a session that does not
    // own the platform business reads back false over the same function.
    const other = await fetchBusinesses((async () => businessesResponse(false)) as never)
    expect(other.ownsPlatformBusiness).toBe(false)

    // NOT MERELY PRESENT — CONSEQUENTIAL. What the reader answers is what the
    // gate is asked, over `main.js`'s own expression, so the two cannot drift.
    expect(
      consoleActions({ ownsPlatformBusiness: owner.ownsPlatformBusiness === true }),
    ).toHaveLength(1)
    expect(consoleActions({ ownsPlatformBusiness: other.ownsPlatformBusiness === true })).toEqual([])
  })

  it('test_UAT_FC_REQ-297_a_session_that_could_not_be_asked_about_owns_nothing', async () => {
    // BOTH REFUSAL PATHS, AND THEY MUST AGREE. A non-OK response and a caught
    // failure are the two ways this call fails; a third field is exactly how one
    // refusal literal starts quietly disagreeing with its twin.
    const refused = await fetchBusinesses((async () => ({ ok: false, status: 500 })) as never)
    expect(refused.ownsPlatformBusiness).toBe(false)
    expect(refused.person).toBeNull()
    expect(refused.businesses).toEqual([])

    // A REJECTED FETCH THAT IS NOT A SESSION FAILURE. `send` turns a rejection
    // into a SessionEndedError, which this function rethrows ([[BUG-52]]); what
    // reaches the `catch` and returns is a body that would not parse.
    const unparseable = await fetchBusinesses(
      (async () => ({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('nope')
        },
      })) as never,
    )
    expect(unparseable.ownsPlatformBusiness).toBe(false)

    // AND THE REFUSAL IS NOT SHARED STATE. Each caller gets its own, so one
    // refused load cannot rewrite another's through an in-place sort.
    expect(refused.businesses).not.toBe(unparseable.businesses)

    // AN ENDPOINT THAT OMITS THE FIELD IS A SESSION WE WERE NOT TOLD ABOUT, and
    // that does not round up to ownership — nor does anything merely truthy.
    const silent = await fetchBusinesses(
      (async () => ({ ok: true, status: 200, json: async () => ({ person: null, businesses: [] }) })) as never,
    )
    expect(silent.ownsPlatformBusiness).toBe(false)
    const truthy = await fetchBusinesses(
      (async () => ({
        ok: true,
        status: 200,
        json: async () => ({ person: null, businesses: [], ownsPlatformBusiness: 'yes' }),
      })) as never,
    )
    expect(truthy.ownsPlatformBusiness).toBe(false)
  })
})

// ── the two pure halves of every figure on the surface ───────────────────────

describe('REQ-297 — money and windows are formatted in one place', () => {
  it('test_UAT_FC_REQ-297_money_and_windows_are_formatted_in_one_place', () => {
    // ASSERTED DIRECTLY because every figure on the console goes through them —
    // and after [[REQ-298]] that is MORE true rather than less: the list's cost
    // column and the pane's figures share `dollars`, and the league read and the
    // detail read share `periodOfDays`, which is the client half of *one period
    // and not two*.
    expect(dollars(24_000_000)).toBe('$24.00')
    expect(dollars(1)).toBe('$0.00') // a real, measured, sub-cent figure
    expect(dollars(null)).toBe(CONFIG.TENANT_COST_NOTHING) // and an absence is not one
    expect(periodOfDays(7, NOW)).toEqual({ from: new Date(NOW - 7 * DAY).toISOString(), to: null })
    expect(periodOfDays(0, NOW)).toEqual({ from: null, to: null })
  })
})

// ── the whole path, over the real shell ──────────────────────────────────────

if (!WEBUI_INSTALLED) console.warn(`REQ-297 chrome case skipped: ${WEBUI_SKIP_REASON}`)

describe.skipIf(!WEBUI_INSTALLED)('REQ-297 — the console in the builder chrome', () => {
  it('test_UAT_FC_REQ-297_a_server_that_says_true_puts_a_console_in_the_header', async () => {
    // THE WHOLE PATH, IN ONE CASE, AND UNTOUCHED BY [[REQ-298]]. What the action
    // opens changed; whether there IS an action did not, and this is the case
    // that catches a reader which never passed the flag on: the server answered
    // `true`, the gate was right, the shell renders every action it is given,
    // and the header had no Console. So it starts where the browser starts — a
    // response off the wire — and ends where the operator looks.
    const { mountBuilder } = await import('../apps/control-app/src/builder/app.js')

    for (const owns of [true, false]) {
      document.body.replaceChildren()
      const root = document.createElement('div')
      document.body.append(root)

      const session = await fetchBusinesses((async () => businessesResponse(owns)) as never)
      // `main.js`'s expression, restated here because that module imports three
      // absolute URLs only a browser resolves and cannot itself be imported.
      const app = mountBuilder(root, {
        businesses: session.businesses,
        person: session.person,
        ownsPlatformBusiness: session.ownsPlatformBusiness === true,
        loadSites: async () => [],
        chatTransport: {
          openSession: async () => ({ sessionId: 's', turns: [], ready: true }),
          streamPrompt: async function* () {
            yield { kind: 'done' }
          },
        },
        libraryTransport: {
          list: async () => ({ material: [] }),
          item: async () => ({ body: '' }),
          save: async () => ({}),
          fileUrl: () => '',
          upload: async () => ({}),
        },
        paletteTransport: { get: async () => ({ palette: {}, usage: {} }), write: async () => ({}) },
      })
      await settle()

      const button = app.shell.element.querySelector(`[data-action="${CONFIG.CONSOLE_ACTION_ID}"]`)
      if (owns) {
        expect(button, 'a server answering true must put a Console in the header').toBeTruthy()
        expect((button as HTMLElement).textContent).toContain(CONFIG.CONSOLE_LABEL)
      } else {
        expect(button, 'a server answering false must leave the header alone').toBeNull()
      }
      // The account avatar is present either way: the console's absence is the
      // console's, and never a header that failed to draw.
      expect(
        app.shell.element.querySelector(`[data-action="${CONFIG.ACCOUNT_ACTION_ID}"]`),
      ).toBeTruthy()
    }
  })
})
