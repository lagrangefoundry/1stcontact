/**
 * REQ-211 — a captured sentence that varies within itself folds to ONE node.
 *
 * THE FAILURE THIS CLOSES. A page's inline structure is several text nodes:
 * `<h1>Serving <em>real</em> food</h1>` is three of them, and the capture has
 * always recorded three runs. The fold then pinned each at its own absolute box
 * — which is DOC-52 §2's trap on a page rather than in a drawing, and worse
 * there, because separately-positioned fragments of one sentence come apart at
 * every width the copy reflows at.
 *
 * TWO HALVES, TESTED SEPARATELY BECAUSE THEY FAIL SEPARATELY.
 *
 *   - The **fold and the oracle agreeing**, which is deterministic and is what
 *     most of this file is. The two sides must rejoin exactly the same flows: if
 *     the fold rejoins what the oracle still counts as three elements, the
 *     fidelity gate reports two phantom `unmatched` runs on every page that
 *     emphasises a word — the measure manufacturing the defects it exists to
 *     find.
 *   - The **extraction**, which needs a real browser to say what `display` and
 *     `<br>` actually did. Those probes drive headless Chromium against a
 *     committed fixture over an ephemeral loopback server, and skip loudly when
 *     no browser is present, exactly as BUG-25's do.
 */
import { describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromiumAvailable, cmdCapturePage, type Capture, type ContentRun } from '../tools/generate/src/cli/capture'
import { fsReferenceStore } from '../tools/generate/src/store/fs-reference-store'
import { foldToL1 } from '../tools/generate/src'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli'
import { oracleBoxes } from '../tools/generate/src/l1/probes'
import { l1PlainText, type L1Document, type L1Node, type L1Text } from '../packages/site-schema/src/index'

const FIXTURES = fileURLToPath(new URL('./fixtures/capture', import.meta.url))
const LADDER = [375, 1280]

// ── the deterministic half: a hand-built capture of one varying flow ──────────

/** The flow root's rect at a width — the box a rejoined sentence lays out in. */
const flowBox = (width: number) => ({ x: 20, y: 100, width: width - 40, height: 60 })

/**
 * One captured run of the heading's inline flow.
 *
 * Modelled on what the extractor records for `<h1>Serving <em>real</em> food
 * since <sup>19</sup>92</h1>`: four text nodes, one flow, each carrying its own
 * computed style and its own tight box, plus the flow root's rect.
 */
function flowRun(
  width: number,
  index: number,
  text: string,
  textFlow: string,
  over: Partial<ValueElement> = {},
): ValueElement {
  return {
    text,
    role: 'heading',
    color: '#111827',
    fontFamily: 'Georgia',
    fontSizePx: 48,
    fontWeight: 700,
    box: { x: 20 + index * 120, y: 100, width: 110, height: 60 },
    inlineGroup: 'f1:0',
    inlineIndex: index,
    inlineBox: flowBox(width),
    textFlow,
    ...over,
  }
}

/** Two runs of one flow that differ in nothing — the control. */
function uniformRun(index: number, text: string): ValueElement {
  return {
    text,
    role: 'body',
    color: '#111827',
    fontFamily: 'Georgia',
    fontSizePx: 20,
    fontWeight: 400,
    box: { x: 20 + index * 200, y: 300, width: 190, height: 28 },
    inlineGroup: 'f2:0',
    inlineIndex: index,
    inlineBox: { x: 20, y: 300, width: 600, height: 28 },
    textFlow: index === 0 ? 'Plain words ' : 'and more of them',
  }
}

function elementsAt(width: number): ValueElement[] {
  return [
    flowRun(width, 0, 'Serving', 'Serving '),
    flowRun(width, 1, 'real', 'real', { fontStyle: 'italic' }),
    flowRun(width, 2, 'food', ' food since ', { color: '#e76f51', fontWeight: 800 }),
    flowRun(width, 3, '19', '19', { fontSizePx: 29, verticalAlign: 'super' }),
    flowRun(width, 4, '92', '92'),
    uniformRun(0, 'Plain words'),
    uniformRun(1, 'and more of them'),
  ]
}

function capture(): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 1000 },
    state: 'rest',
    manifest: {
      source: `t:${width}`,
      elements: elementsAt(width),
      sections: [],
      viewport: { width, height: 1000 },
    },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

function textLeaves(doc: L1Document): L1Text[] {
  const out: L1Text[] = []
  const walk = (n: L1Node): void => {
    if (n.kind === 'text') out.push(n)
    if (n.kind === 'box' || n.kind === 'container') (n.children ?? []).forEach(walk)
  }
  walk(doc.root)
  return out
}

describe('REQ-211 the fold rejoins a varying inline flow', () => {
  it('test_UAT_FC_REQ_211_an_emphasised_word_folds_into_one_multi_run_node', () => {
    const doc = foldToL1(capture())
    const leaves = textLeaves(doc)

    // ONE node for the sentence, not five. And its copy is a run list, not a
    // string — a flattened string would have lost the emphasis, the accent and
    // the ordinal, which is the whole content of the difference.
    const sentence = leaves.find((n) => l1PlainText(n.text).startsWith('Serving'))
    expect(sentence, 'the sentence folded to a node').toBeDefined()
    expect(Array.isArray(sentence!.text)).toBe(true)
    expect(l1PlainText(sentence!.text)).toBe('Serving real food since 1992')

    const runs = sentence!.text as Exclude<L1Text['text'], string>
    expect(runs.map((r) => r.text)).toEqual(['Serving ', 'real', ' food since ', '19', '92'])

    // Each run carries ONLY what it does differently from the node. A run that
    // restated the node's colour would survive a later edit to that colour,
    // silently pinning one word to the old value.
    expect(runs[0].axes).toBeUndefined()
    expect(runs[1].axes).toEqual({ fontStyle: 'italic' })
    expect(runs[2].axes).toMatchObject({ color: '#e76f51', fontWeight: 800 })
    // The ordinal's size is a RATIO of the node's, so it rides the node's
    // per-width size rather than pinning a desktop pixel value.
    expect(runs[3].axes?.sizeScale).toBeCloseTo(29 / 48, 3)
    expect(runs[3].axes?.baselineShiftEm).toBeGreaterThan(0)

    // The node lays out in the FLOW ROOT's rect, not in the tight box of
    // whichever fragment carries it — pinning the fragment's would re-wrap the
    // sentence into the width of one word.
    expect(sentence!.geometry?.keyframes.at(-1)?.width).toBe(flowBox(1280).width)
  })

  it('test_UAT_FC_REQ_211_a_flow_that_varies_in_nothing_is_left_alone', () => {
    const doc = foldToL1(capture())
    const leaves = textLeaves(doc)

    // Two runs, same colour, same size, same weight. There is no inline
    // variation to express, so rejoining would trade two exactly-transcribed
    // boxes for one flowed box on nothing but a hope that the browser re-wraps
    // them identically. They stay two nodes, exactly as before this change.
    const plain = leaves.filter((n) => ['Plain words', 'and more of them'].includes(l1PlainText(n.text)))
    expect(plain.length).toBe(2)
    expect(plain.every((n) => typeof n.text === 'string')).toBe(true)
  })

  it('test_UAT_FC_REQ_211_the_fidelity_oracle_counts_the_rejoined_flow_once', () => {
    // THE AGREEMENT. The oracle is the reference side of the fidelity measure; if
    // it still counted five elements where the fold now emits one node, every
    // rejoined sentence would read as four unmatched runs. Both sides ask the
    // same module, so this is the property that keeps the gate honest.
    const boxes = oracleBoxes(capture()).filter((b) => b.kind === 'text' && b.width === 1280)
    const sentence = boxes.filter((b) => b.text.includes('Serving'))
    expect(sentence.length).toBe(1)
    expect(sentence[0].text).toBe('Serving real food since 1992')
    expect(sentence[0].box.width).toBe(flowBox(1280).width)

    // The uniform pair is NOT rejoined on either side, so the oracle still holds
    // both of them: what the fold declines to merge, the oracle declines too.
    expect(boxes.filter((b) => b.text === 'Plain words').length).toBe(1)
    expect(boxes.filter((b) => b.text === 'and more of them').length).toBe(1)
  })
})

// ── the browser half: what the extractor decides a flow IS ────────────────────

async function serveDir(dir: string): Promise<{ origin: string; close: () => Promise<void> }> {
  const server: Server = createServer((req, res) => {
    const rel = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\/+/, '')
    const file = path.join(dir, rel || 'index.html')
    if (!file.startsWith(dir) || !existsSync(file)) {
      res.statusCode = 404
      res.end()
      return
    }
    res.setHeader('content-type', 'text/html; charset=utf-8')
    res.end(readFileSync(file))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  }
}

const allRuns = (c: Capture): ContentRun[] =>
  c.sections.flatMap((s) => [...s.content, ...s.items.flatMap((i) => i.content)])

const runByText = (c: Capture, text: string): ContentRun | undefined =>
  allRuns(c).find((r) => (r.text ?? '').trim() === text)

async function captureFixture(): Promise<Capture> {
  const server = await serveDir(FIXTURES)
  const cwd = mkdtempSync(path.join(tmpdir(), 'req211-'))
  try {
    const { capture } = await cmdCapturePage(`${server.origin}/req211-inline-runs.html`, fsReferenceStore(cwd))
    return capture
  } finally {
    await server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
}

const itB = it.runIf(await chromiumAvailable())

describe('REQ-211 the capture records which runs are one flow', () => {
  itB('test_UAT_FC_REQ_211_an_inline_element_stays_in_its_sentence', async () => {
    const c = await captureFixture()
    const serving = runByText(c, 'Serving')
    const real = runByText(c, 'real')
    const food = runByText(c, 'food')
    expect(serving?.inlineGroup, 'the sentence is recorded as a flow').toBeTruthy()
    expect(real?.inlineGroup).toBe(serving!.inlineGroup)
    expect(food?.inlineGroup).toBe(serving!.inlineGroup)
    expect([serving, real, food].map((r) => r!.inlineIndex)).toEqual([0, 1, 2])

    // The flow root's rect is the block's, so every member reports the same one —
    // that is the box the rejoined sentence has to lay out in.
    expect(real!.inlineBox).toEqual(serving!.inlineBox)
    expect(serving!.inlineBox!.width).toBeGreaterThan(serving!.box!.width)

    // Separating whitespace is kept on the runs, so rejoining is concatenation
    // and nothing has to invent a space. `text` stays trimmed for the join key.
    expect(serving!.textFlow).toBe('Serving ')
    expect(serving!.text).toBe('Serving')

    // A superscript reports its lift, which is what an ordinal is made of.
    expect(runByText(c, '19')?.verticalAlign).toBe('super')
  }, 120000)

  itB('test_UAT_FC_REQ_211_a_break_and_a_blockified_child_end_a_flow', async () => {
    const c = await captureFixture()

    // A <br> ends a flow. Rejoining across it would put the line break back on
    // the browser's own wrapping — a decision the reference had already made.
    const first = runByText(c, 'First captured line')
    const second = runByText(c, 'second captured line')
    expect(first?.inlineGroup).toBeDefined()
    expect(second?.inlineGroup).toBeDefined()
    expect(second!.inlineGroup).not.toBe(first!.inlineGroup)

    // A flex row blockifies its children, so each link is its own formatting
    // context. This is what keeps a nav row from silently becoming a sentence.
    const home = runByText(c, 'Home')
    const about = runByText(c, 'About')
    expect(home?.inlineGroup).toBeUndefined()
    expect(about?.inlineGroup).toBeUndefined()
  }, 120000)
})
