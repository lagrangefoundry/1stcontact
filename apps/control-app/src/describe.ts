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
 *
 * A DESCRIPTION, NEVER A TRANSCRIPTION (REQ-173). The four branches used not to
 * agree on what a body was: an image and a font were *described* in a few
 * sentences, and a document was *transcribed* — `clipBody(text)`, the whole
 * extracted file. So a brand-guidelines PDF arrived in the Library's *"What this
 * is"* field in full, directly below the REQ-172 reader window already rendering
 * it properly. Every branch now produces a DIGEST, and the document's own text
 * comes back as {@link Description.fullText} for the caller to keep beside the
 * ticket rather than inside it.
 *
 * THE TEXT IS NOT DISCARDED, and that is the half that makes the split safe.
 * `buildChunkIndex` chunking the extracted text is what makes a fact on page 12
 * of a client's brand book retrievable at all ([[DOC-39]] §7's *"search wide,
 * read deep"*). Replacing the body with three sentences and stopping there would
 * silently delete deep retrieval — so this file hands the text back, `material.ts`
 * writes it to a `material_text` comment, and `knowledge.ts` keeps chunking it.
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
  /**
   * The body — a DIGEST of what the material is (REQ-173).
   *
   * A few sentences: what it is, whose it is, roughly when it is from, what
   * someone would reach for it for. Not the material itself — see
   * {@link fullText}, and the module note for why the two are different places.
   */
  body: string
  status: DescriptionStatus
  /**
   * Who wrote the description: a model id where a model wrote it, the extractor's
   * name where code did. Recorded so a later re-describe pass can find everything
   * an older describer produced ([[DOC-38]] §10 / REQ-163) — the pass is out of
   * scope, the two fields that make it a query rather than a migration are not.
   */
  describer: string | null
  /**
   * The material's own extracted text, verbatim — `null` where there is none.
   *
   * NOT THE BODY, AND NOT A FIELD EITHER (REQ-173). The caller writes this to a
   * `material_text` comment on the ticket, which is the precedent [[DOC-33]]
   * §3.1/§3.2 already sets for chat: the durable, human-scale record in the body,
   * the bulky verbatim artefact in an append-only comment. The alternatives were
   * a `fields.extracted_text` — a very large field on a row every index pass
   * reads — and a second blob beside the original bytes, which puts a retrieval
   * input somewhere the knowledge component has no reason to look.
   *
   * SET EVEN WHERE THE DIGEST FAILED. Extraction and description fail
   * independently: a deployment with no describer still read the file, and
   * throwing its text away because a model could not be reached would lose the
   * one half that was actually obtained.
   */
  fullText: string | null
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
 * The document describer, as a seam (REQ-173).
 *
 * ONE ARGUMENT, AND IT IS ALREADY TEXT. By the time this is called the extraction
 * has run, so the model is fed prose rather than a file — which is what makes the
 * cost of describing a document acceptable at all (see {@link digestSource}).
 *
 * ITS DEFAULT IMPLEMENTATION IS NOT AN SDK CALL. Unlike {@link DescribeImage},
 * which has to reach the Messages API directly because the AI host's surface
 * carries no image block, a document digest is text in and text out — so
 * `ai.ts`'s {@link sessionTextDescriber} opens a lightweight session on the AI
 * host's own session factory and prompts it once. The seam is here so the UATs do
 * not reach the network, and so the two describers read alike from this file.
 */
export type DescribeText = (prompt: string) => Promise<{ text: string; model: string }>

/**
 * What the document describer is told to write (REQ-173).
 *
 * ASKS FOR THE WORDS SOMEONE WOULD SEARCH BY, for the same reason the vision
 * prompt does and stated in the same terms: this body is what the document-level
 * index embeds, and a paragraph of elegant abstraction embeds as a vector of
 * nothing in particular.
 *
 * PROSE ONLY — NO TITLE LINE, which is where it differs from the image prompt. A
 * document usually carries a real title, written by whoever made it, and
 * {@link describePdf} prefers the PDF's own `/Title` over anything derived. The
 * image branch asks for a title because a photograph has none to prefer.
 *
 * Exported because `ai.ts` builds the describer role's system prompt from it: the
 * two prompts this product sends about material belong next to each other, in the
 * file that decides what a description IS.
 */
export const DOCUMENT_DIGEST_SYSTEM =
  'You write short descriptions of documents so they can be FOUND again by ' +
  'search. You are given the text of one document, sometimes abridged. Answer ' +
  'with two to four sentences saying what the document is, whose business it ' +
  'concerns, roughly when it is from where the text says, and what someone would ' +
  'reach for it for. Use the ordinary words someone would type looking for it, ' +
  'and name the specific things it is about. Do not summarise its argument, do ' +
  'not comment on how it is written, do not preface your answer, and do not ' +
  'begin with a title line.'

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

/**
 * The body's ceiling — which since REQ-173 bounds a DIGEST and will never bite.
 *
 * A body is a D1 text column and the corpus reads bodies on every index pass, so
 * an unbounded one is paid for repeatedly. That argument is why the number
 * existed; it is kept as the backstop on a body a model wrote, because "the model
 * returned three sentences" is an assumption rather than a guarantee.
 */
export const MAX_BODY_CHARS = 200_000

/**
 * The ceiling on {@link Description.fullText} — the comment's, not the body's.
 *
 * FAR ABOVE THE BODY'S, AND A DIFFERENT KIND OF LIMIT (REQ-173). This one exists
 * to bound what a single comment row may hold, not to keep an index pass cheap:
 * the comment is read by the chunk indexer and by nothing else per request. What
 * actually stops a massive amount of text arriving is `MAX_MATERIAL_BYTES` at the
 * upload boundary — a ceiling on BYTES, which bites images and PDFs hardest
 * because that is where the bytes are. This is the second line of that defence,
 * for the pathological case of a small file that extracts to an enormous amount
 * of text.
 *
 * STATED IN THE TEXT when it bites, for the reason {@link clipBody} states its
 * own: text that stops mid-sentence with no explanation reads as corruption.
 */
export const MAX_EXTRACTED_TEXT_CHARS = 900_000

/**
 * How much of a document the digest is written from.
 *
 * THE HEAD ALONE IS THE COVER PAGE, which is the least informative part of a
 * brand book. So {@link digestSource} takes the head AND a sample from further
 * in, and this is the budget the two share.
 */
export const DIGEST_SOURCE_CHARS = 12_000

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
  deps: { describeImage?: DescribeImage; describeText?: DescribeText } = {},
): Promise<Description> {
  try {
    switch (input.kind) {
      case 'image':
        return await describeImageMaterial(input, deps.describeImage)
      case 'font':
        return describeFont(input)
      case 'document':
        return await describeDocument(input, deps.describeText)
      default:
        return degraded(input, 'unsupported', `${input.kind} material is not described here.`)
    }
  } catch (err) {
    const why = err instanceof Error ? err.message : String(err)
    return degraded(input, 'failed', `The describer failed: ${why}`)
  }
}

/**
 * What a capture describer is given — [[REQ-166]].
 *
 * THE STRUCTURED ESSENCE AND THE PICTURE, which is what [[DOC-38]] §9 asks the
 * body to be written from. They answer different halves of the question and
 * neither answers both: `capture.json` knows the palette to the hex and the
 * type ramp to the pixel and cannot tell you what the business IS; the
 * screenshot shows a bakery at a glance and cannot tell you its accent colour.
 */
export interface DescribeCaptureInput {
  /** The bundle's `capture.json`. */
  capture: CaptureEssence
  /** `screenshot.full.png`, or null when the bundle holds none. */
  screenshot: Uint8Array | null
}

/**
 * As much of `Capture` as describing one needs.
 *
 * STRUCTURALLY TYPED RATHER THAN IMPORTED. `Capture` is `tools/generate`'s and
 * carries the whole L1 vocabulary behind it; this module is reached from the
 * Worker's ingest path and has no business pulling the capture pipeline's type
 * graph in to read six fields off a JSON object it was handed.
 */
export interface CaptureEssence {
  url: string
  host: string
  title?: string
  theme?: {
    colors?: { hex: string; usage: string; freq: number }[]
    fonts?: { family: string; role: string }[]
  }
  sections?: unknown[]
  assets?: unknown[]
}

/** The most-painted colours, most-used first, as `#rrggbb` — at most `n`. */
function palette(input: DescribeCaptureInput, n: number): string[] {
  const colors = input.capture.theme?.colors ?? []
  return [...colors]
    .sort((a, b) => b.freq - a.freq)
    .map((c) => c.hex)
    .filter((hex, i, all) => all.indexOf(hex) === i)
    .slice(0, n)
}

/** The families the page actually set, heading first, deduplicated. */
function families(input: DescribeCaptureInput): string[] {
  const fonts = input.capture.theme?.fonts ?? []
  const ordered = [...fonts].sort((a, b) => (a.role === 'heading' ? -1 : b.role === 'heading' ? 1 : 0))
  return ordered.map((f) => f.family).filter((fam, i, all) => fam !== '' && all.indexOf(fam) === i)
}

/**
 * The facts the capture holds exactly, as a line of prose.
 *
 * DERIVED, NEVER ASKED OF THE MODEL. A vision call can be talked out of a hex
 * code and cannot count a page's sections at all, while `capture.json` knows
 * both to the pixel — so the model is asked what only looking can answer and
 * the capture supplies what only measuring can. That division is also what
 * keeps the body useful when there is no describer configured at all.
 */
function measured(input: DescribeCaptureInput): string {
  const parts: string[] = []
  const hexes = palette(input, 5)
  if (hexes.length > 0) parts.push(`Palette: ${hexes.join(', ')}.`)
  const fams = families(input)
  if (fams.length > 0) parts.push(`Type: ${fams.join(', ')}.`)
  const sections = input.capture.sections?.length ?? 0
  if (sections > 0) parts.push(`${sections} section${sections === 1 ? '' : 's'} down the page.`)
  const assets = input.capture.assets?.length ?? 0
  if (assets > 0) parts.push(`${assets} image${assets === 1 ? '' : 's'} and font${assets === 1 ? '' : 's'} mirrored.`)
  return parts.join(' ')
}

/**
 * The name a captured site goes by — [[REQ-166]].
 *
 * THE PAGE'S OWN `<title>`, WHICH IS WHAT THE CLIENT SAW IN THEIR BROWSER TAB.
 * Not a phrase a model invented: this is somebody's real, externally-existing
 * site, and naming it something other than its name would make the Library row
 * unrecognisable to the one person who asked for it to be captured.
 *
 * The host is the fallback, and the ONLY one. A page that declares no title
 * still has an address, so there is no case left over needing "Untitled".
 */
export function captureTitle(capture: CaptureEssence): string {
  const declared = (capture.title ?? '').trim()
  return clipTitle(declared === '' ? capture.host : declared)
}

/**
 * The first line of every capture description — [[REQ-166]].
 *
 * A LINK, AND ALWAYS THE FIRST THING. The body is prose ABOUT a site that exists
 * on the public web, and a description of a place you cannot get to from is a
 * dead end: the client reads what we thought of the site and then has to go and
 * find it themselves. It is markdown because the Library renders the body as
 * markdown, so this arrives as a link the client can follow rather than as an
 * address they have to copy.
 */
function link(capture: CaptureEssence): string {
  return `[${captureTitle(capture)}](${capture.url})`
}

/**
 * Describe a captured site — [[REQ-166]], [[DOC-38]] §9.
 *
 * NEVER THROWS, for exactly the reason {@link describe} does not: a capture whose
 * description failed is still a complete bundle, and turning "the model was
 * unreachable" into "your capture failed" would discard 11–23MB of successfully
 * mirrored site over a text generation.
 *
 * THE LINK AND THE MEASURED FACTS SURVIVE EVERY DEGRADED PATH. What a missing
 * describer costs is the prose — what the business appears to be, the tone of the
 * copy — and not the entry itself. A capture with no describer is still findable
 * by its address, its palette and its type; a capture with no BODY would not be
 * findable at all, and the whole ticket exists to stop bundles being invisible.
 */
export async function describeCapture(
  input: DescribeCaptureInput,
  deps: { describeImage?: DescribeImage } = {},
): Promise<Description> {
  const title = captureTitle(input.capture)
  const head = link(input.capture)
  const facts = measured(input)
  const withFacts = (prose: string, status: DescriptionStatus, describer: string | null) => ({
    title,
    body: [head, prose, facts].filter((part) => part !== '').join('\n\n'),
    status,
    describer,
    // A capture has no extracted text of its own: what it holds is a screenshot
    // and a structured essence, both of which are already summarised above.
    fullText: null,
  })

  if (!deps.describeImage) {
    return withFacts(
      'Captured but not described: no describer is configured, so nothing has looked ' +
        'at this site yet. It can be found by its address and its palette, not by what ' +
        'the business does.',
      'no_describer',
      null,
    )
  }
  if (!input.screenshot || input.screenshot.length === 0) {
    return withFacts(
      'Captured but not described: this bundle holds no screenshot, so there was ' +
        'nothing to look at. Its structure and palette were still read.',
      'no_text',
      null,
    )
  }
  if (input.screenshot.length > VISION_MAX_BYTES) {
    return withFacts(
      `Captured but not described: the screenshot is ${input.screenshot.length} bytes, above ` +
        `the ${VISION_MAX_BYTES}-byte ceiling for looking at an image. The bundle is kept whole.`,
      'too_large',
      null,
    )
  }
  try {
    const { text, model } = await deps.describeImage(input.screenshot, 'image/png')
    const prose = text.trim()
    if (prose === '') {
      return withFacts('Captured, but the describer returned nothing for this site.', 'failed', null)
    }
    return withFacts(prose, 'ok', model)
  } catch (err) {
    const why = err instanceof Error ? err.message : String(err)
    return withFacts(`Captured, but the describer failed: ${why}`, 'failed', null)
  }
}

/**
 * A description that says what is missing.
 *
 * The body is still WRITTEN, not left empty, because the Library shows bodies and
 * a blank one reads as a bug rather than as a known limitation. It names the
 * filename and the type so the entry is at least identifiable by what it is.
 *
 * IT ALREADY WROTE DIGEST-SHAPED PROSE, which is why REQ-173 left it alone —
 * *"Scanned document, 14 pages, no extractable text"* is a description of what
 * the thing is, not a transcription of it. The one thing it gained is
 * `fullText`: a document whose DIGEST failed may still have been extracted, and
 * the text is passed through so that half is not thrown away with the other.
 */
function degraded(
  input: DescribeInput,
  status: DescriptionStatus,
  why: string,
  fullText: string | null = null,
): Description {
  const provenance = `File: ${input.filename || '(unnamed)'} · ${input.contentType} · ${input.bytes.length} bytes`
  return {
    title: input.filename || 'Untitled material',
    body: `${why}\n\n${provenance}${input.sourceUrl ? `\nSource: ${input.sourceUrl}` : ''}`,
    status,
    describer: null,
    fullText,
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
    // An image has no text of its own. The body IS the description, which is the
    // shape REQ-173 made every other branch match rather than the other way round.
    fullText: null,
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
 *
 * EXTRACTION AND DESCRIPTION ARE TWO STEPS NOW (REQ-173). Extraction produces the
 * text, which goes back as `fullText`; description turns a sample of that text
 * into the digest that becomes the body. They fail independently and are reported
 * independently, which is why a document with no describer still carries its text.
 */
async function describeDocument(
  input: DescribeInput,
  describeText?: DescribeText,
): Promise<Description> {
  if (input.contentType === 'application/pdf') return describePdf(input, describeText)
  if (isTextual(input.contentType)) {
    const text = new TextDecoder().decode(input.bytes).trim()
    if (text === '') return degraded(input, 'no_text', 'The file is empty.')
    return digested(input, text, titleFromText(text, input.filename), 'text-decode', describeText)
  }
  return degraded(
    input,
    'unsupported',
    `Stored but not described: nothing here can read ${input.contentType}. ` +
      'It can be found by name, not by its contents.',
  )
}

async function describePdf(
  input: DescribeInput,
  describeText?: DescribeText,
): Promise<Description> {
  // A COPY, because pdf.js takes ownership of the buffer it is handed and
  // detaches it — and these bytes are attached to the ticket afterwards.
  const { text, totalPages } = await extractText(new Uint8Array(input.bytes), { mergePages: true })
  const trimmed = text.trim()
  if (trimmed === '') {
    // THE SCANNED CASE, and it is not a failure ([[DOC-38]] §10 / REQ-163). No
    // OCR in v1: the honest sentence costs nothing and makes the gap visible,
    // where a rejection would make the document vanish. There is no comment to
    // write either — a material with no extractable text has no text to keep.
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
  return digested(
    input,
    trimmed,
    declared !== '' ? clipTitle(declared) : titleFromText(trimmed, input.filename),
    'unpdf',
    describeText,
  )
}

/**
 * Extracted text plus a title, turned into a digest and its verbatim other half.
 *
 * THE ONE PLACE THE SPLIT HAPPENS, shared by the PDF and the plain-text branches
 * because it is the same decision either way: whatever produced the text, the
 * body is a description of it and the text itself travels beside.
 *
 * THE TITLE IS NOT THE MODEL'S. Both callers already have a better one — the
 * PDF's declared `/Title`, or the document's own first substantial line — and the
 * digest prompt is told not to write one. That is the opposite of the image
 * branch, and for the opposite reason: a photograph has no title to prefer.
 *
 * THE DESCRIBER'S OWN FAILURES ARE NOT THE MATERIAL'S. An absent describer, or
 * one that answers with nothing, degrades the BODY and leaves the extraction
 * untouched — status says which, and `fullText` is returned in every case, so the
 * comment is written and the document stays deeply retrievable either way.
 */
async function digested(
  input: DescribeInput,
  text: string,
  title: string,
  extractor: string,
  describeText?: DescribeText,
): Promise<Description> {
  const fullText = clipExtracted(text)
  // THE DERIVED TITLE SURVIVES A MISSING DESCRIBER, which is why these branches
  // do not go through {@link degraded}. That function falls back to the filename,
  // which is right when nothing could be read at all — and wrong here, where the
  // document WAS read and its own declared title is already in hand. BUG-41's
  // claim is about `titleFromText`, and it must not become a claim about whether
  // a model was reachable.
  const notDescribed = (why: string, status: DescriptionStatus): Description => ({
    title,
    body: `${why}\n\nFile: ${input.filename || '(unnamed)'} · ${input.contentType} · ${input.bytes.length} bytes`,
    status,
    describer: null,
    fullText,
  })
  if (!describeText) {
    return notDescribed(
      'Document stored and read, but not described: no describer is configured, so ' +
        'nothing has written what it is yet. Its own text is kept and searchable.',
      'no_describer',
    )
  }
  const { text: prose, model } = await describeText(digestSource(text))
  const digest = prose.trim()
  if (digest === '') {
    return notDescribed(
      'Document stored and read, but the describer returned nothing for it. ' +
        'Its own text is kept and searchable.',
      'failed',
    )
  }
  return {
    title,
    body: clipBody(digest),
    status: 'ok',
    // The MODEL, not the extractor — `description_model` names whoever wrote the
    // body, and since REQ-173 that is the model for every document with a digest.
    // The extractor is still recorded, because which reader produced the text is
    // what a later re-extract pass would select on.
    describer: `${model} (${extractor})`,
    fullText,
  }
}

/**
 * What the describer is shown: the head of the document, plus a sample from
 * further in.
 *
 * THE HEAD ALONE IS THE COVER PAGE. A brand book opens with a logo, a client
 * name and a date, and a digest written from that says the document is a brand
 * book — which the filename already said. The sample is taken from the middle,
 * where the document is actually about something.
 *
 * TWO PIECES, MARKED AS SUCH. The gap is stated rather than elided, because a
 * model handed two spans spliced silently together will write about the seam.
 */
export function digestSource(text: string): string {
  if (text.length <= DIGEST_SOURCE_CHARS) return text
  const head = Math.floor((DIGEST_SOURCE_CHARS * 2) / 3)
  const tail = DIGEST_SOURCE_CHARS - head
  const from = Math.floor((text.length - tail) / 2)
  return (
    `${text.slice(0, head)}\n\n[…]\n\n` +
    `[Continues from character ${from} of ${text.length}.]\n\n${text.slice(from, from + tail)}`
  )
}

/**
 * The extracted text, bounded — see {@link MAX_EXTRACTED_TEXT_CHARS} for which
 * ceiling this is and which one actually does the work.
 */
function clipExtracted(text: string): string {
  if (text.length <= MAX_EXTRACTED_TEXT_CHARS) return text
  return `${text.slice(0, MAX_EXTRACTED_TEXT_CHARS)}\n\n[Text truncated at ${MAX_EXTRACTED_TEXT_CHARS} characters.]`
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
    // Already three sentences about what the face IS. This branch is one of the
    // two REQ-173 made the document branch resemble; it had nothing to change.
    fullText: null,
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

/**
 * The first substantial line, as a title — **past any front matter** (BUG-41).
 *
 * A markdown file that opens with a YAML block would otherwise be titled `---`:
 * the fence is three characters, which clears the "substantial" bar, and it is
 * the first line there is. So the block is skipped — and where it DECLARES a
 * title, that is taken, because a title the author wrote beats one inferred from
 * a heading, the same reason {@link describePdf} prefers the PDF's own metadata.
 *
 * ONLY A LEADING, CLOSED BLOCK COUNTS. A `---` that never closes is a horizontal
 * rule in a document that happens to start with one, not front matter, and
 * treating it as a block would swallow the whole file's title.
 */
function titleFromText(text: string, filename: string): string {
  const lines = text.split('\n')
  let start = 0
  if (lines[0]?.trim() === '---') {
    const close = lines.findIndex((line, i) => i > 0 && line.trim() === '---')
    if (close > 0) {
      const declared = frontMatterTitle(lines.slice(1, close))
      if (declared !== '') return clipTitle(declared)
      start = close + 1
    }
  }
  for (const line of lines.slice(start)) {
    const trimmed = line.replace(/^#+\s*/, '').trim()
    // A RULE IS NOT A TITLE. `---`, `***`, `===` clear the length bar and say
    // nothing; without this an unclosed opening rule is titled `---` for exactly
    // the reason the front-matter fence was.
    if (/^[-=*_]+$/.test(trimmed)) continue
    if (trimmed.length >= 3) return clipTitle(trimmed)
  }
  return filename || 'Untitled material'
}

/**
 * A `title:` from front-matter lines, unquoted, or `''`.
 *
 * READ AS LINES, NOT PARSED AS YAML. One field is wanted and a YAML dependency
 * to reach it would be a parser in the ingestion path — with its own failure
 * modes — for a string a regex finds. A title this misses simply falls through
 * to the first heading, which is where it came from before.
 */
function frontMatterTitle(lines: string[]): string {
  for (const line of lines) {
    const match = line.match(/^title\s*:\s*(.+)$/i)
    if (!match) continue
    return match[1].trim().replace(/^(['"])(.*)\1$/, '$2').trim()
  }
  return ''
}

function clipTitle(text: string): string {
  const flat = text.replace(/\s+/g, ' ').replace(/^#+\s*/, '').trim()
  return flat.length > 120 ? `${flat.slice(0, 119).trimEnd()}…` : flat
}

/**
 * The body, bounded — a BACKSTOP since REQ-173, no longer a working limit.
 *
 * A body is a D1 text column and the corpus reads bodies on every index pass, so
 * an unbounded one is paid for repeatedly. That was a live concern while the body
 * was a whole extracted document; it is now a digest, and this bites only if a
 * model answers a request for three sentences with two hundred thousand
 * characters. The clip is STATED IN THE TEXT rather than silent — a description
 * that stops mid-sentence with no explanation reads as corruption.
 */
function clipBody(text: string): string {
  if (text.length <= MAX_BODY_CHARS) return text
  return `${text.slice(0, MAX_BODY_CHARS)}\n\n[Text truncated at ${MAX_BODY_CHARS} characters.]`
}
