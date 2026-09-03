import { describe as suite, expect, it } from 'vitest'
import { describe as describeMaterial } from '../apps/control-app/src/describe'
import { kindOf, resolveContentType } from '../apps/control-app/src/material'

/**
 * BUG-41 — **a markdown upload is read, not merely stored**.
 *
 * WHAT WENT WRONG AND WHY IT WAS INVISIBLE. A browser has no MIME type for `.md`,
 * so `File.type` is the empty string and the upload route substitutes
 * `application/octet-stream`. Every downstream step then believed it: `describe`
 * asked `isTextual` about a type that is by definition opaque, took the
 * `unsupported` branch, and wrote *"nothing here can read
 * application/octet-stream"* into the body of a plain text file. Nothing failed
 * — the material was created, the blob was stored, the Library listed it — which
 * is exactly why it had to be found by a client opening the detail pane.
 *
 * WHAT THIS FILE PROVES. The repair is a resolution step, and its two halves are
 * asserted separately: that silence is repaired FROM THE NAME, and that a stated
 * type is NOT second-guessed. Then the consequence — the same file, through the
 * real describer, is READ rather than apologised for.
 *
 * WHERE ITS OWN WORDS LIVE NOW ([[REQ-173]]). The body was the file; it is a
 * digest, and the file's own text comes back as `fullText` for the caller to keep
 * in a `material_text` comment. The claim this bug is about is unchanged in
 * substance — the words a client would search by are carried rather than replaced
 * by *"nothing here can read application/octet-stream"* — so it is asserted where
 * they now are. The title claims below are untouched, and REQ-173 deliberately
 * keeps them reachable without a describer: they are about `titleFromText`, not
 * about whether a model could be called.
 *
 * ONE DOUBLE, AND ONLY FOR THE DIGEST. Reading text is still code and is still
 * exercised for real; a stub stands in for the model that writes the digest,
 * because no claim here is about how well a document is summarised.
 */

/** The digest describer, doubled: whatever it is told to say. */
function stubDigest(text: string) {
  return async () => ({ text, model: 'stub/digest-1' })
}

const SUMMARY = `---
title: Gigabyte Alchemy — positioning summary
author: Martin
---

# Notes

They sell managed data pipelines to mid-market finance teams.
The differentiator they name is the audit trail, not the speed.
`

suite('BUG-41 — the content type is resolved from the name when nothing states one', () => {
  it('UAT_FC_BUG-41 an absent type is repaired from the extension', () => {
    // The browser's own answer for a `.md` file. This is the input the bug is
    // about, and `''` rather than `application/octet-stream` because the route's
    // fallback is downstream of the browser's silence, not a second source of it.
    expect(resolveContentType('', 'gigabyte_alchemy_summary.md')).toBe('text/markdown')
  })

  it('UAT_FC_BUG-41 application/octet-stream is treated as silence, not as an answer', () => {
    // The route's fallback, which is what actually reached `describe`.
    expect(resolveContentType('application/octet-stream', 'notes.md')).toBe('text/markdown')
    expect(resolveContentType('application/octet-stream', 'brief.txt')).toBe('text/plain')
    expect(resolveContentType('application/octet-stream', 'report.pdf')).toBe('application/pdf')
    expect(resolveContentType('application/octet-stream', 'satoshi-400.woff2')).toBe('font/woff2')
  })

  it('UAT_FC_BUG-41 a STATED type is never second-guessed', () => {
    // The sender observed the bytes and we did not. A `.md` served as plain text
    // stays plain text; a `.txt` somebody deliberately served as HTML stays HTML.
    // Overriding either would trade this bug for a less visible one.
    expect(resolveContentType('text/plain', 'notes.md')).toBe('text/plain')
    expect(resolveContentType('text/html', 'notes.txt')).toBe('text/html')
    // Parameters survive, because the value is returned rather than rebuilt.
    expect(resolveContentType('text/plain; charset=utf-8', 'notes.md')).toBe(
      'text/plain; charset=utf-8',
    )
  })

  it('UAT_FC_BUG-41 an unmapped extension still degrades exactly as it did', () => {
    // The trade this pipeline makes everywhere else is preserved: what cannot be
    // read is still stored, still filed as a document, and still says so.
    expect(resolveContentType('', 'archive.xyz')).toBe('application/octet-stream')
    expect(resolveContentType('', 'noextension')).toBe('application/octet-stream')
    expect(kindOf(resolveContentType('', 'archive.xyz'), 'archive.xyz')).toBe('document')
  })
})

suite('BUG-41 — the body of a markdown material is the file', () => {
  it('UAT_FC_BUG-41 the file’s own words are read, not apologised for', async () => {
    const described = await describeMaterial(
      {
        bytes: new TextEncoder().encode(SUMMARY),
        kind: 'document',
        contentType: resolveContentType('', 'gigabyte_alchemy_summary.md'),
        filename: 'gigabyte_alchemy_summary.md',
      },
      { describeText: stubDigest('A positioning summary for a data pipelines vendor.') },
    )
    expect(described.status).toBe('ok')
    // The extractor is still named, beside the model that wrote the digest —
    // which reader produced the text is what a re-extract pass would select on.
    expect(described.describer).toContain('text-decode')
    // The words a client would search by — which is the whole job of the text
    // ([[DOC-38]] §6) and precisely what the degraded body did not carry. Since
    // [[REQ-173]] they are in `fullText`, bound for a `material_text` comment and
    // the chunk index, rather than in the body.
    expect(described.fullText).toContain('audit trail')
    expect(described.fullText).toContain('mid-market finance teams')
    expect(described.body).not.toContain('nothing here can read')
  })

  it('UAT_FC_BUG-41 a markdown file is read even where no describer can be reached', async () => {
    // The repair is the RESOLUTION step, and it must not have acquired a
    // dependency on a model ([[REQ-173]]). With no describer the digest is
    // honestly missing and the file's own words are still carried — which is the
    // difference between this bug being fixed and being fixed only when a key is
    // configured.
    const described = await describeMaterial({
      bytes: new TextEncoder().encode(SUMMARY),
      kind: 'document',
      contentType: resolveContentType('', 'gigabyte_alchemy_summary.md'),
      filename: 'gigabyte_alchemy_summary.md',
    })
    expect(described.status).toBe('no_describer')
    expect(described.fullText).toContain('audit trail')
    expect(described.body).not.toContain('nothing here can read')
  })

  it('UAT_FC_BUG-41 the front matter’s own title wins, and the fence is never one', async () => {
    // `---` is three characters, so the old "first substantial line" rule
    // returned it verbatim as the ticket's name. [[DOC-39]] §7 enumerates a small
    // corpus BY TITLE, so a row called `---` is a row a client cannot recognise.
    const described = await describeMaterial({
      bytes: new TextEncoder().encode(SUMMARY),
      kind: 'document',
      contentType: 'text/markdown',
      filename: 'gigabyte_alchemy_summary.md',
    })
    expect(described.title).toBe('Gigabyte Alchemy — positioning summary')
  })

  it('UAT_FC_BUG-41 with no declared title it falls past the block to the heading', async () => {
    const described = await describeMaterial({
      bytes: new TextEncoder().encode('---\nauthor: Martin\n---\n\n# Postpartum menus\n\nSoups.\n'),
      kind: 'document',
      contentType: 'text/markdown',
      filename: 'menus.md',
    })
    expect(described.title).toBe('Postpartum menus')
  })

  it('UAT_FC_BUG-41 an unclosed rule is a rule, not front matter', async () => {
    // A document that opens with a horizontal rule has no front matter to skip,
    // and skipping to the close of a block that never closes would lose its title.
    const described = await describeMaterial({
      bytes: new TextEncoder().encode('---\n\n# Winter menu\n\nStews.\n'),
      kind: 'document',
      contentType: 'text/markdown',
      filename: 'winter.md',
    })
    expect(described.title).toBe('Winter menu')
  })
})
