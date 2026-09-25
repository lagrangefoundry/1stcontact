// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { ACTIVITY_CRON } from '../apps/control-app/src/activity'
import {
  SESSION_RECORDED,
  eventLabel,
  isKnownKind,
  sessionSpan,
  summariseSession,
} from '../apps/control-app/src/builder/contact-events.js'
import { describeEvent } from '../apps/control-app/src/builder/people.js'
import { declaringBlocks } from './support/wrangler-toml'

/**
 * [[REQ-235]] — **the wiring the activity log needs in order to exist at all**:
 * the schedule that makes a timeline current rather than daily, the browser
 * signal without which "which tab, for how long" is not inferable, and the
 * reading arithmetic the summary row deliberately does not store.
 *
 * WHY THESE ARE HERE AND NOT IN THE WORKERD SUITE. Each one is a claim about
 * source that no request can make: a cron expression that disagrees with the
 * handler branching on it fails nothing visibly, and a client signal is a
 * property of the browser module rather than of anything workerd can be asked.
 * The store, the retention, the inference and the rollup are proved against a
 * real database in `test_UAT_FC_REQ-235_activity_log.workers.test.ts`.
 */

const root = path.resolve(__dirname, '..')
const read = (rel: string): string => readFileSync(path.join(root, rel), 'utf8')

const CONTROL_TOML = read('apps/control-app/wrangler.toml')
const API = read('apps/control-app/src/builder/api.js')
const APP = read('apps/control-app/src/builder/app.js')
const ASSETS = read('tools/generate/src/cli/assets.ts')

describe('REQ-235 — the closer has a schedule, and it agrees with the handler', () => {
  it('test_UAT_FC_REQ-235_both_environments_declare_the_frequent_cron', () => {
    // THE HANDLER BRANCHES ON THIS STRING. The closer runs on every tick and the
    // daily sweeps do not, so a literal in `index.ts` that had drifted from the
    // deployment would mean either three table sweeps every ten minutes or a
    // timeline that never updates — and neither would fail anything visibly.
    const declared = [...CONTROL_TOML.matchAll(/^crons\s*=\s*(\[[^\]]*\])/gm)].map((m) => m[1])
    expect(declared, 'crons is declared in every block').toHaveLength(declaringBlocks(CONTROL_TOML))
    expect(new Set(declared).size, 'every block declares the same schedule').toBe(1)
    for (const block of declared) {
      expect(block).toContain(`"${ACTIVITY_CRON}"`)
      // AND THE DAILY ONE SURVIVES ([[REQ-231]], [[REQ-268]]). The sweeps it
      // carries have horizons measured in days; moving them onto the frequent
      // tick would be 143 walks a day that each take nothing.
      expect(block).toContain('"17 4 * * *"')
    }
  })
})

describe('REQ-235 — the builder says which surface it is on', () => {
  it('test_UAT_FC_REQ-235_the_signal_posts_on_a_change_and_on_the_opening_surface', () => {
    // WITHOUT THIS THE QUESTION IS NOT INFERABLE. A tab that is being read makes
    // no requests, so a tab nobody opened and a tab somebody has been reading for
    // twenty minutes look identical from the server.
    expect(API).toContain('export async function postSurface')
    expect(APP).toContain('onTabChange:')
    expect(APP).toContain('postSurface(tabId)')
    // THE SHELL'S FIRST SELECTION IS NOT NOTIFIED — upstream activates the first
    // tab before wiring `onSelect`, so the opening surface has to be posted
    // explicitly or the tab somebody is most likely to still be on is the one
    // surface never recorded.
    expect(APP).toContain('postSurface(shell.getActiveTab())')
  })

  it('test_UAT_FC_REQ-235_the_signal_is_not_a_beacon_protocol', () => {
    // A SIGNAL AND NOT A HEARTBEAT ([[REQ-235]] §5): no timers, and no duration
    // computed in the browser. The server timestamps what it receives, which is
    // what keeps a client's clock out of a record and keeps this to a handful of
    // requests per session rather than one every few seconds.
    const surfaceFn = API.slice(API.indexOf('export async function postSurface'))
    const body = surfaceFn.slice(0, surfaceFn.indexOf('\n}\n') + 3)
    expect(body).not.toMatch(/setInterval|setTimeout/)
    expect(body).not.toMatch(/duration|elapsed/i)
    // AND IT DOES NOT ANNOUNCE. `send` puts "your session may have ended" on
    // screen when a fetch rejects — right for a call the operator made, wrong
    // for one they did not. A signal nobody asked for must not be able to raise
    // a sign-in banner over work that is fine, so this is the one call in the
    // module that goes straight to `fetch`.
    expect(body).not.toContain('send(fetchImpl')
    expect(body).toContain('await fetchImpl(')
  })
})

describe('REQ-235 — the record is the package’s, resolved like every other one', () => {
  it('test_UAT_FC_REQ-235_the_build_emits_a_shim_for_the_logging_component', () => {
    // THE SAME MECHANISM EVERY SHARED COMPONENT USES, and for the same reason: a
    // bare specifier resolves by walking up from the importing file, which finds
    // the out-of-repo store from the main checkout and finds NOTHING from a
    // linked git worktree. One re-export carrying an absolute path closes it.
    expect(ASSETS).toContain("sharedModulePath('logging')")
    expect(ASSETS).toContain('writeLoggingShim')
    // AND THE DIMENSION SET IS NAMED IN THE EXPORT LIST, so an upstream change to
    // it surfaces as a typecheck failure rather than as a column that silently
    // stopped being written — [[EPIC-1]] §37's one irreversible decision.
    expect(ASSETS).toContain("'RECORD_FIELDS'")
  })
})

describe('REQ-235 — the summary reads as a sentence, and the minutes are derived', () => {
  const detail = {
    endedAt: '2026-09-17T17:28:00.000Z',
    events: 412,
    surfaces: [
      { surface: 'site', from: '2026-09-17T16:23:00.000Z', to: '2026-09-17T16:36:00.000Z' },
      { surface: 'library', from: '2026-09-17T16:36:00.000Z', to: '2026-09-17T16:59:00.000Z' },
    ],
  }

  it('test_UAT_FC_REQ-235_a_reader_reconstructs_the_breakdown_from_one_row', () => {
    // AC-8, on the reading side. The whole point of the row is that a business
    // gets this from ONE event rather than from four hundred.
    expect(summariseSession(detail)).toBe('site 13 min, library 23 min')
    expect(sessionSpan('2026-09-17T16:23:00.000Z', detail)).toBe('65 min')
  })

  it('test_UAT_FC_REQ-235_the_arithmetic_is_done_on_read_and_not_stored', () => {
    // A CLOSED LAPTOP SENDS NOTHING, so every interval here is a lower bound.
    // Computing minutes at write time would have frozen a floor into an
    // immutable row as though it were a measurement — so what the row holds is
    // stamps, and this is where they become a phrase.
    expect(JSON.stringify(detail)).not.toMatch(/duration|minutes/i)
    // AND A PRECISION THE SIGNAL DOES NOT HAVE IS NOT INVENTED. A stretch
    // shorter than a minute reads as `<1 min` rather than as `0 min`, which
    // would read as "nothing happened".
    expect(
      summariseSession({ surfaces: [{ surface: 'site', from: detail.endedAt, to: detail.endedAt }] }),
    ).toBe('site <1 min')
  })

  it('test_UAT_FC_REQ-235_a_session_with_no_surfaces_still_reads_honestly', () => {
    // A SESSION OF API CALLS HAS NO SURFACE ANYBODY CLAIMED. Reporting its span
    // and saying nothing about tabs is true; a breakdown guessed from server
    // routes would not be.
    expect(summariseSession({ endedAt: detail.endedAt, surfaces: [] })).toBe('')
    const row = describeEvent({
      kind: SESSION_RECORDED,
      occurredAt: '2026-09-17T16:23:00.000Z',
      recordedAt: '2026-09-17T17:50:00.000Z',
      detail: { endedAt: detail.endedAt, surfaces: [] },
    })
    expect(row.note).toBe('65 min')
  })

  it('test_UAT_FC_REQ-235_the_timeline_renderer_does_not_branch_on_kind', () => {
    // THE HISTORY SECTION RENDERS A KIND IT HAS NEVER SEEN ([[DOC-44]] §4), and
    // this row must not cost it that. So the one branch lives in `describeEvent`
    // and every other kind comes back with no note at all.
    expect(eventLabel(SESSION_RECORDED)).toBe('Active session')
    expect(isKnownKind(SESSION_RECORDED)).toBe(true)
    const ordinary = describeEvent({
      kind: 'email.sent',
      occurredAt: '2026-09-17T16:23:00.000Z',
      recordedAt: '2026-09-17T16:23:00.000Z',
    })
    expect(ordinary.note).toBeNull()
    expect(ordinary.label).toBe('Email sent')
    // A KIND NOBODY HAS NAMED STILL RENDERS, as the dotted string itself.
    expect(eventLabel('later.capability')).toBe('later.capability')
  })

  it('test_UAT_FC_REQ-235_the_summary_row_reads_as_a_span_and_a_breakdown', () => {
    const row = describeEvent({
      kind: SESSION_RECORDED,
      occurredAt: '2026-09-17T16:23:00.000Z',
      recordedAt: '2026-09-17T17:50:00.000Z',
      detail,
    })
    expect(row.label).toBe('Active session')
    expect(row.note).toBe('65 min — site 13 min, library 23 min')
    // THE TWO STAMPS DIFFER AND THE ROW SAYS SO. A summary is composed after the
    // fact, and `recorded` is exactly the clause that makes that legible.
    expect(row.learned).not.toBeNull()
  })
})
