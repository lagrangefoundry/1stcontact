// @vitest-environment jsdom
/**
 * REQ-222 — **what a publish looks like while it runs**: the builder locks, a
 * message explains, and the bar is real.
 *
 * WHY THIS IS PART OF THIS TICKET RATHER THAN A NICETY BESIDE IT. Building the
 * delivery ladder decodes and re-encodes every picture on the site, and with two
 * formats that arithmetic doubles. The budget for that work is explicitly
 * *minutes with explanation* — so the explanation is a deliverable. A toolbar
 * button that goes quiet for a minute reads as a hang, and a client who reloads
 * mid-publish is a client who has learned not to trust the button.
 *
 * AND THE LOCK IS NOT ONLY POLITENESS. Before this, a publish disabled the
 * Publish button and nothing else, so a client could keep editing through a
 * publish that takes a minute and then hold a reasonable and untested belief
 * about whether that edit is in the site that just went live. The honest fix is to
 * remove the question rather than answer it.
 *
 * WHAT IS ASSERTED AND WHAT DELIBERATELY IS NOT. This proves what the DOM says:
 * the two subtrees `inert`, the chrome left alone, the message and the bar drawn
 * only when there is work, the bar determinate against a real total, and
 * everything put back afterwards — including after a failure. It does NOT assert
 * the absence of dimming as a computed style, which jsdom computes nothing about;
 * the CSS is read and asserted directly instead, beside the class that carries it.
 *
 * THE REGISTER IS THE THING TO GET RIGHT, and it is the one claim here that is
 * about meaning rather than mechanism. [[REQ-173]]'s block says *something is
 * broken and you cannot proceed*; this says *something is working, please wait*.
 * A client shown the "blocked" chrome during a successful publish has been told
 * their site is broken at the exact moment it is going live.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`REQ-222 publish-lock suite skipped: ${WEBUI_SKIP_REASON}`)

const repo = (...parts: string[]) => path.resolve(__dirname, '..', ...parts)
const CSS = readFileSync(repo('apps/control-app/src/builder/builder.css'), 'utf8')

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

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
  }
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

let root: HTMLElement
beforeEach(() => {
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})

type App = { shell: { element: HTMLElement }; destroy(): void }

/** Mount the builder with a publish seam the test drives by hand. */
function mountWithPublish(publish: (slug: string, onProgress?: unknown) => Promise<unknown>): App {
  return mountBuilder(root, {
    sites: SITES,
    storage: memoryStorage(),
    publish,
  }) as unknown as App
}

/** The Publish button the toolbar renders. */
function publishButton(): HTMLButtonElement {
  const btn = root.querySelector<HTMLButtonElement>('.builder-toolbar__publish')
  expect(btn, 'the toolbar renders a Publish button').toBeTruthy()
  return btn!
}

/** A promise plus the handles to settle it later. */
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (err: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const inertState = (app: App) => ({
  tabs: app.shell.element.querySelector('.shell-tabs')?.hasAttribute('inert'),
  panels: app.shell.element.querySelector('.shell-panels')?.hasAttribute('inert'),
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-222 — the builder locks for the duration of a publish', () => {
  it('test_UAT_FC_REQ_222_a_running_publish_makes_the_draft_surfaces_inert', async () => {
    const gate = deferred<unknown>()
    const app = mountWithPublish(() => gate.promise)
    await settle()

    // Before: nothing is inert, which is what every other suite mounts.
    expect(inertState(app)).toEqual({ tabs: false, panels: false })

    publishButton().click()
    await settle()

    // ONE ATTRIBUTE PER SUBTREE, EVERY CONTROL. `inert` removes each subtree from
    // the tab order, from hit testing and from the accessibility tree at once —
    // so the lock covers every surface the builder has and every surface it
    // grows, with nothing per-panel to remember.
    expect(inertState(app)).toEqual({ tabs: true, panels: true })
    expect(app.shell.element.classList.contains('builder-shell--publishing')).toBe(true)

    gate.resolve({ id: 2, published: true })
    await settle()
    // …and put back exactly as it was.
    expect(inertState(app)).toEqual({ tabs: false, panels: false })
    expect(app.shell.element.classList.contains('builder-shell--publishing')).toBe(false)
    app.destroy()
  })

  it('test_UAT_FC_REQ_222_the_chrome_stays_live_while_a_publish_runs', async () => {
    // THE BOUNDARY IS [[REQ-173]]'s OWN PRECEDENT: the switcher, the account,
    // Theme and About are outside the block, because nothing there can change the
    // draft. A publish is a fact about the draft, so it takes the draft's
    // surfaces and leaves the person's. Making the whole shell inert would take
    // the avatar with it — and the account is where a client would go to ask for
    // help with the publish they are watching.
    const gate = deferred<unknown>()
    const app = mountWithPublish(() => gate.promise)
    await settle()
    publishButton().click()
    await settle()

    expect(app.shell.element.hasAttribute('inert')).toBe(false)
    const header = app.shell.element.querySelector('.shell-header')
    expect(header?.hasAttribute('inert')).toBeFalsy()

    gate.resolve({})
    await settle()
    app.destroy()
  })

  it('test_UAT_FC_REQ_222_a_failed_publish_does_not_leave_the_builder_locked', async () => {
    // IN A `finally`. A client locked out of their own draft by a failure they
    // cannot see has lost more than the publish.
    const gate = deferred<unknown>()
    const app = mountWithPublish(() => gate.promise)
    await settle()
    publishButton().click()
    await settle()
    expect(inertState(app)).toEqual({ tabs: true, panels: true })

    gate.reject(new Error('the publish failed'))
    await settle()
    await settle()

    expect(inertState(app)).toEqual({ tabs: false, panels: false })
    expect(root.querySelector('.builder-banner--publishing')).toBeNull()
    app.destroy()
  })

  it('test_UAT_FC_REQ_222_a_failed_publish_says_so_in_the_origin_s_own_words', async () => {
    // A PUBLISH CAN NOW FAIL FOR A REASON THE CLIENT CAN ACT ON — a site whose
    // ladder is larger than one request can carry names exactly that — and it can
    // fail AFTER the response committed `200`, where the only verdict is in the
    // stream's terminal frame. Treating that verdict as a failure means TELLING
    // the client: a rejection that went only to the console and a button that
    // simply came back is indistinguishable from a publish that worked.
    const gate = deferred<unknown>()
    const app = mountWithPublish(() => gate.promise)
    await settle()
    publishButton().click()
    await settle()

    gate.reject(
      new Error(
        'This site has 300 pictures needing 3900 delivery renditions, and one publish can build 2000.',
      ),
    )
    await settle()
    await settle()

    const failed = root.querySelector('.builder-banner--publish-failed')
    expect(failed, 'a failed publish reports itself').toBeTruthy()
    expect(failed!.textContent).toContain('was not published')
    // THE ORIGIN'S OWN SENTENCE, not a substitute for it: the refusal is written
    // for the client and names the site's own facts, which is what they can act
    // on. Anything invented here would be a worse sentence about a fact it knows
    // less about.
    expect(failed!.textContent).toContain('3900 delivery renditions')
    // AN `alert` HERE, where the progress banner is a `status`. The register
    // follows the meaning: this is the reason something did not happen.
    expect(failed!.getAttribute('role')).toBe('alert')

    // AND IT OUTLIVES THE LOCK, so the client can actually read it — a message
    // that vanished with the block would be a failure seen for one frame.
    expect(inertState(app)).toEqual({ tabs: false, panels: false })
    app.destroy()
  })

  it('test_UAT_FC_REQ_222_the_next_attempt_clears_the_last_failure', async () => {
    // The previous failure and the current attempt on screen together reads as
    // the current one having already failed.
    const first = deferred<unknown>()
    let gate = first
    const app = mountWithPublish(() => gate.promise)
    await settle()
    publishButton().click()
    await settle()
    first.reject(new Error('nope'))
    await settle()
    await settle()
    expect(root.querySelector('.builder-banner--publish-failed')).toBeTruthy()

    const second = deferred<unknown>()
    gate = second
    publishButton().click()
    await settle()
    expect(root.querySelector('.builder-banner--publish-failed')).toBeNull()
    second.resolve({})
    await settle()
    app.destroy()
  })

  it('test_UAT_FC_REQ_222_publish_action_still_disables_its_own_button_and_re_enables_it', async () => {
    // THE ACTION IS UNTOUCHED, and that is the point: the lock wraps the publish
    // SEAM, not the toolbar. The action has no access to the shell and no opinion
    // about what a publish costs, so it still disables its button, awaits one
    // promise and re-enables in a `finally`.
    const gate = deferred<unknown>()
    const app = mountWithPublish(() => gate.promise)
    await settle()
    const btn = publishButton()
    expect(btn.disabled).toBe(false)
    btn.click()
    await settle()
    expect(btn.disabled).toBe(true)
    gate.resolve({})
    await settle()
    expect(btn.disabled).toBe(false)
    app.destroy()
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-222 — what it says, and when it says it', () => {
  it('test_UAT_FC_REQ_222_a_publish_with_images_to_resize_explains_the_wait', async () => {
    const gate = deferred<unknown>()
    const app = mountWithPublish((_slug, onProgress) => {
      ;(onProgress as (p: unknown) => void)({ total: 12, done: 0 })
      return gate.promise
    })
    await settle()
    publishButton().click()
    await settle()

    const banner = root.querySelector('.builder-banner--publishing')
    expect(banner, 'a publish with work to do explains itself').toBeTruthy()
    // "FIRST-TIME" IS THE LOAD-BEARING WORD and it is true: the
    // content-addressed derived cache means an unchanged picture costs no
    // transform, so the second publish of the same site is fast. A client told
    // this once understands why the wait does not repeat.
    expect(banner!.textContent).toContain('First-time publication of images requires resizing')
    expect(banner!.textContent).toContain('leave this tab open')

    // A `status`, NOT AN `alert`. This is progress, which is precisely what
    // `alert` is wrong for — a screen reader should reach it without the client's
    // work being interrupted to announce that it is going well.
    expect(banner!.getAttribute('role')).toBe('status')

    // OUTSIDE THE INERT SUBTREE, on REQ-173's reasoning: a message whose text
    // cannot be selected cannot be pasted into a support request.
    const panels = app.shell.element.querySelector('.shell-panels')!
    expect(panels.contains(banner!)).toBe(false)

    gate.resolve({})
    await settle()
    expect(root.querySelector('.builder-banner--publishing')).toBeNull()
    app.destroy()
  })

  it('test_UAT_FC_REQ_222_a_republish_with_nothing_to_build_says_nothing', async () => {
    // A REPUBLISH MUST NOT WARN ABOUT RESIZING. That would train the client to
    // ignore the one case where it matters — so the message is shown when it is
    // TRUE, not always, and a total of zero draws nothing at all.
    const gate = deferred<unknown>()
    const app = mountWithPublish((_slug, onProgress) => {
      ;(onProgress as (p: unknown) => void)({ total: 0, done: 0 })
      return gate.promise
    })
    await settle()
    publishButton().click()
    await settle()

    expect(root.querySelector('.builder-banner--publishing')).toBeNull()
    // The LOCK is still taken, though: the edit-during-publish question exists
    // whatever the publish turns out to cost.
    expect(inertState(app)).toEqual({ tabs: true, panels: true })

    gate.resolve({})
    await settle()
    app.destroy()
  })

  it('test_UAT_FC_REQ_222_a_host_that_reports_no_progress_draws_no_message', async () => {
    // A host with no origin injects a publish that reports nothing, and a publish
    // that reports nothing renders as a publish with nothing to resize — which is
    // exactly what it is.
    const gate = deferred<unknown>()
    const app = mountWithPublish(() => gate.promise)
    await settle()
    publishButton().click()
    await settle()
    expect(root.querySelector('.builder-banner--publishing')).toBeNull()
    gate.resolve({})
    await settle()
    app.destroy()
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-222 — the progress bar is determinate', () => {
  it('test_UAT_FC_REQ_222_the_bar_counts_against_the_total_the_publish_stated', async () => {
    // DETERMINATE, NOT A SPINNER PRETENDING. A spinner is the right affordance
    // for an unknown wait of a few seconds; for a wait of minutes it is the thing
    // that reads as a hang, which is the failure this whole banner exists to
    // prevent. The denominator is real because the publish counted it before the
    // first transform — it is not an animation on a timer.
    const gate = deferred<unknown>()
    let report!: (p: { total: number; done: number }) => void
    const app = mountWithPublish((_slug, onProgress) => {
      report = onProgress as typeof report
      report({ total: 4, done: 0 })
      return gate.promise
    })
    await settle()
    publishButton().click()
    await settle()

    const bar = root.querySelector<HTMLProgressElement>('.builder-banner--publishing progress')
    expect(bar, 'the banner carries a determinate bar').toBeTruthy()
    expect(bar!.max).toBe(4)
    expect(bar!.value).toBe(0)

    report({ total: 4, done: 3 })
    expect(bar!.value).toBe(3)
    report({ total: 4, done: 4 })
    expect(bar!.value).toBe(4)

    gate.resolve({})
    await settle()
    app.destroy()
  })

  it('test_UAT_FC_REQ_222_the_publishing_block_does_not_dim_the_builder', async () => {
    // THE APPEARANCE IS DELIBERATELY NOT THE LAPSED-ACCOUNT BLOCK'S. That one
    // dims because the surfaces beneath it are gone and are not coming back; a
    // builder greyed out mid-publish says *your site is broken* at the exact
    // moment it is going live. Asserted against the CSS rather than a computed
    // style, which jsdom does not compute — and beside the rules that DO dim, so
    // the contrast is the assertion.
    expect(CSS).toMatch(/\.builder-shell--no-business \.shell-tabs[\s\S]*?opacity: 0\.45/)
    const publishing = /\.builder-shell--publishing \.shell-tabs,[\s\S]*?\}/.exec(CSS)
    expect(publishing, 'the publishing block has its own rule').not.toBeNull()
    expect(publishing![0]).not.toContain('opacity')
    expect(publishing![0]).not.toContain('grayscale')
    // The cursor carries the signal instead, which is honest about what has
    // happened: the surfaces are still there, they are just not answering yet.
    expect(publishing![0]).toContain('cursor: progress')
  })
})

/**
 * REQ-222 — the client's half of the streaming publish contract.
 *
 * THE ONE CLAIM WORTH THE MOST HERE: **a stream that ends without a terminal
 * frame is a failure.** The response committed `200` before the first rendition
 * was built, so a dropped connection would otherwise render as the success the
 * status code claims — telling a client their site is live when it is not, which
 * is the worst outcome available in this whole ticket.
 */
describe('REQ-222 — the publish stream, read by the builder', () => {
  /** A `fetch` that answers one event-stream response built from `frames`. */
  const streaming = (frames: unknown[], opts: { truncate?: boolean } = {}) => {
    const body = frames.map((f) => `data: ${JSON.stringify(f)}\n\n`).join('')
    return async () =>
      new Response(opts.truncate ? body.replace(/\n\n$/, '') : body, {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      })
  }

  it('test_UAT_FC_REQ_222_the_progress_frames_reach_the_caller_and_the_verdict_is_returned', async () => {
    const { streamPublish } = await import('../apps/control-app/src/builder/api.js')
    const seen: unknown[] = []
    const result = await streamPublish(
      'bakery',
      (p: unknown) => seen.push(p),
      streaming([
        { kind: 'progress', total: 3, done: 0 },
        { kind: 'progress', total: 3, done: 3 },
        { kind: 'done', ok: true, id: 4, published: true, url: 'https://x/site/y/' },
      ]),
    )
    expect(seen).toEqual([
      { kind: 'progress', total: 3, done: 0 },
      { kind: 'progress', total: 3, done: 3 },
    ])
    expect(result.published).toBe(true)
    expect(result.id).toBe(4)
  })

  it('test_UAT_FC_REQ_222_a_stream_that_ends_without_a_verdict_is_a_failure', async () => {
    // A DROPPED CONNECTION MUST NOT RENDER AS A COMPLETED PUBLISH. The status said
    // 200 and meant only "the stream opened"; the absence of a verdict is treated
    // as the failure it is.
    const { streamPublish } = await import('../apps/control-app/src/builder/api.js')
    await expect(
      streamPublish('bakery', undefined, streaming([{ kind: 'progress', total: 2, done: 1 }])),
    ).rejects.toThrow(/before it said whether it finished/)
  })

  it('test_UAT_FC_REQ_222_a_terminal_frame_that_says_it_failed_is_raised_in_its_own_words', async () => {
    const { streamPublish } = await import('../apps/control-app/src/builder/api.js')
    await expect(
      streamPublish(
        'bakery',
        undefined,
        streaming([{ kind: 'done', ok: false, error: 'This site has 300 pictures needing 3900' }]),
      ),
    ).rejects.toThrow(/3900/)
  })

  it('test_UAT_FC_REQ_222_a_refusal_before_the_stream_opens_is_still_an_ordinary_status', async () => {
    // Not every failure is post-commit. A malformed request is refused before the
    // response becomes a stream, so it keeps the ordinary envelope — which is what
    // the client's own error handling reaches first.
    const { streamPublish } = await import('../apps/control-app/src/builder/api.js')
    const refusing = async () =>
      new Response(JSON.stringify({ error: 'slug is required' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      })
    await expect(streamPublish('bakery', undefined, refusing)).rejects.toThrow(/slug is required/)
  })
})
