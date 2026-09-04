import { beforeAll, describe as suite, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { MAX_MATERIAL_BYTES } from '../apps/control-app/src/material'
import { MAX_BODY_CHARS, VISION_MAX_BYTES } from '../apps/control-app/src/describe'
import { applySchema } from './support/d1-site-factory'
import { bytesOf, minimalPdf, scannedPdf } from './support/material-fixtures'

/**
 * STORY-724e4e8c — **material is found by what it says or shows, and says
 * honestly when it cannot be read**.
 *
 * WHAT MAKES THIS EVIDENCE. Every claim below is made through `route()` — the
 * Worker's own route table — against the real D1 database and the real R2
 * buckets `@cloudflare/vitest-pool-workers` supplies. The description is written
 * by the real `describe.ts`, the PDF is parsed by the real `unpdf`, the material
 * record is written and validated by the ticketing component's own store, and
 * the bytes are read back through `/api/material/file` rather than from the
 * variable they were uploaded from. Nothing here reimplements a step in order to
 * assert it, and `MAX_BODY_CHARS` / `VISION_MAX_BYTES` / `MAX_MATERIAL_BYTES`
 * are the implementation's own constants rather than second opinions about them.
 *
 * ONE DOUBLE, AND IT IS THE VISION MODEL. `DescribeImage` is a supplied
 * capability precisely so the story's claims are provable without reaching a
 * model — none of them is about the QUALITY of a description, they are about
 * what the pipeline does with one and with its absence.
 *
 * A TENANT PER TEST. Several criteria are "exactly these records and no others",
 * and the ticket store is tenant-scoped on every read, so a distinct `TENANT_ID`
 * is what makes an exactness claim mean something in a shared database.
 *
 * AC-1553 (a typeface is read from its own name table) lives in the sibling node
 * suite instead: it needs the checked-in `.ttf` off a real filesystem, which
 * workerd does not have.
 */

const APPLIED = applySchema()

function routerEnv(tenantId: string, over: Partial<RouterEnv> = {}): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: tenantId,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    ...over,
  }
}

/**
 * A describer that says what it is told to, and records every call.
 *
 * The count is the assertion in two criteria — "one look per image, never a
 * second call to title it", and "no model is consulted for a typeface" — so it
 * is recorded rather than assumed.
 */
function vision(text: string, model = 'stub/vision-1') {
  const seen: string[] = []
  return {
    seen,
    describeImage: async (bytes: Uint8Array, contentType: string) => {
      void bytes
      seen.push(contentType)
      return { text, model }
    },
  }
}

/**
 * Deps with a no-op indexer.
 *
 * WIRED RATHER THAN OMITTED even where nothing below asserts on indexing: an
 * absent indexer is a loud `console.warn` per upload by design, and a suite that
 * left it absent would be reading its own noise.
 */
function deps(over: Partial<RouterDeps> = {}): RouterDeps {
  return { index: async () => async () => {}, ...over }
}

async function upload(
  tenant: string,
  bytes: Uint8Array,
  filename: string,
  contentType: string,
  d: RouterDeps = deps(),
): Promise<Response> {
  const form = new FormData()
  form.append('file', new File([bytes as unknown as BlobPart], filename, { type: contentType }))
  return route(
    new Request('https://app.test/api/material', { method: 'POST', body: form }),
    routerEnv(tenant),
    d,
  )
}

/** Upload, assert the request SUCCEEDED, and hand back the envelope. */
async function ingest(
  tenant: string,
  bytes: Uint8Array,
  filename: string,
  contentType: string,
  d: RouterDeps = deps(),
): Promise<Record<string, unknown>> {
  const response = await upload(tenant, bytes, filename, contentType, d)
  expect(response.status, `${filename} was not accepted`).toBe(200)
  return (await response.json()) as Record<string, unknown>
}

/** One material in full, read back through the surface that serves it. */
async function readItem(tenant: string, uid: string): Promise<Record<string, unknown>> {
  const response = await route(
    new Request(`https://app.test/api/material/item?uid=${encodeURIComponent(uid)}`),
    routerEnv(tenant),
    deps(),
  )
  expect(response.status).toBe(200)
  return (await response.json()) as Record<string, unknown>
}

/** The stored bytes, read back out of R2 through the Worker's own file route. */
async function readFile(tenant: string, uid: string): Promise<Uint8Array> {
  const response = await route(
    new Request(`https://app.test/api/material/file?uid=${encodeURIComponent(uid)}`),
    routerEnv(tenant),
    deps(),
  )
  expect(response.status).toBe(200)
  return new Uint8Array(await response.arrayBuffer())
}

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

beforeAll(async () => {
  await APPLIED
})

suite('a document is read for what it says', () => {
  it('test_UAT_AC1548_document_text_becomes_its_description', async () => {
    // THE CLAIM IN ITS SHARPEST FORM: the material is retrievable by words that
    // appear INSIDE the file. The knowledge base indexes bodies and nothing
    // else, so a body that carried only the filename would make [[DOC-38]] §6's
    // one-retrieval-path simplification false.
    const tenant = 'recdesc-1548'
    const declared = await ingest(
      tenant,
      minimalPdf('The kitchen opens at six and the bread is baked overnight.'),
      'guidelines.pdf',
      'application/pdf',
    )
    const item = await readItem(tenant, String(declared.uid))

    expect(item.body).toContain('kitchen')
    expect(item.body).toContain('bread')
    expect(item.description_status).toBe('ok')
    // A producer, named. Not merely truthy in the envelope — read off the stored
    // record, because it is what makes a later re-describe pass a query.
    expect(item.description_model).toBe('unpdf')
    expect(String(item.description_model ?? '')).not.toBe('')

    // THE DOCUMENT'S OWN DECLARED TITLE WINS. `minimalPdf` writes
    // `/Title (Brand guidelines)` into the info dictionary, and the first line
    // of its text is the kitchen sentence — so this is only satisfiable by
    // actually reading the metadata, not by either fallback.
    expect(item.title).toBe('Brand guidelines')
    expect(item.title).not.toBe('guidelines.pdf')
    expect(item.title).not.toContain('kitchen')

    // A plain-text file declares no title, so the FIRST SUBSTANTIAL LINE is the
    // title — and still never the filename.
    const undeclared = await ingest(
      tenant,
      bytesOf('Oxblood and bone\n\nare the palette for the bakery frontage.'),
      'palette-notes.txt',
      'text/plain',
    )
    const plain = await readItem(tenant, String(undeclared.uid))
    expect(plain.title).toBe('Oxblood and bone')
    expect(plain.title).not.toBe('palette-notes.txt')
    expect(plain.body).toContain('palette for the bakery')
    expect(plain.description_status).toBe('ok')
    expect(String(plain.description_model ?? '')).not.toBe('')
  })
})

suite('a document that yields no text is kept and honestly described', () => {
  it('test_UAT_AC1549_no_extractable_text_is_kept_not_refused', async () => {
    const tenant = 'recdesc-1549'

    // THE SCANNED CASE. Extraction RAN and SUCCEEDED; the document simply has no
    // text in it. Refusing the one copy a client has of their brand book is the
    // worse failure by a wide margin, so it is stored with an honest sentence.
    const scan = scannedPdf()
    const scanned = await ingest(tenant, scan, 'brandbook-scan.pdf', 'application/pdf')
    const scannedItem = await readItem(tenant, String(scanned.uid))
    expect(scannedItem.description_status).toBe('no_text')
    expect(String(scannedItem.body)).toMatch(/scanned document/i)
    expect(scannedItem.body).toContain('no extractable text')
    // THE DOCUMENT'S OWN EXTENT, where it reports one — a page count is the
    // difference between "we could not read it" and "we could not read its 14
    // pages", which is what tells a client whether to go looking for the source.
    expect(scannedItem.body).toContain('1 page')
    // Identifiable in a list rather than anonymous: the filename is in BOTH.
    expect(scannedItem.title).toBe('brandbook-scan.pdf')
    expect(scannedItem.body).toContain('brandbook-scan.pdf')
    // Nothing wrote a real description, so nothing is named as having done so.
    expect(scannedItem.description_model).toBeNull()
    expect(sameBytes(await readFile(tenant, String(scanned.uid)), scan)).toBe(true)

    // A TEXT FILE WITH NO TEXT IN IT — the other way the same branch is reached.
    // (Bytes that are only whitespace, rather than a zero-length upload: a file
    // with no bytes at all is refused one step earlier by the ingestion guard,
    // which is [[STORY-132]]'s and explicitly out of this story's scope. What
    // this story owns is what happens when reading SUCCEEDS and yields nothing.)
    const blank = bytesOf('   \n\t  \n ')
    const empty = await ingest(tenant, blank, 'blank.txt', 'text/plain')
    const emptyItem = await readItem(tenant, String(empty.uid))
    expect(emptyItem.description_status).toBe('no_text')
    expect(String(emptyItem.body)).toMatch(/empty/i)
    expect(emptyItem.title).toBe('blank.txt')
    expect(emptyItem.body).toContain('blank.txt')
    expect(emptyItem.description_model).toBeNull()
    expect(sameBytes(await readFile(tenant, String(empty.uid)), blank)).toBe(true)
  })
})

suite('an image is described by what it depicts', () => {
  it('test_UAT_AC1550_image_described_by_what_it_depicts', async () => {
    // `IMG_4821.jpg` retrieved by *"the kitchen at dusk"*. If the body carried
    // the filename instead, a photograph would be unfindable — and there is no
    // second retrieval path for images to fall back to.
    const tenant = 'recdesc-1550'
    const looker = vision(
      'Kitchen at dusk\n\nA restaurant kitchen photographed in the evening, ' +
        'stainless counters lit by low warm light, no people present.',
    )
    const envelope = await ingest(
      tenant,
      bytesOf('png-ish bytes, and the describer is supplied'),
      'IMG_4821.jpg',
      'image/png',
      deps({ describeImage: looker.describeImage }),
    )
    const item = await readItem(tenant, String(envelope.uid))

    expect(item.body).toContain('restaurant kitchen')
    expect(item.body).toContain('evening')
    expect(item.body).not.toBe('')
    expect(item.description_status).toBe('ok')
    expect(item.description_model).toBe('stub/vision-1')
    // THE TITLE CAME OUT OF THE SAME LOOK. One call, not two: the count is the
    // only way to state "never a second call to title it", and the content type
    // travelling intact is what selects the media type of the image block.
    expect(item.title).toBe('Kitchen at dusk')
    expect(looker.seen).toEqual(['image/png'])

    // A SINGLE PASSAGE IS THE DESCRIPTION, not a title with an empty body —
    // which would be the one outcome the whole step exists to avoid.
    const oneParagraph = vision('A close photograph of sourdough loaves cooling on a wire rack.')
    const single = await ingest(
      tenant,
      bytesOf('more png-ish bytes'),
      'IMG_4822.jpg',
      'image/png',
      deps({ describeImage: oneParagraph.describeImage }),
    )
    const singleItem = await readItem(tenant, String(single.uid))
    expect(singleItem.description_status).toBe('ok')
    expect(String(singleItem.body)).not.toBe('')
    expect(singleItem.body).toContain('sourdough loaves')
    expect(oneParagraph.seen).toEqual(['image/png'])
  })
})

suite('an image nothing is configured to look at', () => {
  it('test_UAT_AC1551_no_describer_configured_is_still_kept', async () => {
    // The deployment has no key, so `defaultDescriber` resolves to nothing —
    // resolved BY THE ROUTER off the real env rather than injected here, so this
    // is the genuine absence and not a stand-in for it.
    const tenant = 'recdesc-1551'
    const bytes = bytesOf('png-ish bytes on a deployment with no vision key')
    const envelope = await ingest(
      tenant,
      bytes,
      'logo.png',
      'image/png',
      deps({ describeImage: undefined }),
    )
    const item = await readItem(tenant, String(envelope.uid))

    // NOT the failure value: one of these waits for configuration and the other
    // for a retry, and a later pass has to be able to tell them apart.
    expect(item.description_status).toBe('no_describer')
    expect(item.description_status).not.toBe('failed')
    expect(item.description_model).toBeNull()
    // Said in words, not left as a status code the Library would render blank.
    expect(String(item.body)).toMatch(/stored but not described/i)
    expect(String(item.body)).toMatch(/looked at it yet/i)
    expect(String(item.body)).toMatch(/found by name/i)
    // And the file itself is intact — nothing was lost to the missing key.
    expect(sameBytes(await readFile(tenant, String(envelope.uid)), bytes)).toBe(true)
  })
})

suite('the looking ceiling is not the holding ceiling', () => {
  it(
    'test_UAT_AC1552_image_above_the_looking_ceiling_is_stored_whole',
    async () => {
      // THE TWO CEILINGS ARE DIFFERENT NUMBERS, and this is the gap between them:
      // a file the platform will happily hold, and will not look at. Losing the
      // client's photograph in order to describe it would be the wrong trade.
      expect(VISION_MAX_BYTES).toBeLessThan(MAX_MATERIAL_BYTES)

      const tenant = 'recdesc-1552'
      const looker = vision('Too big\n\nThis text must never be reached.')

      const big = new Uint8Array(VISION_MAX_BYTES + 1)
      for (let i = 0; i < big.length; i++) big[i] = i % 251
      expect(big.length).toBeGreaterThan(VISION_MAX_BYTES)
      expect(big.length).toBeLessThan(MAX_MATERIAL_BYTES)

      const envelope = await ingest(
        tenant,
        big,
        'panorama.png',
        'image/png',
        deps({ describeImage: looker.describeImage }),
      )
      const item = await readItem(tenant, String(envelope.uid))

      // Its own outcome, distinguishable from every other degraded one — a later
      // pass must be able to see that retrying this would be pointless.
      expect(item.description_status).toBe('too_large')
      expect(item.description_model).toBeNull()
      expect(String(item.body)).toMatch(/stored but not described/i)
      expect(String(item.body)).toMatch(/kept whole/i)
      // Never reached. The size decided it, not a failed look.
      expect(looker.seen).toEqual([])

      // THE COMPLETE ORIGINAL: not downscaled, not truncated, not discarded.
      const stored = await readFile(tenant, String(envelope.uid))
      expect(stored.length).toBe(big.length)
      expect(sameBytes(stored, big)).toBe(true)

      // AND THE SAME DEPLOYMENT DESCRIBES A SMALLER ONE NORMALLY, which is what
      // makes the two ceilings demonstrably distinct rather than one ceiling
      // that happens to reject everything.
      const small = await ingest(
        tenant,
        bytesOf('a small png'),
        'thumb.png',
        'image/png',
        deps({ describeImage: looker.describeImage }),
      )
      const smallItem = await readItem(tenant, String(small.uid))
      expect(smallItem.description_status).toBe('ok')
      expect(smallItem.description_model).toBe('stub/vision-1')
      expect(looker.seen).toEqual(['image/png'])
    },
    30_000,
  )
})

suite('material nothing here can read', () => {
  it('test_UAT_AC1554_unreadable_material_is_kept_and_marked_unreadable', async () => {
    const tenant = 'recdesc-1554'
    const looker = vision('Never asked\n\nNothing should reach this describer.')

    // A COMPRESSED TYPEFACE WRAPPER. WOFF2 brotli-compresses its tables and
    // workerd's `DecompressionStream` has no brotli, so the name table cannot be
    // reached — and a confident wrong family name would be worse than an honest
    // absence.
    const woff2 = new Uint8Array([0x77, 0x4f, 0x46, 0x32, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    const font = await ingest(tenant, woff2, 'satoshi.woff2', 'font/woff2')
    const fontItem = await readItem(tenant, String(font.uid))
    expect(fontItem.description_status).toBe('unsupported')
    expect(String(fontItem.body)).toMatch(/WOFF or WOFF2/)
    expect(fontItem.description_model).toBeNull()
    // NO FAMILY, RATHER THAN A GUESSED ONE. The title falls back to the file's
    // own name; nothing in the record claims to know what typeface this is.
    expect(fontItem.title).toBe('satoshi.woff2')
    expect(fontItem.body).toContain('satoshi.woff2')
    expect(sameBytes(await readFile(tenant, String(font.uid)), woff2)).toBe(true)

    // A DOCUMENT FORMAT WITH NO TEXT EXTRACTOR.
    const xls = bytesOf('PK zip-ish spreadsheet bytes')
    const sheet = await ingest(tenant, xls, 'books.xls', 'application/vnd.ms-excel')
    const sheetItem = await readItem(tenant, String(sheet.uid))
    expect(sheetItem.description_status).toBe('unsupported')
    // NAMES THE TYPE that could not be read, and says how it can still be found.
    expect(sheetItem.body).toContain('application/vnd.ms-excel')
    expect(String(sheetItem.body)).toMatch(/found by name/i)
    expect(sheetItem.title).toBe('books.xls')
    expect(sheetItem.body).toContain(`${xls.length} bytes`)
    expect(sheetItem.description_model).toBeNull()
    expect(sameBytes(await readFile(tenant, String(sheet.uid)), xls)).toBe(true)

    // AN IMAGE IN A FORMAT NOTHING CAN LOOK AT — a describer IS configured, so
    // this is distinguishable from the no-describer case by construction.
    const tiff = bytesOf('II*\0 tiff-ish bytes')
    const scan = await ingest(
      tenant,
      tiff,
      'scan.tiff',
      'image/tiff',
      deps({ describeImage: looker.describeImage }),
    )
    const scanItem = await readItem(tenant, String(scan.uid))
    expect(scanItem.description_status).toBe('unsupported')
    expect(scanItem.description_status).not.toBe('no_describer')
    expect(scanItem.body).toContain('image/tiff')
    expect(scanItem.title).toBe('scan.tiff')
    expect(scanItem.description_model).toBeNull()
    expect(sameBytes(await readFile(tenant, String(scan.uid)), tiff)).toBe(true)
    // Half-guessing would mean sending it anyway and keeping whatever came back.
    expect(looker.seen).toEqual([])
  })
})

suite('a reading failure costs findability and nothing else', () => {
  it('test_UAT_AC1555_a_failed_describer_never_fails_the_upload', async () => {
    const tenant = 'recdesc-1555'

    // REACHED AND FAILED — it threw. Turning "we could not read your PDF" into
    // "your upload failed" would be untrue and would leave nothing to retry.
    const thrownBytes = bytesOf('png-ish bytes the describer will choke on')
    const thrown = await ingest(
      tenant,
      thrownBytes,
      'logo.png',
      'image/png',
      deps({
        describeImage: async () => {
          throw new Error('rate limited')
        },
      }),
    )
    const thrownItem = await readItem(tenant, String(thrown.uid))
    expect(thrownItem.description_status).toBe('failed')
    // NOT the nothing-configured value: one of these waits for a retry and the
    // other for configuration, and they must not be confused with each other.
    expect(thrownItem.description_status).not.toBe('no_describer')
    // THE FAILURE'S OWN WORDING, carried into the record so it is legible to
    // whoever looks at it rather than buried in a log line nobody kept.
    expect(thrownItem.body).toContain('rate limited')
    expect(thrownItem.description_model).toBeNull()
    expect(sameBytes(await readFile(tenant, String(thrown.uid)), thrownBytes)).toBe(true)

    // REACHED AND RETURNED NOTHING USABLE — the same outcome, because it is the
    // same repair: something answered, and what it said cannot be indexed.
    const emptyBytes = bytesOf('png-ish bytes that produce no answer')
    const empty = await ingest(
      tenant,
      emptyBytes,
      'silent.png',
      'image/png',
      deps({ describeImage: async () => ({ text: '   ', model: 'stub/vision-1' }) }),
    )
    const emptyItem = await readItem(tenant, String(empty.uid))
    expect(emptyItem.description_status).toBe('failed')
    expect(emptyItem.description_status).not.toBe('no_describer')
    expect(String(emptyItem.body)).toMatch(/returned nothing/i)
    expect(emptyItem.description_model).toBeNull()
    expect(String(emptyItem.body)).not.toBe('')
    expect(sameBytes(await readFile(tenant, String(empty.uid)), emptyBytes)).toBe(true)
  })
})

suite('how a description turned out is queryable', () => {
  it('test_UAT_AC1556_outcome_and_producer_are_queryable_on_every_material', async () => {
    // THE POINT OF THE FIELD PAIR: material with no real description is found by
    // ASKING, not by re-reading every record. This ingests a mixture producing
    // five different outcomes into a tenant of its own, then asks.
    const tenant = 'recdesc-1556'

    const okBytes = bytesOf('The bakery opens at six and the flour arrives on Tuesdays.')
    const ok = await ingest(tenant, okBytes, 'note.txt', 'text/plain')

    const pngBytes = bytesOf('png-ish bytes, nothing configured to look')
    const noDescriber = await ingest(
      tenant,
      pngBytes,
      'logo.png',
      'image/png',
      deps({ describeImage: undefined }),
    )

    const scanBytes = scannedPdf()
    const noText = await ingest(tenant, scanBytes, 'scan.pdf', 'application/pdf')

    const xlsBytes = bytesOf('PK zip-ish spreadsheet bytes')
    const unsupported = await ingest(tenant, xlsBytes, 'books.xls', 'application/vnd.ms-excel')

    const brokenBytes = bytesOf('png-ish bytes the describer will choke on')
    const failed = await ingest(
      tenant,
      brokenBytes,
      'broken.png',
      'image/png',
      deps({
        describeImage: async () => {
          throw new Error('upstream said no')
        },
      }),
    )

    // AND ONE THAT WAS RETRIEVED RATHER THAN HANDED OVER, so the address it came
    // from can be looked for in its description.
    const fetchedBytes = bytesOf('PK fetched spreadsheet bytes')
    const stub: typeof fetch = async () =>
      new Response(fetchedBytes as unknown as BodyInit, {
        status: 200,
        headers: { 'content-type': 'application/vnd.ms-excel' },
      })
    const fetchResponse = await route(
      new Request('https://app.test/api/material/fetch', {
        method: 'POST',
        body: JSON.stringify({ url: 'https://example.com/trade/books.xls' }),
      }),
      routerEnv(tenant),
      { ...deps(), fetch: stub },
    )
    expect(fetchResponse.status).toBe(200)
    const fetched = (await fetchResponse.json()) as Record<string, unknown>

    const expected: Array<{ envelope: Record<string, unknown>; status: string; producer: string | null; filename: string; size: number }> = [
      { envelope: ok, status: 'ok', producer: 'text-decode', filename: 'note.txt', size: okBytes.length },
      { envelope: noDescriber, status: 'no_describer', producer: null, filename: 'logo.png', size: pngBytes.length },
      { envelope: noText, status: 'no_text', producer: null, filename: 'scan.pdf', size: scanBytes.length },
      { envelope: unsupported, status: 'unsupported', producer: null, filename: 'books.xls', size: xlsBytes.length },
      { envelope: failed, status: 'failed', producer: null, filename: 'broken.png', size: brokenBytes.length },
      { envelope: fetched, status: 'unsupported', producer: null, filename: 'books.xls', size: fetchedBytes.length },
    ]

    const store = await ticketStoreFor(routerEnv(tenant))
    for (const row of expected) {
      const uid = String(row.envelope.uid)
      const { ticket } = await store.get({ uid })
      // THE OUTCOME IS PRESENT ON EVERY MATERIAL, the successful one included.
      expect(ticket.fields.description_status, uid).toBe(row.status)
      // THE PRODUCER IS A STATED VALUE, never an absent key — so a predicate
      // over it never has to treat absence as a third state.
      expect(
        Object.prototype.hasOwnProperty.call(ticket.fields, 'description_model'),
        `${uid} has no description_model key at all`,
      ).toBe(true)
      expect(ticket.fields.description_model ?? null, uid).toBe(row.producer)
      // NO EMPTY BODIES, EVER. In the Library a blank body reads as a bug rather
      // than as a known limitation.
      expect(String(ticket.body ?? ''), uid).not.toBe('')
      if (row.producer === null) {
        // A degraded description is WRITTEN PROSE plus the file's own identity —
        // its name, its declared type and its size.
        expect(ticket.body, uid).toContain(row.filename)
        expect(ticket.body, uid).toContain(String(ticket.fields.filename))
        expect(ticket.body, uid).toContain(`${row.size} bytes`)
      }
    }

    // ASKING BY OUTCOME RETURNS EXACTLY THE EXPECTED SUBSET.
    const uidsWhere = async (predicate: string): Promise<string[]> => {
      const { tickets } = await store.query({
        predicate: `type = material AND ${predicate}`,
        limit: 'all',
      })
      return tickets.map((t) => t.uid).sort()
    }
    expect(await uidsWhere("fields.description_status = 'ok'")).toEqual([String(ok.uid)])
    expect(await uidsWhere("fields.description_status = 'no_describer'")).toEqual([
      String(noDescriber.uid),
    ])
    expect(await uidsWhere("fields.description_status = 'no_text'")).toEqual([String(noText.uid)])
    expect(await uidsWhere("fields.description_status = 'failed'")).toEqual([String(failed.uid)])
    expect(await uidsWhere("fields.description_status = 'unsupported'")).toEqual(
      [String(unsupported.uid), String(fetched.uid)].sort(),
    )

    // AND THE WHOLE BACKLOG IN ONE QUESTION: everything whose description is not
    // real, and nothing whose description is.
    const notReal = await uidsWhere("fields.description_status != 'ok'")
    expect(notReal).toEqual(
      [noDescriber, noText, unsupported, failed, fetched].map((e) => String(e.uid)).sort(),
    )
    expect(notReal).not.toContain(String(ok.uid))

    // A RETRIEVED FILE'S DESCRIPTION NAMES THE ADDRESS IT CAME FROM — provenance
    // a client can act on, in the one place the Library actually shows.
    const fetchedItem = await readItem(tenant, String(fetched.uid))
    expect(fetchedItem.body).toContain('https://example.com/trade/books.xls')
  })
})

suite('a description is bounded, and says so when it was cut', () => {
  it(
    'test_UAT_AC1557_a_bounded_description_states_its_own_truncation',
    async () => {
      const tenant = 'recdesc-1557'
      const opening = 'Sourdough starter maintenance for the Fitzrovia kitchen.\n'
      // Comfortably past the bound, so the clip is unambiguous.
      const long = opening + 'The flour is stored below the counter. '.repeat(6000)
      expect(long.length).toBeGreaterThan(MAX_BODY_CHARS)
      const longBytes = bytesOf(long)

      const envelope = await ingest(tenant, longBytes, 'manual.txt', 'text/plain')
      const item = await readItem(tenant, String(envelope.uid))
      const body = String(item.body)
      const notice = `\n\n[Text truncated at ${MAX_BODY_CHARS} characters.]`

      // IT CARRIES THE BEGINNING of the document's own text…
      expect(body.startsWith(opening)).toBe(true)
      // …IT SAYS IT WAS CUT, AND AT WHAT LENGTH…
      expect(body.endsWith(notice)).toBe(true)
      expect(body).toContain(String(MAX_BODY_CHARS))
      // …AND IT IS NO LONGER THAN THE BOUND PLUS THAT STATEMENT. A description
      // that stopped mid-sentence with no explanation would read as corruption,
      // and an unbounded one is re-read on every indexing pass.
      expect(body.length).toBeLessThanOrEqual(MAX_BODY_CHARS + notice.length)
      expect(body.length).toBe(MAX_BODY_CHARS + notice.length)
      expect(body.length).toBeLessThan(long.length)

      // ONLY THE DESCRIPTION IS SHORTENED. The stored bytes are the original.
      const stored = await readFile(tenant, String(envelope.uid))
      expect(stored.length).toBe(longBytes.length)
      expect(sameBytes(stored, longBytes)).toBe(true)

      // A DOCUMENT WITHIN THE BOUND IS STORED COMPLETE AND CARRIES NO NOTICE.
      const shortText = 'The kitchen opens at six and the bread is baked overnight.'
      const shortBytes = bytesOf(shortText)
      const small = await ingest(tenant, shortBytes, 'short.txt', 'text/plain')
      const smallItem = await readItem(tenant, String(small.uid))
      expect(smallItem.body).toBe(shortText)
      expect(String(smallItem.body)).not.toMatch(/truncated/i)
      const smallStored = await readFile(tenant, String(small.uid))
      expect(smallStored.length).toBe(shortBytes.length)
      expect(sameBytes(smallStored, shortBytes)).toBe(true)
    },
    30_000,
  )
})
