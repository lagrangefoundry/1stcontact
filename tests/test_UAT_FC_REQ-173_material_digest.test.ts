/**
 * REQ-173 — **a digest in the body, the full text beside it**.
 *
 * WHAT WAS WRONG. `describe.ts` had four branches and they did not agree on what
 * a body is. An image and a font were *described* — a few sentences saying what
 * the thing is. A document was *transcribed*: `clipBody(text)`, the whole
 * extracted file, up to 200,000 characters. The Library renders `item.body` into
 * the field labelled *"What this is"* either way, so a brand-guidelines PDF
 * appeared there in full — and, after REQ-172 put a reader window above it, twice
 * on one screen: once rendered properly, once as raw source in a field claiming
 * to say what the thing IS.
 *
 * WHY THE TEXT STILL HAS TO EXIST, and why this is not "make the body a digest".
 * `buildChunkIndex` chunking the extracted text is what makes a fact on page 12
 * of a client's brand book retrievable at all ([[DOC-39]] §7's *"search wide,
 * read deep"*). Replacing the body with three sentences and stopping there would
 * silently delete deep retrieval. So it is BOTH, IN DIFFERENT PLACES: the digest
 * in the body, the verbatim text in a `material_text` comment — the precedent
 * [[DOC-33]] §3.1/§3.2 already sets for chat.
 *
 * WHAT THIS FILE PROVES, and what its siblings prove instead. This is the pure
 * function of bytes: what `describe` returns for a document, where the two halves
 * end up, and how the source handed to the model is sampled. The workers sibling
 * proves the comment is really written and the chunk index really reads it, over
 * real D1 and R2; the jsdom sibling proves the builder blocks itself when there
 * is no key to describe with.
 *
 * ONE DOUBLE, AND IT IS THE DIGEST MODEL. Every extraction below is real — a real
 * PDF through the real `unpdf`, real markdown through a real `TextDecoder`.
 * Nothing here is a claim about how well a document is summarised; the claims are
 * about what the pipeline does with a summary, and with its absence.
 */

import { describe as suite, expect, it } from 'vitest'
import {
  describe as describeMaterial,
  digestSource,
  DIGEST_SOURCE_CHARS,
  DOCUMENT_DIGEST_SYSTEM,
  MAX_EXTRACTED_TEXT_CHARS,
  type DescribeText,
} from '../apps/control-app/src/describe'
import { bytesOf, minimalPdf, scannedPdf } from './support/material-fixtures'

/** The digest describer, doubled: what it was asked, and what it answers. */
function stubDigest(text = 'A bakery brand guide from 2023, kept for reference.') {
  const seen: string[] = []
  const describeText: DescribeText = async (prompt) => {
    seen.push(prompt)
    return { text, model: 'stub/digest-1' }
  }
  return { seen, describeText }
}

const MARKDOWN = `# Late-night bakery

They bake sourdough overnight and open at six.
The differentiator they name is the overnight ferment, not the price.
`

suite('REQ-173 — a document body is a description, not a transcription', () => {
  it('test_UAT_FC_REQ_173_a_pdf_body_is_the_digest_and_its_text_comes_back_beside_it', async () => {
    const digest = stubDigest()
    const description = await describeMaterial(
      {
        bytes: minimalPdf('The kitchen opens at six and the bread is baked overnight.'),
        kind: 'document',
        contentType: 'application/pdf',
        filename: 'guidelines.pdf',
      },
      { describeText: digest.describeText },
    )

    expect(description.status).toBe('ok')
    // THE BODY IS THE DIGEST. This is the whole change: the field the Library
    // labels "What this is" now says what the thing is.
    expect(description.body).toContain('bakery brand guide')
    expect(description.body).not.toContain('kitchen')
    // AND THE TEXT IS NOT LOST — it comes back for the caller to keep in a
    // comment, which is what the chunk index goes on reading.
    expect(description.fullText).toContain('kitchen')
    expect(description.fullText).toContain('bread')
  })

  it('test_UAT_FC_REQ_173_a_text_document_splits_the_same_way_a_pdf_does', async () => {
    // The two document sub-branches used to differ only in how the text was
    // obtained and then behaved identically. They still do — which is the point:
    // the split happens once, in the step both share.
    const digest = stubDigest('A note about an overnight bakery.')
    const description = await describeMaterial(
      {
        bytes: bytesOf(MARKDOWN),
        kind: 'document',
        contentType: 'text/markdown',
        filename: 'bakery.md',
      },
      { describeText: digest.describeText },
    )

    expect(description.status).toBe('ok')
    expect(description.body).toContain('overnight bakery')
    expect(description.fullText).toContain('sourdough')
    // The title is still the document's own first substantial line, not the
    // model's: a document usually carries a better title than one could invent.
    expect(description.title).toBe('Late-night bakery')
  })

  it('test_UAT_FC_REQ_173_the_title_is_the_documents_own_and_the_prompt_asks_for_no_title', async () => {
    // WHERE THIS DIFFERS FROM THE IMAGE BRANCH, and why. A photograph carries no
    // title, so the vision prompt asks for one and the first line of the answer
    // becomes it. A PDF's `/Title` was written by whoever made the document, and
    // preferring a model's guess over it would be a regression in the one field
    // [[DOC-39]] §7's enumerated landscape is made of.
    const digest = stubDigest()
    const description = await describeMaterial(
      {
        bytes: minimalPdf('Body text that is not a title.'),
        kind: 'document',
        contentType: 'application/pdf',
        filename: 'guidelines.pdf',
      },
      { describeText: digest.describeText },
    )
    expect(description.title).toBe('Brand guidelines')
    expect(DOCUMENT_DIGEST_SYSTEM).toMatch(/not begin with a title line/i)
  })

  it('test_UAT_FC_REQ_173_the_describer_credits_the_model_and_still_names_the_extractor', async () => {
    // `description_model` names whoever wrote the BODY, which is now the model.
    // The extractor is kept beside it because which reader produced the text is
    // what a later re-extract pass would select on.
    const digest = stubDigest()
    const pdf = await describeMaterial(
      {
        bytes: minimalPdf('Anything.'),
        kind: 'document',
        contentType: 'application/pdf',
        filename: 'a.pdf',
      },
      { describeText: digest.describeText },
    )
    expect(pdf.describer).toContain('stub/digest-1')
    expect(pdf.describer).toContain('unpdf')

    const text = await describeMaterial(
      { bytes: bytesOf(MARKDOWN), kind: 'document', contentType: 'text/markdown', filename: 'a.md' },
      { describeText: digest.describeText },
    )
    expect(text.describer).toContain('text-decode')
  })
})

suite('REQ-173 — what the describer is shown, and what it may not overrun', () => {
  it('test_UAT_FC_REQ_173_a_long_document_is_sampled_from_the_middle_as_well_as_the_head', async () => {
    // AN EXCERPT OFF THE TOP OF A PDF IS THE COVER PAGE — a logo, a client name,
    // a date — which is the least informative part of the file. A digest written
    // from that says the document is a brand book, which the filename already
    // said. So the sample reaches into the middle, where it is about something.
    const head = 'COVER PAGE. '.repeat(1000)
    const middle = 'THE OVERNIGHT FERMENT IS THE DIFFERENTIATOR. '
    const tail = 'filler. '.repeat(1000)
    const long = head + middle + tail
    expect(long.length).toBeGreaterThan(DIGEST_SOURCE_CHARS)

    const source = digestSource(long)
    expect(source.length).toBeLessThanOrEqual(DIGEST_SOURCE_CHARS + 200)
    expect(source).toContain('COVER PAGE')
    expect(source).toContain('OVERNIGHT FERMENT')
    // THE GAP IS STATED. Two spans spliced silently together read as one
    // document, and a model handed that will write about the seam.
    expect(source).toContain('[…]')
  })

  it('test_UAT_FC_REQ_173_a_short_document_is_shown_whole', () => {
    // No sampling below the budget: an abridgement marker on a two-page note
    // would tell the model something untrue about what it is looking at.
    expect(digestSource(MARKDOWN)).toBe(MARKDOWN)
  })

  it('test_UAT_FC_REQ_173_the_kept_text_is_bounded_and_says_so_when_it_bites', async () => {
    // THE CEILING THAT DOES THE REAL WORK IS `MAX_MATERIAL_BYTES`, at the upload
    // boundary — bytes, biting images and PDFs hardest because that is where the
    // bytes are. This is the second line of that defence: the pathological small
    // file that extracts to an enormous amount of text, which would otherwise be
    // asked to fit in one row. The clip is STATED, never silent, for the reason
    // `clipBody` states its own: text that stops mid-sentence reads as corruption.
    const huge = 'sourdough '.repeat(Math.ceil((MAX_EXTRACTED_TEXT_CHARS + 5000) / 10))
    const description = await describeMaterial(
      {
        bytes: bytesOf(huge),
        kind: 'document',
        contentType: 'text/plain',
        filename: 'huge.txt',
      },
      { describeText: stubDigest().describeText },
    )
    expect(description.fullText!.length).toBeLessThan(MAX_EXTRACTED_TEXT_CHARS + 200)
    expect(description.fullText).toContain('[Text truncated at')
  })
})

suite('REQ-173 — extraction and description fail independently', () => {
  it('test_UAT_FC_REQ_173_a_document_with_no_describer_still_carries_its_text_and_its_title', async () => {
    // The upload route refuses an unconfigured deployment before this is reached
    // — but `describe` must not throw for a caller that got past the gate, and it
    // must not throw the EXTRACTION away because the DIGEST could not be written.
    // Those are two steps, and only one of them failed.
    const description = await describeMaterial({
      bytes: bytesOf(MARKDOWN),
      kind: 'document',
      contentType: 'text/markdown',
      filename: 'bakery.md',
    })
    expect(description.status).toBe('no_describer')
    expect(description.describer).toBeNull()
    expect(description.fullText).toContain('sourdough')
    // The derived title survives too: it is a fact about the document, not about
    // whether a model could be called.
    expect(description.title).toBe('Late-night bakery')
  })

  it('test_UAT_FC_REQ_173_a_describer_that_answers_with_nothing_is_not_a_lost_document', async () => {
    const description = await describeMaterial(
      {
        bytes: bytesOf(MARKDOWN),
        kind: 'document',
        contentType: 'text/markdown',
        filename: 'bakery.md',
      },
      { describeText: async () => ({ text: '   ', model: 'stub/digest-1' }) },
    )
    expect(description.status).toBe('failed')
    expect(description.fullText).toContain('sourdough')
    expect(description.title).toBe('Late-night bakery')
  })

  it('test_UAT_FC_REQ_173_a_scan_is_unchanged_and_has_no_text_to_keep', async () => {
    // [[DOC-38]] §10's degraded path already wrote digest-shaped prose — *"Scanned
    // document, N pages, no extractable text"* is a description of what the thing
    // is, not a transcription of it — so this ticket left it alone. And a material
    // with no extractable text has no comment to write, which is what `null` says.
    const digest = stubDigest()
    const description = await describeMaterial(
      {
        bytes: scannedPdf(),
        kind: 'document',
        contentType: 'application/pdf',
        filename: 'brandbook-scan.pdf',
      },
      { describeText: digest.describeText },
    )
    expect(description.status).toBe('no_text')
    expect(description.body).toMatch(/scanned document/i)
    expect(description.fullText).toBeNull()
    // AND NO MODEL CALL WAS MADE. There is nothing to describe, so paying for a
    // call to be told so would be a cost with no product.
    expect(digest.seen).toEqual([])
  })
})

suite('REQ-173 — the branches that were already digests are untouched', () => {
  it('test_UAT_FC_REQ_173_an_image_and_a_font_carry_no_extracted_text', async () => {
    // These two are what the document branch was made to resemble. The one thing
    // they gained is an explicit `null`: the field is present on every
    // description, so a caller never has to reason about absence as a third state.
    const image = await describeMaterial(
      { bytes: bytesOf('png-ish'), kind: 'image', contentType: 'image/png', filename: 'a.png' },
      { describeImage: async () => ({ text: 'A kitchen\n\nAt dusk.', model: 'stub/vision-1' }) },
    )
    expect(image.status).toBe('ok')
    expect(image.fullText).toBeNull()

    const font = await describeMaterial({
      bytes: bytesOf('not a font'),
      kind: 'font',
      contentType: 'font/woff2',
      filename: 'a.woff2',
    })
    expect(font.fullText).toBeNull()
  })
})
