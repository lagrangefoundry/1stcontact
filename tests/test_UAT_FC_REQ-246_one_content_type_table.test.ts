import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import worker from '../apps/public-site/src/index'
import type { Env } from '../apps/public-site/src/index'
import {
  ACTIVE_CONTENT_TYPES,
  OCTET_STREAM,
  contentTypeEntries,
  contentTypeOf,
  extensionOf,
  isActiveContentType,
} from '../tools/generate/src/store/content-type.js'
import { memberContentType } from '../apps/control-app/src/capture-material'
import { resolveContentType } from '../apps/control-app/src/material'
import { contentTypeFor as mirroredContentType } from '../tools/generate/src/cli/capture/reextract'
import { publishedOutPrefix } from '../tools/generate/src/store/revision-model'
import { starterHomePage, starterSiteJson } from '../tools/generate/src/cli/scaffold'
import { emptyPublished, publishInto, type PublishedFixture } from './fixtures/published-site'

/**
 * REQ-246 §1–2, §5 AC1–AC5 — **one extension-to-type table, and it knows what a
 * site actually carries.**
 *
 * THE FAILURE THIS SUITE IS ABOUT. `store/content-type.ts` is documented as the
 * single table and says, in its own header, why a second copy is a drift waiting
 * to happen. There were four. `apps/public-site/src/content-type.ts` held `otf`,
 * `txt`, `xml`, `mjs` and `webmanifest` that the store's did not;
 * `capture-material.ts` and `capture/reextract.ts` each held a third and fourth.
 * None of them held `pdf`, so both XGD whitepapers were stored AND served as
 * `application/octet-stream` — a browser downloading a paper it could have
 * opened, with the cause four files away from the symptom.
 *
 * WHAT IS REAL HERE. The reader is the shipped one and the table is the shipped
 * table. The served-header cases drive `public-site`'s own `fetch` entry point
 * over a bucket seeded by a REAL publish, so what is asserted is the header a
 * visitor gets rather than a mapping function agreeing with itself. R2 is faked
 * at the binding, which is the one boundary this repo does not own.
 *
 * AC2 IS ASSERTED BY A SCAN, NOT BY A COMPARISON. A test that checked two tables
 * against each other would have passed happily for as long as both were wrong,
 * and would go on passing when a fifth appeared. So the guard reads the source
 * tree and fails on a SECOND TABLE — the shape, not its contents.
 */

const SLUG = 'acme'
const ORIGIN = 'https://1stcontact.io'

/** Drive the Worker's real entry point for one request. */
async function get(published: PublishedFixture, pathAndQuery: string): Promise<Response> {
  const waits: Promise<unknown>[] = []
  const res = await worker.fetch(
    new Request(`${ORIGIN}${pathAndQuery}`),
    {
      SITES: published.bucket as unknown as R2Bucket,
      DB: published.db as unknown as D1Database,
    } as Env,
    {
      waitUntil: (p: Promise<unknown>) => void waits.push(p),
      passThroughOnException: () => {},
      props: {},
    } as unknown as ExecutionContext,
  )
  await Promise.all(waits)
  return res
}

/**
 * A published site whose revision also holds `extras` at `out/`.
 *
 * The starter render does not emit a whitepaper, so the files whose SERVED type
 * is under test are seeded into the revision D1 already vouches for — the
 * question is what the served path's extension is labelled as, not how the bytes
 * got there.
 */
async function publishedWith(extras: string[]): Promise<PublishedFixture> {
  const published = emptyPublished()
  const { id } = await publishInto(published, SLUG, {
    siteJson: starterSiteJson(SLUG) as unknown as Record<string, unknown>,
    pages: { 'home.json': starterHomePage(SLUG) as unknown as Record<string, unknown> },
    assets: {},
  })
  const prefix = publishedOutPrefix(SLUG, id)
  for (const rel of extras) {
    published.bucket.objects.set(`${prefix}/${rel}`, Buffer.from('x', 'utf8'))
  }
  return published
}

// ── AC1 — a PDF is a PDF ─────────────────────────────────────────────────────

describe('REQ-246 AC1 — a PDF placed on a site is served as application/pdf', () => {
  it('test_UAT_FC_REQ_246_a_pdf_is_served_as_a_pdf', async () => {
    const published = await publishedWith(['assets/whitepaper.pdf'])
    const res = await get(published, `/site/${SLUG}/assets/whitepaper.pdf`)

    expect(res.status).toBe(200)
    // THE WHOLE TICKET IN ONE ASSERTION. This was `application/octet-stream`,
    // which is a browser being told to download a paper it could have opened.
    expect(res.headers.get('content-type')).toBe('application/pdf')

    // And the same answer on the store side, which is what an R2 object's own
    // `httpMetadata` is written from when the asset lands in the draft.
    expect(contentTypeOf('whitepaper.pdf')).toBe('application/pdf')
    expect(contentTypeOf('draft/site_abc/assets/How-It-Works.PDF')).toBe('application/pdf')
  })
})

// ── AC2 — one table, one reader ──────────────────────────────────────────────

/**
 * Every production source file — what a deployment is built from, plus the
 * scripts that run beside it.
 *
 * `tools/generate/bin` IS IN SCOPE, and leaving it out is how the fifth copy
 * survived being looked for. `smoke.mjs` runs under bare `node` after a deploy,
 * which is a different runtime but not a different question: it was asserting
 * what type the origin must answer with, out of a list of its own.
 */
function productionSources(): string[] {
  const roots = [
    'apps/public-site/src',
    'apps/control-app/src',
    'tools/generate/src',
    'tools/generate/bin',
  ]
  for (const pkg of readdirSync('packages')) {
    const src = path.join('packages', pkg, 'src')
    try {
      if (statSync(src).isDirectory()) roots.push(src)
    } catch {
      // A package with no `src/` contributes nothing to scan.
    }
  }
  const found: string[] = []
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== 'generated') walk(full)
      } else if (/\.(ts|js|mjs)$/.test(entry.name)) {
        found.push(full)
      }
    }
  }
  for (const root of roots) walk(root)
  return found
}

/**
 * Files that map an extension to a content type, judged by the signature rows a
 * general MIME table has and a special-purpose one does not.
 *
 * TWO ROWS FROM DIFFERENT FAMILIES, because one alone is not evidence: `material.ts`
 * legitimately holds `text/css` (it repairs the type of a stylesheet a client
 * uploaded) and `image-recipe` legitimately names `image/png`. A file naming
 * BOTH a stylesheet type AND a font type AND a media type is answering the
 * general question — which is the one there is supposed to be one answer to.
 */
function looksLikeAGeneralTable(source: string): boolean {
  const families = [
    /['"]text\/css/,
    /['"]font\/(woff2|woff|ttf|otf)/,
    /['"]image\/(svg\+xml|webp|avif)/,
  ]
  return families.filter((re) => re.test(source)).length >= 2
}

const CANONICAL = path.join('tools', 'generate', 'src', 'store', 'content-type.js')

/**
 * The one file that maps extensions to types and is NOT this table.
 *
 * §4 exempts it by name and says why: it is not a general MIME database. It
 * answers a different question — what a file whose OWN declared type said
 * nothing probably is — and every row in it is a format some step of the
 * ingestion pipeline can actually read. The exemption is a named entry rather
 * than a hole in the pattern, and the case below holds it to the claim.
 */
const NOT_A_GENERAL_TABLE = path.join('apps', 'control-app', 'src', 'material.ts')

describe('REQ-246 AC2 — there is one extension-to-type table with one reader', () => {
  it('test_UAT_FC_REQ_246_a_second_table_fails_this_test', () => {
    const tables = productionSources().filter((file) =>
      looksLikeAGeneralTable(readFileSync(file, 'utf8')),
    )

    // THE GUARD, AND IT IS ABOUT THE SHAPE RATHER THAN THE CONTENTS. A test that
    // compared two tables would pass while both were wrong and would notice
    // nothing when a fifth arrived. This fails the moment a second one exists —
    // and the exemption is spelled, so a fifth cannot arrive by resembling it.
    expect(tables.sort()).toEqual([NOT_A_GENERAL_TABLE, CANONICAL].sort())

    // ONE READER, TOO. The table is not exported, so no caller can index it and
    // reintroduce the second lookup rule that made `.PNG` an octet-stream on one
    // path and an image on another.
    const canonical = readFileSync(CANONICAL, 'utf8')
    expect(canonical).not.toMatch(/^export const MIME/m)
    expect(canonical).toMatch(/export function contentTypeOf/)
  })

  it('test_UAT_FC_REQ_246_the_exempt_table_answers_a_different_question', () => {
    // IT REPAIRS SILENCE AND NOTHING ELSE, which is what makes it not a second
    // answer to the question `contentTypeOf` answers. A type the browser or the
    // sender actually STATED comes back untouched — including one this table
    // would map differently — so it can never disagree with the served header.
    expect(resolveContentType('text/plain; charset=utf-8', 'notes.md')).toBe(
      'text/plain; charset=utf-8',
    )
    expect(resolveContentType('', 'notes.md')).toBe('text/markdown')
    expect(resolveContentType(OCTET_STREAM, 'brief.pdf')).toBe('application/pdf')
    // And it holds rows the served table deliberately does not, because they are
    // formats the ingestion steps read rather than formats a site serves.
    expect(resolveContentType('', 'export.yaml')).toBe('text/yaml')
    expect(contentTypeOf('export.yaml')).toBe(OCTET_STREAM)
  })

  it('test_UAT_FC_REQ_246_every_former_copy_now_answers_from_the_one_table', () => {
    // The three call sites that held their own literal, each asked something the
    // table now answers. `memberContentType` and the mirrored-member reader are
    // the real shipped functions.
    expect(memberContentType('capture.json')).toBe(contentTypeOf('capture.json'))
    expect(memberContentType('assets/body.otf')).toBe('font/otf')
    expect(mirroredContentType('assets/logo.svg', new Uint8Array())).toBe('image/svg+xml')

    // And the one thing the mirrored reader needed that a table could never
    // hold: Google Fonts' stylesheet mirrors as the extensionLESS `css2`, so it
    // is sniffed. That branch survives the merge.
    const css = new TextEncoder().encode('@font-face { font-family: Inter; }')
    expect(mirroredContentType('assets/css2', css)).toBe('text/css; charset=utf-8')
  })
})

// ── AC3 — nothing that was served stops being served ─────────────────────────

describe('REQ-246 AC3 — the formats only public-site held survive the merge', () => {
  it('test_UAT_FC_REQ_246_the_merged_table_still_serves_what_either_side_served', async () => {
    // Exactly the five the public-site table held and the store table did not,
    // plus the ones both held, asserted through the route that served them.
    const expected: Record<string, string> = {
      'body.otf': 'font/otf',
      'robots.txt': 'text/plain; charset=utf-8',
      'sitemap.xml': 'application/xml',
      'app.mjs': 'text/javascript; charset=utf-8',
      'site.webmanifest': 'application/manifest+json',
      'theme.css': 'text/css; charset=utf-8',
      'assets/logo.svg': 'image/svg+xml',
      'assets/hero.avif': 'image/avif',
      'favicon.ico': 'image/x-icon',
    }
    const published = await publishedWith(Object.keys(expected))

    for (const [rel, type] of Object.entries(expected)) {
      const res = await get(published, `/site/${SLUG}/${rel}`)
      expect(res.status, rel).toBe(200)
      // NOT `application/octet-stream`, which is the specific regression this
      // case exists to refuse: a route that served one of these before the merge
      // must not start labelling it as bytes after it.
      expect(res.headers.get('content-type'), rel).toBe(type)
    }
  })

  it('test_UAT_FC_REQ_246_the_table_covers_the_inert_formats_a_site_carries', () => {
    // The breadth §2 asks for: a brochure, a price list, a download, a video.
    expect(contentTypeOf('brochure.pdf')).toBe('application/pdf')
    expect(contentTypeOf('prices.csv')).toBe('text/csv; charset=utf-8')
    expect(contentTypeOf('terms.docx')).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    )
    expect(contentTypeOf('press-kit.zip')).toBe('application/zip')
    expect(contentTypeOf('tour.mp4')).toBe('video/mp4')
    expect(contentTypeOf('jingle.mp3')).toBe('audio/mpeg')
  })
})

// ── AC4 — an unknown extension is still bytes ────────────────────────────────

describe('REQ-246 AC4 — an unknown extension is still application/octet-stream', () => {
  it('test_UAT_FC_REQ_246_an_unknown_extension_is_labelled_as_bytes', async () => {
    const published = await publishedWith(['download.bin', 'LICENSE', '.gitignore'])

    for (const rel of ['download.bin', 'LICENSE', '.gitignore']) {
      const res = await get(published, `/site/${SLUG}/${rel}`)
      expect(res.headers.get('content-type'), rel).toBe(OCTET_STREAM)
    }

    // A GUESS IS THE UNSAFE ANSWER, not merely an inelegant one: labelling
    // something as what it might be is how a `.svg`-shaped hole becomes an XSS
    // one. Breadth in the table is not permission to guess outside it.
    expect(contentTypeOf('notes.xyz')).toBe(OCTET_STREAM)
    expect(contentTypeOf('README')).toBe(OCTET_STREAM)
    // A dot that begins the name is a name, not an extension — the rule
    // public-site's own reader had and the store's did not.
    expect(extensionOf('.gitignore')).toBe('')
    // And a dot in a DIRECTORY is not an extension either, which is what lets
    // one reader answer for a served key and a stored name both.
    expect(extensionOf('sites/a.b/logo')).toBe('')
    expect(extensionOf('sites/k/rev/3/out/assets/hero.PNG')).toBe('.png')
  })
})

// ── AC5 — no new active type ─────────────────────────────────────────────────

describe('REQ-246 AC5 — no type a browser executes was added', () => {
  it('test_UAT_FC_REQ_246_the_active_set_is_enumerated_and_unchanged', () => {
    // WHAT WAS ALREADY SERVED, before the merge, by one table or the other.
    // `html`, `js` and `svg` were in both; `mjs` and `xml` were in public-site's.
    // Nothing else a browser runs has ever come out of this bucket.
    const SERVED_BEFORE = [
      'text/html; charset=utf-8',
      'text/javascript; charset=utf-8',
      'image/svg+xml',
      'application/xml',
    ]

    expect([...ACTIVE_CONTENT_TYPES].sort()).toEqual([...SERVED_BEFORE].sort())

    // AND EVERY ROW IN THE TABLE IS EITHER ONE OF THOSE OR INERT. This is the
    // assertion that makes breadth safe: the next person adding a format has to
    // put it in the inert literal or fail here, which is the decision §2 says
    // must not be made by appending to an undifferentiated list.
    const active = contentTypeEntries()
      .filter(([, type]) => isActiveContentType(type))
      .map(([ext]) => ext)
      .sort()
    expect(active).toEqual(['.html', '.js', '.mjs', '.svg', '.xml'])

    // Spot-check the far end: a document is not script, however it is spelled.
    for (const name of ['a.pdf', 'a.zip', 'a.mp4', 'a.docx', 'a.txt', 'a.md']) {
      expect(isActiveContentType(contentTypeOf(name)), name).toBe(false)
    }
  })
})
