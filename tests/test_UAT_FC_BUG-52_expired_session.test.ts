// @vitest-environment jsdom
/**
 * BUG-52 — **an expired session says so, instead of drawing an empty account**.
 *
 * THE BUG THIS PINS. Every route answered 401 correctly and the client swallowed
 * all three of the calls it makes on load: `/api/businesses` became
 * `{account: null, businesses: []}`, `/api/status` became `{ai: true}`, and
 * `/api/sites` threw into a `.catch(() => [])`. The result was a builder that
 * looked fine and contained nothing — no account behind the avatar, an empty
 * switcher, no sites, and an assistant reporting itself healthy. An expired
 * session was indistinguishable from a deleted account, which is the failure
 * REQ-178 already refused to ship one business at a time.
 *
 * WHAT IS ASSERTED. That the three defaults are gone; that a REJECTED fetch — the
 * shape a lapsed Cloudflare Access cookie actually takes, since Access answers
 * with a cross-origin redirect before the Worker is reached and no status code
 * exists anywhere — is read as an authentication failure rather than a transport
 * blip; that a refused load draws the reason where the builder would have been;
 * that a session lapsing MID-EDIT reports itself without emptying or disabling
 * the work already on screen; and that a working session is completely
 * unaffected, which is the property this fix could most plausibly have broken.
 *
 * WHAT IS DELIBERATELY NOT ASSERTED. Anything about not being refused in the
 * first place, or about renewal — that is REQ-187, and this bug is only about
 * what a reload does.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchAiStatus,
  fetchBusinesses,
  fetchSites,
} from '../apps/control-app/src/builder/api.js'
import {
  createSessionNotice,
  isSessionEnded,
  loadOrSignOut,
  onSessionEnded,
  SESSION_EXPIRED,
  SESSION_UNREACHABLE,
} from '../apps/control-app/src/builder/session.js'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

if (!WEBUI_INSTALLED) console.warn(`BUG-52 mount suite skipped: ${WEBUI_SKIP_REASON}`)

const CSS = readFileSync(
  path.resolve(__dirname, '..', 'apps/control-app/src/builder/builder.css'),
  'utf8',
)

/** A response that only has to answer the two questions the client asks of it. */
const refuses = () => async () => ({ status: 401, ok: false, json: async () => ({}) })
const answers = (body: unknown) => async () => ({ status: 200, ok: true, json: async () => body })
/** What `fetch` does when Access redirects it somewhere it may not follow. */
const rejects = () => async () => {
  throw new TypeError('Failed to fetch')
}

/** Collect every session-ended announcement made while `run` is in flight. */
async function watching<T>(run: () => Promise<T>): Promise<{ result: T; seen: unknown[] }> {
  const seen: unknown[] = []
  const stop = onSessionEnded((error: unknown) => seen.push(error))
  try {
    return { result: await run(), seen }
  } finally {
    stop()
  }
}

let root: HTMLElement
beforeEach(() => {
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})

describe('BUG-52 — a refusal is no longer a default', () => {
  it('test_UAT_FC_BUG_52_the_three_load_calls_refuse_rather_than_returning_a_default', async () => {
    // ALL THREE, because it took all three to draw the empty builder: one of
    // them still defaulting would leave a switcher with no account, or a healthy
    // assistant, beside a notice saying the session had ended.
    await expect(fetchBusinesses(refuses() as never)).rejects.toMatchObject({
      name: 'SessionEndedError',
      reason: SESSION_EXPIRED,
    })
    await expect(fetchAiStatus(refuses() as never)).rejects.toMatchObject({
      reason: SESSION_EXPIRED,
    })
    await expect(fetchSites(refuses() as never)).rejects.toMatchObject({
      reason: SESSION_EXPIRED,
    })
  })

  it('test_UAT_FC_BUG_52_a_rejected_fetch_is_an_authentication_failure_not_a_transport_error', async () => {
    // THE PRODUCTION SHAPE. Behind Access the Worker is never reached, so there
    // is no 401 to find — the promise simply rejects. Landing that in the same
    // `catch` as "the origin blipped" is what made the production symptom
    // identical to the local one and harder to diagnose.
    const { result, seen } = await watching(async () =>
      fetchBusinesses(rejects() as never).catch((error: unknown) => error),
    )
    expect(isSessionEnded(result)).toBe(true)
    expect((result as { reason: string }).reason).toBe(SESSION_UNREACHABLE)
    // The original is kept rather than replaced: a session failure is the
    // client's reading of it, not a claim that nothing else happened.
    expect((result as { cause?: Error }).cause).toBeInstanceOf(TypeError)
    expect(seen).toHaveLength(1)
  })

  it('test_UAT_FC_BUG_52_every_call_announces_it_not_only_the_ones_on_the_load_path', async () => {
    // THE SIGNAL IS THE MECHANISM, and it fires from the one place every request
    // in the client goes through. `/api/sites` is asked long after load, by the
    // business switcher, and it is a perfectly ordinary way to find out.
    const { seen } = await watching(async () => {
      await fetchSites(refuses() as never).catch(() => null)
    })
    expect(seen).toHaveLength(1)
    expect((seen[0] as { reason: string }).reason).toBe(SESSION_EXPIRED)
  })

  it('test_UAT_FC_BUG_52_a_valid_session_answers_normally_and_announces_nothing', async () => {
    // THE PROPERTY THIS FIX COULD MOST PLAUSIBLY HAVE BROKEN. A client that
    // reacts to authentication failure is a client that can misfire on a working
    // session and sign somebody out for no reason.
    const { result, seen } = await watching(async () => ({
      businesses: await fetchBusinesses(
        answers({ account: { email: 'a@b.c' }, businesses: [{ id: 'acct_1' }] }) as never,
      ),
      status: await fetchAiStatus(answers({ ai: true }) as never),
      sites: await fetchSites(answers([{ slug: 'bakery', latest: 1 }]) as never),
    }))
    expect(result.businesses.account).toEqual({ email: 'a@b.c' })
    expect(result.businesses.businesses).toHaveLength(1)
    expect(result.status).toEqual({ ai: true, message: null })
    expect(result.sites).toEqual([{ slug: 'bakery', latest: 1 }])
    expect(seen).toEqual([])
  })

  it('test_UAT_FC_BUG_52_an_origin_that_merely_failed_is_still_not_a_session_failure', async () => {
    // THE OLD DEFAULTS SURVIVE FOR THE CASE THEY WERE WRITTEN FOR (REQ-173,
    // REQ-179): an origin that cannot answer the question leaves the builder
    // mounted and unblocked. Only a 401 — which answers it, with "not you" —
    // stops being a default.
    const failing = async () => ({ status: 500, ok: false, json: async () => ({}) })
    const { result, seen } = await watching(async () => ({
      status: await fetchAiStatus(failing as never),
      businesses: await fetchBusinesses(failing as never),
    }))
    expect(result.status).toEqual({ ai: true, message: null })
    expect(result.businesses).toEqual({ account: null, businesses: [] })
    expect(seen).toEqual([])
  })
})

describe('BUG-52 — a refused load draws the reason, not a blank page', () => {
  it('test_UAT_FC_BUG_52_a_refused_load_says_so_where_the_builder_would_have_been', async () => {
    const mounted = await loadOrSignOut(root, () => fetchBusinesses(refuses() as never))

    // NOTHING IS MOUNTED — which is the point. The alternative on offer was a
    // builder drawn from the defaults, and an empty builder reads as data loss.
    expect(mounted).toBeNull()

    const notice = root.querySelector('.builder-signed-out')!
    expect(notice).toBeTruthy()
    expect(notice.textContent).toContain('session has ended')
    // `alert`, so a screen reader reaches it without being asked — this is not
    // progress, it is the reason there is no builder.
    expect(notice.getAttribute('role')).toBe('alert')
    // AND IT FILLS `#app`, which is also how REQ-149's boot guard is stood down:
    // every path it takes checks that element is still empty first, so a page
    // that says "your session ended" is never replaced four seconds later by one
    // saying "the builder did not start".
    expect(root.childElementCount).toBe(1)
  })

  it('test_UAT_FC_BUG_52_any_other_load_failure_is_still_thrown', async () => {
    // A load path that answered "sign in again" to a 500, a broken import map
    // and a mount that threw would be the blank-page-with-no-reason problem the
    // boot guard exists to end, wearing a friendlier sentence.
    const boom = new Error('importmap.json is not valid JSON')
    await expect(
      loadOrSignOut(root, async () => {
        throw boom
      }),
    ).rejects.toBe(boom)
    expect(root.querySelector('.builder-signed-out')).toBeNull()
  })

  it('test_UAT_FC_BUG_52_recovery_is_a_top_level_navigation_the_operator_asks_for', async () => {
    // A TOP-LEVEL NAVIGATION IS THE ONLY THING THAT RECOVERS: Access answers a
    // document request with its login page, and will never show that to a
    // background fetch. It is a button rather than something this module does on
    // its own, because the operator may have unsaved work to rescue first.
    const signIn = vi.fn()
    const notice = createSessionNotice({ reason: SESSION_UNREACHABLE, variant: 'page', signIn })
    // The hedged wording for the case the client genuinely cannot tell apart.
    expect(notice.element.textContent).toContain('could not reach the server')
    expect(notice.button.textContent).toBe('Sign in again')
    notice.button.click()
    expect(signIn).toHaveBeenCalledTimes(1)
  })
})

/**
 * The mid-session half, against the real shell.
 *
 * Skipped rather than failed where the shared `webui-*` components are absent,
 * for the reason `webui-installed` states: a green run that silently proved
 * nothing would be worse than a reported gap.
 */
describe.skipIf(!WEBUI_INSTALLED)('BUG-52 — a session that lapses under a working builder', () => {
  const SITES = [{ slug: 'bakery', latest: 1 }]

  function memoryStorage() {
    const map = new Map<string, string>()
    return {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, String(v)),
      removeItem: (k: string) => void map.delete(k),
      clear: () => map.clear(),
      key: (i: number) => [...map.keys()][i] ?? null,
      get length() {
        return map.size
      },
    }
  }

  const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

  /**
   * A chat transport that answers locally.
   *
   * WITHOUT ONE, THE PANE OPENS A SESSION OVER `fetch` — against no origin, in a
   * document with no base URL — and that rejection is now (correctly) an
   * authentication failure. Injecting one keeps each test's session ending at
   * the moment the test chooses, rather than at mount.
   */
  const quietChat = {
    openSession: async (slug: string) => ({ sessionId: `site-${slug}`, turns: [], ready: true }),
  }

  /** The same, for the two tabs that read their list at mount. */
  const quietLibrary = {
    list: async () => ({ material: [] }),
    item: async () => ({}),
    save: async () => ({}),
    fileUrl: () => '',
    upload: async () => ({}),
  }
  const quietPeople = {
    list: async () => ({ people: [] }),
    item: async () => ({}),
    saveStatus: async () => ({}),
    invite: async () => ({}),
    fulfil: async () => ({}),
    revoke: async () => ({}),
  }

  type Builder = {
    shell: { element: HTMLElement }
    panel: { getSite(): string | null }
    sessionNotice: HTMLElement | null
    destroy(): void
  }

  let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Builder

  beforeEach(async () => {
    ;({ mountBuilder } = (await import('../apps/control-app/src/builder/app.js')) as never)
    globalThis.ResizeObserver ??= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as never
    globalThis.matchMedia ??= ((q: string) => ({
      matches: false,
      media: q,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      onchange: null,
      dispatchEvent: () => false,
    })) as never
  })

  it('test_UAT_FC_BUG_52_it_says_so_and_leaves_the_unsaved_work_where_it_is', async () => {
    const app = mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      chatTransport: quietChat,
      libraryTransport: quietLibrary,
      peopleTransport: quietPeople,
    })
    await settle()
    expect(app.sessionNotice).toBeNull()

    // MID-EDIT, which is the state the person most likely to meet this is in.
    // A modal mounts inside the shell root, so a half-typed value lives there.
    const unsaved = document.createElement('textarea')
    unsaved.value = 'the paragraph they have not saved yet'
    app.shell.element.append(unsaved)

    // The session ends the ordinary way: some call, any call, comes back 401.
    await fetchSites(refuses() as never).catch(() => null)

    const notice = app.sessionNotice!
    expect(notice).toBeTruthy()
    expect(notice.textContent).toContain('session has ended')
    // OUTSIDE THE SHELL AND ABOVE IT, so its text can be selected and pasted
    // into a support message — the same reason REQ-173's banner is mounted on
    // the root rather than inside.
    expect(app.shell.element.contains(notice)).toBe(false)
    expect(notice.compareDocumentPosition(app.shell.element)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )

    // AND NOTHING IS DISABLED OR TAKEN AWAY. `inert` would remove the shell from
    // hit testing, putting the operator's own unsaved text behind a barrier they
    // cannot select it out of — immediately before signing in again discards it.
    expect(app.shell.element.hasAttribute('inert')).toBe(false)
    expect(app.shell.element.contains(unsaved)).toBe(true)
    expect(unsaved.value).toBe('the paragraph they have not saved yet')
    expect(app.panel.getSite()).toBe('bakery')

    app.destroy()
    // Taken away with the app, so a second mount does not inherit it.
    expect(root.querySelector('.builder-session-notice')).toBeNull()
  })

  it('test_UAT_FC_BUG_52_it_is_said_once_however_many_calls_are_refused', async () => {
    // A lapsed session refuses everything at once, so the subscription fires
    // repeatedly for one fact. Stacking a banner per refusal would bury the
    // builder under the news that it is not working.
    const app = mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      chatTransport: quietChat,
      libraryTransport: quietLibrary,
      peopleTransport: quietPeople,
    })
    await settle()
    await Promise.all([
      fetchSites(refuses() as never).catch(() => null),
      fetchSites(refuses() as never).catch(() => null),
      fetchBusinesses(refuses() as never).catch(() => null),
    ])
    expect(root.querySelectorAll('.builder-session-notice')).toHaveLength(1)
    app.destroy()
  })

  it('test_UAT_FC_BUG_52_a_refused_site_listing_does_not_empty_the_builder', async () => {
    // THE ORIGINAL SYMPTOM, at the call that produced it. `app.js` discarded a
    // failed listing as `[]` and then rewrote the pane, the Library and the
    // People tab from it — so the one call that knew the session had ended was
    // also the one that emptied everything.
    const listed: string[] = []
    const app = mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      businesses: [{ id: 'acct_1', name: "Alice's Plumbing" }],
      chatTransport: quietChat,
      loadSites: () => fetchSites(refuses() as never),
      libraryTransport: {
        list: async () => {
          listed.push('library')
          return { material: [] }
        },
        item: async () => ({}),
        save: async () => ({}),
        fileUrl: () => '',
        upload: async () => ({}),
      },
    })
    await settle()

    expect(app.sessionNotice).toBeTruthy()
    // The pane keeps the site it was showing rather than being blanked…
    expect(app.panel.getSite()).toBe('bakery')
    // …and the Library is not cleared-then-re-read against a store this session
    // can no longer read. Leaving what is on screen alone is the only honest
    // answer once the notice has said why nothing more will arrive.
    expect(listed).toEqual([])
    app.destroy()
  })
})

describe('BUG-52 — the notice is visible, and it disables nothing', () => {
  it('test_UAT_FC_BUG_52_both_shapes_are_styled_and_neither_dims_the_shell', () => {
    // jsdom computes nothing about appearance, so the rules are asserted beside
    // the module that applies the classes — the same split REQ-173 uses.
    expect(CSS).toMatch(/\.builder-session-notice\s*\{/)
    expect(CSS).toMatch(/\.builder-signed-out\s*\{/)
    // AND NEITHER BLOCK IS REACHED FOR. `inert` and `.builder-shell--blocked`
    // are REQ-173's, for a builder with nothing in it yet; applying either to a
    // builder holding unsaved work would put the operator's own half-typed text
    // behind a barrier they cannot select it out of, and dim it as though it had
    // already gone. Asserted against the module, because "does not do a thing"
    // has no DOM to observe it in.
    const SOURCE = readFileSync(
      path.resolve(__dirname, '..', 'apps/control-app/src/builder/session.js'),
      'utf8',
    )
    expect(SOURCE).not.toMatch(/setAttribute\(\s*'inert'/)
    expect(SOURCE).not.toMatch(/builder-shell--blocked/)
  })
})
