// @vitest-environment jsdom
/**
 * BUG-83 — **a test that is red for a known reason has stopped being a test**.
 *
 * Seventeen tests were failing on a clean tree, and had been for long enough
 * that the suite's red was the normal state. The damage is not the seventeen: it
 * is that a run expected to fail cannot tell anybody something NEW broke, which
 * is exactly what it then failed to say twice — REQ-220 shipped two routes with
 * no freshness probe, and BUG-78 routed the lead write past a guard that says it
 * is not routed, and neither announced itself because the file was already red.
 *
 * THIS FILE HOLDS THE THREE CLAIMS THAT COULD OTHERWISE ROT BACK. Each is a
 * property of the evidence rather than of the product, which is what this ticket
 * turned out to be about: eleven of the seventeen were one upstream change of
 * CHANNEL, two were one assertion reading CSS as text, and the pattern in both is
 * an assertion that quietly stopped looking where the thing it names actually is.
 *
 * WHAT IS DELIBERATELY NOT HERE. That the session is told which site it is on,
 * that the change signal fires only when the site moved, that the corpus delta
 * is reported once — those are REQ-122's, REQ-131's, REQ-160's and BUG-63's, and
 * they assert it through a real host and a real turn. This asserts the READERS
 * those suites use, because a reader that looks in the wrong place turns every
 * one of their negative assertions into a green that proves nothing.
 */

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { cmdNew, cmdRender } from '../tools/generate/src/cli/commands'
import { L1_EDIT_HOT_CLASS, L1_EDIT_SEGMENT_ATTR } from '../packages/site-schema/src/l1/edit'
import { cssRules, normaliseSelector, rulesOf } from './support/css-rules'
import {
  sentText,
  systemText,
  turnTailText,
  type ModelRequest,
} from './support/scripted-model-client'

const REPO = path.resolve(__dirname, '..')
const BUILDER_CSS = path.join(REPO, 'apps/control-app/src/builder/builder.css')

/** A request in the shape the backend sends when it has no usable breakpoint. */
function plainRequest(system: string, said: string, tail: string): ModelRequest {
  return {
    system,
    messages: [
      { role: 'user', content: 'an earlier turn' },
      { role: 'assistant', content: 'an earlier answer' },
      { role: 'user', content: `${said}\n\n${tail}` },
    ],
    tools: [],
  }
}

/** The same request in the shape it takes once a cache marker has touched it. */
function blockRequest(system: string, said: string, tail: string): ModelRequest {
  return {
    system: [
      { type: 'text', text: system, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: '' },
    ],
    messages: [
      { role: 'user', content: [{ type: 'text', text: 'an earlier turn' }] },
      { role: 'assistant', content: [{ type: 'text', text: 'an earlier answer' }] },
      {
        role: 'user',
        content: [
          { type: 'text', text: said, cache_control: { type: 'ephemeral' } },
          { type: 'text', text: tail },
        ],
      },
    ],
    tools: [],
  }
}

describe('BUG-83 — what the model was sent is read from every channel it can arrive in', () => {
  const PRIMING = '# The site you look after\n\nYou look after one website.'
  const SAID = 'make the heading bigger'
  const TAIL = 'You are working on the site "studio". Every tool you have acts on that site and no other.'

  it('test_UAT_FC_BUG-83_the_per_turn_tail_is_read_in_both_wire_shapes', () => {
    // TWO SHAPES AND BOTH ARE PRODUCTION. A message a cache marker has touched is
    // already a list of blocks by the time it reaches the wire; one no marker
    // touched is left the string it always was. A reader that handles one of them
    // reports the other as empty — which is indistinguishable, to every negative
    // assertion downstream, from the reminder genuinely not having fired.
    for (const req of [plainRequest(PRIMING, SAID, TAIL), blockRequest(PRIMING, SAID, TAIL)]) {
      expect(turnTailText(req)).toContain(TAIL)
      // It is the LAST user message and not any earlier one: a reader that
      // scanned the whole conversation would find a previous turn's reminder and
      // report a signal that did not fire this turn.
      expect(turnTailText(req)).not.toContain('an earlier turn')
      expect(sentText(req)).toContain(TAIL)
      expect(sentText(req)).toContain(PRIMING)
      expect(systemText(req)).toContain(PRIMING)
    }
  })

  it('test_UAT_FC_BUG-83_a_channel_the_reader_does_not_cover_is_reported_as_absent', () => {
    // THE FAILURE MODE, STATED AS A TEST. Reading only the priming is what made
    // eleven assertions go red at once and, worse, made every NEGATIVE assertion
    // beside them pass for the wrong reason. So: the reminder is genuinely not in
    // the field those assertions used to read, and `sentText` is what still finds
    // it. If upstream moves it again, `sentText` is the one reader that has to
    // change rather than eleven of them.
    const req = plainRequest(PRIMING, SAID, TAIL)
    expect(systemText(req)).not.toContain(TAIL)
    expect(sentText(req)).toContain(TAIL)

    // And a turn that really carries nothing says so through the same reader, so
    // absence stays meaningful rather than becoming the only answer available.
    const quiet = plainRequest(PRIMING, SAID, '')
    expect(sentText(quiet)).not.toContain('acts on that site and no other')
    expect(sentText(quiet)).toContain(SAID)
  })

  it('test_UAT_FC_BUG-83_a_request_with_no_trailing_user_message_reads_as_empty', () => {
    // A caller asserting ABSENCE wants nothing found, not a throw that reads like
    // a different bug entirely.
    const req: ModelRequest = {
      system: PRIMING,
      messages: [{ role: 'assistant', content: 'still talking' }],
      tools: [],
    }
    expect(turnTailText(req)).toBe('')
    expect(sentText(req)).toBe(PRIMING)
  })
})

describe('BUG-83 — a stylesheet rule is found however its selector is wrapped', () => {
  it('test_UAT_FC_BUG-83_selector_layout_is_not_a_behaviour_an_assertion_can_pin', () => {
    // THE ACTUAL DEFECT, REPRODUCED. Two `AC-1043` assertions selected the panel's
    // narrowing rule by a contiguous substring of its selector and read the empty
    // string for months, because the rule is authored as a multi-line
    // `:not(:has( … ))` and there is a newline and eight spaces where the
    // substring expects none. The rule was right the whole time.
    const wrapped = `.panel:not(\n    :has(\n        .box,\n        .picker\n      )\n  ) { width: 520px }`
    const flat = `.panel:not(:has(.box, .picker)) { width: 520px }`
    const pick = (css: string): string[] =>
      rulesOf(css, (sel) => sel.includes(':has(.box') && sel.includes('.picker'))

    expect(pick(flat)).toEqual([' width: 520px '])
    expect(pick(wrapped)).toEqual(pick(flat))

    // A DESCENDANT COMBINATOR SURVIVES, because there a space is the whole
    // meaning: normalising it away would silently turn "a box inside a panel"
    // into "a panel that is also a box" and match a different set entirely.
    expect(normaliseSelector('.panel   .box')).toBe('.panel .box')
    expect(normaliseSelector('.panel.box')).toBe('.panel.box')

    // And against the real stylesheet, which is what the two suites read.
    const css = readFileSync(BUILDER_CSS, 'utf8')
    const narrow = rulesOf(
      css,
      (sel) => sel.includes(':has(.builder-modal__box') && sel.includes('.builder-modal__picker'),
    )
    expect(narrow, 'the panel narrowing rule was not found in builder.css').toHaveLength(1)
    expect(narrow.join('\n')).toContain('width: min(520px, calc(100vw - 48px))')
  })
})

describe('BUG-83 — the marked-points overlay dims the hover without restating the contract', () => {
  let cwd: string
  let createMarkedPoints: (opts?: Record<string, unknown>) => { destroy(): void }

  beforeAll(async () => {
    ;({ createMarkedPoints } = (await import(
      '../apps/control-app/src/builder/points.js'
    )) as never)
  })

  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'bug83-points-'))
    cmdNew('acme', { cwd })
    const home = path.join(cwd, 'storage', 'sites', 'acme', 'draft', 'pages', 'home.json')
    const page = JSON.parse(readFileSync(home, 'utf8'))
    page.l1.root = {
      kind: 'container',
      id: 'root',
      layout: 'stack',
      children: [{ kind: 'text', text: 'A painted band.', axes: { fontSizePx: 32 } }],
    }
    writeFileSync(home, JSON.stringify(page, null, 2))
  })

  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('test_UAT_FC_BUG-83_the_dimmed_hover_still_selects_a_stamped_segment', async () => {
    // AGAINST THE BYTES THE RENDERER ACTUALLY WROTE, for the reason REQ-210's own
    // suite gives: the subject is which elements a selector reaches, and a
    // fabricated document reaches whatever the fabrication said.
    const { outDir } = await cmdRender('acme', { cwd, edit: true })
    const dom = new JSDOM(readFileSync(path.join(outDir, 'index.html'), 'utf8'), {
      url: 'https://builder.test/preview/acme/edit/',
    })
    const doc = dom.window.document
    doc.elementFromPoint = () => null

    const controller = createMarkedPoints({
      api: {},
      insertToken: () => {},
      removeToken: () => {},
    }) as unknown as {
      bind(doc: Document): void
      setActive(on: boolean): void
      destroy(): void
    }
    // The two calls `app.js` makes: adopt what the frame is showing, then turn
    // the mode on — which is what installs the overlay's stylesheet.
    controller.bind(doc)
    controller.setActive(true)

    const injected = [...doc.querySelectorAll('style')]
      .map((s) => s.textContent ?? '')
      .filter((t) => t.includes('.fc-point'))
    expect(injected, 'the overlay injected no stylesheet').toHaveLength(1)
    const overlay = injected[0]

    // IT NAMES THE HOT CLASS AND NOT THE REGION STAMP. Mirroring the renderer's
    // own `[stamp].hot` pair made this stylesheet a second reader of the markup
    // contract: rename the stamp upstream and the rule stops matching, silently.
    expect(overlay).not.toContain(L1_EDIT_SEGMENT_ATTR)
    expect(overlay).toContain(L1_EDIT_HOT_CLASS)

    // And it still reaches exactly the set it did: a region the renderer stamped,
    // marked hot by the bridge, inside a document in Mark Points mode.
    const segment = doc.querySelector(`[${L1_EDIT_SEGMENT_ATTR}]`)
    expect(segment, 'the edit render stamped no region').toBeTruthy()
    segment!.classList.add(L1_EDIT_HOT_CLASS)
    const hot = cssRules(overlay).filter((rule) =>
      rule.selector.includes(`.${L1_EDIT_HOT_CLASS}`),
    )
    expect(hot, 'the overlay declares no dimmed-hover rule').toHaveLength(1)
    // Asserted through the rule's OWN selector rather than a literal written
    // here, so this cannot pass by agreeing with a copy of it.
    expect(segment!.matches(hot[0].selector)).toBe(true)

    // THE SPECIFICITY IT GAVE UP, BOUGHT BACK EXPLICITLY. Dropping the stamp
    // dropped the weight that was winning over the render's own hot treatment, so
    // the override says so rather than relying on which stylesheet came last —
    // the render's `[stamp].hot` would otherwise tie with it and win on order.
    expect(hot[0].body).toContain('!important')

    controller.destroy()
  })
})
