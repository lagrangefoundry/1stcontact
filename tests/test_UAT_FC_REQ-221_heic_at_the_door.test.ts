import { describe as suite, expect, it } from 'vitest'
import {
  CONVERTED_CONTENT_TYPE,
  isHeic,
  isoBrand,
  MAX_CONVERTIBLE_BYTES,
  renameConverted,
  imagesHeicConverter,
} from '../apps/control-app/src/heic'
import {
  ingestFetch,
  ingestUpload,
  MAX_MATERIAL_BYTES,
  MaterialRejectedError,
} from '../apps/control-app/src/material'
import type { Ticket, TicketStore } from '../apps/control-app/src/tickets'
import { heicBytes, isoMediaBytes, pngBytes } from './support/material-fixtures'

/**
 * REQ-221 — **a HEIC upload is converted at the door**.
 *
 * WHAT THE TICKET IS ABOUT. HEIC is what a modern iPhone produces by default and
 * Chrome decodes none of it, so a client photographing their own shopfront and
 * dropping it on the builder hands us bytes the Library cannot preview, the
 * describer cannot look at, the editor cannot open and the site cannot serve.
 * Converting on the upload path means what lands in the Library is an ordinary
 * image indistinguishable from any other.
 *
 * ONE DOUBLE, AND IT IS THE IMAGES BINDING — for a reason stronger than
 * convenience. The binding's local implementation supports a subset of
 * transforms and does not decode HEIC, so a suite reaching for the real one
 * could prove the happy path nowhere and the three refusals nowhere either. Every
 * claim below is about what the PIPELINE does with a conversion, with its
 * absence, and with its failure, and a double makes all three reachable. What
 * the real binding actually does with real HEIC bytes is provable only against
 * the live API and is deliberately not claimed here.
 *
 * THE STORE IS A RECORDER RATHER THAN A FAKE. The claims that matter most are
 * NEGATIVE — nothing is created when a conversion fails — and a negative claim
 * needs a store that remembers being called, not one that behaves correctly.
 */

/** A store that records what it was asked to do, and agrees to all of it. */
function recordingStore() {
  const created: Array<{ type: string; title: string; fields: Record<string, unknown> }> = []
  const attached: Array<{ bytes: Uint8Array; filename?: string; content_type?: string }> = []
  const ticket = (uid: string, fields: Record<string, unknown> = {}) =>
    ({ uid, id: uid, type: 'material', title: '', fields }) as unknown as Ticket
  const store = {
    async create(a: {
      type: string
      title: string
      fields?: Record<string, unknown>
      body?: string
    }) {
      created.push({ type: a.type, title: a.title, fields: a.fields ?? {} })
      return { ticket: ticket(`material-${created.length}`, a.fields ?? {}) }
    },
    async attach(a: { uid: string; bytes: Uint8Array; filename?: string; content_type?: string }) {
      attached.push({ bytes: a.bytes, filename: a.filename, content_type: a.content_type })
      return { attachment: ticket(`attachment-${attached.length}`) }
    },
    async comment(a: { uid: string; kind: string; body: string }) {
      void a
      return { comment: ticket('comment-1') }
    },
  } as unknown as TicketStore
  return { store, created, attached }
}

/**
 * The converter, doubled: it reports what it was handed and returns a JPEG.
 *
 * IT RETURNS BYTES UNLIKE ITS INPUT, on purpose. "The HEIC bytes are discarded"
 * is only assertable if what came out is distinguishable from what went in.
 */
function stubConverter(jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0x01, 0x02, 0x03])) {
  const seen: Array<{ bytes: Uint8Array; filename: string }> = []
  return {
    seen,
    convertHeic: async (input: { bytes: Uint8Array; filename: string }) => {
      seen.push(input)
      return {
        bytes: jpeg,
        filename: renameConverted(input.filename),
        contentType: CONVERTED_CONTENT_TYPE,
      }
    },
  }
}

/** A describer that answers for anything, and records the type it was shown. */
function stubVision() {
  const seen: string[] = []
  return {
    seen,
    describeImage: async (bytes: Uint8Array, contentType: string) => {
      void bytes
      seen.push(contentType)
      return { text: 'A shopfront, painted green, with a bicycle outside.', model: 'stub/vision-1' }
    },
    describeText: async () => ({ text: 'unused', model: 'stub/digest-1' }),
  }
}

suite('REQ-221 — it recognises one by the bytes, not by what the browser said', () => {
  it('UAT_FC_REQ-221 a HEIC whose browser said nothing is still recognised', () => {
    // THE TICKET'S OWN CLAIM: the upload route falls back to
    // `application/octet-stream`, and for HEIC that fallback is the ORDINARY case
    // rather than the exception — a file dragged in from Finder arrives with no
    // type at all. Detection reads the container, so the declared type never
    // enters into it and this holds whatever the browser said.
    expect(isHeic(heicBytes())).toBe(true)
  })

  it('UAT_FC_REQ-221 every HEIF brand an iPhone photograph carries is recognised', () => {
    // Including the GENERIC brands. `mif1`/`msf1` are the HEIF image and
    // image-sequence brands rather than HEIC-specific ones, and a real iPhone
    // photograph carries one of them often enough that omitting them would leave
    // the bug in place for a share of exactly the files this ticket is about.
    for (const brand of ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1']) {
      expect(isHeic(isoMediaBytes(brand)), `brand ${brand}`).toBe(true)
    }
  })

  it('UAT_FC_REQ-221 AVIF shares the container and is deliberately left alone', () => {
    // AVIF is an ISO base-media file too, so a detector that stopped at `ftyp`
    // would convert a format this pipeline already stores, previews and serves —
    // re-encoding a perfectly good image and losing quality doing it.
    expect(isoBrand(isoMediaBytes('avif'))).toBe('avif')
    expect(isHeic(isoMediaBytes('avif'))).toBe(false)
    expect(isHeic(isoMediaBytes('avis'))).toBe(false)
  })

  it('UAT_FC_REQ-221 bytes that are not an ISO file at all are not one', () => {
    expect(isoBrand(pngBytes())).toBeNull()
    expect(isHeic(pngBytes())).toBe(false)
    // Too short to carry an `ftyp` box. Reading past the end would be the one
    // way this could throw on a file a client legitimately uploaded.
    expect(isHeic(new Uint8Array([0, 0, 0]))).toBe(false)
    expect(isHeic(new Uint8Array(0))).toBe(false)
  })
})

suite('REQ-221 — what lands in the Library is an ordinary image', () => {
  it('UAT_FC_REQ-221 a HEIC upload is stored as a JPEG, and is classified as an image', async () => {
    const { store, created, attached } = recordingStore()
    const converter = stubConverter()
    const vision = stubVision()

    await ingestUpload(
      store,
      {
        // THE OCTET-STREAM CASE, which is the commonest one and the one that
        // today lands in the Library as a `document` — a photograph with no
        // picture in it.
        bytes: heicBytes(),
        filename: 'shopfront.HEIC',
        contentType: 'application/octet-stream',
        role: 'site',
      },
      { convertHeic: converter.convertHeic, ...vision },
    )

    expect(created).toHaveLength(1)
    // INDISTINGUISHABLE FROM ANY OTHER IMAGE. `kind` is what the Library filters
    // and badges on, and `content_type` is what its detail pane renders from.
    expect(created[0].fields.kind).toBe('image')
    expect(created[0].fields.content_type).toBe('image/jpeg')
    // AND THE ATTACHMENT RECORD AGREES, because it is what a later re-describe
    // pass reads. A record still saying HEIC would make the same wrong decision
    // again months later.
    expect(attached[0].content_type).toBe('image/jpeg')
  })

  it('UAT_FC_REQ-221 the name changes with the bytes', async () => {
    const { store, created, attached } = recordingStore()
    await ingestUpload(
      store,
      { bytes: heicBytes(), filename: 'shopfront.HEIC', contentType: 'image/heic' },
      { convertHeic: stubConverter().convertHeic, ...stubVision() },
    )
    // THE FILENAME IS SHOWN IN THE LIBRARY and is what `resolveContentType`
    // reads when a later pass re-derives the type, so a `.HEIC` on a file that is
    // now JPEG would make the record disagree with itself and would put a lie in
    // front of the client in the one place they look.
    expect(created[0].fields.filename).toBe('shopfront.jpg')
    expect(attached[0].filename).toBe('shopfront.jpg')
  })

  it('UAT_FC_REQ-221 the HEIC bytes are discarded and nothing keeps a copy', async () => {
    const { store, attached } = recordingStore()
    const original = heicBytes()
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0x42])
    await ingestUpload(
      store,
      { bytes: original, filename: 'shopfront.heic', contentType: 'image/heic' },
      { convertHeic: stubConverter(jpeg).convertHeic, ...stubVision() },
    )
    // A DELIBERATE EXCEPTION TO "AN ORIGINAL IS NEVER LOST": we can do nothing
    // with those bytes and the client has the file on their phone by definition,
    // so keeping an unreadable archival copy would cost storage on every iPhone
    // upload to buy a copy of a file its owner already has. Exactly one blob is
    // attached, and it is the JPEG.
    expect(attached).toHaveLength(1)
    expect(Array.from(attached[0].bytes)).toEqual(Array.from(jpeg))
    expect(Array.from(attached[0].bytes)).not.toEqual(Array.from(original))
  })

  it('UAT_FC_REQ-221 the describer is shown the converted image, so the photograph is described', async () => {
    const { store, created } = recordingStore()
    const vision = stubVision()
    await ingestUpload(
      store,
      { bytes: heicBytes(), filename: 'shopfront.heic', contentType: 'image/heic' },
      { convertHeic: stubConverter().convertHeic, ...vision },
    )
    // THE CONSTRAINT THAT PICKS JPEG OVER AVIF. The vision describer reads JPEG,
    // PNG, GIF and WebP and NOT AVIF, so an AVIF conversion would land a
    // photograph in the Library undescribed and unsearchable — the failure this
    // ticket exists to remove, arrived at from the other side. The proof is that
    // the describer was reached at all, with the converted type.
    expect(vision.seen).toEqual(['image/jpeg'])
    expect(created[0].fields.description_status).not.toBe('unsupported')
    expect(created[0].title).not.toBe('')
  })

  it('UAT_FC_REQ-221 anything that is not HEIC passes through untouched', async () => {
    const { store, created, attached } = recordingStore()
    const converter = stubConverter()
    const png = pngBytes()
    await ingestUpload(
      store,
      // DECLARING `image/heic` AND NOT BEING ONE. The declared type is not
      // consulted in EITHER direction: these bytes are a PNG, so they are stored
      // as they arrived rather than handed to a converter on the strength of a
      // header nothing verified.
      { bytes: png, filename: 'logo.png', contentType: 'image/heic' },
      { convertHeic: converter.convertHeic, ...stubVision() },
    )
    expect(converter.seen).toHaveLength(0)
    expect(Array.from(attached[0].bytes)).toEqual(Array.from(png))
    expect(created[0].fields.filename).toBe('logo.png')
  })

  it('UAT_FC_REQ-221 only the upload path converts', async () => {
    const { store, attached } = recordingStore()
    const converter = stubConverter()
    const heic = heicBytes()
    await ingestFetch(store, 'https://example.com/photo.heic', {
      convertHeic: converter.convertHeic,
      ...stubVision(),
      fetch: (async () =>
        new Response(heic, { headers: { 'content-type': 'image/heic' } })) as typeof fetch,
    })
    // THE TICKET SCOPES THIS TO THE UPLOAD PATH — a client's own photograph
    // arriving at the door. What we pull on their behalf is `reference` material
    // that is never promoted onto a site, and converting it would be a different
    // change with a different justification.
    expect(converter.seen).toHaveLength(0)
    expect(Array.from(attached[0].bytes)).toEqual(Array.from(heic))
  })
})

suite('REQ-221 — a conversion that fails is a refusal, not a broken row', () => {
  it('UAT_FC_REQ-221 a deployment with no Images binding refuses, and names the format', async () => {
    const { store, created, attached } = recordingStore()
    const failure = await ingestUpload(
      store,
      { bytes: heicBytes(), filename: 'shopfront.heic', contentType: 'image/heic' },
      // `null` IS THE UNCONFIGURED DEPLOYMENT, which is a different fact from
      // "this caller did not supply one" and gets a different sentence.
      { convertHeic: null, ...stubVision() },
    ).catch((err) => err)

    expect(failure).toBeInstanceOf(MaterialRejectedError)
    // IT NAMES THE FORMAT AND THE REMEDY. "That file could not be read" sends a
    // client looking at their photograph; naming HEIC tells them the one true
    // thing, and their phone will take JPEGs directly if they ask it to.
    expect(failure.message).toContain('HEIC')
    expect(failure.message).toContain('Most Compatible')
    // THE MATERIAL IS NOT CREATED. Storing the HEIC and getting on with it is
    // precisely the broken row — a Library row whose preview cannot render and
    // which will be exactly as unreadable in six months.
    expect(created).toHaveLength(0)
    expect(attached).toHaveLength(0)
  })

  it('UAT_FC_REQ-221 a conversion that throws refuses, and creates nothing', async () => {
    const { store, created, attached } = recordingStore()
    const failure = await ingestUpload(
      store,
      { bytes: heicBytes(), filename: 'shopfront.heic', contentType: 'image/heic' },
      {
        convertHeic: async () => {
          throw new Error('IMAGES_DECODE_FAILED: unsupported input (9412)')
        },
        ...stubVision(),
      },
    ).catch((err) => err)

    expect(failure).toBeInstanceOf(MaterialRejectedError)
    expect(failure.message).toContain('HEIC')
    // THE FAILURE DOC-38 §7.3'S ORDERING EXISTS TO PREVENT IS A RECORD NAMING
    // BYTES THAT ARE NOT THERE. Converting in front of `ingest` makes that state
    // unreachable rather than merely unlikely: nothing was created.
    expect(created).toHaveLength(0)
    expect(attached).toHaveLength(0)
    // AND THE CODEC'S OWN WORDS SURVIVE FOR AN OPERATOR, without reaching the
    // client — the message they read says nothing about decoders.
    expect(String((failure as Error).cause)).toContain('9412')
    expect(failure.message).not.toContain('9412')
  })

  it('UAT_FC_REQ-221 a photograph too large for the converter is refused for being too large', async () => {
    const { store, created } = recordingStore()
    const converter = stubConverter()
    // THE BAND THIS CONSTANT EXISTS FOR. The converter's own input ceiling is
    // below this repository's material ceiling, so there are file sizes
    // `ingestUpload` accepts and the converter will not take — and a client in
    // that band is owed the reason they are actually in.
    expect(MAX_CONVERTIBLE_BYTES).toBeLessThan(MAX_MATERIAL_BYTES)
    const oversize = heicBytes(MAX_CONVERTIBLE_BYTES)
    expect(oversize.length).toBeGreaterThan(MAX_CONVERTIBLE_BYTES)
    expect(oversize.length).toBeLessThan(MAX_MATERIAL_BYTES)

    const failure = await ingestUpload(
      store,
      { bytes: oversize, filename: 'shopfront.heic', contentType: 'image/heic' },
      { convertHeic: converter.convertHeic, ...stubVision() },
    ).catch((err) => err)

    expect(failure).toBeInstanceOf(MaterialRejectedError)
    // IN THOSE WORDS: a size, not a generic failure to read the file.
    expect(failure.message).toContain('the limit is')
    expect(failure.message).toContain('20MB')
    // AND BEFORE THE CALL, so the size is the reason given rather than whatever
    // the converter would have said about bytes it never finished reading.
    expect(converter.seen).toHaveLength(0)
    expect(created).toHaveLength(0)
  })
})

suite('REQ-221 — the binding, and the name it gives back', () => {
  it('UAT_FC_REQ-221 an unconfigured deployment produces no converter at all', () => {
    // `null` RATHER THAN A CONVERTER THAT THROWS, because the two states are
    // answered with different sentences and a caller that could not tell them
    // apart would give the client the wrong one.
    expect(imagesHeicConverter({})).toBeNull()
    expect(imagesHeicConverter({ IMAGES: undefined })).toBeNull()
  })

  it('UAT_FC_REQ-221 the binding is asked for a JPEG, and its answer is what is stored', async () => {
    const asked: Array<{ format: string; quality?: number }> = []
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0x77])
    const convert = imagesHeicConverter({
      IMAGES: {
        input: () => ({
          output: async (options: { format: string; quality?: number }) => {
            asked.push(options)
            return {
              image: () =>
                new ReadableStream<Uint8Array>({
                  start(controller) {
                    // TWO CHUNKS, because the binding returns a stream and a
                    // reassembly that only ever saw one would be untested.
                    controller.enqueue(jpeg.slice(0, 2))
                    controller.enqueue(jpeg.slice(2))
                    controller.close()
                  },
                }),
              contentType: () => 'image/jpeg',
            }
          },
        }),
      },
    })
    expect(convert).not.toBeNull()

    const converted = await convert!({ bytes: heicBytes(), filename: 'shopfront.HEIC' })
    expect(asked[0].format).toBe('image/jpeg')
    expect(Array.from(converted.bytes)).toEqual(Array.from(jpeg))
    expect(converted.contentType).toBe('image/jpeg')
    expect(converted.filename).toBe('shopfront.jpg')
  })

  it('UAT_FC_REQ-221 the converted name keeps the stem and never the old extension', () => {
    expect(renameConverted('shopfront.HEIC')).toBe('shopfront.jpg')
    expect(renameConverted('IMG_4021.heif')).toBe('IMG_4021.jpg')
    // Dots inside the name are part of it — only the LAST segment is the
    // extension, so a stem is not truncated at the first dot.
    expect(renameConverted('front.of.shop.heic')).toBe('front.of.shop.jpg')
    // A name with no extension GAINS one, because the extension is the only
    // thing the silent-type path has to read.
    expect(renameConverted('shopfront')).toBe('shopfront.jpg')
    // A name that is ONLY an extension has nothing in front of the dot to keep.
    expect(renameConverted('.heic')).toBe('photograph.jpg')
    expect(renameConverted('')).toBe('photograph.jpg')
  })
})
