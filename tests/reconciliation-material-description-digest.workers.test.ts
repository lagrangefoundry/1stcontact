import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { sessionTextDescriber } from '../apps/control-app/src/ai'
import {
  describe as describeMaterial,
  DOCUMENT_DIGEST_SYSTEM,
  MAX_BODY_CHARS,
  MAX_EXTRACTED_TEXT_CHARS,
  VISION_MAX_BYTES,
  type DescribeImage,
  type DescribeText,
} from '../apps/control-app/src/describe'
import { ingestUpload, MAX_MATERIAL_BYTES } from '../apps/control-app/src/material'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import { applySchema } from './support/d1-site-factory'
import { bytesOf, minimalPdf, scannedPdf } from './support/material-fixtures'
import { says, scriptedClient, type ModelRequest } from './support/scripted-model-client'

/**
 * Reconciliation UATs for story-4cabde9a (STORY-141) — **description: what the
 * system understands a file to be**, as it stands after REQ-173.
 *
 * WHAT REQ-173 CHANGED, AND SO WHAT THIS FILE PROVES. A document's body used to
 * be its own extracted text; it is now a DIGEST written by a describer, and the
 * text comes back separately as `fullText` for the ingestion to keep on a
 * `material_text` comment. Every document criterion below is therefore asserted
 * in two halves — what the body is, and what the full text is — and the two are
 * kept apart on purpose: a body that still contained the document's sentence
 * would be the pre-REQ-173 transcription, and a full text that lost it would be
 * deep retrieval silently deleted.
 *
 * WHERE THE BOUNDARY IS. The story owns what the description step produces, so
 * `describe()` is the boundary for what a description SAYS, and `ingestUpload()`
 * is the boundary for what ends up STORED (the six outcomes queried back out,
 * never-fails-an-upload, whole bytes for an image nothing looked at, no chat
 * record left by the describer session).
 *
 * THE DOUBLES ARE THE MODELS, AND ONLY THE MODELS. `DescribeImage` and
 * `DescribeText` are the declared seams; for the session criterion (AC-2097) the
 * double moves one layer further out, to the Anthropic client the AI host's own
 * backend is written to have injected, so the session manager, role, junction and
 * archive under test are the real ones. PDF extraction is the real `unpdf`, font
 * names come out of a real SFNT `name` table, and stored records are read back
 * through a second `ticketStoreFor` handle over real D1 and R2.
 */

const APPLIED = applySchema()

function storeFor(tenant: string): Promise<TicketStore> {
  return ticketStoreFor({ DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket, TENANT_ID: tenant })
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function keysUnder(bucket: R2Bucket, prefix: string): Promise<string[]> {
  const out: string[] = []
  let cursor: string | undefined
  for (;;) {
    const page = await bucket.list({ prefix, cursor })
    for (const object of page.objects) out.push(object.key)
    if (!page.truncated) break
    cursor = page.cursor
  }
  return out.sort()
}

/** Flatten a request's system content to its text. */
function systemText(req: ModelRequest): string {
  const system: unknown = req.system
  if (typeof system === 'string') return system
  if (!Array.isArray(system)) return ''
  return system
    .map((block: unknown) =>
      typeof block === 'string'
        ? block
        : block && typeof block === 'object' && 'text' in block
          ? String((block as { text: unknown }).text ?? '')
          : '',
    )
    .join('\n')
}

// ───────────────────────────── fixtures: documents ─────────────────────────────

/** A PDF with a real cross-reference table, so it opens without damage recovery. */
function buildPdf(objects: string[], trailerExtra = ''): Uint8Array {
  let out = '%PDF-1.4\n'
  const offsets: number[] = []
  objects.forEach((body, i) => {
    offsets.push(out.length)
    out += `${i + 1} 0 obj\n${body}\nendobj\n`
  })
  const xref = out.length
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const offset of offsets) out += `${String(offset).padStart(10, '0')} 00000 n \n`
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R${trailerExtra} >>\n`
  out += `startxref\n${xref}\n%%EOF\n`
  return bytesOf(out)
}

/**
 * A one-page text PDF, one short line per `Tj`, at a size that keeps every line
 * on the page — text drawn past the MediaBox is not extracted.
 */
function textPdf(lines: string[], declaredTitle: string | null): Uint8Array {
  const content =
    'BT /F1 4 Tf 4 TL 10 780 Td ' + lines.map((line) => `(${line}) Tj T*`).join(' ') + ' ET'
  return buildPdf(
    [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ' +
        '/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
      `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
      declaredTitle === null ? '<< /Author (Ada Vale) >>' : `<< /Title (${declaredTitle}) >>`,
    ],
    ' /Info 6 0 R',
  )
}

/** A one-page text PDF whose /Info points at an object that does not exist. */
function pdfWithUnreadableMetadata(text: string): Uint8Array {
  const content = `BT /F1 12 Tf 36 700 Td (${text}) Tj ET`
  return buildPdf(
    [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ' +
        '/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
      `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ],
    ' /Info 99 0 R',
  )
}

const PDF_SENTENCE = 'Sourdough is proofed overnight in the cold room at Ridgeway Bakery.'
const PDF_DECLARED_TITLE = 'Ridgeway Bakery Positioning Paper'
const DIGEST = 'A positioning paper for a neighbourhood bakery, kept for brand reference.'

/** The digest describer, doubled: what it was shown, and a fixed answer. */
function stubDigest(text = DIGEST, model = 'stub/digest-1') {
  const seen: string[] = []
  const describeText: DescribeText = async (prompt) => {
    seen.push(prompt)
    return { text, model }
  }
  return { seen, describeText }
}

// ─────────────────────────────── fixtures: fonts ───────────────────────────────

function utf16be(text: string): Uint8Array {
  const out = new Uint8Array(text.length * 2)
  for (let i = 0; i < text.length; i++) {
    out[i * 2] = text.charCodeAt(i) >> 8
    out[i * 2 + 1] = text.charCodeAt(i) & 0xff
  }
  return out
}

/** A real uncompressed SFNT carrying a `name` table (and optionally `fvar`). */
function sfnt(names: Array<[number, string]>, opts: { variable?: boolean } = {}): Uint8Array {
  const strings = names.map(([, text]) => utf16be(text))
  const recordsSize = 6 + names.length * 12
  const storageSize = strings.reduce((total, s) => total + s.length, 0)
  const nameTable = new Uint8Array(recordsSize + storageSize)
  const nv = new DataView(nameTable.buffer)
  nv.setUint16(0, 0)
  nv.setUint16(2, names.length)
  nv.setUint16(4, recordsSize)
  let cursor = 0
  names.forEach(([nameId], i) => {
    const record = 6 + i * 12
    nv.setUint16(record, 3)
    nv.setUint16(record + 2, 1)
    nv.setUint16(record + 4, 0x0409)
    nv.setUint16(record + 6, nameId)
    nv.setUint16(record + 8, strings[i].length)
    nv.setUint16(record + 10, cursor)
    nameTable.set(strings[i], recordsSize + cursor)
    cursor += strings[i].length
  })

  const tables: Array<[string, Uint8Array]> = []
  if (opts.variable) tables.push(['fvar', new Uint8Array(16)])
  tables.push(['name', nameTable])

  const header = 12 + tables.length * 16
  const padding = tables.map(([, data]) => (4 - (data.length % 4)) % 4)
  const total = tables.reduce((n, [, data], i) => n + data.length + padding[i], header)
  const out = new Uint8Array(total)
  const dv = new DataView(out.buffer)
  dv.setUint32(0, 0x00010000)
  dv.setUint16(4, tables.length)
  let offset = header
  tables.forEach(([tag, data], i) => {
    const record = 12 + i * 16
    for (let c = 0; c < 4; c++) out[record + c] = tag.charCodeAt(c)
    dv.setUint32(record + 8, offset)
    dv.setUint32(record + 12, data.length)
    out.set(data, offset)
    offset += data.length + padding[i]
  })
  return out
}

const FAMILY = 'Ridgeway Display'
const STYLE = 'Semibold'
const DESIGNER = 'Ada Vale'
const BLURB = 'Drawn for bakery signage and menu headings.'

function webFontWrapper(magic: string): Uint8Array {
  const out = new Uint8Array(48)
  for (let i = 0; i < 4; i++) out[i] = magic.charCodeAt(i)
  out.set(bytesOf('OTTO'), 4)
  for (let i = 8; i < out.length; i++) out[i] = (i * 37) % 256
  return out
}

// ───────────────────────────── fixtures: images ─────────────────────────────

function imageBytes(length: number): Uint8Array {
  const out = new Uint8Array(length)
  out.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  for (let i = 8; i < length; i++) out[i] = i % 251
  return out
}

const IMAGE_TITLE_LINE = 'Kitchen at dusk'
const IMAGE_PROSE =
  'A restaurant kitchen at dusk, stainless counters wiped down, two cooks plating ' +
  'under the pass light.'

function describerSaying(text: string, model = 'stub/vision-1') {
  const calls: Array<{ bytes: Uint8Array; contentType: string }> = []
  const describeImage: DescribeImage = async (bytes, contentType) => {
    calls.push({ bytes, contentType })
    return { text, model }
  }
  return { describeImage, calls }
}

function describerThrowing(message: string) {
  const calls: string[] = []
  const describeImage: DescribeImage = async (_bytes, contentType) => {
    calls.push(contentType)
    throw new Error(message)
  }
  return { describeImage, calls }
}

beforeAll(async () => {
  await APPLIED
})

describe('story-4cabde9a — what the system understands a file to be (digest era)', () => {
  it('test_UAT_AC2097_describing_a_document_opens_one_toolless_unprimed_session_that_leaves_no_record', async () => {
    const client = scriptedClient([says('A supplier note for a bakery.'), says('A farm price list.')])
    const describeText = sessionTextDescriber('sk-not-a-real-key', { client })

    const tenant = 'story4cabde9a-session'
    const store = await storeFor(tenant)
    const first = await ingestUpload(
      store,
      {
        bytes: bytesOf('# Mill note\n\nThe stoneground rye comes from Bennett Mill.'),
        filename: 'mill.md',
        contentType: 'text/markdown',
      },
      { describeText },
    )
    const second = await ingestUpload(
      store,
      {
        bytes: bytesOf('# Farm list\n\nThe oats come from Calder Farm.'),
        filename: 'farm.md',
        contentType: 'text/markdown',
      },
      { describeText },
    )

    // One request per document, each its own session.
    expect(client.seen).toHaveLength(2)
    for (const req of client.seen) {
      // NO TOOLS offered to the describer.
      expect(req.tools ?? []).toEqual([])
      // The fixed digest instruction is the ONLY system content — no landscape,
      // no toolbox manual.
      expect(systemText(req).trim()).toBe(DOCUMENT_DIGEST_SYSTEM)
    }
    expect(JSON.stringify(client.seen[0].messages)).toContain('Bennett Mill')
    // The second request carries none of the first document's text or answer.
    const secondSent = JSON.stringify(client.seen[1].messages)
    expect(secondSent).toContain('Calder Farm')
    expect(secondSent).not.toContain('Bennett Mill')
    expect(secondSent).not.toContain('supplier note')

    // The describer reports the model that answered, and that is what is recorded.
    expect(first.description.status).toBe('ok')
    expect(first.description.body).toBe('A supplier note for a bakery.')
    expect(second.description.body).toBe('A farm price list.')
    const recorded = String(first.description.describer)
    expect(recorded).toMatch(/^\S.* \(text-decode\)$/)
    const reader = await storeFor(tenant)
    const { ticket } = await reader.get({ uid: first.ticket.uid })
    expect(ticket.fields.description_model).toBe(recorded)

    // NO CONVERSATION RECORD: describing created no chat ticket in the store.
    const { tickets: chats } = await reader.query({ predicate: 'type=chat', limit: 'all' })
    expect(chats).toHaveLength(0)

    // CLOSED ON THE FAILING PATH TOO, and the failure reaches the description step.
    let calls = 0
    const flaky = scriptedClient([
      (req) => {
        calls += 1
        if (calls === 1) throw new Error('upstream refused the digest')
        return says('Recovered digest.')(req)
      },
    ])
    const flakyDescriber = sessionTextDescriber('sk-not-a-real-key', { client: flaky })
    await expect(flakyDescriber('First document.')).rejects.toThrow(/upstream refused the digest/)
    // A fresh session is opened and answered after the failed one was closed.
    const recovered = await flakyDescriber('Second document.')
    expect(recovered.text).toBe('Recovered digest.')
    expect(JSON.stringify(flaky.seen[1].messages)).not.toContain('First document.')

    // Surfaces to the description step rather than being swallowed in the describer.
    const failing = scriptedClient([
      () => {
        throw new Error('digest model unavailable')
      },
    ])
    const failed = await describeMaterial(
      { bytes: bytesOf('Some words.'), kind: 'document', contentType: 'text/plain', filename: 'x.txt' },
      { describeText: sessionTextDescriber('sk-not-a-real-key', { client: failing }) },
    )
    expect(failed.status).toBe('failed')
    expect(failed.body).toContain('digest model unavailable')
  })

  it('test_UAT_AC1688_a_document_that_carries_text_yields_a_digest_body_its_declared_title_and_its_full_text', async () => {
    const digest = stubDigest()
    const described = await describeMaterial(
      {
        bytes: textPdf([PDF_SENTENCE], PDF_DECLARED_TITLE),
        kind: 'document',
        contentType: 'application/pdf',
        filename: 'positioning.pdf',
      },
      { describeText: digest.describeText },
    )

    expect(described.status).toBe('ok')
    // THE BODY IS THE DIGEST, not a transcription.
    expect(described.body).toBe(DIGEST)
    expect(described.body).not.toContain('Sourdough')
    // THE FULL TEXT carries the document's words, not its name, type or size.
    expect(described.fullText).toContain(PDF_SENTENCE)
    expect(described.fullText).not.toContain('positioning.pdf')
    // The document's own declared title, never the describer's.
    expect(described.title).toBe(PDF_DECLARED_TITLE)
    // The describer names the model and the extractor.
    expect(described.describer).toBe('stub/digest-1 (unpdf)')
    // The describer was shown the document's text.
    expect(digest.seen).toHaveLength(1)
    expect(digest.seen[0]).toContain(PDF_SENTENCE)

    // A LONG DOCUMENT is shown its head AND a sample from further in.
    const head = Array.from({ length: 90 }, () => 'COVER PAGE. '.repeat(8))
    const middle = 'THE OVERNIGHT FERMENT IS THE DIFFERENTIATOR.'
    const tail = Array.from({ length: 90 }, () => 'Appendix filler. '.repeat(5))
    const longLines = [...head, middle, ...tail]
    const longDigest = stubDigest()
    const long = await describeMaterial(
      {
        bytes: textPdf(longLines, 'Long brand book'),
        kind: 'document',
        contentType: 'application/pdf',
        filename: 'brand-book.pdf',
      },
      { describeText: longDigest.describeText },
    )
    expect(long.status).toBe('ok')
    expect(longDigest.seen[0]).toContain('COVER PAGE')
    expect(longDigest.seen[0]).toContain('OVERNIGHT FERMENT')
    // Long enough to be sampled: the describer saw less than the document holds,
    // and the full text still holds all of it.
    expect(long.fullText!.length).toBeGreaterThan(longDigest.seen[0].length)
    expect(long.fullText).toContain('COVER PAGE')
    expect(long.fullText).toContain('OVERNIGHT FERMENT')
    expect(long.fullText).toContain('Appendix filler')

    // UNREADABLE METADATA: text still yielded, title falls back to a derived one.
    const untitled = await describeMaterial(
      {
        bytes: pdfWithUnreadableMetadata(PDF_SENTENCE),
        kind: 'document',
        contentType: 'application/pdf',
        filename: 'untitled-paper.pdf',
      },
      { describeText: stubDigest().describeText },
    )
    expect(untitled.status).toBe('ok')
    expect(untitled.fullText).toContain(PDF_SENTENCE)
    expect(untitled.title).toContain('Sourdough')

    // NO DESCRIBER: only the body degrades — title and full text are kept.
    const noDescriber = await describeMaterial({
      bytes: textPdf([PDF_SENTENCE], PDF_DECLARED_TITLE),
      kind: 'document',
      contentType: 'application/pdf',
      filename: 'positioning.pdf',
    })
    expect(noDescriber.status).toBe('no_describer')
    expect(noDescriber.title).toBe(PDF_DECLARED_TITLE)
    expect(noDescriber.fullText).toContain(PDF_SENTENCE)

    // A DESCRIBER THAT ANSWERS WITH NOTHING: same — title and text survive.
    const empty = await describeMaterial(
      {
        bytes: textPdf([PDF_SENTENCE], PDF_DECLARED_TITLE),
        kind: 'document',
        contentType: 'application/pdf',
        filename: 'positioning.pdf',
      },
      { describeText: stubDigest('   ').describeText },
    )
    expect(empty.status).toBe('failed')
    expect(empty.title).toBe(PDF_DECLARED_TITLE)
    expect(empty.fullText).toContain(PDF_SENTENCE)
  })

  it('test_UAT_AC1689_a_text_shaped_file_becomes_a_digest_body_with_its_decoded_contents_kept_in_full', async () => {
    const phrase = 'Oxblood and bone are the palette chosen for the bakery.'
    const markdown = ['# The Ridgeway Brand Brief', '', phrase].join('\n')
    const md = await describeMaterial(
      { bytes: bytesOf(markdown), kind: 'document', contentType: 'text/markdown', filename: 'brief.md' },
      { describeText: stubDigest('A brand brief for a bakery.').describeText },
    )
    expect(md.status).toBe('ok')
    expect(md.body).toBe('A brand brief for a bakery.')
    expect(md.body).not.toContain(phrase)
    expect(md.fullText).toContain(phrase)
    expect(md.title).toBe('The Ridgeway Brand Brief')
    expect(md.describer).toBe('stub/digest-1 (text-decode)')

    // STRUCTURED TEXT — the type family, not one extension.
    const json = ['{', '  "brand": "Ridgeway Bakery",', '  "note": "proofed overnight"', '}'].join('\n')
    const structured = await describeMaterial(
      { bytes: bytesOf(json), kind: 'document', contentType: 'application/json', filename: 'brand.json' },
      { describeText: stubDigest('Brand settings for a bakery.').describeText },
    )
    expect(structured.status).toBe('ok')
    expect(structured.body).toBe('Brand settings for a bakery.')
    expect(structured.fullText).toContain('proofed overnight')
    expect(structured.title).toContain('Ridgeway Bakery')
    expect(structured.describer).toBe('stub/digest-1 (text-decode)')

    const titleOf = async (text: string) =>
      (
        await describeMaterial(
          { bytes: bytesOf(text), kind: 'document', contentType: 'text/markdown', filename: 'fm.md' },
          { describeText: stubDigest().describeText },
        )
      ).title

    // A CLOSED BLOCK DECLARING ITS OWN TITLE — the declared title wins.
    const declared = await titleOf(
      ['---', 'title: "Declared Brief"', 'author: Ada', '---', '# Heading Below', '', 'Body.'].join('\n'),
    )
    expect(declared).toBe('Declared Brief')
    // A CLOSED BLOCK DECLARING NONE — the block is skipped, the heading below wins.
    const fallsThrough = await titleOf(
      ['---', 'author: Ada', 'date: 2026-01-01', '---', '# Heading Below', '', 'Body.'].join('\n'),
    )
    expect(fallsThrough).toBe('Heading Below')
    // AN UNCLOSED FENCE — an ordinary rule; the title comes from the text below.
    const unclosed = await titleOf(['---', '# Real Title', '', 'Body text here.'].join('\n'))
    expect(unclosed).toBe('Real Title')
    // A LINE THAT IS ONLY A RULE is never a title, wherever it appears.
    const rules = await titleOf(['***', '', '=====', '', '___', '', 'Actual Opening Line'].join('\n'))
    expect(rules).toBe('Actual Opening Line')
    for (const title of [declared, fallsThrough, unclosed, rules]) {
      expect(title).not.toMatch(/^[-=*_]+$/)
      expect(title).not.toContain('---')
    }

    // NO TEXT DESCRIBER — the words still come back in full, the title still derived.
    const bare = await describeMaterial({
      bytes: bytesOf(markdown),
      kind: 'document',
      contentType: 'text/markdown',
      filename: 'brief.md',
    })
    expect(bare.fullText).toContain(phrase)
    expect(bare.title).toBe('The Ridgeway Brand Brief')
  })

  it('test_UAT_AC1690_a_document_with_nothing_extractable_is_stored_and_honestly_described', async () => {
    const digest = stubDigest()
    const scan = await describeMaterial(
      {
        bytes: scannedPdf(),
        kind: 'document',
        contentType: 'application/pdf',
        filename: 'brand-book-scan.pdf',
      },
      { describeText: digest.describeText },
    )
    expect(scan.status).toBe('no_text')
    expect(scan.body.toLowerCase()).toContain('no extractable text')
    expect(scan.body).toMatch(/\d+ pages?/)
    expect(scan.title).toContain('brand-book-scan.pdf')
    expect(scan.body).toContain('brand-book-scan.pdf')
    // No model call for a document with nothing to describe.
    expect(digest.seen).toEqual([])

    // Stored, not refused, when it arrives through the ingestion.
    const store = await storeFor('story4cabde9a-scan')
    const ingested = await ingestUpload(
      store,
      { bytes: scannedPdf(), filename: 'brand-book-scan.pdf', contentType: 'application/pdf' },
      { describeText: digest.describeText },
    )
    expect(ingested.ticket.uid).not.toBe('')
    expect(ingested.description.status).toBe('no_text')

    // A FILE OF ZERO LENGTH — the same outcome, equally not an error.
    const empty = await describeMaterial(
      { bytes: new Uint8Array(0), kind: 'document', contentType: 'text/plain', filename: 'nothing.txt' },
      { describeText: digest.describeText },
    )
    expect(empty.status).toBe('no_text')
    expect(empty.body.toLowerCase()).toContain('empty')
    expect(empty.title).toContain('nothing.txt')
    expect(empty.body).toContain('nothing.txt')
  })

  it('test_UAT_AC1691_an_image_is_described_by_what_it_depicts_and_never_by_its_filename', async () => {
    const describer = describerSaying(`${IMAGE_TITLE_LINE}\n\n${IMAGE_PROSE}`, 'stub/vision-9')
    const described = await describeMaterial(
      { bytes: imageBytes(4096), kind: 'image', contentType: 'image/jpeg', filename: 'IMG_4821.jpg' },
      { describeImage: describer.describeImage },
    )

    expect(described.status).toBe('ok')
    expect(described.body).toContain('stainless counters')
    expect(described.body).not.toContain('IMG_4821')
    expect(described.title).toBe(IMAGE_TITLE_LINE)
    expect(described.body).toContain(IMAGE_TITLE_LINE)
    expect(described.body).toContain(IMAGE_PROSE)
    expect(described.describer).toBe('stub/vision-9')
    expect(describer.calls).toHaveLength(1)
    expect(describer.calls[0].contentType).toBe('image/jpeg')

    const single = describerSaying('A proving basket of rye dough on a floured bench.')
    const onlyProse = await describeMaterial(
      { bytes: imageBytes(2048), kind: 'image', contentType: 'image/png', filename: 'DSC01.png' },
      { describeImage: single.describeImage },
    )
    expect(onlyProse.status).toBe('ok')
    expect(onlyProse.body).toBe('A proving basket of rye dough on a floured bench.')
    expect(single.calls[0].contentType).toBe('image/png')
  })

  it('test_UAT_AC1693_an_image_past_the_looking_ceiling_is_stored_whole_and_simply_not_looked_at', async () => {
    expect(VISION_MAX_BYTES).toBeLessThan(MAX_MATERIAL_BYTES)
    const bytes = imageBytes(VISION_MAX_BYTES + 1)
    const describer = describerSaying('should never be asked')

    const tenant = 'story4cabde9a-digest-ceiling'
    const store = await storeFor(tenant)
    const before = await keysUnder(env.BLOBS as R2Bucket, `t/${tenant}/`)
    const ingested = await ingestUpload(
      store,
      { bytes, filename: 'banner-original.png', contentType: 'image/png' },
      { describeImage: describer.describeImage },
    )

    expect(describer.calls).toHaveLength(0)
    expect(ingested.ticket.uid).not.toBe('')
    expect(ingested.description.status).toBe('too_large')
    expect(ingested.description.describer).toBeNull()
    expect(ingested.description.body.toLowerCase()).toContain('not described')
    expect(ingested.description.body).toContain(String(VISION_MAX_BYTES))

    const after = await keysUnder(env.BLOBS as R2Bucket, `t/${tenant}/`)
    const added = after.filter((key) => !before.includes(key))
    expect(added).toHaveLength(1)
    const stored = await (env.BLOBS as R2Bucket).get(added[0])
    expect(stored).not.toBeNull()
    const storedBytes = new Uint8Array(await stored!.arrayBuffer())
    expect(storedBytes.length).toBe(bytes.length)
    expect(await sha256(storedBytes)).toBe(await sha256(bytes))
  })

  it('test_UAT_AC1694_content_nothing_here_can_read_is_stored_and_marked_unreadable_by_type', async () => {
    const sheet = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    const spreadsheet = await describeMaterial(
      { bytes: bytesOf('PK typed as a spreadsheet'), kind: 'document', contentType: sheet, filename: 'prices.xlsx' },
      { describeText: stubDigest().describeText },
    )
    expect(spreadsheet.status).toBe('unsupported')
    expect(spreadsheet.body).toContain(sheet)
    expect(spreadsheet.body.toLowerCase()).toContain('found by name')
    expect(spreadsheet.describer).toBeNull()

    const describer = describerSaying('never asked')
    const bitmap = await describeMaterial(
      { bytes: imageBytes(1024), kind: 'image', contentType: 'image/bmp', filename: 'logo.bmp' },
      { describeImage: describer.describeImage },
    )
    expect(bitmap.status).toBe('unsupported')
    expect(bitmap.body).toContain('image/bmp')
    expect(bitmap.describer).toBeNull()
    expect(describer.calls).toHaveLength(0)

    const scan = await describeMaterial({
      bytes: scannedPdf(),
      kind: 'document',
      contentType: 'application/pdf',
      filename: 'scan.pdf',
    })
    expect(scan.status).toBe('no_text')
    expect(spreadsheet.status).not.toBe(scan.status)

    // A MARKDOWN FILE WITH NO DECLARED TYPE is read as text, not marked unreadable.
    const phrase = 'The counter opens at six and the rye sells out by nine.'
    const store = await storeFor('story4cabde9a-undeclared-md')
    const markdown = await ingestUpload(
      store,
      { bytes: bytesOf(`# Opening hours\n\n${phrase}`), filename: 'hours.md', contentType: '' },
      { describeText: stubDigest('Opening hours for a bakery.').describeText },
    )
    expect(markdown.description.status).toBe('ok')
    expect(markdown.description.status).not.toBe('unsupported')
    expect(markdown.description.body).toBe('Opening hours for a bakery.')
    // The file's own words reach the material, on its text comment.
    expect(markdown.text).not.toBeNull()
    expect(markdown.text!.body).toContain(phrase)
  })

  it('test_UAT_AC1695_a_font_is_described_from_the_faces_own_name_records_and_not_by_a_model', async () => {
    const described = await describeMaterial({
      bytes: sfnt(
        [
          [1, FAMILY],
          [2, STYLE],
          [9, DESIGNER],
          [10, BLURB],
          [16, FAMILY],
          [17, STYLE],
        ],
        { variable: true },
      ),
      kind: 'font',
      contentType: 'font/ttf',
      filename: 'ridgeway-display.ttf',
    })
    expect(described.status).toBe('ok')
    expect(described.body).toContain(FAMILY)
    expect(described.body).toContain(STYLE)
    expect(described.body).toContain(DESIGNER)
    expect(described.body).toContain(BLURB)
    expect(described.body).toContain('variable typeface')
    expect(described.title).toBe(`${FAMILY} ${STYLE}`)
    expect(described.describer).toBe('sfnt-name-table')

    // The plain style does not extend the title.
    const regular = await describeMaterial({
      bytes: sfnt([
        [1, FAMILY],
        [2, 'Regular'],
      ]),
      kind: 'font',
      contentType: 'font/otf',
      filename: 'r.otf',
    })
    expect(regular.title).toBe(FAMILY)
    expect(regular.body).not.toContain('variable')

    const anonymous = await describeMaterial({
      bytes: sfnt([[9, DESIGNER]]),
      kind: 'font',
      contentType: 'font/ttf',
      filename: 'mystery.ttf',
    })
    expect(anonymous.status).toBe('unsupported')
    expect(anonymous.describer).toBeNull()
    expect(anonymous.body).not.toContain(FAMILY)
  })

  it('test_UAT_AC1696_a_compressed_web_font_wrapper_degrades_honestly_rather_than_being_half_read', async () => {
    const wrappers: Array<[string, string, string]> = [
      ['wOFF', 'ridgeway-display.woff', 'font/woff'],
      ['wOF2', 'ridgeway-display.woff2', 'font/woff2'],
    ]
    for (const [magic, filename, contentType] of wrappers) {
      const described = await describeMaterial({
        bytes: webFontWrapper(magic),
        kind: 'font',
        contentType,
        filename,
      })
      expect(described.status, magic).toBe('unsupported')
      expect(described.describer, magic).toBeNull()
      expect(described.body, magic).toContain('OpenType/TrueType')
      expect(described.body, magic).toMatch(/WOFF/)
      expect(described.body, magic).toContain(filename)
      expect(described.body, magic).not.toContain(FAMILY)
      expect(described.body, magic).not.toContain('typeface.')
      expect(described.title, magic).toBe(filename)
    }
  })

  it('test_UAT_AC1697_every_material_records_one_of_six_outcomes_and_who_produced_the_description', async () => {
    const tenant = 'story4cabde9a-digest-outcomes'
    const store = await storeFor(tenant)
    const answering = describerSaying(`${IMAGE_TITLE_LINE}\n\n${IMAGE_PROSE}`, 'stub/vision-1')
    const broken = describerThrowing('the vision provider refused this request')
    const digest = stubDigest()

    const ok = await ingestUpload(
      store,
      { bytes: minimalPdf(PDF_SENTENCE), filename: 'paper.pdf', contentType: 'application/pdf' },
      { describeImage: answering.describeImage, describeText: digest.describeText },
    )
    // No image describer, though a document describer is present.
    const noDescriber = await ingestUpload(
      store,
      { bytes: imageBytes(2048), filename: 'shopfront.png', contentType: 'image/png' },
      { describeText: digest.describeText },
    )
    const noText = await ingestUpload(
      store,
      { bytes: scannedPdf(), filename: 'scan.pdf', contentType: 'application/pdf' },
      { describeImage: answering.describeImage, describeText: digest.describeText },
    )
    const unsupported = await ingestUpload(
      store,
      {
        bytes: bytesOf('a spreadsheet, as far as anyone here can tell'),
        filename: 'prices.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      { describeImage: answering.describeImage, describeText: digest.describeText },
    )
    const tooLarge = await ingestUpload(
      store,
      { bytes: imageBytes(VISION_MAX_BYTES + 1), filename: 'banner.png', contentType: 'image/png' },
      { describeImage: answering.describeImage, describeText: digest.describeText },
    )
    const failed = await ingestUpload(
      store,
      { bytes: imageBytes(2048), filename: 'broken.png', contentType: 'image/png' },
      { describeImage: broken.describeImage, describeText: digest.describeText },
    )

    const expected: Array<[string, string]> = [
      ['ok', ok.ticket.uid],
      ['no_describer', noDescriber.ticket.uid],
      ['no_text', noText.ticket.uid],
      ['unsupported', unsupported.ticket.uid],
      ['too_large', tooLarge.ticket.uid],
      ['failed', failed.ticket.uid],
    ]
    expect(new Set(expected.map(([status]) => status)).size).toBe(6)

    const reader = await storeFor(tenant)
    for (const [status, uid] of expected) {
      const { tickets } = await reader.query({
        predicate: `type=material AND fields.description_status=${status}`,
        limit: 'all',
      })
      expect(tickets.map((ticket) => ticket.uid), status).toEqual([uid])
    }

    const { tickets: all } = await reader.query({ predicate: 'type=material', limit: 'all' })
    expect(all).toHaveLength(6)
    for (const ticket of all) {
      expect(Object.keys(ticket.fields)).toContain('description_status')
      expect(Object.keys(ticket.fields)).toContain('description_model')
    }
    const byUid = new Map(all.map((ticket) => [ticket.uid, ticket]))
    expect(byUid.get(ok.ticket.uid)?.fields.description_model).toBe('stub/digest-1 (unpdf)')
    for (const [status, uid] of expected.filter(([s]) => s !== 'ok')) {
      expect(byUid.get(uid)?.fields.description_model ?? null, status).toBeNull()
    }

    // Everything with no real description — and none of the honest accounts.
    const wanting: string[] = []
    for (const status of ['no_describer', 'failed']) {
      const { tickets } = await reader.query({
        predicate: `type=material AND fields.description_status=${status}`,
        limit: 'all',
      })
      wanting.push(...tickets.map((ticket) => ticket.uid))
    }
    expect(wanting.sort()).toEqual([noDescriber.ticket.uid, failed.ticket.uid].sort())
    expect(wanting).not.toContain(noText.ticket.uid)
    expect(wanting).not.toContain(unsupported.ticket.uid)
    expect(wanting).not.toContain(tooLarge.ticket.uid)
  })

  it('test_UAT_AC1698_a_describer_that_is_reached_and_fails_costs_findability_and_nothing_else', async () => {
    const tenant = 'story4cabde9a-digest-failure'
    const store = await storeFor(tenant)
    const message = 'rate limited by the vision provider at 04:12'
    const broken = describerThrowing(message)

    const ingested = await ingestUpload(
      store,
      { bytes: imageBytes(3072), filename: 'kitchen.png', contentType: 'image/png' },
      { describeImage: broken.describeImage, describeText: stubDigest().describeText },
    )
    expect(broken.calls).toHaveLength(1)
    expect(ingested.ticket.uid).not.toBe('')
    expect(ingested.attachment.uid).not.toBe('')
    expect(ingested.description.status).toBe('failed')
    expect(ingested.description.status).not.toBe('no_describer')
    expect(ingested.description.body.toLowerCase()).toContain('describer failed')
    expect(ingested.description.body).toContain(message)

    const reader = await storeFor(tenant)
    const { ticket } = await reader.get({ uid: ingested.ticket.uid })
    expect(ticket.type).toBe('material')
    expect(ticket.fields.description_status).toBe('failed')
    expect(ticket.body).toContain(message)
    expect((await keysUnder(env.BLOBS as R2Bucket, `t/${tenant}/`)).length).toBeGreaterThan(0)

    // A document describer that throws: also reached-but-failed, also stored.
    const docMessage = 'digest provider timed out after 30s'
    const doc = await ingestUpload(
      store,
      { bytes: minimalPdf(PDF_SENTENCE), filename: 'paper.pdf', contentType: 'application/pdf' },
      {
        describeText: async () => {
          throw new Error(docMessage)
        },
      },
    )
    expect(doc.ticket.uid).not.toBe('')
    expect(doc.description.status).toBe('failed')
    expect(doc.description.body).toContain(docMessage)

    // MALFORMED BYTES of a readable type: a material is still returned, never a throw.
    const malformed = await ingestUpload(
      store,
      {
        bytes: bytesOf('%PDF-1.4 and then nothing that is actually a document'),
        filename: 'corrupt.pdf',
        contentType: 'application/pdf',
      },
      { describeText: stubDigest().describeText },
    )
    expect(malformed.ticket.uid).not.toBe('')
    expect(malformed.description.status).not.toBe('ok')
  })

  it('test_UAT_AC1699_a_body_is_a_bounded_digest_a_title_one_collapsed_line_and_full_text_bounded_separately', async () => {
    // TEXT BEYOND THE BODY CEILING BUT WITHIN THE FULL-TEXT CEILING is kept whole.
    const opening = 'Ridgeway Bakery opened on a Tuesday. '
    const midsize = opening + 'The bread is proofed overnight. '.repeat(10_000)
    expect(midsize.length).toBeGreaterThan(MAX_BODY_CHARS)
    expect(midsize.length).toBeLessThan(MAX_EXTRACTED_TEXT_CHARS)
    const whole = await describeMaterial(
      { bytes: bytesOf(midsize), kind: 'document', contentType: 'text/plain', filename: 'history.txt' },
      { describeText: stubDigest().describeText },
    )
    expect(whole.status).toBe('ok')
    expect(whole.fullText).toBe(midsize.trim())
    expect(whole.fullText).not.toContain('truncated at')
    expect(whole.body).toBe(DIGEST)
    expect(whole.body).not.toContain('truncated at')

    // TEXT BEYOND THE FULL-TEXT CEILING: the leading portion, then the stated clip.
    const huge = opening + 'sourdough '.repeat(Math.ceil((MAX_EXTRACTED_TEXT_CHARS + 5000) / 10))
    const clipped = await describeMaterial(
      { bytes: bytesOf(huge), kind: 'document', contentType: 'text/plain', filename: 'huge.txt' },
      { describeText: stubDigest().describeText },
    )
    expect(clipped.fullText!.startsWith(huge.slice(0, MAX_EXTRACTED_TEXT_CHARS))).toBe(true)
    expect(clipped.fullText).toContain(`truncated at ${MAX_EXTRACTED_TEXT_CHARS} characters`)
    expect(clipped.fullText!.length).toBeLessThan(huge.length)

    // A DIGEST LONGER THAN THE BODY CEILING is bounded, and says so.
    const rambling = 'The bakery is a bakery. '.repeat(Math.ceil((MAX_BODY_CHARS + 1000) / 24))
    const bounded = await describeMaterial(
      { bytes: bytesOf('A short note.'), kind: 'document', contentType: 'text/plain', filename: 'n.txt' },
      { describeText: stubDigest(rambling).describeText },
    )
    expect(bounded.body.length).toBeLessThan(rambling.length)
    expect(bounded.body.startsWith(rambling.slice(0, 1000))).toBe(true)
    expect(bounded.body).toContain(`truncated at ${MAX_BODY_CHARS} characters`)
    expect(bounded.fullText).toBe('A short note.')

    // A TITLE IS A SINGLE COLLAPSED LINE, ending in an ellipsis when over-long.
    const wordy = `The   Ridgeway \t Bakery ${'Positioning And Naming Paper '.repeat(12)}`
    const titled = await describeMaterial(
      { bytes: bytesOf(`${wordy}\n\nBody text follows.`), kind: 'document', contentType: 'text/plain', filename: 'wordy.txt' },
      { describeText: stubDigest().describeText },
    )
    expect(titled.title.length).toBeLessThanOrEqual(120)
    expect(titled.title.endsWith('…')).toBe(true)
    expect(titled.title).not.toMatch(/\s{2,}|\n|\t/)
    expect(titled.title.startsWith('The Ridgeway Bakery')).toBe(true)
  })
})
