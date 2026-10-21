/**
 * [[REQ-217]] — **an image a turn produced appears in the conversation**.
 *
 * THE GAP THIS CLOSES. A picture the assistant made fell out of the conversation
 * that made it: the turn said one existed and named a ticket, and the client went
 * elsewhere to find out what it looked like. The one place it was not was the
 * conversation that produced it.
 *
 * WHAT IS UNDER TEST HERE, AND WHAT IS NOT. This file covers the half that needs
 * no runtime: what `write_image` hands back, what the surface tells the model to
 * do with it, what a scoped address is, and that the pane bounds a picture it
 * never expected. The half that needs a Worker — a real turn, through the real
 * route, over a real store, whose line actually fetches the bytes — is
 * `test_UAT_FC_REQ-217_a_picture_in_the_conversation.workers.test.ts`, and that
 * is where the round trip is proved rather than described.
 *
 * THE CLAIMS, in the order the ticket makes them:
 *
 *   1. THE TOOL AUTHORS THE LINE. `write_image` returns the exact markdown to
 *      paste, addressing the drawing it just wrote.
 *   2. THE MODEL PLACES IT. The surface says to include it verbatim, and the
 *      `absences` section says what a turn that does not looks like.
 *   3. ABSENCE IS ORDINARY. A deployment with nowhere to show a picture — the
 *      `1c` CLI — is offered no line and invents none.
 *   4. THE ADDRESS NAMES THE BUSINESS. An unscoped path resolves against the
 *      first admissible business, so the composer and the reader of the prefix
 *      are one pair and round-trip.
 *   5. IT IS BOUNDED WHERE IT IS SHOWN, because `webui-chat` ships no rule for
 *      content it never anticipated.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  L1_DECLARATION,
  displayLine,
} from '../tools/generate/src/cli/ai/toolbox-core'
import { businessPath, splitBusinessPrefix } from '../apps/control-app/src/scope'
import librarySurface from '../tools/generate/src/cli/ai/library-surface.json'

const repo = (...parts: string[]) => path.resolve(__dirname, '..', ...parts)
const CSS = readFileSync(repo('apps/control-app/src/builder/builder.css'), 'utf8')

/** The declaration's own words, read rather than restated. */
const declaration = L1_DECLARATION as unknown as {
  shapes: Record<string, Record<string, string>>
  operations: { op: string; description: string }[]
  absences: { name: string; note: string }[]
}

/**
 * [[REQ-423]] — drawing moved to the Library: `draw_image` and its `drawing`
 * shape are where the display line is declared now.
 */
const library = librarySurface as unknown as typeof declaration
const drawImageOp = () => library.operations.find((o) => o.op === 'draw_image')!

describe('REQ-217 — a picture a turn made is a picture the client sees', () => {
  it('test_UAT_FC_REQ-217_the_line_is_ordinary_markdown_the_sanitiser_already_allows', () => {
    // ORDINARY `![alt](url)` AND NOTHING ELSE, because the chat's sanitiser is
    // stock DOMPurify: an `<img>` survives it untouched, so the picture needs
    // nothing new in the pane and survives a reload for free.
    expect(displayLine('wordmark.svg', '/x/y.svg')).toBe('![wordmark](/x/y.svg)')
    // THE ALT TEXT CANNOT BREAK OUT OF ITS OWN BRACKETS. A filename is not
    // model-supplied prose, but it is the one part of the line that comes from
    // outside this function.
    expect(displayLine('a]b[c.svg', '/x.svg')).toBe('![abc](/x.svg)')
  })

  it('test_UAT_FC_REQ-217_the_surface_tells_the_model_to_paste_it_verbatim', () => {
    const shape = library.shapes.drawing
    expect(shape.display).toBeTruthy()
    // THE FIELD SAYS WHAT IT IS FOR, AND THAT ABSENCE IS ORDINARY — the two
    // things a model reading only the shape has to know.
    expect(shape.display.toLowerCase()).toContain('exactly as written')
    expect(shape.display.toLowerCase()).toContain('absent')

    const op = drawImageOp()
    expect(op.description).toContain('`display`')
    expect(op.description.toLowerCase()).toContain('word for word')
  })

  it('test_UAT_FC_REQ-217_the_failure_mode_is_named_where_it_is_hard_to_miss', () => {
    // THE ACCEPTED FAILURE. A model that does not paste the line leaves a turn
    // with no picture in it; host-injecting a trailer was rejected because it
    // would put the picture in a fixed place rather than where the sentence
    // wants it. So the instruction is reinforced in `absences`, which is the
    // section a model reads for what it cannot do.
    const absence = library.absences.find((a) => /`display`|display line/i.test(a.note))
    expect(absence).toBeTruthy()
    expect(absence!.note.toLowerCase()).toContain('display')
  })

  it('test_UAT_FC_REQ-217_the_address_names_the_business_and_round_trips', () => {
    // THE COMPOSER AND THE READER ARE ONE PAIR, in one file. An unscoped path
    // does not 404 — it resolves against the FIRST admissible business — so a
    // transcript that named no business would show one business's conversation
    // with another's picture.
    const url = businessPath('biz two', '/api/material/file?uid=material-7')
    expect(url.startsWith('/b/')).toBe(true)
    const split = splitBusinessPrefix(new URL(url, 'http://local.invalid/').pathname)
    expect(split.businessId).toBe('biz two')
    expect(split.path).toBe('/api/material/file')
  })

  it('test_UAT_FC_REQ-217_a_picture_in_a_turn_is_bounded_by_the_pane', () => {
    // `webui-chat` SHIPS NO `img` RULE, because it never expected an image in a
    // message. Bounding content a component never anticipated is not restyling
    // it — and without this an unconstrained drawing takes the whole pane.
    const rule = CSS.slice(CSS.indexOf('.builder-chat img'))
    expect(CSS).toContain('.builder-chat img')
    const block = rule.slice(0, rule.indexOf('}'))
    expect(block).toMatch(/max-width:\s*100%/)
    expect(block).toMatch(/max-height:\s*\d+px/)
  })
})
