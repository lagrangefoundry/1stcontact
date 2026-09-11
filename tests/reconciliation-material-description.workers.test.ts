import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  describe as describeMaterial,
  MAX_BODY_CHARS,
  VISION_MAX_BYTES,
  type DescribeImage,
} from '../apps/control-app/src/describe'
import { ingestUpload, MAX_MATERIAL_BYTES } from '../apps/control-app/src/material'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import { applySchema } from './support/d1-site-factory'

/**
 * Reconciliation UATs for story-4cabde9a — **description: what the system
 * understands a file to be**.
 *
 * WHERE THE BOUNDARY IS FOR THIS STORY. The story says it in its own words:
 * STORY-140 owns the surrounding pipeline and "calls into this step exactly once
 * per created material; this story owns what that step produces." So the step's
 * own entry point — `describe()` — is the boundary for every criterion that is
 * about what a description SAYS, and the ingestion entry point `ingestUpload()`
 * is the boundary for the three criteria that are about what ends up STORED: the
 * six outcomes queried back out of the account's own ticket store (AC-1697), the
 * never-fails-an-upload contract (AC-1698), and the whole bytes kept for an image
 * nothing looked at (AC-1693). Nothing here reaches through the HTTP route, which
 * is STORY-140's boundary and is proved in its own file.
 *
 * ONE DOUBLE, AND IT IS THE ONE THE STORY DECLARES. `DescribeImage` is an
 * injectable seam in the production code precisely so a UAT does not reach a
 * vision model, and the story's Technical Context says no criterion here asserts
 * which model or which path is used. Every other component is real: the PDF text
 * comes out of the extractor the product ships, the font names come out of the
 * face's own binary name table, and the stored records are read back through a
 * second, independently constructed `ticketStoreFor` handle against real D1 and
 * real R2 supplied by `@cloudflare/vitest-pool-workers`.
 *
 * THE FIXTURES ARE BUILT, NOT MOCKED. A hand-assembled PDF with a real cross
 * reference table and a hand-assembled SFNT with a real `name` table are the
 * genuine article as far as the code under test is concerned — it parses them
 * with the same reader it parses a client's file with. That is what makes
 * "a phrase present in the font's name records is present in the description" an
 * observation rather than a restatement.
 */

const APPLIED = applySchema()

/** A fresh account per test, so one test's material can never answer another's query. */
function storeEnv(tenant: string) {
  return { DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket, TENANT_ID: tenant }
}

function storeFor(tenant: string): Promise<TicketStore> {
  return ticketStoreFor(storeEnv(tenant))
}

function bytesOf(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}

/** Bytes as lowercase hex sha-256 — how "byte for byte" is actually compared. */
async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Every R2 key under a prefix, so what was stored is enumerated rather than assumed. */
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

// ───────────────────────── fixtures: portable documents ─────────────────────────

/**
 * A PDF assembled object by object, with a REAL cross-reference table.
 *
 * The offsets are computed from the bytes actually emitted rather than written
 * by hand, which is what lets the extractor open these the way it opens a
 * client's file instead of falling back to its damaged-document recovery.
 * Everything emitted is ASCII, so a character index is a byte offset.
 */
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

function pdfStream(content: string): string {
  return `<< /Length ${content.length} >>\nstream\n${content}\nendstream`
}

const PDF_SENTENCE = 'Sourdough is proofed overnight in the cold room at Ridgeway Bakery.'
const PDF_DECLARED_TITLE = 'Ridgeway Bakery Positioning Paper'

/** A one-page portable document that carries text, with or without a declared title. */
function textPdf(declaredTitle: boolean): Uint8Array {
  return buildPdf(
    [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ' +
        '/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
      pdfStream(`BT /F1 12 Tf 36 700 Td (${PDF_SENTENCE}) Tj ET`),
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
      declaredTitle
        ? `<< /Title (${PDF_DECLARED_TITLE}) /Author (Ada Vale) >>`
        : '<< /Author (Ada Vale) >>',
    ],
    ' /Info 6 0 R',
  )
}

/** Two pages of ink and no text layer — a scan, as far as any extractor is concerned. */
function scannedPdf(): Uint8Array {
  return buildPdf([
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>',
    pdfStream('0.8 0.8 0.8 rg 36 36 540 720 re f'),
  ])
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

/**
 * A real uncompressed SFNT: an offset table, a table directory and a `name`
 * table whose records are the ones the parser reads.
 *
 * The strings go in as UTF-16BE under platform 3, which is how a shipped face
 * stores them — so the decode path the product runs is the decode path exercised
 * here, not an ASCII shortcut past it.
 */
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
    nv.setUint16(record, 3) // platform: Windows
    nv.setUint16(record + 2, 1) // encoding: UCS-2
    nv.setUint16(record + 4, 0x0409)
    nv.setUint16(record + 6, nameId)
    nv.setUint16(record + 8, strings[i].length)
    nv.setUint16(record + 10, cursor)
    nameTable.set(strings[i], recordsSize + cursor)
    cursor += strings[i].length
  })

  const tables: Array<[string, Uint8Array]> = []
  // A face is variable because it carries a font-variations table; a stub one is
  // enough, because what the description claims is that the table is THERE.
  if (opts.variable) tables.push(['fvar', new Uint8Array(16)])
  tables.push(['name', nameTable])

  const header = 12 + tables.length * 16
  const padding = tables.map(([, data]) => (4 - (data.length % 4)) % 4)
  const total = tables.reduce((n, [, data], i) => n + data.length + padding[i], header)
  const out = new Uint8Array(total)
  const dv = new DataView(out.buffer)
  dv.setUint32(0, 0x00010000) // TrueType outlines
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

/** A wrapper whose tables are compressed — the whole file, as far as we can read it. */
function webFontWrapper(magic: string): Uint8Array {
  const out = new Uint8Array(48)
  for (let i = 0; i < 4; i++) out[i] = magic.charCodeAt(i)
  // The flavour field a real wrapper carries, then noise standing in for the
  // compressed table data nothing here can inflate.
  out.set(bytesOf('OTTO'), 4)
  for (let i = 8; i < out.length; i++) out[i] = (i * 37) % 256
  return out
}

// ───────────────────────────── fixtures: images ─────────────────────────────

/** Bytes of an image, deterministic so "byte for byte" has something to compare. */
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

/** A describer that answers, and records what it was offered. */
function describerSaying(text: string, model = 'stub/vision-1') {
  const calls: Array<{ bytes: Uint8Array; contentType: string }> = []
  const describeImage: DescribeImage = async (bytes, contentType) => {
    calls.push({ bytes, contentType })
    return { text, model }
  }
  return { describeImage, calls }
}

/** A describer that is reached and breaks. */
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

describe('story-4cabde9a — what the system understands a file to be', () => {
  it('test_UAT_AC1688_a_document_that_carries_text_yields_its_own_words_and_its_own_declared_title', async () => {
    // THE BODY IS THE DOCUMENT'S OWN WORDS, which is the claim the whole
    // uniform-corpus simplification rests on: a phrase in the file is a phrase in
    // the description, so the retrieval handle for a PDF is the same one as for
    // anything else.
    const described = await describeMaterial({
      bytes: textPdf(true),
      kind: 'document',
      contentType: 'application/pdf',
      filename: 'positioning.pdf',
    })

    expect(described.status).toBe('ok')
    expect(described.body).toContain('Sourdough')
    expect(described.body).toContain('Ridgeway Bakery')
    // Not merely its name, type or size — the distinction the criterion draws.
    expect(described.body).not.toBe('positioning.pdf')
    expect(described.body).not.toContain('positioning.pdf')
    // The document's OWN declared title beats anything derived from its text.
    expect(described.title).toBe(PDF_DECLARED_TITLE)
    // An extractor identity, never an empty value: `ok` plus a named describer is
    // what "this is a real description" means.
    expect(described.describer).not.toBeNull()
    expect(String(described.describer)).not.toBe('')

    // A DOCUMENT WHOSE DECLARED TITLE CANNOT BE READ still yields its text, and
    // falls back to a derived title rather than failing.
    const untitled = await describeMaterial({
      bytes: textPdf(false),
      kind: 'document',
      contentType: 'application/pdf',
      filename: 'untitled-paper.pdf',
    })
    expect(untitled.status).toBe('ok')
    expect(untitled.body).toContain('Sourdough')
    expect(untitled.title).not.toBe('')
    expect(untitled.title).not.toBe(PDF_DECLARED_TITLE)
  })

  it('test_UAT_AC1689_a_text_shaped_file_becomes_material_whose_body_is_its_decoded_contents', async () => {
    // MARKDOWN — the title is the first substantial line with its heading marks
    // removed, and the body is the file's text rather than a summary of its name.
    const markdown = [
      '# The Ridgeway Brand Brief',
      '',
      'Oxblood and bone are the palette chosen for the bakery.',
    ].join('\n')
    const md = await describeMaterial({
      bytes: bytesOf(markdown),
      kind: 'document',
      contentType: 'text/markdown',
      filename: 'brief.md',
    })
    expect(md.status).toBe('ok')
    expect(md.body).toContain('Oxblood and bone are the palette chosen')
    expect(md.title).toBe('The Ridgeway Brand Brief')
    expect(md.title).not.toContain('#')
    expect(md.describer).not.toBeNull()
    expect(String(md.describer)).not.toBe('')

    // STRUCTURED TEXT — the same treatment, reached by the type FAMILY and not by
    // a list of extensions, which is what the criterion asks to be shown.
    const json = ['{', '  "brand": "Ridgeway Bakery",', '  "note": "proofed overnight"', '}'].join(
      '\n',
    )
    const structured = await describeMaterial({
      bytes: bytesOf(json),
      kind: 'document',
      contentType: 'application/json',
      filename: 'brand.json',
    })
    expect(structured.status).toBe('ok')
    expect(structured.body).toContain('proofed overnight')
    expect(structured.title).toContain('Ridgeway Bakery')
    expect(structured.describer).not.toBeNull()
  })

  it('test_UAT_AC1690_a_document_with_nothing_extractable_is_stored_and_honestly_described', async () => {
    // A SCAN — pages of ink, no text layer. Not a refusal: the honest sentence,
    // the page count, and an entry that is still identifiable by name.
    const scan = await describeMaterial({
      bytes: scannedPdf(),
      kind: 'document',
      contentType: 'application/pdf',
      filename: 'brand-book-scan.pdf',
    })
    expect(scan.status).toBe('no_text')
    expect(scan.body.toLowerCase()).toContain('no extractable text')
    // The page count is present for the scanned case — two pages, said in words.
    expect(scan.body).toContain('2 pages')
    expect(scan.title).toContain('brand-book-scan.pdf')
    expect(scan.body).toContain('brand-book-scan.pdf')

    // A FILE OF ZERO LENGTH — the same outcome, for the same reason, and equally
    // not an error.
    const empty = await describeMaterial({
      bytes: new Uint8Array(0),
      kind: 'document',
      contentType: 'text/plain',
      filename: 'nothing.txt',
    })
    expect(empty.status).toBe('no_text')
    expect(empty.body.toLowerCase()).toContain('empty')
    expect(empty.title).toContain('nothing.txt')
    expect(empty.body).toContain('nothing.txt')
  })

  it('test_UAT_AC1691_an_image_is_described_by_what_it_depicts_and_never_by_its_filename', async () => {
    // The describer answers with a title line, a blank line, then the description
    // — and the filename shares no word with either, so a body drawn from the name
    // could not accidentally pass.
    const describer = describerSaying(`${IMAGE_TITLE_LINE}\n\n${IMAGE_PROSE}`, 'stub/vision-9')
    const described = await describeMaterial(
      {
        bytes: imageBytes(4096),
        kind: 'image',
        contentType: 'image/jpeg',
        filename: 'IMG_4821.jpg',
      },
      { describeImage: describer.describeImage },
    )

    expect(described.status).toBe('ok')
    // What it DEPICTS, in the words someone would type looking for it.
    expect(described.body).toContain('stainless counters')
    expect(described.body).toContain('two cooks plating')
    expect(described.body).not.toContain('IMG_4821')
    // The title is the description's own opening line, not the filename.
    expect(described.title).toBe(IMAGE_TITLE_LINE)
    // BOTH HALVES reach the body — a description reduced to its title alone is
    // never produced.
    expect(described.body).toContain(IMAGE_TITLE_LINE)
    expect(described.body).toContain(IMAGE_PROSE)
    // The describer recorded is the model that answered.
    expect(described.describer).toBe('stub/vision-9')
    // Offered under its OWN declared type, never re-labelled as another.
    expect(describer.calls).toHaveLength(1)
    expect(describer.calls[0].contentType).toBe('image/jpeg')

    // A DESCRIBER THAT ANSWERS WITH ONE PARAGRAPH: the body is that paragraph
    // rather than empty.
    const single = describerSaying('A proving basket of rye dough on a floured bench.')
    const onlyProse = await describeMaterial(
      { bytes: imageBytes(2048), kind: 'image', contentType: 'image/png', filename: 'DSC01.png' },
      { describeImage: single.describeImage },
    )
    expect(onlyProse.status).toBe('ok')
    expect(onlyProse.body).toContain('proving basket of rye dough')
    expect(onlyProse.body.trim()).not.toBe('')
  })

  it('test_UAT_AC1692_with_no_image_describer_configured_the_record_says_nothing_has_looked_at_it', async () => {
    const described = await describeMaterial({
      bytes: imageBytes(4096),
      kind: 'image',
      contentType: 'image/jpeg',
      filename: 'shopfront.jpg',
    })

    expect(described.status).toBe('no_describer')
    // Explicitly empty rather than naming something that did not run.
    expect(described.describer).toBeNull()
    // In words: nothing has looked at it, and it is findable by name and not by
    // what it shows.
    expect(described.body.toLowerCase()).toContain('looked at it')
    expect(described.body.toLowerCase()).toContain('found by name')
    // Still identifiable — never an anonymous row.
    expect(described.title).toContain('shopfront.jpg')

    // HELD DISTINCT from a describer that was reached and failed, because the two
    // wait on different things.
    const broken = describerThrowing('the vision provider rate limited this account')
    const failed = await describeMaterial(
      { bytes: imageBytes(4096), kind: 'image', contentType: 'image/jpeg', filename: 'x.jpg' },
      { describeImage: broken.describeImage },
    )
    expect(failed.status).toBe('failed')
    expect(failed.status).not.toBe(described.status)
  })

  it('test_UAT_AC1693_an_image_past_the_looking_ceiling_is_stored_whole_and_simply_not_looked_at', async () => {
    // THE TWO CEILINGS ARE DIFFERENT, and this file sits between them: above the
    // ceiling for LOOKING at an image, below the one for STORING one.
    expect(VISION_MAX_BYTES).toBeLessThan(MAX_MATERIAL_BYTES)
    const bytes = imageBytes(VISION_MAX_BYTES + 1)
    const describer = describerSaying('should never be asked')

    const tenant = 'story4cabde9a-ceiling'
    const store = await storeFor(tenant)
    const before = await keysUnder(env.BLOBS as R2Bucket, `t/${tenant}/`)

    const ingested = await ingestUpload(
      store,
      { bytes, filename: 'banner-original.png', contentType: 'image/png' },
      { describeImage: describer.describeImage },
    )

    // No description attempt was made against it.
    expect(describer.calls).toHaveLength(0)
    // A material is produced, with its own distinct outcome and an empty describer.
    expect(ingested.ticket.uid).not.toBe('')
    expect(ingested.description.status).toBe('too_large')
    expect(ingested.description.describer).toBeNull()
    // The body states it was stored but not described, and names the ceiling.
    expect(ingested.description.body.toLowerCase()).toContain('not described')
    expect(ingested.description.body).toContain(String(VISION_MAX_BYTES))

    // THE STORED BYTES ARE THE CLIENT'S FILE IN FULL — not shrunk, not clipped.
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
    // A DOCUMENT TYPE NOTHING HERE CAN PARSE — a spreadsheet.
    const sheet = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    const spreadsheet = await describeMaterial({
      bytes: bytesOf('PK not really a spreadsheet, but typed as one'),
      kind: 'document',
      contentType: sheet,
      filename: 'prices.xlsx',
    })
    expect(spreadsheet.status).toBe('unsupported')
    // The body names the content type that could not be read.
    expect(spreadsheet.body).toContain(sheet)
    expect(spreadsheet.body.toLowerCase()).toContain('found by name')
    expect(spreadsheet.describer).toBeNull()
    expect(spreadsheet.title).toContain('prices.xlsx')

    // AN IMAGE IN A FORMAT THE CONFIGURED DESCRIBER DOES NOT ACCEPT — configured,
    // reachable, and still unable to look at this one.
    const describer = describerSaying('never asked')
    const bitmap = await describeMaterial(
      { bytes: imageBytes(1024), kind: 'image', contentType: 'image/bmp', filename: 'logo.bmp' },
      { describeImage: describer.describeImage },
    )
    expect(bitmap.status).toBe('unsupported')
    expect(bitmap.body).toContain('image/bmp')
    expect(bitmap.describer).toBeNull()
    expect(describer.calls).toHaveLength(0)

    // DISTINCT FROM A SCANNED DOCUMENT, where reading succeeded and produced
    // nothing — the two are different sets a later pass would treat differently.
    const scan = await describeMaterial({
      bytes: scannedPdf(),
      kind: 'document',
      contentType: 'application/pdf',
      filename: 'scan.pdf',
    })
    expect(scan.status).toBe('no_text')
    expect(spreadsheet.status).not.toBe(scan.status)
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
    // TEXT LIFTED FROM THE FILE ITSELF: a phrase present in the name records is
    // present in the description.
    expect(described.body).toContain(FAMILY)
    expect(described.body).toContain(STYLE)
    expect(described.body).toContain(DESIGNER)
    expect(described.body).toContain(BLURB)
    // A face carrying variation axes is described as a variable typeface.
    expect(described.body).toContain('variable typeface')
    // The title is the family, extended with the style where it is not the plain one.
    expect(described.title).toBe(`${FAMILY} ${STYLE}`)
    // A NAME-RECORD PARSE, NOT A MODEL.
    expect(described.describer).toBe('sfnt-name-table')

    // A FACE THAT NAMES NO FAMILY falls back to the unreadable-type outcome
    // rather than producing an empty or invented family.
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
    // BOTH WRAPPER FORMATS, in one pass: WOFF compresses each table with zlib and
    // WOFF2 with brotli, and neither can be inflated here — so neither may be
    // half-read into a confident wrong family.
    const wrappers: Array<[string, string]> = [
      ['wOFF', 'ridgeway-display.woff'],
      ['wOF2', 'ridgeway-display.woff2'],
    ]
    for (const [magic, filename] of wrappers) {
      const described = await describeMaterial({
        bytes: webFontWrapper(magic),
        kind: 'font',
        contentType: 'font/woff2',
        filename,
      })

      // The material is described as unreadable-type, and the describer is empty.
      expect(described.status, magic).toBe('unsupported')
      expect(described.describer, magic).toBeNull()
      // The body says only uncompressed OpenType/TrueType files can be read here,
      // and that a compressed wrapper is not one — so the file is findable by name.
      expect(described.body, magic).toContain('OpenType/TrueType')
      expect(described.body, magic).toMatch(/WOFF/)
      expect(described.body, magic).toContain(filename)
      // NO FAMILY IS ASSERTED from bytes that were never decompressed — nothing
      // beyond what the filename itself supplies.
      expect(described.body, magic).not.toContain(FAMILY)
      expect(described.body, magic).not.toContain('typeface.')
      expect(described.title, magic).toBe(filename)
    }
  })

  it('test_UAT_AC1697_every_material_records_one_of_six_outcomes_and_who_produced_the_description', async () => {
    const tenant = 'story4cabde9a-outcomes'
    const store = await storeFor(tenant)
    const answering = describerSaying(`${IMAGE_TITLE_LINE}\n\n${IMAGE_PROSE}`, 'stub/vision-1')
    const broken = describerThrowing('the vision provider refused this request')

    // ONE MATERIAL OF EACH OF THE SIX OUTCOMES, ingested through the pipeline's
    // own entry point so each record is written the way a client's file is.
    const ok = await ingestUpload(
      store,
      { bytes: imageBytes(2048), filename: 'kitchen.png', contentType: 'image/png' },
      { describeImage: answering.describeImage },
    )
    const noDescriber = await ingestUpload(store, {
      bytes: imageBytes(2048),
      filename: 'shopfront.png',
      contentType: 'image/png',
    })
    const noText = await ingestUpload(store, {
      bytes: scannedPdf(),
      filename: 'scan.pdf',
      contentType: 'application/pdf',
    })
    const unsupported = await ingestUpload(store, {
      bytes: bytesOf('a spreadsheet, as far as anyone here can tell'),
      filename: 'prices.xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const tooLarge = await ingestUpload(
      store,
      {
        bytes: imageBytes(VISION_MAX_BYTES + 1),
        filename: 'banner.png',
        contentType: 'image/png',
      },
      { describeImage: answering.describeImage },
    )
    const failed = await ingestUpload(
      store,
      { bytes: imageBytes(2048), filename: 'broken.png', contentType: 'image/png' },
      { describeImage: broken.describeImage },
    )

    const expected: Array<[string, string]> = [
      ['ok', ok.ticket.uid],
      ['no_describer', noDescriber.ticket.uid],
      ['no_text', noText.ticket.uid],
      ['unsupported', unsupported.ticket.uid],
      ['too_large', tooLarge.ticket.uid],
      ['failed', failed.ticket.uid],
    ]
    // Six DISTINCT outcomes over six materials — not five with one doubled.
    expect(new Set(expected.map(([status]) => status)).size).toBe(6)

    // SELECTING BY OUTCOME RETURNS EXACTLY ITS OWN SET. A second, independently
    // constructed handle, so this reads the stored records rather than the
    // envelopes the pipeline just returned.
    const reader = await storeFor(tenant)
    for (const [status, uid] of expected) {
      const { tickets } = await reader.query({
        predicate: `type=material AND fields.description_status=${status}`,
        limit: 'all',
      })
      expect(tickets.map((ticket) => ticket.uid)).toEqual([uid])
    }

    // EVERY record carries an outcome and a describer key — never absent, so a
    // predicate over the describer never has to treat absence as a third state.
    const { tickets: all } = await reader.query({ predicate: 'type=material', limit: 'all' })
    expect(all).toHaveLength(6)
    for (const ticket of all) {
      expect(Object.keys(ticket.fields)).toContain('description_status')
      expect(Object.keys(ticket.fields)).toContain('description_model')
    }
    // An identity where something described it, an explicit empty value where
    // nothing did.
    const byUid = new Map(all.map((ticket) => [ticket.uid, ticket]))
    expect(String(byUid.get(ok.ticket.uid)?.fields.description_model)).not.toBe('')
    expect(byUid.get(ok.ticket.uid)?.fields.description_model).not.toBeNull()
    for (const [, uid] of expected.filter(([status]) => status !== 'ok')) {
      expect(byUid.get(uid)?.fields.description_model ?? null).toBeNull()
    }

    // ASKING FOR EVERYTHING THAT HAS NO REAL DESCRIPTION returns those two and
    // not the honest accounts — which is the whole point of holding six values
    // rather than a single "degraded" flag.
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
    const tenant = 'story4cabde9a-failure'
    const store = await storeFor(tenant)
    const message = 'rate limited by the vision provider at 04:12'
    const broken = describerThrowing(message)
    const bytes = imageBytes(3072)

    // THE CALL RETURNS SUCCESSFULLY. Not a throw, not a refusal — the client is
    // told their file arrived.
    const ingested = await ingestUpload(
      store,
      { bytes, filename: 'kitchen.png', contentType: 'image/png' },
      { describeImage: broken.describeImage },
    )
    expect(broken.calls).toHaveLength(1)
    expect(ingested.ticket.uid).not.toBe('')
    expect(ingested.attachment.uid).not.toBe('')

    // The recorded outcome is the reached-but-failed one, held distinct from
    // no-describer-configured.
    expect(ingested.description.status).toBe('failed')
    expect(ingested.description.status).not.toBe('no_describer')
    // The body says the describer failed and CARRIES THE REASON, so an operator
    // can tell a rate limit from a malformed file.
    expect(ingested.description.body.toLowerCase()).toContain('describer failed')
    expect(ingested.description.body).toContain(message)

    // The file is still stored and the record is still there, read back through a
    // second handle.
    const reader = await storeFor(tenant)
    const { ticket } = await reader.get({ uid: ingested.ticket.uid })
    expect(ticket.type).toBe('material')
    expect(ticket.fields.description_status).toBe('failed')
    expect(ticket.body).toContain(message)
    const stored = await keysUnder(env.BLOBS as R2Bucket, `t/${tenant}/`)
    expect(stored.length).toBeGreaterThan(0)

    // NO ERROR ESCAPES INTO THE INGESTION RESULT FOR ANY KIND OF MATERIAL,
    // including a malformed file of an otherwise readable type.
    const malformed = await ingestUpload(store, {
      bytes: bytesOf('%PDF-1.4 and then nothing that is actually a document'),
      filename: 'corrupt.pdf',
      contentType: 'application/pdf',
    })
    expect(malformed.ticket.uid).not.toBe('')
    expect(malformed.description.status).not.toBe('ok')
  })

  it('test_UAT_AC1699_a_description_body_is_bounded_and_says_so_and_a_title_is_one_collapsed_line', async () => {
    // TEXT BEYOND THE BODY CEILING IS NOT CARRIED, and the text up to it is.
    const opening = 'Ridgeway Bakery opened on a Tuesday. '
    const long = opening + 'The bread is proofed overnight. '.repeat(20_000)
    expect(long.length).toBeGreaterThan(MAX_BODY_CHARS)
    const clipped = await describeMaterial({
      bytes: bytesOf(long),
      kind: 'document',
      contentType: 'text/plain',
      filename: 'history.txt',
    })

    expect(clipped.status).toBe('ok')
    // Bounded — the whole file did not arrive.
    expect(clipped.body.length).toBeLessThan(long.length)
    // The retained text is the LEADING portion of the original.
    expect(clipped.body.startsWith(long.slice(0, 2000))).toBe(true)
    // WHERE TEXT WAS DROPPED the body says so, and names the truncation length,
    // so a description that stops mid-sentence is never read as corruption.
    expect(clipped.body).toContain(`truncated at ${MAX_BODY_CHARS} characters`)

    // MATERIAL WITHIN THE CEILING CARRIES NO SUCH STATEMENT.
    const short = await describeMaterial({
      bytes: bytesOf('A short note about the bakery.'),
      kind: 'document',
      contentType: 'text/plain',
      filename: 'note.txt',
    })
    expect(short.status).toBe('ok')
    expect(short.body).not.toContain('truncated at')

    // A TITLE IS A SINGLE COLLAPSED LINE: internal runs of whitespace collapsed,
    // and an over-long one ended with an ellipsis rather than cut without a mark.
    const wordy = `The   Ridgeway \t Bakery ${'Positioning And Naming Paper '.repeat(12)}`
    const titled = await describeMaterial({
      bytes: bytesOf(`${wordy}\n\nBody text follows.`),
      kind: 'document',
      contentType: 'text/plain',
      filename: 'wordy.txt',
    })
    expect(titled.title.length).toBeLessThanOrEqual(120)
    expect(titled.title.endsWith('…')).toBe(true)
    expect(titled.title).not.toContain('\n')
    expect(titled.title).not.toContain('  ')
    expect(titled.title).not.toContain('\t')
    expect(titled.title.startsWith('The Ridgeway Bakery')).toBe(true)
  })
})
