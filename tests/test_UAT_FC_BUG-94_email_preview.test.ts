/**
 * [[BUG-94]] — **an email page can be opened in the builder.**
 *
 * WHAT WAS BROKEN. [[REQ-247]] made the copy a capture form mails an ordinary
 * page of the site, and protected it with a true property: a message has no
 * public address, so a published revision carries no file for one. That was
 * enforced in `renderSiteFiles`, at the one place a published revision's bytes
 * are decided — and `preview.ts` is deliberately not a second renderer, so the
 * builder's draft preview inherited the refusal. The page control listed the
 * message, selecting it produced nothing, and the one surface where somebody is
 * supposed to read a message before a stranger does could not show it.
 *
 * THE DISTINCTION THIS FILE PINS. *Not publicly addressable* is not the same as
 * *not renderable in the builder*. Publish writes no file for a message; the
 * builder's preview renders one, through the email target [[REQ-247]] already
 * built. Both halves are asserted here, in the same file and against the same
 * site, because either alone is satisfiable by the wrong fix: a preview that
 * works is satisfiable by serving the message publicly, and a published revision
 * that withholds it is satisfiable by the bug.
 *
 * DRIVEN THROUGH REAL ENTRY POINTS. The message is fetched over HTTP from the
 * real builder transport, at the URL the real page control composes, from a
 * listing taken from the real `/api/pages`. The published half goes through
 * `1c publish` and is read off the bytes it actually wrote. The page itself is
 * made and edited through the consultant's own toolbox, as [[REQ-247]]'s suite
 * does and for the same reason: a test that called `editPageAdd` directly would
 * prove a page can be made and say nothing about whether anyone can reach it.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *a message the builder cannot open* — the bug itself, in the two channels
 *     the builder actually shows and at the URL the control actually asks for;
 *   - *a message shown through the WEB target* — a preview that flatters the
 *     send, showing a flexbox page with a stylesheet that no mail client will
 *     ever paint, so what was checked is not what arrives;
 *   - *a message reaching a published revision* — [[REQ-247]] AC-3 traded away
 *     rather than kept;
 *   - *a message disturbing the pages that ARE served* — the served bytes are
 *     the thing a visitor sees, and this change must not move them;
 *   - *a preview that goes stale* — a message edited and a render still showing
 *     the words the operator just replaced;
 *   - *the declared-placeholder rule holding everywhere except here* — copy that
 *     drops `{{cta_url}}` accepted because it was written while looking at a
 *     preview.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { cmdNew, cmdPublish, startBuilder, type BuilderHandle } from '../tools/generate/src/cli'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox'
import { renderL1Email } from '../packages/framework/src/l1/email-render'
import type { L1Document } from '../packages/site-schema/src/index'
// The builder client's own URL composition — the same functions `pages.js` calls
// when the operator chooses a page, rather than a second spelling of the shape
// they encode. A URL built here by hand would prove this suite can reach the
// render and not that the CONTROL can.
import { previewPageUrl, previewUrl } from '../apps/control-app/src/builder/api.js'

const REPO = path.resolve(__dirname, '..')
const SLUG = 'studio'
/** The message under test: the shape of the real `whitepapers-email` page. */
const MESSAGE = 'welcome'
const SUBJECT = 'Your two papers'

let cwd: string
let builder: BuilderHandle

interface Box {
  run: (tool: string, input: Record<string, unknown>) => Promise<string>
}

/** The consultant, with exactly the grant it ships with. Nothing is added. */
function consultant(): Promise<Box> {
  return createL1Toolbox(SLUG, { cwd }) as Promise<Box>
}

function unwrap(answer: string): string {
  return answer.replace(/^<<<untrusted>>>\n/, '').replace(/\n<<<\/untrusted>>>$/, '')
}

/** The stored page, read as the store holds it — the input the emitter takes. */
function storedPage(id: string): { l1: L1Document; email?: { subject?: string } } {
  return JSON.parse(
    fs.readFileSync(path.join(cwd, 'storage', 'sites', SLUG, 'draft', 'pages', `${id}.json`), 'utf8'),
  )
}

/** The stored site definition, for the palette a message resolves against. */
function storedSite(): Record<string, unknown> {
  return JSON.parse(
    fs.readFileSync(path.join(cwd, 'storage', 'sites', SLUG, 'draft', 'site.json'), 'utf8'),
  )
}

/** GET a path on the builder, as the iframe and the chrome both do. */
async function get(p: string): Promise<Response> {
  return fetch(new URL(p, builder.url))
}

/** Every `.html` artifact a publish wrote, by name. */
function publishedHtml(outDir: string): string[] {
  return fs
    .readdirSync(outDir)
    .filter((f) => f.endsWith('.html'))
    .sort()
}

beforeEach(async () => {
  cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'bug94-'))
  cmdNew(SLUG, { cwd })
  const box = await consultant()
  // A served page beside the message, so every assertion below distinguishes
  // "the message is missing" from "the render failed and produced nothing".
  await box.run('add_page', { page: 'about', title: 'About', path: 'about' })
  await box.run('add_page', {
    page: MESSAGE,
    title: 'Your papers',
    kind: 'email',
    subject: SUBJECT,
    // The token whose loss is fatal to the delivery, so the placeholder rule is
    // live on this page rather than vacuously satisfied.
    placeholders: ['cta_url'],
  })
  builder = await startBuilder({
    cwd,
    clientDir: path.join(REPO, 'apps/control-app/src/builder'),
  })
})

afterEach(async () => {
  await builder?.close()
  if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
})

// ── the builder can show it ─────────────────────────────────────────────────

describe('BUG-94 — the draft preview renders a message', () => {
  /**
   * The bug, stated as the thing that must now work: the message comes back.
   *
   * THE SERVED PAGE IS FETCHED IN THE SAME TEST, which is what makes a pass mean
   * "the message renders" rather than "this build serves everything".
   */
  it('test_UAT_FC_BUG-94_the_draft_preview_serves_a_message', async () => {
    const message = await get(previewUrl(SLUG, 'draft', MESSAGE))
    expect(message.status).toBe(200)
    const html = await message.text()
    // The copy is THERE. Without this, every absence asserted below is satisfied
    // by an empty document.
    expect(html).toContain('Your papers')
    expect(html).toContain('{{cta_url}}')

    const served = await get(previewUrl(SLUG, 'draft', 'about'))
    expect(served.status).toBe(200)
  })

  /**
   * And the bytes are the EMAIL target's — not merely email-shaped.
   *
   * ASSERTED AS AN EQUALITY AGAINST `renderL1Email`, over the stored document
   * and the stored palette. A spot check for `<table` is satisfiable by a second
   * emitter that agrees about tables and disagrees about everything else; only
   * byte-identity says the operator is looking at the same bytes the SENDER
   * (`lead.ts`) will put in the envelope, which is the entire point of being
   * able to look at all.
   */
  it('test_UAT_FC_BUG-94_the_preview_bytes_are_the_email_targets', async () => {
    const page = storedPage(MESSAGE)
    const expected = renderL1Email(page.l1, {
      palette: storedSite().palette as never,
      subject: page.email?.subject,
    })

    const html = await (await get(previewUrl(SLUG, 'draft', MESSAGE))).text()
    expect(html).toBe(expected)
  })

  /**
   * …and therefore carries none of what the WEB target emits.
   *
   * THE MARKERS ARE TAKEN FROM THE SERVED PAGE IN THE SAME SITE rather than
   * written here, so this cannot pass by asserting the absence of something the
   * web target stopped emitting. Each is a thing a mail client discards: a
   * linked stylesheet, class selectors, the client bundle.
   */
  it('test_UAT_FC_BUG-94_a_message_is_not_shown_through_the_web_target', async () => {
    // THE SCAFFOLDED HOME PAGE, which carries an L1 document — `about` is added
    // bare above and renders an empty body, so it could witness no marker.
    const web = await (await get(previewUrl(SLUG, 'draft', 'home'))).text()
    expect(web).toContain('theme.css')
    expect(web).toContain('class=')

    const message = await (await get(previewUrl(SLUG, 'draft', MESSAGE))).text()
    expect(message).not.toContain('theme.css')
    expect(message).not.toContain('class=')
    expect(message).not.toContain('<script')
    // Tables and inlined style, which is what survives the journey instead.
    expect(message).toContain('<table')
    expect(message).toContain('style="')
    // The subject is the document title, which is what a mail client shows when
    // it has nowhere else to put one.
    expect(message).toContain(`<title>${SUBJECT}</title>`)
  })

  /**
   * A palette reference is a literal colour by the time the operator sees it.
   *
   * THE SAME RULE THE SEND OBEYS, checked where it is checkable. A mail client
   * has no custom properties, so a preview still carrying `{ ref: … }` — or the
   * `var(--…)` a browser would be handed — would be showing a message that
   * paints differently in the inbox than on the screen it was approved on.
   */
  it('test_UAT_FC_BUG-94_a_palette_reference_reaches_the_preview_as_a_colour', async () => {
    const box = await consultant()
    await box.run('add_palette_color', { name: 'paper', color: '#fffdf8' })
    const root = JSON.parse(unwrap(await box.run('get_l1', { page: MESSAGE, path: '0' }))) as {
      node: Record<string, unknown>
    }
    await box.run('set_l1', {
      page: MESSAGE,
      path: '0',
      node: { ...root.node, axes: { ...(root.node.axes as object), surfaceFill: { ref: 'paper' } } },
    })

    const html = await (await get(previewUrl(SLUG, 'draft', MESSAGE))).text()
    expect(html).toContain('#fffdf8')
    // The REFERENCE, in either spelling it could survive as: the stored form a
    // verbatim read hands back, and the custom property a browser would be given.
    expect(html).not.toContain('"ref"')
    expect(html).not.toContain('var(--')
  })
})

// ── the page control reaches it ─────────────────────────────────────────────

describe('BUG-94 — the page control opens a message', () => {
  /**
   * The operator's actual path: the listing names it, and the URL the control
   * builds for that row serves it.
   *
   * COMPOSED THROUGH THE CONTROL'S OWN FUNCTIONS. `previewPageUrl` is what
   * `pages.open` calls, so what is under test is the chain — listing row →
   * composed URL → bytes — rather than three facts that happen to be true
   * separately. This is precisely the chain that was broken: the listing had the
   * row all along.
   */
  it('test_UAT_FC_BUG-94_the_page_control_lists_a_message_and_opening_it_shows_it', async () => {
    const listing = (await (await get(`/api/pages?site=${SLUG}`)).json()) as {
      pages: { id: string; slug: string; kind: string }[]
    }
    const row = listing.pages.find((p) => p.id === MESSAGE)
    expect(row, 'the page control must list the message').toBeTruthy()
    expect(row!.kind).toBe('email')

    // The pane is showing some other page; choosing this row rewrites the page
    // within the channel it is already on, which is all `open` does.
    const showing = new URL(previewUrl(SLUG, 'draft', 'about'), builder.url).toString()
    const html = await (await fetch(previewPageUrl(showing, row!.slug))).text()
    expect(html).toContain('{{cta_url}}')
    expect(html).toContain('<table')
  })

  /**
   * In Edit as well as in View, because choosing a page never chooses a channel.
   *
   * THE SAME BYTES IN BOTH, and that is the decision rather than an accident. The
   * View/Edit toggle chooses between a page as a reader meets it and the same
   * page with its behaviour off and its regions addressable; neither half of that
   * distinction exists for something a mail client will paint, so a message has
   * one rendering and the toggle does not change it. What must not happen is the
   * bug returning on one side of the toggle.
   */
  it('test_UAT_FC_BUG-94_a_message_opens_in_the_edit_channel_too', async () => {
    const draft = await (await get(previewUrl(SLUG, 'draft', MESSAGE))).text()
    const edit = await get(previewUrl(SLUG, 'edit', MESSAGE))
    expect(edit.status).toBe(200)
    expect(await edit.text()).toBe(draft)
  })
})

// ── the published half is unchanged ─────────────────────────────────────────

describe('BUG-94 — publish still writes no file for a message', () => {
  /**
   * [[REQ-247]] AC-3, asserted directly against this change rather than assumed
   * to have survived it.
   *
   * THE FILE LIST IS COMPARED EXHAUSTIVELY, not spot-checked: a message must not
   * have been written under some OTHER name either. And the message's own words
   * are searched for across every published artifact, which is the form "no path
   * reaches it" takes when there is no file to ask for — there is no sitemap in
   * this project for one to be absent from, so what is asserted is the stronger
   * thing the sitemap claim stood for: a published revision does not carry these
   * bytes anywhere.
   */
  it('test_UAT_FC_BUG-94_a_published_revision_carries_no_message', async () => {
    const { outDir } = await cmdPublish(SLUG, { cwd })

    expect(publishedHtml(outDir)).toEqual(['about.html', 'home.html', 'index.html'])
    expect(fs.existsSync(path.join(outDir, `${MESSAGE}.html`))).toBe(false)

    for (const name of fs.readdirSync(outDir)) {
      const full = path.join(outDir, name)
      if (fs.statSync(full).isDirectory()) continue
      expect(fs.readFileSync(full, 'utf8'), `${name} names the message`).not.toContain('{{cta_url}}')
    }
  })

  /**
   * And a site holding one still publishes, with its served bytes untouched.
   *
   * THE COMPARISON IS AGAINST THE SAME SITE WITHOUT THE MESSAGE, published
   * first — which is what makes "byte-identical to what they were before this
   * change" an assertion rather than a claim. Every artifact is compared, not
   * only the pages: `theme.css` is where an L1 axis or a token change would land
   * and is the file a careless widening of the render would most likely disturb.
   */
  it('test_UAT_FC_BUG-94_a_message_does_not_disturb_the_pages_that_are_served', async () => {
    const bare = fs.mkdtempSync(path.join(os.tmpdir(), 'bug94-bare-'))
    try {
      cmdNew(SLUG, { cwd: bare })
      const box = (await createL1Toolbox(SLUG, { cwd: bare })) as Box
      await box.run('add_page', { page: 'about', title: 'About', path: 'about' })
      const before = await cmdPublish(SLUG, { cwd: bare })
      const after = await cmdPublish(SLUG, { cwd })

      const read = (dir: string): Map<string, string> =>
        new Map(
          fs
            .readdirSync(dir)
            .filter((n) => !fs.statSync(path.join(dir, n)).isDirectory())
            .sort()
            .map((n) => [n, fs.readFileSync(path.join(dir, n), 'utf8')] as const),
        )

      expect(read(after.outDir)).toEqual(read(before.outDir))
    } finally {
      fs.rmSync(bare, { recursive: true, force: true })
    }
  })
})

// ── the preview is live, and still governed ─────────────────────────────────

describe('BUG-94 — the preview tracks the definition', () => {
  /**
   * An edit to the copy shows up on the next request.
   *
   * THIS IS THE POINT OF THE FEATURE, not a cache test. The reason to render a
   * message in the builder is to read it, change it and read it again before
   * anyone receives it; a preview that answered from a render taken before the
   * edit would be showing the words the operator just replaced, which is worse
   * than showing nothing.
   */
  it('test_UAT_FC_BUG-94_editing_a_message_changes_what_the_preview_shows', async () => {
    const first = await (await get(previewUrl(SLUG, 'draft', MESSAGE))).text()
    expect(first).toContain('Nobody has received it yet')

    const box = await consultant()
    await box.run('set_l1', {
      page: MESSAGE,
      path: '0',
      node: {
        kind: 'container',
        layout: 'stack',
        gapPx: 16,
        children: [
          { kind: 'text', text: 'Here are the two papers you asked for.', axes: { fontSizePx: 16 } },
          // The declared token, kept — see the next case for what happens without it.
          { kind: 'text', text: 'Open them', link: { href: '{{cta_url}}' }, axes: { fontSizePx: 16 } },
        ],
      },
    })

    const second = await (await get(previewUrl(SLUG, 'draft', MESSAGE))).text()
    expect(second).toContain('Here are the two papers you asked for.')
    expect(second).not.toContain('Nobody has received it yet')
  })

  /**
   * And the declared-placeholder rule still holds while they are looking at it.
   *
   * WHERE THE AUTHOR CAN STILL ACT ON IT. The sender has always refused copy
   * that lost a declared token, but that refusal arrives while somebody is
   * waiting for mail. Being able to SEE the message is exactly the moment an
   * author rewrites it, so the refusal has to survive the new surface — and the
   * preview must go on showing the copy that was kept rather than the copy that
   * was refused.
   */
  it('test_UAT_FC_BUG-94_copy_that_drops_a_declared_token_is_still_refused', async () => {
    const box = await consultant()
    const why = await box.run('set_l1', {
      page: MESSAGE,
      path: '0',
      node: {
        kind: 'container',
        layout: 'stack',
        children: [{ kind: 'text', text: 'Thanks! It is on its way.', axes: { fontSizePx: 16 } }],
      },
    })
    expect(why).toMatch(/^Error:/)
    expect(why).toContain('cta_url')

    const html = await (await get(previewUrl(SLUG, 'draft', MESSAGE))).text()
    expect(html).toContain('{{cta_url}}')
    expect(html).not.toContain('Thanks! It is on its way.')
  })
})
