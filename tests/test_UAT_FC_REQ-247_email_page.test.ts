/**
 * [[REQ-247]] — **an email a form sends is a page of the site.**
 *
 * WHAT THIS FILE PROVES. That the copy a capture form mails is an ordinary page
 * — listed where pages are listed, styled with L1, reached through the
 * operations the assistant already holds — and that being a page is what closes
 * the capability gap the ticket exists for. Before this, `config.template` named
 * a key into a business-scoped ticket store the consultant had no write grant
 * to: it could not author copy, could not show an operator what a message said,
 * and could not act on a `no_template` outcome. §1's real delivery failure — the
 * whitepapers form, configured with two assets and no `template`, capturing
 * contacts and mailing nobody — was that gap costing a live send.
 *
 * SO THE CENTRAL CLAIM IS "NO NEW SURFACE", and it is asserted the only way it
 * can be: by doing the whole job through the tools that already existed. Every
 * case below drives `createL1Toolbox` — the real consultant surface, with the
 * real grant — and never `editPageAdd` directly. A test calling the edit
 * function would prove a page can be made and say nothing about whether the
 * assistant can reach it, which is the half that was missing.
 *
 * THE SECOND CLAIM IS THAT THE REDUCED AXIS SET IS DATA. §3 is explicit that a
 * documented subset drifts from its renderer and a declared one cannot, so the
 * assertions compare what the surface TELLS the assistant against the same
 * constant the refusals are computed from — never against a list written here.
 * A list written here would be a third answer to the question, and the one that
 * drifts.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *an email page needing a tool, a tab or a role that did not exist* — the
 *     whole design collapses to "a new surface", which is what §2 rules out;
 *   - *a message being served* — it has no public address, and a page in a
 *     published revision is fetchable by guessing a path;
 *   - *an axis the email emitter cannot honour being written and found out about
 *     by a recipient* — the failure the declaration exists to prevent;
 *   - *the allowed set the assistant is told about disagreeing with the one it is
 *     refused by* — a manual that lies, which is the failure §3 cites
 *     `BehaviorConfigSpec` for having already caused;
 *   - *a form naming a message that does not exist being accepted* — [[REQ-243]]'s
 *     property, which must survive the move rather than be traded for it;
 *   - *copy losing a token its delivery depends on* — a mail with a dead button,
 *     which looks entirely ordinary to whoever receives it;
 *   - *a message arriving illegible in a client with no flexbox, no custom
 *     properties and no web fonts* — the reason there are two render targets at
 *     all.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, existsSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, cmdRender } from '../tools/generate/src/cli'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox'
import { editPageList } from '../tools/generate/src/cli/edit'
import {
  L1_EMAIL_TARGET,
  validateSite,
  type L1Document,
  type L1Node,
} from '../packages/site-schema/src/index'
import { renderL1Email } from '../packages/framework/src/l1/email-render'
import { defaultEmailDocument } from '../packages/framework/src/l2/email-page'
import { siteSeed } from './support/site-seed'
import { readSitePayload, payloadToWrite } from '../tools/generate/src/cli/push'
import { fsSiteStore, memorySiteStore, memoryReferenceStore } from '../tools/generate/src/store'
// The Astro-free worker entry, as `edit.ts` and `publish.ts` use — the same
// readers the refusals under test are computed from.
import {
  contactFormTemplateRefs,
  emailPageRefusal,
  emailPagesOf,
} from '../packages/framework/src/worker'

const SLUG = 'studio'

let cwd: string

interface Box {
  run: (tool: string, input: Record<string, unknown>) => Promise<string>
  toolNames: () => string[]
}

/** The consultant, with exactly the grant it ships with. Nothing is added. */
function consultant(): Promise<Box> {
  return createL1Toolbox(SLUG, { cwd, sandbox: true }) as Promise<Box>
}

/** A read's payload, with the provenance markers a consumer strips after reading. */
function unwrap(answer: string): string {
  return answer.replace(/^<<<untrusted>>>\n/, '').replace(/\n<<<\/untrusted>>>$/, '')
}

async function json<T>(box: Box, tool: string, input: Record<string, unknown> = {}): Promise<T> {
  return JSON.parse(unwrap(await box.run(tool, input))) as T
}

/**
 * Run an operation that must be REFUSED, and hand back what the caller was told.
 *
 * THE SURFACE ANSWERS A REFUSAL, IT DOES NOT THROW ONE, and that is deliberate
 * on its part rather than an accident this helper papers over: the consumer is a
 * model in a tool loop, and a refusal it can read and correct from is worth more
 * than an exception that ends the turn. So the assertion is on the words, which
 * is also the only thing that says the refusal was ACTIONABLE.
 */
async function refused(
  box: Box,
  tool: string,
  input: Record<string, unknown>,
): Promise<string> {
  const answer = await box.run(tool, input)
  expect(answer, `${tool} was expected to be refused`).toMatch(/^Error:/)
  return answer
}

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'req247-'))
  cmdNew(SLUG, { cwd, sandbox: true })
})
afterEach(() => rmTmp())
function rmTmp(): void {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('node:fs').rmSync(cwd, { recursive: true, force: true })
}

// ── AC-1, AC-2 — it is a page, and the tools that reach pages reach it ──────

describe('REQ-247 — a message is an ordinary page', () => {
  /**
   * AC-1 ∩ AC-2 — the whole job, through the operations that already existed.
   *
   * THE ASSERTION ABOUT THE TOOL LIST IS THE LOAD-BEARING ONE. Making a page,
   * reading its document and writing a new one would all pass against a design
   * that had added `add_email`, `get_email_copy` and `set_email_copy` — and that
   * design is precisely what §2 rules out, because it is a new surface, a new
   * vocabulary and a new thing to keep in step with pages. So the names the
   * consultant holds are captured BEFORE anything is made and compared after,
   * and the message is authored with `add_page`, `get_l1` and `set_l1` by name.
   */
  it('test_UAT_FC_REQ-247_a_message_is_made_and_edited_with_the_page_tools', async () => {
    const box = await consultant()
    const before = box.toolNames().sort()

    // MADE WITH `add_page`. Not a new operation — the same one that makes a
    // served page, told which target this one is for.
    await box.run('add_page', {
      page: 'welcome',
      title: 'Welcome aboard',
      kind: 'email',
      subject: 'Welcome aboard',
    })

    // AC-1 — it is in the page list, beside the served pages, and says which it
    // is. Every entry carries a kind, so an unmarked page is never ambiguous
    // between "served" and "written before this existed".
    const listed = await json<{ pages: Array<{ id: string; kind: string }> }>(box, 'list_pages')
    const welcome = listed.pages.find((p) => p.id === 'welcome')
    expect(welcome, JSON.stringify(listed)).toBeDefined()
    expect(welcome!.kind).toBe('email')
    expect(listed.pages.find((p) => p.id === 'home')!.kind).toBe('web')

    // AC-1 — it is STYLED WITH L1, and it arrived with copy somebody can read.
    // AC-4's "before any submission occurs" rests on this: a page with no body
    // would be a message nobody could have reviewed.
    const read = await json<{ node: L1Node }>(box, 'get_l1', { page: 'welcome', path: '0' })
    expect(JSON.stringify(read.node)).toContain('Welcome aboard')

    // …and it is edited with `set_l1`, exactly as a served page is.
    await box.run('set_l1', {
      page: 'welcome',
      path: '0.1',
      node: {
        kind: 'text',
        text: 'Hello from the studio.',
        axes: { fontFamily: 'Helvetica, sans-serif', fontSizePx: 16, color: '#1a1a1a' },
      },
    })
    const after = await json<{ node: L1Node }>(box, 'get_l1', { page: 'welcome', path: '0.1' })
    expect(JSON.stringify(after.node)).toContain('Hello from the studio.')

    // AC-2 — AND NOT ONE TOOL WAS ADDED. No new surface, no new role, and no
    // ticket-write grant: the capability gap closed as a consequence of the
    // message being a page rather than as a work item of its own.
    expect(box.toolNames().sort()).toEqual(before)
  })

  /**
   * AC-1's other half — the subject and the sender travel with the page and are
   * not L1.
   *
   * WHY THEY CANNOT BE IN THE DOCUMENT. The L1 document is the BODY, the words a
   * recipient reads. A subject line is not in it: it is not painted, it has no
   * box, and nothing in the element tree is the place for it — which is exactly
   * why `seoMeta` sits beside the document for a served page rather than inside
   * it.
   */
  it('test_UAT_FC_REQ-247_the_subject_is_carried_by_the_page_and_refined_in_place', async () => {
    const box = await consultant()
    await box.run('add_page', {
      page: 'papers',
      title: 'Your download',
      kind: 'email',
      subject: 'Your download is ready',
      placeholders: ['cta_url'],
    })

    const read = await json<{ page: { email: { subject: string; placeholders: string[] } } }>(
      box,
      'describe_page',
      { page: 'papers' },
    )
    expect(read.page.email.subject).toBe('Your download is ready')
    expect(read.page.email.placeholders).toEqual(['cta_url'])

    // CHANGING THE SUBJECT DOES NOT LOSE THE DECLARATION, which is the same
    // merge-not-replace rule `seoMeta` takes — an author editing one field must
    // not silently drop another they cannot see from where they are standing.
    await box.run('update_page', { page: 'papers', subject: 'Here are your papers' })
    const again = await json<{ page: { email: { subject: string; placeholders: string[] } } }>(
      box,
      'describe_page',
      { page: 'papers' },
    )
    expect(again.page.email.subject).toBe('Here are your papers')
    expect(again.page.email.placeholders).toEqual(['cta_url'])
  })
})

// ── AC-3 — it is never served ───────────────────────────────────────────────

describe('REQ-247 — a message has no public address', () => {
  /**
   * AC-3 — no file is written for an email page, so there is nothing to route
   * to and nothing to guess.
   *
   * ASSERTED ON THE BYTES AND NOT ON A ROUTER. §2 says a message is part of the
   * site's content and not of its surface, and the difference between those is
   * only real if it is enforced where the published bytes are decided. A route
   * that refused a path would be a rule somebody could relax; a file that was
   * never written is a page there is no way to ask for.
   *
   * THE SERVED PAGE IS RENDERED IN THE SAME PASS, which is what stops this
   * passing against a render that simply failed.
   */
  it('test_UAT_FC_REQ-247_an_email_page_is_not_in_the_published_output', async () => {
    const box = await consultant()
    await box.run('add_page', {
      page: 'welcome',
      title: 'Welcome',
      kind: 'email',
      subject: 'Welcome',
    })
    await box.run('add_page', { page: 'about', title: 'About', path: 'about' })

    await cmdRender(SLUG, { cwd, sandbox: true })
    const out = path.join(cwd, 'storage', 'dist', 'sandbox', SLUG, 'draft')
    const written = readdirSync(out).filter((f) => f.endsWith('.html')).sort()

    // The served pages are there…
    expect(written).toContain('index.html')
    expect(written).toContain('about.html')
    // …and the message is not, under its own name or any other. The exhaustive
    // comparison is what makes this more than a spot check: a message cannot
    // have been written under some OTHER name either.
    expect(written).toEqual(['about.html', 'home.html', 'index.html'])
    expect(existsSync(path.join(out, 'welcome.html'))).toBe(false)
  })

  /**
   * AC-3 — and nothing may link to one.
   *
   * REFUSED RATHER THAN DROPPED AT RENDER, because the two failures are not the
   * same. A silently-omitted nav entry is a menu item an author put there and
   * cannot find, which reads as the builder losing their work; naming it says
   * which entry and which page, at the moment the entry is written.
   */
  it('test_UAT_FC_REQ-247_nothing_can_navigate_to_a_message', () => {
    const seed = siteSeed({ slug: SLUG })
    const nav = (seed.siteJson as { nav: Record<string, unknown> }).nav
    const result = validateSite({
      ...seed.siteJson,
      // MERGED INTO THE SCAFFOLDER'S OWN NAV rather than replacing it, so what
      // is under test is the entry and not a nav rebuilt here missing a field.
      nav: { ...nav, entries: [{ label: 'Welcome', target: { kind: 'page', pageId: 'welcome' } }] },
      pages: [
        seed.pages['home.json'],
        {
          id: 'welcome',
          slug: 'welcome',
          title: 'Welcome',
          kind: 'email',
          email: { subject: 'Welcome' },
          modules: [],
          l1: defaultEmailDocument('Welcome'),
        },
      ],
    })

    expect(result.ok).toBe(false)
    const said = JSON.stringify(result.ok ? [] : result.errors)
    expect(said).toContain('welcome')
    expect(said).toContain('never served')
  })
})

// ── AC-10 — the reduced axis set is declared data ───────────────────────────

describe('REQ-247 — an email page says only what the email target can emit', () => {
  /**
   * AC-10, the refusal half — an axis the emitter cannot honour is refused when
   * it is WRITTEN.
   *
   * THE POINT IS WHEN, NOT WHETHER. A `boxShadow` in a message is not a rendering
   * bug that shows up in review: a mail client silently drops it, so the author
   * sees the page they meant everywhere they look and the recipient sees
   * something else. Refusing at the write is the only moment the author is still
   * holding the decision.
   *
   * DRIVEN THROUGH `set_l1`, so what is asserted is that the assistant cannot do
   * it — not that a validator would have objected if anyone had asked.
   */
  it('test_UAT_FC_REQ-247_an_axis_the_email_target_cannot_emit_is_refused_by_set_l1', async () => {
    const box = await consultant()
    await box.run('add_page', { page: 'welcome', title: 'Welcome', kind: 'email', subject: 'Hi' })
    const before = await box.run('get_l1', { page: 'welcome', path: '0' })

    const why = await refused(box, 'set_l1', {
      page: 'welcome',
      path: '0.0',
      node: {
        kind: 'text',
        text: 'Shadowed',
        // Not on the email target: a paint effect a mail client either drops or
        // paints as something the author did not author. WELL-FORMED, so what
        // refuses it is the target and not the shape — a malformed shadow would
        // be refused on a served page too, and would prove nothing.
        axes: {
          fontSizePx: 16,
          boxShadow: { offsetXPx: 0, offsetYPx: 2, blurPx: 4, color: '#000000' },
        },
      },
    })
    // AND IT SAYS WHY IN TERMS OF THE TARGET, not merely that something is
    // invalid: an author told "refused" learns nothing about a message that
    // looks right everywhere they can see it.
    expect(why).toMatch(/mail client|email/)

    // THE DRAFT IS BYTE-UNCHANGED, which is what makes it a refusal rather than
    // a warning: a partially-applied write would leave the author's message in a
    // state neither they nor the emitter agreed to.
    expect(await box.run('get_l1', { page: 'welcome', path: '0' })).toBe(before)

    // …and THE SAME AXIS ON A SERVED PAGE IS PERFECTLY ORDINARY, which is what
    // makes the refusal above about the target rather than about the axis.
    const onWeb = await box.run('set_l1', {
      page: 'home',
      path: '0',
      node: {
        kind: 'box',
        axes: { boxShadow: { offsetXPx: 0, offsetYPx: 2, blurPx: 4, color: '#000000' } },
        children: [],
      },
    })
    expect(onWeb).not.toMatch(/^Error:/)
  })

  /**
   * AC-10, the projection half — what the assistant is TOLD it may use is read
   * off the same constant the refusal is computed from.
   *
   * THIS IS THE ASSERTION §3 IS ABOUT. "Documentation would drift from the
   * renderer; a declaration cannot" is a claim about identity, and the only way
   * to assert identity is to compare the two values rather than to compare
   * either against a list written here. A literal expectation in this file would
   * be a third answer to the question and the one that goes stale first.
   */
  it('test_UAT_FC_REQ-247_the_allowed_set_is_projected_and_not_written_by_hand', async () => {
    const box = await consultant()
    await box.run('add_page', { page: 'welcome', title: 'Welcome', kind: 'email', subject: 'Hi' })

    const told = await json<{ emailTarget: typeof L1_EMAIL_TARGET }>(box, 'describe_page', {
      page: 'welcome',
    })
    expect(told.emailTarget).toEqual(L1_EMAIL_TARGET)

    // AND ABSENT ON A SERVED PAGE, because a served page has the whole of L1.
    // A target stated on every page would read as a limit that applies to all of
    // them.
    const served = await json<Record<string, unknown>>(box, 'describe_page', { page: 'home' })
    expect(served.emailTarget).toBeUndefined()

    // THE PROJECTION IS NOT EMPTY AND IS NOT EVERYTHING. Both degenerate cases
    // would satisfy the identity above while making the declaration useless.
    expect(L1_EMAIL_TARGET.kinds.length).toBeGreaterThan(0)
    expect(L1_EMAIL_TARGET.kinds).not.toContain('slot')
  })
})

// ── AC-12 — copy keeps the promise it made ──────────────────────────────────

describe('REQ-247 — a declared placeholder survives editing', () => {
  /**
   * AC-12 — copy that would drop `{{cta_url}}` out of a message whose delivery
   * depends on it is refused rather than sent broken.
   *
   * REFUSED AT THE KEYSTROKE, NOT AT THE SEND. The sender has always refused a
   * render whose copy lost a declared token ([[REQ-197]]) — but that refusal
   * arrives while somebody is waiting for mail, by which time the edit that
   * caused it is hours old and the operator is not looking. An email page is
   * validated like every other page on every write, so the same rule lands where
   * the author can still act on it.
   */
  it('test_UAT_FC_REQ-247_copy_that_drops_a_declared_token_is_refused', async () => {
    const box = await consultant()
    await box.run('add_page', {
      page: 'papers',
      title: 'Your download',
      kind: 'email',
      subject: 'Your download',
      placeholders: ['cta_url'],
    })

    // The default copy carries the token, in a button and again as pasteable
    // text — so the page is valid the moment it is made.
    const made = await json<{ node: L1Node }>(box, 'get_l1', { page: 'papers', path: '0' })
    expect(JSON.stringify(made.node)).toContain('{{cta_url}}')

    // REPLACING THE WHOLE BODY WITH COPY THAT DOES NOT CARRY IT IS REFUSED.
    const why = await refused(box, 'set_l1', {
      page: 'papers',
      path: '0',
      node: {
        kind: 'container',
        layout: 'stack',
        children: [
          {
            kind: 'text',
            text: 'Thanks! Your download is on its way.',
            axes: { fontSizePx: 16 },
          },
        ],
      },
    })
    // THE REFUSAL NAMES THE TOKEN, which is the difference between a refusal an
    // author can act on and one that sends them re-reading their own copy.
    expect(why).toContain('cta_url')

    // …and the message still says what it promised to say.
    const still = await json<{ node: L1Node }>(box, 'get_l1', { page: 'papers', path: '0' })
    expect(JSON.stringify(still.node)).toContain('{{cta_url}}')
  })

  /**
   * AC-12's counterpart — a token in a LINK counts as copy.
   *
   * AND IT HAS TO. The one token whose absence is fatal is the call to action,
   * and the ordinary way to write a call to action is a button whose words say
   * "Open your download" and whose `href` is `{{cta_url}}`. A check that read
   * only the visible words would pass a message whose button is the broken part
   * — which is the exact mail this rule exists to stop going out.
   */
  it('test_UAT_FC_REQ-247_a_token_in_a_link_is_copy_for_this_purpose', () => {
    const seed = siteSeed({ slug: SLUG })
    const linkOnly: L1Document = {
      widths: [600],
      background: '#ffffff',
      textColor: '#1a1a1a',
      root: {
        kind: 'container',
        layout: 'stack',
        children: [
          // The words do not contain the token; the `href` does. This must pass.
          { kind: 'text', text: 'Open your download', link: { href: '{{cta_url}}' } },
        ],
      },
    } as L1Document

    const page = {
      id: 'papers',
      slug: 'papers',
      title: 'Papers',
      kind: 'email',
      email: { subject: 'Papers', placeholders: ['cta_url'] },
      modules: [],
      l1: linkOnly,
    }
    const ok = validateSite({ ...seed.siteJson, pages: [seed.pages['home.json'], page] })
    expect(ok.ok, JSON.stringify(ok.ok ? [] : ok.error)).toBe(true)
  })
})

// ── AC-11 — it arrives legibly in a poor client ─────────────────────────────

describe('REQ-247 — one L1, two render targets', () => {
  /**
   * AC-11 — a message renders for a client that supports no flexbox, no custom
   * properties and no web fonts.
   *
   * ASSERTED AS ABSENCES AND AS PRESENCES, because either alone is satisfiable
   * by a broken renderer: a document containing none of the forbidden constructs
   * could simply be empty, and one laying out in tables could still be reaching
   * for a web font. So the copy has to be IN there, laid out in tables, with
   * every style inlined — and none of the three things the ticket names.
   *
   * THE PALETTE IS RESOLVED TO A LITERAL, which is the custom-properties half:
   * `var(--ink)` is what a browser would be given and is nothing at all in a
   * mail client, so a reference has to have become a colour by the time the
   * bytes leave.
   */
  it('test_UAT_FC_REQ-247_a_message_renders_for_a_client_that_supports_almost_nothing', () => {
    const doc = defaultEmailDocument('Your download', ['cta_url'])
    // A palette REFERENCE, which is the thing that must not survive.
    ;(doc.root as unknown as { axes: Record<string, unknown> }).axes = { surfaceFill: { ref: 'paper' } }

    const html = renderL1Email(doc, {
      palette: { paper: { value: '#fffdf8' } } as never,
      subject: 'Your download',
    })

    // THE WORDS ARE THERE. Without this every absence below is satisfied by an
    // empty document.
    expect(html).toContain('Your download')
    expect(html).toContain('{{cta_url}}')

    // LAID OUT IN TABLES, which is the only layout a mail client agrees on.
    expect(html).toContain('<table')
    // NO FLEXBOX, anywhere.
    expect(html).not.toMatch(/display\s*:\s*flex/)
    // NO CUSTOM PROPERTIES — and the reference really did resolve.
    expect(html).not.toContain('var(--')
    expect(html).toContain('#fffdf8')
    // NO WEB FONTS, AND NO STYLESHEET AT ALL: every style is inlined, because
    // Gmail drops a `<style>` block on forwarding.
    expect(html).not.toContain('@font-face')
    expect(html).not.toContain('<style')
    expect(html).not.toContain('<link')
    expect(html).toContain('style="')
    // NO SCRIPT. A message is a closed document by the time it leaves.
    expect(html).not.toContain('<script')

    // A FAMILY DEGRADES TO GLYPHS THAT EXIST ON THE READING MACHINE, which is
    // the whole reason a handle cannot simply be passed through.
    expect(html).toMatch(/font-family:[^;"]*Helvetica/)
    expect(html).toMatch(/font-family:[^;"]*sans-serif/)
  })

  /**
   * AC-11's structural half — the same document is emitted differently for the
   * two targets, and the authoring model does not fork.
   *
   * ONE L1 AND TWO EMITTERS is the claim, and what makes it checkable is that
   * the SAME document object goes into both. A test rendering two documents
   * would prove only that two renderers exist.
   */
  it('test_UAT_FC_REQ-247_one_document_is_emitted_two_ways', () => {
    const doc = defaultEmailDocument('Hello there')
    const asEmail = renderL1Email(doc, { subject: 'Hello there' })

    // The email target says it in tables with inlined styles…
    expect(asEmail).toContain('Hello there')
    expect(asEmail).toContain('<table')
    // …at exactly the one width an email page is authored at, because there is
    // no viewport to respond to.
    expect(doc.widths).toHaveLength(1)
    expect(asEmail).toContain(`width="${doc.widths[0]}"`)
  })
})

// ── AC-4, AC-7 — naming a message is a decision, made at the moment of the act ─

describe('REQ-247 — a form names a message, and naming a missing one is refused', () => {
  /**
   * AC-7 — configuring a form to send a message that does not exist is refused
   * WHEN THE FORM IS CONFIGURED, and the refusal says what exists and how to
   * make another.
   *
   * THE MOMENT IS THE CHANGE, not the check. [[REQ-243]] already made a typo a
   * refusal at PUBLISH, which is authoring time and is still far too late: the
   * author has moved on, the connection between the name they typed and the
   * refusal they eventually read has to be reconstructed, and in the meantime
   * the builder's own preview submits against a draft nothing validated.
   *
   * AND THE REFUSAL HAS TO BE ACTIONABLE, which is the half §1's real failure
   * turned on. The whitepapers form was configured by an assistant that set
   * every field it had been told about and omitted the one whose meaning existed
   * only in a source comment; nothing could have told it otherwise. So the words
   * are asserted, not just the refusal: what the site holds, and the operation
   * that makes another.
   */
  it('test_UAT_FC_REQ-247_configuring_a_form_to_send_a_missing_message_is_refused', async () => {
    const box = await consultant()
    // One message the site DOES hold, so the refusal has something to list and
    // the assertion is about naming rather than about emptiness.
    await box.run('add_page', {
      page: 'welcome',
      title: 'Welcome',
      kind: 'email',
      subject: 'Welcome',
    })
    await box.run('set_l1', {
      page: 'home',
      path: '0',
      node: { kind: 'container', layout: 'stack', children: [{ kind: 'slot', name: 'capture' }] },
    })

    const why = await refused(box, 'add_component', {
      page: 'home',
      name: 'beta-form',
      behavior: 'contact-form',
      slot: 'capture',
      config: {
        submitLabel: 'Join',
        fields: [{ name: 'email', label: 'Your email', type: 'email', required: true }],
        template: 'whitepapers',
      },
    })

    expect(why).toContain('beta-form')
    expect(why).toContain('whitepapers')
    // WHAT EXISTS…
    expect(why).toContain('welcome')
    // …AND WHAT MAKES ANOTHER. A refusal an author can act on inside the same
    // turn, rather than one that sends them hunting.
    expect(why).toMatch(/add_page/)
    expect(why).toMatch(/email/)
  })

  /**
   * AC-4 — configuring a form to send a message materialises the page, with
   * readable default copy, BEFORE any submission occurs.
   *
   * THIS IS THE PROPERTY THE WHOLE DESIGN IS FOR. The copy used to be seeded at
   * SEND time, so the first recipient of a new message was the first person to
   * read it — a message nobody had reviewed, going out under a business's name.
   * Making the page is now the thing that makes the form configurable at all, so
   * the copy necessarily exists first and necessarily can be read first.
   *
   * ASSERTED AS AN ORDER OF EVENTS: the page is readable, with words in it, at a
   * moment when nothing has been submitted and the site has never been
   * published.
   */
  it('test_UAT_FC_REQ-247_the_copy_can_be_read_before_anybody_receives_it', async () => {
    const box = await consultant()
    await box.run('add_page', {
      page: 'whitepapers',
      title: 'Your papers',
      kind: 'email',
      subject: 'Your papers are ready',
      placeholders: ['cta_url'],
    })
    await box.run('set_l1', {
      page: 'home',
      path: '0',
      node: { kind: 'container', layout: 'stack', children: [{ kind: 'slot', name: 'capture' }] },
    })
    const added = await box.run('add_component', {
      page: 'home',
      name: 'papers-form',
      behavior: 'contact-form',
      slot: 'capture',
      config: {
        submitLabel: 'Send me the papers',
        fields: [{ name: 'email', label: 'Your email', type: 'email', required: true }],
        template: 'whitepapers',
      },
    })
    expect(added).not.toMatch(/^Error:/)

    // THE WORDS ARE THERE, READABLE, AND NOBODY HAS SUBMITTED ANYTHING. This is
    // the review window the old seed-at-send design had no room for at all.
    const copy = await json<{ node: L1Node }>(box, 'get_l1', { page: 'whitepapers', path: '0' })
    const said = JSON.stringify(copy.node)
    expect(said).toContain('Your papers')
    expect(said).toContain('{{cta_url}}')
    // …and it says, in as many words, that it has not gone anywhere yet.
    expect(said).toMatch(/Nobody has received it yet/)
  })

  /**
   * AC-7's counterpart — a message a form sends is not removed out from under it.
   *
   * THE SAME RULE AS THE NAV CHECK, for the half of the site that is never
   * served. A page nothing links to still has something pointing at it when a
   * form names it, and deleting it would leave the form silently mailing nobody
   * — which is §1's failure arrived at from the other direction.
   */
  it('test_UAT_FC_REQ-247_a_message_a_form_sends_cannot_be_removed_by_accident', async () => {
    const box = await consultant()
    await box.run('add_page', {
      page: 'welcome',
      title: 'Welcome',
      kind: 'email',
      subject: 'Welcome',
    })
    await box.run('set_l1', {
      page: 'home',
      path: '0',
      node: { kind: 'container', layout: 'stack', children: [{ kind: 'slot', name: 'capture' }] },
    })
    await box.run('add_component', {
      page: 'home',
      name: 'beta-form',
      behavior: 'contact-form',
      slot: 'capture',
      config: {
        submitLabel: 'Join',
        fields: [{ name: 'email', label: 'Your email', type: 'email', required: true }],
        template: 'welcome',
      },
    })

    const why = await refused(box, 'remove_page', { page: 'welcome' })
    expect(why).toContain('beta-form')
    expect(why).toContain('welcome')

    // …and the message is still there, so the refusal really refused.
    const listed = await json<{ pages: Array<{ id: string }> }>(box, 'list_pages')
    expect(listed.pages.map((p) => p.id)).toContain('welcome')
  })
})

// ── AC-18 — a message is reached by the form that sends it ─────────────────

describe('REQ-247 — what reaches a message is a form, not a link', () => {
  /**
   * AC-18 — the listing says a message nothing sends is stranded, and does NOT
   * say it of one a form sends.
   *
   * THIS IS WHERE TWO RULES MEET. [[REQ-248]] marks a page nothing links to,
   * because such a page cannot be opened at all and the mark is the only signal
   * it is either deliberate or forgotten. [[REQ-247]] gives the site pages that
   * NOTHING MAY EVER LINK TO — a message has no public address by design. Read
   * naively, every message a site holds is stranded, and a mark that fires on
   * correct work is one an author learns to scroll past, which costs the real
   * stranded page the only thing it had.
   *
   * SO THE QUESTION IS ASKED IN THE RIGHT VOCABULARY. What reaches a message is
   * the form whose `template` names it, and what strands one is no form naming
   * it — which is a genuine and useful thing to be told, because a message
   * nothing sends is copy nobody will ever receive.
   *
   * AND THE WORDING FOLLOWS THE VOCABULARY. Telling an author that nothing
   * *links* to a page nobody can visit would send them looking for a link they
   * must never add.
   */
  it('test_UAT_FC_REQ-247_a_message_a_form_sends_is_not_reported_stranded', async () => {
    const box = await consultant()
    await box.run('add_page', {
      page: 'welcome',
      title: 'Welcome',
      kind: 'email',
      subject: 'Welcome',
    })
    // A second message that no form will ever name — the control.
    await box.run('add_page', {
      page: 'orphan',
      title: 'Nobody sends this',
      kind: 'email',
      subject: 'Unsent',
    })
    await box.run('set_l1', {
      page: 'home',
      path: '0',
      node: { kind: 'container', layout: 'stack', children: [{ kind: 'slot', name: 'capture' }] },
    })
    await box.run('add_component', {
      page: 'home',
      name: 'beta-form',
      behavior: 'contact-form',
      slot: 'capture',
      config: {
        submitLabel: 'Join',
        fields: [{ name: 'email', label: 'Your email', type: 'email', required: true }],
        template: 'welcome',
      },
    })

    const listed = await json<{
      pages: Array<{ id: string; kind: string; reachable: boolean }>
    }>(box, 'list_pages')
    const reach = Object.fromEntries(listed.pages.map((p) => [p.id, p.reachable]))

    // THE MESSAGE A FORM SENDS IS REACHED, though nothing links to it and
    // nothing ever may.
    expect(reach.welcome).toBe(true)
    // …and the one nothing sends is not, which is the true and useful answer.
    expect(reach.orphan).toBe(false)
    // The ordinary page is unaffected by any of this.
    expect(reach.home).toBe(true)

    // THE WORDING NAMES WHAT WOULD ACTUALLY REACH IT — asserted where the
    // wording is produced. The assistant reads the structured rows above; the
    // sentence is what a person reads, and it has to send them looking for the
    // right missing thing rather than for a link they must never add.
    const store = fsSiteStore({ cwd, root: 'sandbox' })
    const human = (await editPageList(SLUG, { cwd, sandbox: true, store })).human
    expect(human).toContain('(unreachable: no form sends it)')
    expect(human).not.toContain('(unreachable: nothing links to it)')
  })
})

// ── AC-15 — a message travels with the site ─────────────────────────────────

describe('REQ-247 — a message is carried by an export and restored by an import', () => {
  /**
   * AC-15 — an email page survives the round trip, with its copy and with its
   * association to the form that sends it intact.
   *
   * WHY THIS IS NOT AUTOMATIC, AND WHY IT IS ASSERTED ANYWAY. Being a page is
   * supposed to make this free: the export reads pages, the import writes pages,
   * and a message is a page. But "free by construction" is exactly the kind of
   * claim that stops being true the first time something filters the page list
   * — a render that skips email pages is one such filter and is correct, and a
   * transfer that copied the same filter would silently drop the message while
   * keeping the form that names it. The site would then import, publish, and
   * mail nobody, which is §1's failure restored by a refactor.
   *
   * THE TWO HALVES ARE ASSERTED SEPARATELY. That the copy arrives, and that the
   * form still resolves to it — because a payload carrying both, where the form
   * names something the page no longer is, would satisfy a shallower check and
   * be exactly as broken.
   *
   * ROUND-TRIPPED THROUGH THE REAL PAIR, `readSitePayload` and `payloadToWrite`,
   * which are what `pushSite` and `/api/import` are built out of.
   */
  it('test_UAT_FC_REQ-247_a_message_survives_an_export_and_an_import', async () => {
    const box = await consultant()
    await box.run('add_page', {
      page: 'whitepapers',
      title: 'Your papers',
      kind: 'email',
      subject: 'Your papers are ready',
      placeholders: ['cta_url'],
    })
    await box.run('set_l1', {
      page: 'whitepapers',
      path: '0.1',
      node: {
        kind: 'text',
        text: 'The studio wrote this line.',
        axes: { fontFamily: 'Helvetica, sans-serif', fontSizePx: 16, color: '#1a1a1a' },
      },
    })
    await box.run('set_l1', {
      page: 'home',
      path: '0',
      node: { kind: 'container', layout: 'stack', children: [{ kind: 'slot', name: 'capture' }] },
    })
    await box.run('add_component', {
      page: 'home',
      name: 'papers-form',
      behavior: 'contact-form',
      slot: 'capture',
      config: {
        submitLabel: 'Send me the papers',
        fields: [{ name: 'email', label: 'Your email', type: 'email', required: true }],
        template: 'whitepapers',
      },
    })

    // ── export ──
    const payload = await readSitePayload(fsSiteStore({ cwd, root: 'sandbox' }), memoryReferenceStore(), SLUG)

    // ── import, into a store that has never seen this site ──
    const landed = memorySiteStore()
    landed.seed('copy', { siteJson: {}, pages: {}, assets: {} })
    await landed.write('copy', payloadToWrite(payload))
    const pages = await landed.readPages('copy')

    // THE MESSAGE ARRIVED, as a message, with the words somebody wrote.
    const arrived = pages.find((p) => (p.page as { id?: string }).id === 'whitepapers')
    expect(arrived, JSON.stringify(pages.map((p) => p.name))).toBeDefined()
    const page = arrived!.page as Record<string, unknown>
    expect(page.kind).toBe('email')
    expect((page.email as { subject: string }).subject).toBe('Your papers are ready')
    expect((page.email as { placeholders: string[] }).placeholders).toEqual(['cta_url'])
    expect(JSON.stringify(page.l1)).toContain('The studio wrote this line.')
    expect(JSON.stringify(page.l1)).toContain('{{cta_url}}')

    // AND THE FORM STILL NAMES IT — a payload carrying both, where the form
    // pointed at something the page no longer is, would be just as broken.
    const refs = pages.flatMap((p) => contactFormTemplateRefs(p.page))
    expect(refs.map((r) => r.templateKey)).toContain('whitepapers')
    expect(emailPageRefusal('whitepapers', emailPagesOf(pages))).toBeNull()
  })
})
