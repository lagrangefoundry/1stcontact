/**
 * story-b3de4571 (STORY-107) — **a drawing the assistant made appears in the
 * turn that made it** (REQ-217, `write_image`'s half).
 *
 * THE GAP THIS CLOSES. A picture the assistant made fell out of the conversation
 * that made it: the turn said one existed and named a ticket, and the client went
 * elsewhere to find out what it looked like.
 *
 * WHAT IS UNDER TEST HERE, AND WHAT IS NOT. This file covers the half that needs
 * no runtime: what `write_image` hands back (AC-2569, AC-2571), what the surface
 * tells the model to do with it (AC-2570), and that the pane bounds a picture it
 * never expected (AC-2572). The half that needs a Worker — a real turn, through
 * the real route, over a real store, whose line actually fetches the bytes — is
 * `reconciliation-assistant-picture-in-the-turn.workers.test.ts` (AC-2569).
 * `create_image`'s line is story-39c992d3's (AC-2567, AC-2568).
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  L1_DECLARATION,
  L1_SURFACE_VERSION,
  displayLine,
  l1Operations,
} from '../tools/generate/src/cli/ai/toolbox-core'
import { businessPath, splitBusinessPrefix } from '../apps/control-app/src/scope'
import { makeMemorySite } from './support/site-factory'
import type { SiteFixture } from './support/site-factory'

const repo = (...parts: string[]) => path.resolve(__dirname, '..', ...parts)
const CSS = readFileSync(repo('apps/control-app/src/builder/builder.css'), 'utf8')

/** A drawing that passes the SVG envelope — shapes only, nothing executable. */
const MARK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">' +
  '<rect x="1" y="1" width="8" height="8" fill="#1a3a6b"/></svg>'

/** The declaration's own words, read rather than restated. */
const declaration = L1_DECLARATION as unknown as {
  surface_version: number
  shapes: Record<string, Record<string, string>>
  operations: { op: string; description: string }[]
  absences: { name: string; note: string }[]
}

const writeImageOp = () => declaration.operations.find((o) => o.op === 'write_image')!

/** The address this deployment would serve a drawing at, for site `slug`. */
const serving = (slug: string) => (handle: string) =>
  businessPath('biz-one', `/preview/${slug}/draft/${handle.replace(/^\/+/, '')}`)

describe('story-b3de4571 — a drawing a turn made is a picture the client sees', () => {
  let site: SiteFixture | null = null
  afterEach(() => {
    void site?.dispose()
    site = null
  })

  // ── AC-2569 — the result carries the line, scoped to the business ──────────

  it('test_UAT_AC2569_write_image_hands_back_a_business_scoped_line_that_a_redraw_keeps', async () => {
    site = makeMemorySite()
    const ops = l1Operations(site.slug, site.opts, {}, null, serving(site.slug))

    const out = (await ops.write_image({ name: 'wordmark', svg: MARK })) as {
      asset: { id: string; src: string }
      display: string
    }

    // THE LINE ADDRESSES THE DRAWING THAT WAS ACTUALLY WRITTEN, not the name the
    // model typed: `write_image` normalises a name to a filename.
    expect(out.asset.id).toBe('wordmark.svg')
    const expected = `![wordmark](/b/biz-one/preview/${site.slug}/draft/assets/wordmark.svg)`
    expect(out.display).toBe(expected)

    // THE ADDRESS NAMES THE BUSINESS AND ROUND-TRIPS through the production reader
    // of the prefix — an unscoped path resolves against the first admissible
    // business.
    const url = /\]\(([^)]+)\)/.exec(out.display)![1]
    const split = splitBusinessPrefix(new URL(url, 'http://local.invalid/').pathname)
    expect(split.businessId).toBe('biz-one')
    expect(split.path).toBe(`/preview/${site.slug}/draft/assets/wordmark.svg`)

    // A REDRAW IS THE SAME ASSET AND THEREFORE THE SAME LINE — the accepted
    // consequence of naming a live asset.
    const again = (await ops.write_image({
      name: 'wordmark',
      svg: MARK.replace('#1a3a6b', '#e76f51'),
      replace: true,
    })) as { display: string }
    expect(again.display).toBe(expected)

    // ORDINARY `![alt](url)` AND NOTHING ELSE; the alt text is the file name
    // without its extension and cannot break out of its own brackets.
    expect(displayLine('wordmark.svg', '/x/y.svg')).toBe('![wordmark](/x/y.svg)')
    expect(displayLine('a]b[c.svg', '/x.svg')).toBe('![abc](/x.svg)')
  })

  // ── AC-2570 — surface v9 tells the model to paste it verbatim ──────────────

  it('test_UAT_AC2570_surface_v9_tells_the_model_to_paste_the_line_word_for_word', () => {
    expect(declaration.surface_version).toBe(9)
    expect(L1_SURFACE_VERSION).toBe(9)

    const shape = declaration.shapes.image
    expect(shape.display).toBeTruthy()
    // THE FIELD SAYS WHAT IT IS FOR, AND THAT ABSENCE IS ORDINARY.
    expect(shape.display.toLowerCase()).toContain('exactly as written')
    expect(shape.display.toLowerCase()).toContain('absent')

    const op = writeImageOp()
    expect(op.description).toContain('`display`')
    expect(op.description.toLowerCase()).toContain('word for word')

    // THE ACCEPTED FAILURE is named in `absences`, the section a model reads for
    // what it cannot do: a tool result is never shown to the user.
    const absence = declaration.absences.find(
      (a) => a.name === 'Showing a picture any way but pasting the line',
    )
    expect(absence).toBeTruthy()
    expect(absence!.note.toLowerCase()).toContain('display')
  })

  // ── AC-2571 — nowhere to show it means no line ─────────────────────────────

  it('test_UAT_AC2571_with_no_asset_url_factory_the_drawing_is_written_with_no_display', async () => {
    site = makeMemorySite()
    // THE `1c` CLI'S DEPLOYMENT: no origin, nowhere to put a picture. The field is
    // ABSENT rather than empty or pointing nowhere.
    const ops = l1Operations(site.slug, site.opts, {}, null, null)
    const out = (await ops.write_image({ name: 'mark', svg: MARK })) as Record<string, unknown>
    expect('display' in out).toBe(false)
    expect(out.asset).toBeTruthy()
    expect((out.asset as { id: string }).id).toBe('mark.svg')
  })

  // ── AC-2572 — bounded by the pane ──────────────────────────────────────────

  it('test_UAT_AC2572_an_image_in_a_chat_message_is_bounded_by_the_pane', () => {
    // `webui-chat` SHIPS NO `img` RULE, because it never expected an image in a
    // message; without this an unconstrained drawing takes the whole pane.
    expect(CSS).toContain('.builder-chat img')
    const rule = CSS.slice(CSS.indexOf('.builder-chat img'))
    const block = rule.slice(0, rule.indexOf('}'))
    expect(block).toMatch(/max-width:\s*100%/)
    expect(block).toMatch(/max-height:\s*260px/)
    expect(block).toMatch(/(^|[\s;{])width:\s*auto/)
    expect(block).toMatch(/(^|[\s;{])height:\s*auto/)
  })
})
