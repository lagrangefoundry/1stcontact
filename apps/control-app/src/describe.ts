/**
 * Step 3 of the ingestion pipeline — **the description** (REQ-163, [[DOC-38]] §10).
 *
 * WHY THIS IS THE STEP THAT MATTERS. [[DOC-38]] §6's whole simplification rests
 * on it: because every piece of material carries a written description in its
 * ticket BODY, the knowledge base indexes bodies uniformly and never learns that
 * images exist. There is no second retrieval path for media — a photograph is
 * found by *"the kitchen at dusk"* through exactly the code that finds a
 * positioning paper. A weak description is therefore not a cosmetic problem: it
 * is material that cannot be found at all.
 *
 * IT IS OURS, NOT THE TICKETING COMPONENT'S ([[DOC-38]] §7.4). The component
 * stores bytes and metadata; turning a PDF into prose is a product concern and a
 * general store must not learn it.
 *
 * FOUR SUB-PIPELINES, FOUR FAILURE MODES, ONE MECHANISM FOR ALL OF THEM. The
 * inputs are unlike each other — a PDF is extracted, an image is looked at, a
 * font is parsed, plain text is decoded — and each fails in its own way. What
 * they share is {@link DescriptionStatus}: in every degraded case the material is
 * still created, is still visible in the Library, says honestly what is missing,
 * and is selectable BY PREDICATE for a later re-describe pass. Three special
 * cases would have been three things to remember; one field is one thing to
 * query.
 *
 * WRITTEN FOR RETRIEVAL, NOT FOR ELEGANCE ([[DOC-38]] §6). A description that
 * reads beautifully and never uses the word "kitchen" has failed at the only job
 * it has, so the vision prompt asks for what a thing DEPICTS in the words someone
 * would search by.
 */

import Anthropic from '@anthropic-ai/sdk'
import { extractText, getMeta } from 'unpdf'

/**
 * The four shapes material comes in ([[DOC-38]] §9 `fields.kind`).
 *
 * `capture` is declared because the field's vocabulary is the component's, not
 * this file's — bundles are their own ticket and nothing here produces one.
 */
export type MaterialKind = 'document' | 'image' | 'font' | 'capture'

/**
 * How well the description went — the one mechanism covering every degraded case.
 *
 * `ok` is the only value that means "this is a real description". Everything else
 * names what was missing, and each is a query: `fields.description_status =
 * no_describer` is exactly the set a later pass would re-describe once a key is
 * configured.
 *
 * WHY NOT REJECT INSTEAD ([[DOC-38]] §10, REQ-163). Refusing a client's scanned
 * brand book is the worse failure by a wide margin — they hand over the one
 * document they have and the system says no. Storing it with *"Scanned document,
 * 14 pages, no extractable text"* keeps it visible, keeps it selectable, and is
 * honest about why it will not be found by its contents.
 */
export type DescriptionStatus =
  /** A real description: extracted text, a written image description, a parsed face. */
  | 'ok'
  /** No API key is wired, so the image could not be looked at. */
  | 'no_describer'
  /** Extraction ran and the document yielded nothing — a scan, or an empty PDF. */
  | 'no_text'
  /** Nothing here can describe this content type. Stored anyway. */
  | 'unsupported'
  /** An image past the vision ceiling. Stored whole; simply not looked at. */
  | 'too_large'
  /** The describer was reached and failed. Distinguished so a retry is findable. */
  | 'failed'

/** What one description pass produced. */
export interface Description {
  /**
   * The ticket's title — AI-written where there is an AI in the loop, derived
   * from the material's own first line where there is not, and the filename only
   * as a last resort.
   *
   * It matters more than a title usually does: [[DOC-39]] §7's enumerated
   * landscape is titles, and `uninformativeTitle` treats a bare filename as the
   * narrow exception it has to rescue with an excerpt.
   */
  title: string
  /** The body — what the material SAYS, so the KB can index it. */
  body: string
  status: DescriptionStatus
  /**
   * Who wrote the description: a model id where a model wrote it, the extractor's
   * name where code did. Recorded so a later re-describe pass can find everything
   * an older describer produced ([[DOC-38]] §10 / REQ-163) — the pass is out of
   * scope, the two fields that make it a query rather than a migration are not.
   */
  describer: string | null
}

/**
 * The image describer, as a seam.
 *
 * INJECTED SO THE UATs DO NOT REACH THE NETWORK, and so the consolidation named
 * below has somewhere to land.
 */
export type DescribeImage = (
  bytes: Uint8Array,
  contentType: string,
) => Promise<{ text: string; model: string }>

/**
 * The model that looks at images.
 *
 * A SECOND LLM PATH BESIDE THE AI HOST, DELIBERATELY AND TEMPORARILY (REQ-163).
 * The AI component's Worker surface is text-only — `promptStream(ref, text)`,
 * with no image content block anywhere in it — so an image cannot be described
 * through the host this Worker already runs. Rather than widen that surface from
 * here, this calls the SDK directly.
 *
 * That is duplication and is accepted as such. What stops it becoming permanent
 * by default is that the consolidation point is named NOW: either [[REQ-157]]
 * (the fidelity/"looking" surface, which needs the same capability) or an image
 * block on the AI component's own surface. Whichever lands, this function is what
 * is deleted.
 */
export const VISION_MODEL = 'claude-opus-5'

/**
 * The per-image ceiling for the vision call, which is NOT the blob ceiling.
 *
 * [[DOC-38]] §14 sizes blobs at 25MB because that is what a Worker isolate can
 * hold; the Messages API's own per-image limit is far lower. An image between the
 * two is stored WHOLE and simply not looked at — `too_large`, not a rejection,
 * because the client's file is not at fault and losing it to describe it would be
 * the wrong trade.
 */
export const VISION_MAX_BYTES = 5 * 1024 * 1024

/** What the Messages API will accept as an image block. */
const VISION_MEDIA_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])

/** How much extracted text goes in the body. Beyond this the tail is dropped. */
export const MAX_BODY_CHARS = 200_000

/**
 * Ask the model what an image depicts.
 *
 * THE PROMPT ASKS FOR SEARCH TERMS, NOT PROSE. The description exists to be
 * matched against a query someone types months later, so it is told to lead with
 * what the thing IS and to use the ordinary words for it. The title comes from
 * the same call rather than a second one: two calls to describe one photograph
 * would double the cost of an upload to produce something the first call already
 * knows.
 */
export function anthropicImageDescriber(apiKey: string): DescribeImage {
  const client = new Anthropic({ apiKey })
  return async (bytes, contentType) => {
    const response = await client.messages.create({
      model: VISION_MODEL,
      max_tokens: 1024,
      system:
        'You describe images so they can be FOUND again by search. Answer with a ' +
        'short title on the first line, then a blank line, then two or three ' +
        'sentences saying what the image depicts. Use the ordinary words someone ' +
        'would type looking for it — what it shows, where it is, what time of day, ' +
        'who is in it. Do not comment on quality, composition or how it might be ' +
        'used. Do not preface your answer.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: contentType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: base64(bytes),
              },
            },
            { type: 'text', text: 'Describe this image.' },
          ],
        },
      ],
    })
    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim()
    return { text, model: response.model }
  }
}

/**
 * Bytes as base64, in chunks.
 *
 * CHUNKED BECAUSE THE ARGUMENT LIST HAS A LIMIT. A 5MB image spread into one
 * `String.fromCharCode(...bytes)` call overflows the stack, and the failure looks
 * like an unrelated runtime error rather than "that image was too big".
 */
function base64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

/** What the describers need to know about the thing they are describing. */
export interface DescribeInput {
  bytes: Uint8Array
  kind: MaterialKind
  contentType: string
  filename: string
  sourceUrl?: string
}

/**
 * Describe one piece of material.
 *
 * NEVER THROWS. A describer that fails takes the material's findability with it
 * and nothing else — the blob is stored, the record is created, and the status
 * says what happened. Letting an extraction error reach the route would turn "we
 * could not read your PDF" into "your upload failed", which is both untrue and
 * unrecoverable.
 */
export async function describe(
  input: DescribeInput,
  deps: { describeImage?: DescribeImage } = {},
): Promise<Description> {
  try {
    switch (input.kind) {
      case 'image':
        return await describeImageMaterial(input, deps.describeImage)
      case 'font':
        return describeFont(input)
      case 'document':
        return await describeDocument(input)
      default:
        return degraded(input, 'unsupported', `${input.kind} material is not described here.`)
    }
  } catch (err) {
    const why = err instanceof Error ? err.message : String(err)
    return degraded(input, 'failed', `The describer failed: ${why}`)
  }
}

/**
 * A description that says what is missing.
 *
 * The body is still WRITTEN, not left empty, because the Library shows bodies and
 * a blank one reads as a bug rather than as a known limitation. It names the
 * filename and the type so the entry is at least identifiable by what it is.
 */
function degraded(input: DescribeInput, status: DescriptionStatus, why: string): Description {
  const provenance = `File: ${input.filename || '(unnamed)'} · ${input.contentType} · ${input.bytes.length} bytes`
  return {
    title: input.filename || 'Untitled material',
    body: `${why}\n\n${provenance}${input.sourceUrl ? `\nSource: ${input.sourceUrl}` : ''}`,
    status,
    describer: null,
  }
}

async function describeImageMaterial(
  input: DescribeInput,
  describeImage?: DescribeImage,
): Promise<Description> {
  if (!describeImage) {
    return degraded(
      input,
      'no_describer',
      'Image stored but not described: no describer is configured, so nothing has ' +
        'looked at it yet. It can be found by name, not by what it shows.',
    )
  }
  if (!VISION_MEDIA_TYPES.has(input.contentType)) {
    return degraded(
      input,
      'unsupported',
      `Image stored but not described: ${input.contentType} is not a format that can be looked at.`,
    )
  }
  if (input.bytes.length > VISION_MAX_BYTES) {
    return degraded(
      input,
      'too_large',
      `Image stored but not described: at ${input.bytes.length} bytes it is above the ` +
        `${VISION_MAX_BYTES}-byte ceiling for looking at an image. The file itself is kept whole.`,
    )
  }
  const { text, model } = await describeImage(input.bytes, input.contentType)
  if (text.trim() === '') {
    return degraded(input, 'failed', 'The describer returned nothing for this image.')
  }
  // The model was asked for a title, a blank line, then the description. Split on
  // the first blank line rather than the first newline: a title that wrapped
  // would otherwise be cut in half and the remainder would open the body.
  const [head, ...rest] = text.split(/\n\s*\n/)
  const body = rest.join('\n\n').trim()
  return {
    title: clipTitle(head),
    // BOTH HALVES, ALWAYS. If the model gave only one paragraph it is the
    // description, and dropping it in favour of a title would leave the body
    // empty — the one outcome this whole file exists to avoid.
    body: body === '' ? head.trim() : `${head.trim()}\n\n${body}`,
    status: 'ok',
    describer: model,
  }
}

/**
 * A document: extract what it says.
 *
 * PDF EXTRACTION TAKES A DEPENDENCY, and `unpdf` is the one (REQ-163). It is
 * pdf.js packaged for workerd with no native code, MIT licensed. The alternative
 * considered was a description limited to filename-plus-size, and it guts this
 * step: class 4b — the background material a client actually hands over — IS
 * PDFs, so a pipeline that cannot read one has a body for every kind of material
 * except the important one.
 */
async function describeDocument(input: DescribeInput): Promise<Description> {
  if (input.contentType === 'application/pdf') return describePdf(input)
  if (isTextual(input.contentType)) {
    const text = new TextDecoder().decode(input.bytes).trim()
    if (text === '') return degraded(input, 'no_text', 'The file is empty.')
    return {
      title: titleFromText(text, input.filename),
      body: clipBody(text),
      status: 'ok',
      describer: 'text-decode',
    }
  }
  return degraded(
    input,
    'unsupported',
    `Stored but not described: nothing here can read ${input.contentType}. ` +
      'It can be found by name, not by its contents.',
  )
}

async function describePdf(input: DescribeInput): Promise<Description> {
  // A COPY, because pdf.js takes ownership of the buffer it is handed and
  // detaches it — and these bytes are attached to the ticket afterwards.
  const { text, totalPages } = await extractText(new Uint8Array(input.bytes), { mergePages: true })
  const trimmed = text.trim()
  if (trimmed === '') {
    // THE SCANNED CASE, and it is not a failure ([[DOC-38]] §10 / REQ-163). No
    // OCR in v1: the honest sentence costs nothing and makes the gap visible,
    // where a rejection would make the document vanish.
    return degraded(
      input,
      'no_text',
      `Scanned document, ${totalPages} page${totalPages === 1 ? '' : 's'}, no extractable text. ` +
        'It can be found by name, not by its contents.',
    )
  }
  // The PDF's own title where it has one — a real title written by whoever made
  // the document, which beats anything derived from its first line.
  let declared = ''
  try {
    const meta = await getMeta(new Uint8Array(input.bytes))
    const t: unknown = meta.info?.Title
    if (typeof t === 'string') declared = t.trim()
  } catch {
    // A PDF with unreadable metadata still has readable text; the title falls
    // back below. Nothing here is worth failing an upload over.
  }
  return {
    title: declared !== '' ? clipTitle(declared) : titleFromText(trimmed, input.filename),
    body: clipBody(trimmed),
    status: 'ok',
    describer: 'unpdf',
  }
}

/** Content types whose bytes are just text. */
function isTextual(contentType: string): boolean {
  const ct = contentType.split(';')[0].trim()
  return (
    ct.startsWith('text/') ||
    ct === 'application/json' ||
    ct === 'application/xml' ||
    ct === 'image/svg+xml'
  )
}

/**
 * A font: read its own name table.
 *
 * PARSED, NOT DESCRIBED BY A MODEL. A font already carries the answer — family,
 * style, designer, and often a sentence about what it is for, written by whoever
 * drew it. Asking a model to guess from the bytes would produce something worse
 * and cost a call.
 *
 * SFNT ONLY, AND WOFF/WOFF2 DEGRADE HONESTLY. `.ttf`/`.otf` carry their table
 * directory in the clear. WOFF compresses each table with zlib and WOFF2 with
 * brotli, and workerd's `DecompressionStream` has no brotli at all — so rather
 * than half-support one wrapper and not the other, both are recorded as
 * `unsupported` and remain findable by name. The font registry ([[REQ-101]]) is
 * where a family's provenance actually lives; this is only what makes the FILE
 * retrievable.
 */
function describeFont(input: DescribeInput): Description {
  const names = sfntNames(input.bytes)
  if (!names) {
    return degraded(
      input,
      'unsupported',
      'Font stored but not described: only uncompressed OpenType/TrueType files ' +
        'can be read here, and a WOFF or WOFF2 wrapper compresses its tables.',
    )
  }
  const family = names.get(16) ?? names.get(1) ?? ''
  const style = names.get(17) ?? names.get(2) ?? ''
  const designer = names.get(9) ?? names.get(8) ?? ''
  const blurb = names.get(10) ?? ''
  if (family === '') {
    return degraded(input, 'unsupported', 'Font stored but not described: it names no family.')
  }
  const lines = [
    `${family}${style ? ` ${style}` : ''} — a ${names.variable ? 'variable ' : ''}typeface.`,
  ]
  if (designer !== '') lines.push(`Designed by ${designer}.`)
  if (blurb !== '') lines.push(blurb)
  lines.push(`File: ${input.filename || '(unnamed)'} · ${input.contentType}`)
  return {
    title: family + (style && style.toLowerCase() !== 'regular' ? ` ${style}` : ''),
    body: lines.join('\n\n'),
    status: 'ok',
    describer: 'sfnt-name-table',
  }
}

/** The name records of an SFNT font, by nameID, or `null` if this is not one. */
function sfntNames(bytes: Uint8Array): (Map<number, string> & { variable: boolean }) | null {
  if (bytes.length < 12) return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const version = view.getUint32(0)
  // 0x00010000 TrueType outlines · 'OTTO' CFF outlines · 'true' the Mac variant.
  if (version !== 0x00010000 && version !== 0x4f54544f && version !== 0x74727565) return null
  const numTables = view.getUint16(4)
  let nameOffset = 0
  let variable = false
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16
    if (rec + 16 > bytes.length) return null
    const tag = String.fromCharCode(bytes[rec], bytes[rec + 1], bytes[rec + 2], bytes[rec + 3])
    if (tag === 'name') nameOffset = view.getUint32(rec + 8)
    // A font-variations table is what makes a face variable, and saying so is
    // the difference between "a serif" and "a variable serif".
    if (tag === 'fvar') variable = true
  }
  if (nameOffset === 0 || nameOffset + 6 > bytes.length) return null

  const count = view.getUint16(nameOffset + 2)
  const storage = nameOffset + view.getUint16(nameOffset + 4)
  const out = new Map<number, string>() as Map<number, string> & { variable: boolean }
  out.variable = variable
  for (let i = 0; i < count; i++) {
    const rec = nameOffset + 6 + i * 12
    if (rec + 12 > bytes.length) break
    const platform = view.getUint16(rec)
    const nameId = view.getUint16(rec + 6)
    const length = view.getUint16(rec + 8)
    const offset = storage + view.getUint16(rec + 10)
    if (offset + length > bytes.length) continue
    const raw = bytes.subarray(offset, offset + length)
    // Platform 3 (Windows) and 0 (Unicode) store UTF-16BE; platform 1 (Mac)
    // stores MacRoman, which agrees with ASCII over the characters that matter.
    const text =
      platform === 1
        ? new TextDecoder('utf-8').decode(raw)
        : new TextDecoder('utf-16be').decode(raw)
    const trimmed = text.replace(/\0/g, '').trim()
    // FIRST RECORD WINS per nameID: a font repeats each name once per platform,
    // and later records are the same string in another encoding.
    if (trimmed !== '' && !out.has(nameId)) out.set(nameId, trimmed)
  }
  return out.size === 0 ? null : out
}

/** The first substantial line, as a title. */
function titleFromText(text: string, filename: string): string {
  for (const line of text.split('\n')) {
    const trimmed = line.replace(/^#+\s*/, '').trim()
    if (trimmed.length >= 3) return clipTitle(trimmed)
  }
  return filename || 'Untitled material'
}

function clipTitle(text: string): string {
  const flat = text.replace(/\s+/g, ' ').replace(/^#+\s*/, '').trim()
  return flat.length > 120 ? `${flat.slice(0, 119).trimEnd()}…` : flat
}

/**
 * The body, bounded.
 *
 * A body is a D1 text column and the corpus reads bodies on every index pass, so
 * an unbounded one is paid for repeatedly. The clip is STATED IN THE TEXT rather
 * than silent — a description that stops mid-sentence with no explanation reads
 * as corruption.
 */
function clipBody(text: string): string {
  if (text.length <= MAX_BODY_CHARS) return text
  return `${text.slice(0, MAX_BODY_CHARS)}\n\n[Text truncated at ${MAX_BODY_CHARS} characters.]`
}
