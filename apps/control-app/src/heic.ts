/**
 * HEIC at the door (REQ-221).
 *
 * WHY THIS EXISTS. HEIC is what a modern iPhone produces by default and Chrome
 * decodes none of it, so a client photographing their own shopfront and dropping
 * it on the builder hands us bytes the Library cannot preview, the describer
 * cannot look at, the editor cannot open and the site cannot serve. Every part of
 * the image experience is unavailable for the single commonest way a small
 * business takes a photograph.
 *
 * THE WHOLE MODULE IS TWO FUNCTIONS: recognise one, and turn it into a JPEG.
 * `material.ts` owns what happens next, because what happens next is a REFUSAL
 * or an ingest, and neither is this module's business.
 */

/**
 * Whether these bytes are HEIC — **read off the bytes, never off the type**.
 *
 * THE DECLARED TYPE IS NOT CONSULTED, and that is the point rather than an
 * oversight. The upload route takes the browser's `File.type` and falls back to
 * `application/octet-stream`, and for HEIC that fallback is the ORDINARY case
 * rather than the exception: a file dragged in from Finder arrives with no type
 * at all, because the browser has no registered type to give. A converter that
 * waited to be told `image/heic` would miss the commonest form of exactly the
 * file it exists for — and it is that form which today lands in the Library as a
 * `document`, a photograph with no picture in it.
 *
 * It is the same principle `resolveContentType` follows from the other end.
 * There, a type the sender STATED is honoured and only silence consults the
 * name. Here there is no second opinion to weigh: the container either is an
 * ISO base-media file with a HEIF brand or it is not, and that is a fact about
 * the bytes that no header can be more authoritative about.
 *
 * THE SHAPE. An ISO base-media file opens with a box: four bytes of length, then
 * the four-character type. `ftyp` must be first, and the four bytes after it are
 * the MAJOR BRAND — which is what actually distinguishes a HEIC photograph from
 * the AVIF, MP4 and MOV files that share the container.
 */
export function isHeic(bytes: Uint8Array): boolean {
  return HEIF_BRANDS.has(isoBrand(bytes) ?? '')
}

/**
 * The `ftyp` major brand, or `null` for bytes that are not an ISO base-media
 * file at all.
 *
 * SEPARATE FROM {@link isHeic} so a refusal can say what it was handed. AVIF
 * lives in this container too and is a format the pipeline already reads, so
 * "not HEIC" and "not an ISO file" are different answers and only one of them
 * is interesting to a caller.
 */
export function isoBrand(bytes: Uint8Array): string | null {
  // 4 length + `ftyp` + 4 brand. Shorter than twelve bytes cannot carry one.
  if (bytes.length < 12) return null
  const ascii = (offset: number) =>
    String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3])
  if (ascii(4) !== 'ftyp') return null
  return ascii(8)
}

/**
 * The brands that mean "an iPhone photograph".
 *
 * `mif1`/`msf1` ARE IN THE LIST AND ARE NOT HEIC-SPECIFIC. They are the generic
 * HEIF image and image-sequence brands, and a real iPhone photograph carries one
 * of them as its major brand often enough that omitting them would leave the
 * bug in place for a share of the files this ticket is about. They are also
 * carried by HEIF files that are not photographs — which costs nothing here,
 * because the answer for those is the same conversion.
 *
 * `avif`/`avis` ARE DELIBERATELY ABSENT. AVIF shares the container and is a
 * format this pipeline already stores, previews and serves; converting it would
 * be re-encoding a perfectly good image for no reason and would lose quality
 * doing it.
 *
 * The same list is spelled in `tools/generate/src/cli/png.ts` for the CLI's
 * refusal message. Two copies of eight four-character codes is the cheaper side
 * of the trade against a shared module between a Worker and a Node CLI, and
 * neither copy can go wrong quietly: the codes are fixed by ISO/IEC 23008-12 and
 * do not change.
 */
const HEIF_BRANDS: ReadonlySet<string> = new Set([
  'heic',
  'heix',
  'hevc',
  'hevx',
  'heim',
  'heis',
  'mif1',
  'msf1',
])

/**
 * What a converted photograph is — **JPEG**, and three constraints pick it.
 *
 * NOT AVIF, and this one is not a preference. `describe.ts`'s vision describer
 * reads `image/jpeg`, `image/png`, `image/gif` and `image/webp` and nothing
 * else, so an AVIF conversion would land a photograph in the Library
 * UNDESCRIBED and therefore unsearchable — which is the failure this ticket
 * exists to remove, arrived at from the other side. The Images binding offers
 * AVIF and it is the wrong answer here.
 *
 * NOT WEBP, and this one is a judgement with a reason. What is being stored is
 * the MASTER rather than the delivery copy: the width ladder at publish
 * ([[REQ-222]]) chooses delivery formats, and the recipe renderer ([[REQ-219]])
 * re-derives every rendition from this file, so the stored format wants to be
 * the one every future consumer can open rather than the one that is smallest
 * today. WebP would save bytes in the one place saving them buys nothing.
 *
 * AND JPEG IS WHAT THE PHONE WOULD HAVE PRODUCED had its owner set *Most
 * Compatible*. That is the sense in which what lands in the Library is the
 * photograph they took rather than a derivative of it.
 */
export const CONVERTED_CONTENT_TYPE = 'image/jpeg'

/** The extension that goes with it — `shopfront.HEIC` becomes `shopfront.jpg`. */
export const CONVERTED_EXTENSION = 'jpg'

/**
 * The largest photograph the converter will take — the Images binding's own
 * `input()` ceiling, which is **not** this repository's material ceiling.
 *
 * THE TWO NUMBERS ARE DIFFERENT AND THAT IS THE WHOLE POINT OF THE CONSTANT.
 * `MAX_MATERIAL_BYTES` is 25 MiB, so there is a band of file sizes this
 * repository accepts and the converter will not take. A client in that band is
 * owed the reason they are actually in — a size — rather than a generic failure
 * to read their photograph, and without this number the only way to find out is
 * to hand the bytes over and read the error.
 *
 * THE BINARY READING OF "20 MB", DELIBERATELY. Cloudflare documents the limit in
 * decimal-looking prose and the two readings differ by about a megabyte. Taking
 * the LARGER one means this check can never refuse a photograph the binding
 * would have accepted; the cost is the sliver in between, where the binding
 * refuses and the client gets the "could not be read" sentence rather than the
 * size one. A message that is imprecise for a megabyte-wide band is the better
 * side of that trade against refusing files that work.
 */
export const MAX_CONVERTIBLE_BYTES = 20 * 1024 * 1024

/**
 * The quality the conversion asks for.
 *
 * 90 rather than the default, because this is the MASTER and not the delivery
 * copy: the width ladder at publish ([[REQ-222]]) re-encodes for delivery and the
 * recipe renderer ([[REQ-219]]) re-derives every rendition from this file, so
 * every later step inherits whatever is thrown away here. Saving bytes at this
 * end is saving them in the one place they cannot be recovered.
 */
const CONVERTED_QUALITY = 90

/**
 * The converted photograph, with the name it should now carry.
 *
 * `contentType` travels with the bytes because `ingest` resolves the type ONCE
 * at its head and hands the same value to `classify`, `describe` and `attach`
 * (BUG-41) — so a conversion that returned bytes alone would leave three
 * consumers agreeing with each other about a format none of them received.
 */
export interface ConvertedImage {
  bytes: Uint8Array
  filename: string
  contentType: string
}

/**
 * Turn HEIC bytes into something everything downstream can read.
 *
 * A SEAM RATHER THAN A DIRECT CALL ON `env.IMAGES`, for the reason every other
 * seam in `material.ts` is one: the pipeline's claims are about what it does
 * with a conversion and with its absence, and a suite proving those should not
 * have to stand up an image codec to make them. {@link imagesHeicConverter} is
 * the real one.
 *
 * IT THROWS RATHER THAN RETURNING A FAILURE. The caller's answer to a failure is
 * a `MaterialRejectedError` carrying a sentence for the client, and building
 * that sentence is `material.ts`'s job — it knows the ceiling, the filename and
 * the client. A result type here would only be unwrapped into the same throw one
 * line later.
 */
export type ConvertHeic = (input: { bytes: Uint8Array; filename: string }) => Promise<ConvertedImage>

/**
 * What the deployed Worker uses — the Cloudflare Images binding ([[REQ-219]]).
 *
 * THIS IS THE STRONGEST SINGLE REASON THAT DEPENDENCY IS WORTH TAKING. Neither
 * the client's canvas nor Browser Rendering can decode HEIC: Chrome has no
 * decoder, so a headless Chrome does not either. Without the binding this needs
 * a wasm decoder shipped inside the Worker bundle.
 *
 * `null` FOR AN UNCONFIGURED DEPLOYMENT, rather than a converter that throws.
 * The two states are answered differently — "this deployment cannot convert" is
 * a sentence about configuration and "this photograph could not be read" is a
 * sentence about the file — and a caller that cannot tell them apart would give
 * the client the wrong one. See `heicUnsupported` and `heicUnreadable`.
 */
export function imagesHeicConverter(env: { IMAGES?: ImagesLike }): ConvertHeic | null {
  const images = env.IMAGES
  if (!images) return null
  return async ({ bytes, filename }) => {
    // A FRESH STREAM PER CALL. `input` consumes it, so a stream held anywhere
    // outside this closure could only ever be converted once.
    const result = await images
      .input(streamOf(bytes))
      .output({ format: CONVERTED_CONTENT_TYPE, quality: CONVERTED_QUALITY })
    return {
      bytes: await drain(result.image()),
      filename: renameConverted(filename),
      // THE BINDING'S OWN ANSWER, not the constant we asked for. They agree
      // today; if a future output option ever made them disagree, the record
      // that says what the attachment is should say what it actually is.
      contentType: result.contentType() || CONVERTED_CONTENT_TYPE,
    }
  }
}

/**
 * The binding, as narrowly as this module needs it.
 *
 * `@cloudflare/workers-types` declares `ImagesBinding` with `hosted` CRUD and a
 * transform vocabulary this module touches none of. Naming the two calls it does
 * make is what lets a UAT hand it a double without implementing an image
 * service, and what keeps `env.IMAGES` from being an `any` on the router's env.
 */
export interface ImagesLike {
  input(stream: ReadableStream<Uint8Array>): {
    output(options: { format: string; quality?: number }): Promise<{
      image(): ReadableStream<Uint8Array>
      contentType(): string
    }>
  }
}

/**
 * `shopfront.HEIC` → `shopfront.jpg`.
 *
 * THE NAME HAS TO CHANGE WITH THE BYTES. It is what the Library shows, what the
 * attachment record freezes, and what `resolveContentType` reads when a later
 * re-describe pass asks what the file is — so a `.HEIC` on a file that is now
 * JPEG would make the record disagree with itself and would put a lie in front
 * of the client in the one place they look at it.
 *
 * A NAME WITH NO EXTENSION GAINS ONE rather than being left bare, because the
 * extension is the only thing the silent-type path has to read. A name that is
 * ONLY an extension — `.HEIC` — is treated as a bare name for the same reason
 * the regex `material.ts` uses does: there is nothing in front of the dot to
 * keep.
 */
export function renameConverted(filename: string): string {
  // `.*` AND NOT `.+`, which is the whole of the `.HEIC` case: with `.+` there
  // is no match at all, the name is left alone, and the file is stored as
  // `.HEIC.jpg` — carrying the extension this function exists to remove.
  const stem = /^(.*)\.[A-Za-z0-9]+$/.exec(filename)?.[1]
  const base = stem ?? filename
  if (base === '') return `photograph.${CONVERTED_EXTENSION}`
  return `${base}.${CONVERTED_EXTENSION}`
}

/** The bytes as a stream, for a binding whose input is one. */
function streamOf(bytes: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes)
      controller.close()
    },
  })
}

/** A stream back into bytes, because that is what the store attaches. */
async function drain(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    total += value.length
  }
  const out = new Uint8Array(total)
  let at = 0
  for (const chunk of chunks) {
    out.set(chunk, at)
    at += chunk.length
  }
  return out
}
