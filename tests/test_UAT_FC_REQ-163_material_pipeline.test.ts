import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe as suite, expect, it } from 'vitest'
import { describe as describeMaterial } from '../apps/control-app/src/describe'
import { classify, kindOf } from '../apps/control-app/src/material'
import {
  assertFetchable,
  FetchRefusedError,
  guardedFetch,
  isPrivateHost,
  MAX_REDIRECTS,
} from '../apps/control-app/src/fetch-guard'
import { bytesOf, minimalPdf, scannedPdf } from './support/material-fixtures'

/**
 * REQ-163 — **classification, description and the fetch guard**.
 *
 * WHAT THIS FILE PROVES, and what its sibling proves instead. This one is the
 * three steps that are pure functions of bytes — step 2 (classify), step 3
 * (describe) and the guard on the fetch entry point. Its sibling
 * (`…_ingestion.workers.test.ts`) runs the whole pipeline through the real
 * Worker routes against real D1 and R2. The split is the repository's own
 * convention (`vitest.config.mts`): these need a filesystem for the font fixture,
 * which workerd does not have.
 *
 * ONE DOUBLE, AND IT IS THE VISION MODEL. Everything else is real: a real PDF
 * parsed by the real `unpdf`, a real SFNT font parsed byte by byte, the real
 * guard driven by a stub `fetch` that returns real `Response`s. The describer is
 * stubbed because none of the claims below is about description QUALITY — they
 * are about what the pipeline does with a description, and with its absence.
 *
 * THE GUARD'S CLAIM IS THE REDIRECT ONE. A guard applied only to the address the
 * caller typed is not a guard: a public host is free to answer 302 with
 * `169.254.169.254`, and `redirect: 'follow'` would take it without ever showing
 * the hop to the check. So the test that matters below is not "a loopback address
 * is refused" — it is "a PUBLIC address that redirects to a loopback address is
 * refused".
 */

const FONT = readFileSync(path.join(__dirname, 'fixtures', 'capture', 'heading-font.ttf'))

/** The stub describer: whatever it is told to say, and a count of how often. */
function stubVision(text: string) {
  const seen: string[] = []
  return {
    seen,
    describeImage: async (bytes: Uint8Array, contentType: string) => {
      seen.push(contentType)
      void bytes
      return { text, model: 'stub/vision-1' }
    },
  }
}

suite('REQ-163 — rights come from provenance, never from a question', () => {
  it('UAT_FC_REQ-163 an upload is republishable and not exportable', async () => {
    // [[DOC-38]] §10.1. The client uploaded it, so we may put it on their site;
    // it is their own business, so it must not leave the tenant as aggregate.
    // Nothing was asked, and there is no argument on `classify` that could carry
    // an answer — which is the mechanical form of "never asked".
    const it_ = classify({ contentType: 'image/png', filename: 'kitchen.png', origin: 'uploaded' })
    expect(it_.rights).toBe('owned')
    expect(it_.republishable).toBe(true)
    expect(it_.exportable).toBe(false)
    expect(it_.origin).toBe('uploaded')
  })

  it('UAT_FC_REQ-163 fetched background inverts BOTH bits', async () => {
    // The pair inverting is the whole reason [[REQ-162]] made both required: no
    // rule derives either from `rights` without being wrong for half the corpus.
    const it_ = classify({
      contentType: 'application/pdf',
      filename: 'report.pdf',
      origin: 'fetched',
      sourceUrl: 'https://example.com/report.pdf',
    })
    expect(it_.rights).toBe('third_party')
    expect(it_.republishable).toBe(false)
    expect(it_.exportable).toBe(true)
    expect(it_.source_url).toBe('https://example.com/report.pdf')
  })

  it('UAT_FC_REQ-163 kind comes from the content type, and from the name when it says nothing', () => {
    expect(kindOf('image/jpeg', 'x')).toBe('image')
    expect(kindOf('font/woff2', 'x')).toBe('font')
    expect(kindOf('application/pdf', 'x.pdf')).toBe('document')
    // The common real case: a font served as a generic binary. Ignoring the name
    // here would misfile most of them.
    expect(kindOf('application/octet-stream', 'satoshi-400.woff2')).toBe('font')
    // And anything unrecognised is a document rather than a refusal — the file is
    // kept, and `description_status` records that nothing could read it.
    expect(kindOf('application/vnd.ms-excel', 'books.xls')).toBe('document')
  })
})

suite('REQ-163 — the description is what makes material findable', () => {
  it('UAT_FC_REQ-163 a PDF yields its own text and its own declared title', async () => {
    const description = await describeMaterial({
      bytes: minimalPdf('The kitchen opens at six and the bread is baked overnight.'),
      kind: 'document',
      contentType: 'application/pdf',
      filename: 'guidelines.pdf',
    })
    expect(description.status).toBe('ok')
    // The words a client would search by are IN THE BODY, which is the only
    // property that matters: the KB indexes bodies, so this is the difference
    // between findable and not.
    expect(description.body).toContain('kitchen')
    expect(description.body).toContain('bread')
    // The PDF's own `/Title` beats anything derived from its first line — it was
    // written by whoever made the document.
    expect(description.title).toBe('Brand guidelines')
    expect(description.describer).toBe('unpdf')
  })

  it('UAT_FC_REQ-163 a scanned PDF is STORED and honestly described, never rejected', async () => {
    // [[DOC-38]] §10 / REQ-163's decision. Refusing a client's scanned brand book
    // is the worse failure by a wide margin, so extraction yielding nothing
    // produces a description that says so and a status a later pass can query.
    const description = await describeMaterial({
      bytes: scannedPdf(),
      kind: 'document',
      contentType: 'application/pdf',
      filename: 'brandbook-scan.pdf',
    })
    expect(description.status).toBe('no_text')
    expect(description.body).toMatch(/scanned document/i)
    expect(description.body).toContain('no extractable text')
    // Still identifiable: the filename survives into both title and body, so the
    // entry is not an anonymous row in the Library.
    expect(description.title).toBe('brandbook-scan.pdf')
    expect(description.body).toContain('brandbook-scan.pdf')
  })

  it('UAT_FC_REQ-163 an image is described by what it DEPICTS, not by its filename', async () => {
    // The acceptance in its sharpest form: the retrieval handle is *"the kitchen
    // at dusk"*, and the filename is `IMG_4821.jpg`. If the body carried only the
    // name, [[DOC-38]] §6's whole simplification — one corpus, one retrieval path,
    // images included — would be false.
    const vision = stubVision(
      'Kitchen at dusk\n\nA restaurant kitchen photographed in the evening, ' +
        'stainless counters lit by low warm light, no people present.',
    )
    const description = await describeMaterial(
      {
        bytes: bytesOf('not really a png, and the describer is stubbed'),
        kind: 'image',
        contentType: 'image/png',
        filename: 'IMG_4821.jpg',
      },
      { describeImage: vision.describeImage },
    )
    expect(description.status).toBe('ok')
    expect(description.title).toBe('Kitchen at dusk')
    expect(description.body).toContain('restaurant kitchen')
    expect(description.body).toContain('evening')
    expect(description.describer).toBe('stub/vision-1')
    // The content type reached the describer intact — it is what selects the
    // media type of the image block, and a wrong one is a 400 from the API.
    expect(vision.seen).toEqual(['image/png'])
  })

  it('UAT_FC_REQ-163 an image with no describer is still stored, and says so', async () => {
    const description = await describeMaterial({
      bytes: bytesOf('bytes'),
      kind: 'image',
      contentType: 'image/png',
      filename: 'logo.png',
    })
    expect(description.status).toBe('no_describer')
    expect(description.describer).toBeNull()
    expect(description.body).toMatch(/no describer is configured/i)
  })

  it('UAT_FC_REQ-163 a describer that throws degrades rather than failing the upload', async () => {
    // NEVER THROWS is the contract: an extraction error costs findability and
    // nothing else. Letting it reach the route would turn "we could not read your
    // file" into "your upload failed", which is untrue and unrecoverable.
    const description = await describeMaterial(
      {
        bytes: bytesOf('bytes'),
        kind: 'image',
        contentType: 'image/png',
        filename: 'logo.png',
      },
      {
        describeImage: async () => {
          throw new Error('rate limited')
        },
      },
    )
    expect(description.status).toBe('failed')
    expect(description.body).toContain('rate limited')
  })

  it('UAT_FC_REQ-163 a font is described from its own name table', async () => {
    // Parsed, not guessed. The fixture is a real TTF and these strings are in its
    // `name` table — family, style and the designer's own sentence about it.
    const description = await describeMaterial({
      bytes: new Uint8Array(FONT),
      kind: 'font',
      contentType: 'font/ttf',
      filename: 'heading-font.ttf',
    })
    expect(description.status).toBe('ok')
    expect(description.describer).toBe('sfnt-name-table')
    expect(description.title).toBe('codicon')
    expect(description.body).toContain('codicon')
    expect(description.body).toContain('The icon font for Visual Studio Code')
  })

  it('UAT_FC_REQ-163 a WOFF2 font degrades honestly rather than being mis-parsed', async () => {
    // workerd has no brotli in `DecompressionStream`, so a WOFF2's tables cannot
    // be reached. Saying that is better than emitting a confident wrong family.
    const woff2 = new Uint8Array([0x77, 0x4f, 0x46, 0x32, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    const description = await describeMaterial({
      bytes: woff2,
      kind: 'font',
      contentType: 'font/woff2',
      filename: 'satoshi.woff2',
    })
    expect(description.status).toBe('unsupported')
    expect(description.body).toMatch(/WOFF or WOFF2/)
  })

  it('UAT_FC_REQ-163 an unreadable content type is stored and marked unsupported', async () => {
    const description = await describeMaterial({
      bytes: bytesOf('PK zip-ish'),
      kind: 'document',
      contentType: 'application/vnd.ms-excel',
      filename: 'books.xls',
    })
    expect(description.status).toBe('unsupported')
    expect(description.body).toContain('application/vnd.ms-excel')
  })
})

suite('REQ-163 — the fetch guard', () => {
  it('UAT_FC_REQ-163 non-https is refused rather than silently upgraded', async () => {
    // Upgrading would fetch a DIFFERENT address than the one the client named,
    // which is worse than refusing.
    expect(() => assertFetchable('http://example.com/report.pdf')).toThrow(FetchRefusedError)
    expect(() => assertFetchable('file:///etc/passwd')).toThrow(FetchRefusedError)
    expect(() => assertFetchable('not a url at all')).toThrow(FetchRefusedError)
    expect(assertFetchable('https://example.com/report.pdf').hostname).toBe('example.com')
  })

  it('UAT_FC_REQ-163 private, loopback, link-local and metadata addresses are refused', () => {
    // 169.254.169.254 is the cloud metadata service and is the reason link-local
    // is on the list at all.
    for (const host of [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '10.1.2.3',
      '172.16.0.1',
      '192.168.1.1',
      '169.254.169.254',
      '100.64.0.1',
      '::1',
      'fd00::1',
      'fe80::1',
      '::ffff:127.0.0.1',
      'db.internal',
      'printer.local',
    ]) {
      expect(isPrivateHost(host), host).toBe(true)
    }
    for (const host of ['example.com', '93.184.216.34', '8.8.8.8', '2606:2800::1']) {
      expect(isPrivateHost(host), host).toBe(false)
    }
  })

  it('UAT_FC_REQ-163 EVERY redirect hop is re-validated, not just the first address', async () => {
    // THE CLAIM OF THIS FILE. The address the client typed is public and passes;
    // the hop it redirects to is the metadata service. `redirect: 'follow'` would
    // have fetched it without the guard ever seeing it, so the guard follows by
    // hand and re-checks each `Location`.
    const seen: string[] = []
    const stub: typeof fetch = async (input) => {
      const url = String(input)
      seen.push(url)
      if (url.startsWith('https://example.com/')) {
        return new Response(null, { status: 302, headers: { location: 'https://169.254.169.254/latest/meta-data/' } })
      }
      return new Response('secrets', { status: 200 })
    }
    await expect(
      guardedFetch('https://example.com/report.pdf', 1024, { fetch: stub }),
    ).rejects.toBeInstanceOf(FetchRefusedError)
    // And it was never fetched. That is the difference between a guard and a
    // report: `seen` holds the first hop only.
    expect(seen).toEqual(['https://example.com/report.pdf'])
  })

  it('UAT_FC_REQ-163 a redirect loop is bounded rather than followed forever', async () => {
    let hops = 0
    const stub: typeof fetch = async () => {
      hops++
      return new Response(null, {
        status: 302,
        headers: { location: `https://example.com/${hops}` },
      })
    }
    await expect(
      guardedFetch('https://example.com/start', 1024, { fetch: stub }),
    ).rejects.toThrow(/redirected more than/)
    expect(hops).toBe(MAX_REDIRECTS + 1)
  })

  it('UAT_FC_REQ-163 a body past the ceiling is refused even when the server lied about its size', async () => {
    // `content-length` is the remote server's claim about itself. Counting as the
    // bytes arrive is what stops a dishonest — or merely silent — server pushing
    // past the ceiling the isolate has to hold.
    const stub: typeof fetch = async () =>
      new Response(new Uint8Array(4096), { status: 200, headers: { 'content-type': 'text/plain' } })
    await expect(
      guardedFetch('https://example.com/big.txt', 1024, { fetch: stub }),
    ).rejects.toThrow(/the limit is/)
  })

  it('UAT_FC_REQ-163 a permitted fetch returns the bytes and the FINAL address', async () => {
    // The final hop, not the requested one: what we stored came from there, and a
    // `source_url` naming an address we were redirected away from would be a
    // provenance record that is quietly wrong.
    const stub: typeof fetch = async (input) =>
      String(input) === 'https://example.com/a'
        ? new Response(null, { status: 301, headers: { location: 'https://example.com/b' } })
        : new Response('an industry report', {
            status: 200,
            headers: { 'content-type': 'text/plain; charset=utf-8' },
          })
    const fetched = await guardedFetch('https://example.com/a', 1024, { fetch: stub })
    expect(new TextDecoder().decode(fetched.bytes)).toBe('an industry report')
    expect(fetched.contentType).toBe('text/plain')
    expect(fetched.finalUrl).toBe('https://example.com/b')
    expect(fetched.requestedUrl).toBe('https://example.com/a')
  })
})
