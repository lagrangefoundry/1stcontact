/**
 * story-e674c60a — **the builder workspace, request-time render side**: the two
 * draft-side channels are *produced when they are asked for*, from the site's
 * definition, rather than served off a rendered artifact somebody had to
 * remember to refresh.
 *
 * These UATs drive real entry points only — the builder origin over HTTP
 * (`startBuilder`), the `1c` command functions (`cmdNew`, `cmdRender`,
 * `cmdPublish`) that produce what the origin is compared against, and the
 * workspace's own browser module that decides which address the pane displays.
 * Nothing reaches into a renderer or a handler directly: every claim here is
 * about bytes a browser is handed.
 *
 * NONE OF THIS NEEDS THE SHARED UI COMPONENTS. The chrome document is the only
 * route that consumes them, and no assertion below fetches it — so these
 * criteria are unconditional on every machine, install or no install.
 *
 * The fixture site is deliberately not the empty starter: two pages, a behaviour
 * module mounted into an L1 seam, and an asset on disk. That is what makes the
 * comparisons cover the module render path and asset serving rather than a
 * document with nothing in it.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { cmdNew, cmdPublish, cmdRender } from '../tools/generate/src/cli/commands'
import { starterHomePage } from '../tools/generate/src/cli/scaffold'
import { startBuilder, type BuilderHandle } from '../tools/generate/src/cli/builder'

/** The two channels produced on request. `published` is deliberately not one. */
const DRAFT_SIDE = ['draft', 'edit'] as const
type DraftSideChannel = (typeof DRAFT_SIDE)[number]

const SLUG = 'alpha'
/** Copy the home page carries, so a rendered page is identifiable in a body. */
const HOME_COPY = 'The copy on the home page.'
const ABOUT_COPY = 'The copy on the about page.'
const SLIDE_ONE = 'The first slide.'
const SLIDE_TWO = 'The second slide.'

/** A one-pixel JPEG. Real bytes, so asset serving is exercised for real. */
const ASSET_BYTES = Buffer.from(
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a' +
    'HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAA' +
    'AAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==',
  'base64',
)

interface Workspace {
  cwd: string
  builder: BuilderHandle
  /** GET a path on the builder origin. */
  get(p: string): Promise<Response>
}

const OPEN: Workspace[] = []

afterEach(async () => {
  while (OPEN.length) {
    const ws = OPEN.pop()!
    await ws.builder.close()
    fs.rmSync(ws.cwd, { recursive: true, force: true })
  }
})

const draftDirOf = (cwd: string): string => path.join(cwd, 'storage', 'sites', SLUG, 'draft')
const distRootOf = (cwd: string): string => path.join(cwd, 'storage', 'dist')
const distDirOf = (cwd: string, channel: string): string =>
  path.join(distRootOf(cwd), 'sites', SLUG, channel)
const homeJsonOf = (cwd: string): string => path.join(draftDirOf(cwd), 'pages', 'home.json')

/**
 * A throwaway store holding one site with real content — two pages, a carousel
 * mounted into an L1 seam, and an asset — and a builder origin over it.
 *
 * Nothing is rendered here: a caller that wants an artifact on disk asks for one
 * explicitly, which is what keeps "no artifact" and "an artifact to compare
 * against" separate setups rather than one setup with a flag.
 */
async function openWorkspace(): Promise<Workspace> {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'story-e674c60a-rtr-'))
  cmdNew(SLUG, { cwd })

  const draft = draftDirOf(cwd)
  fs.writeFileSync(path.join(draft, 'assets', 'hero.jpg'), ASSET_BYTES)

  // The home page: copy, an image drawn from the asset above, and a behaviour
  // module in a seam, so the render path under comparison is the real one.
  const home = JSON.parse(fs.readFileSync(homeJsonOf(cwd), 'utf8')) as Record<string, unknown>
  ;(home as { l1: { root: unknown } }).l1.root = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [
      { kind: 'text', id: 'home-copy', text: HOME_COPY, axes: { fontSizePx: 32 } },
      { kind: 'image', src: 'assets/hero.jpg', alt: 'A hero image' },
      { kind: 'slot', name: 'gallery' },
    ],
  }
  home.modules = [
    {
      id: 'gallery',
      type: 'carousel',
      version: 3,
      slot: 'gallery',
      config: {},
      slots: {
        slide: [
          { kind: 'text', text: SLIDE_ONE },
          { kind: 'text', text: SLIDE_TWO },
        ],
      },
    },
  ]
  fs.writeFileSync(homeJsonOf(cwd), JSON.stringify(home, null, 2))

  // A second page, built from the same scaffold the platform ships so it cannot
  // drift out of schema behind this file's back.
  const about = starterHomePage(SLUG) as Record<string, unknown>
  about.id = 'about'
  about.slug = 'about'
  about.title = 'About'
  ;(about as { l1: { root: { children: { text?: string }[] } } }).l1.root.children[0].text =
    ABOUT_COPY
  fs.writeFileSync(path.join(draft, 'pages', 'about.json'), JSON.stringify(about, null, 2))

  const builder = await startBuilder({ cwd })
  const ws: Workspace = {
    cwd,
    builder,
    get: (p: string, init?: RequestInit) => fetch(new URL(p, builder.url), init),
  }
  OPEN.push(ws)
  return ws
}

/** Every text artifact under `dir`, relative and sorted; `assets/` excluded. */
function textArtifacts(dir: string): string[] {
  const out: string[] = []
  const walk = (sub: string): void => {
    for (const entry of fs.readdirSync(path.join(dir, sub), { withFileTypes: true })) {
      const rel = sub ? `${sub}/${entry.name}` : entry.name
      if (entry.isDirectory()) {
        if (rel === 'assets') continue
        walk(rel)
      } else out.push(rel)
    }
  }
  walk('')
  return out.sort()
}

/** Rewrite the home page's copy in place, outside the builder entirely. */
function setHomeCopy(cwd: string, text: string): void {
  const home = JSON.parse(fs.readFileSync(homeJsonOf(cwd), 'utf8')) as {
    l1: { root: { children: { text?: string }[] } }
  }
  home.l1.root.children[0].text = text
  fs.writeFileSync(homeJsonOf(cwd), JSON.stringify(home, null, 2))
}

// ── the draft-side channels are produced, not fetched off a shelf ────────────

describe('story-e674c60a request-time render', () => {
  it(
    'test_UAT_AC1031_draft_side_channels_answer_with_no_rendered_artifact_on_disk',
    async () => {
      // AC-1031 — with NO rendered output anywhere on disk the origin still
      // answers for both draft-side channels, whole: the document, the
      // stylesheet it references, and the site's own assets, all over the same
      // origin. And serving materialises nothing — a request that quietly wrote
      // the channel out the first time would satisfy every other assertion here
      // while reintroducing the very artifact whose absence this is about.
      const ws = await openWorkspace()
      const distRoot = distRootOf(ws.cwd)
      fs.rmSync(distRoot, { recursive: true, force: true })
      expect(fs.existsSync(distRoot), 'the fixture starts with no rendered output').toBe(false)

      for (const channel of DRAFT_SIDE) {
        const root = await ws.get(`/preview/${SLUG}/${channel}/`)
        expect(root.status, channel).toBe(200)
        expect(root.headers.get('content-type'), channel).toContain('text/html')
        const html = await root.text()
        expect(html, channel).toContain(HOME_COPY)
        // The behaviour module really rendered — the fixture is not quietly a
        // bare L1 document with an inert seam.
        expect(html, `${channel}: the mounted behaviour module rendered nothing`).toContain(
          SLIDE_ONE,
        )

        // The stylesheet THE DOCUMENT REFERENCES, read out of the document
        // rather than assumed, so a renamed stylesheet is caught here.
        const href = /<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/.exec(html)?.[1]
        expect(href, `${channel}: the document references no stylesheet`).toBeTruthy()
        const css = await ws.get(
          `/preview/${SLUG}/${channel}/${href!.replace(/^\.?\//, '')}`,
        )
        expect(css.status, `${channel} stylesheet`).toBe(200)
        expect(css.headers.get('content-type'), `${channel} stylesheet`).toContain('text/css')
        expect((await css.text()).length, `${channel} stylesheet`).toBeGreaterThan(0)

        // The site's own asset, over the same origin.
        const asset = await ws.get(`/preview/${SLUG}/${channel}/assets/hero.jpg`)
        expect(asset.status, `${channel} asset`).toBe(200)
        expect(Buffer.from(await asset.arrayBuffer()).equals(ASSET_BYTES)).toBe(true)
      }

      // Nothing was written back. Any number of requests later, the rendered
      // output location still does not exist.
      expect(fs.existsSync(distRoot), 'serving a channel materialised an artifact').toBe(false)
    },
    120000,
  )

  it(
    'test_UAT_AC1032_one_render_backs_both_the_written_artifact_and_the_served_bytes',
    async () => {
      // AC-1032 — for each draft-side channel the set of text artifacts
      // `1c render` writes and the set the origin serves are the SAME set, and
      // each is byte-for-byte the same text. Equality is the claim: two
      // implementations that agree today diverge at the next axis, and the
      // divergence shows up as "it looks different in the builder than when it
      // is published", which is unattributable after the fact.
      const ws = await openWorkspace()

      for (const channel of DRAFT_SIDE) {
        const written = await cmdRender(SLUG, {
          cwd: ws.cwd,
          ...(channel === 'edit' ? { edit: true } : { source: 'draft' as const }),
        })
        const outDir = distDirOf(ws.cwd, channel)
        expect(written.outDir, channel).toBe(outDir)

        const artifacts = textArtifacts(outDir)
        // Not only the pages: the per-site stylesheet is where a new typed axis
        // or a changed token actually lands, and where a second implementation
        // would be most likely to be approximately right rather than identical.
        const pages = artifacts.filter((rel) => rel.endsWith('.html'))
        expect(artifacts, `${channel}: no stylesheet in the channel`).toContain('theme.css')
        expect(
          artifacts.length,
          `${channel}: the artifact set is the pages alone`,
        ).toBeGreaterThan(pages.length)
        expect(pages, `${channel}: fewer than two pages`).toEqual(
          expect.arrayContaining(['about.html', 'home.html', 'index.html']),
        )

        for (const rel of artifacts) {
          const res = await ws.get(`/preview/${SLUG}/${channel}/${rel}`)
          expect(res.status, `${channel}/${rel}`).toBe(200)
          expect(await res.text(), `${channel}/${rel}`).toBe(
            fs.readFileSync(path.join(outDir, rel), 'utf8'),
          )
        }

        // The channel root — the directory address the display panel actually
        // loads — is the home page's bytes.
        const rootRes = await ws.get(`/preview/${SLUG}/${channel}/`)
        expect(rootRes.status, channel).toBe(200)
        expect(await rootRes.text(), `${channel} root`).toBe(
          fs.readFileSync(path.join(outDir, 'index.html'), 'utf8'),
        )
      }
    },
    180000,
  )

  it(
    'test_UAT_AC1033_a_definition_changed_outside_the_workspace_shows_on_the_next_request',
    async () => {
      // AC-1033 — a change made ANYWHERE AT ALL is visible on the next request:
      // nothing re-rendered first, nothing restarted, nothing told the change
      // happened. And it unwinds the same way, so the assertion cannot pass on a
      // rendering that was simply produced once and held.
      const ws = await openWorkspace()

      const before = await Promise.all(
        DRAFT_SIDE.map(async (channel) => (await ws.get(`/preview/${SLUG}/${channel}/`)).text()),
      )
      for (const html of before) expect(html).toContain(HOME_COPY)

      const MARKER = 'Changed from outside the workspace entirely.'
      setHomeCopy(ws.cwd, MARKER)

      // No other action: no render, no restart, no notification.
      for (const channel of DRAFT_SIDE) {
        const res = await ws.get(`/preview/${SLUG}/${channel}/`)
        expect(res.status, channel).toBe(200)
        const html = await res.text()
        expect(html, `${channel} did not follow the definition forward`).toContain(MARKER)
        expect(html, `${channel} still carries the superseded copy`).not.toContain(HOME_COPY)
      }

      // …and back again, so what is served follows the definition in BOTH
      // directions rather than merely having been produced after the change.
      setHomeCopy(ws.cwd, HOME_COPY)
      for (const channel of DRAFT_SIDE) {
        const html = await (await ws.get(`/preview/${SLUG}/${channel}/`)).text()
        expect(html, `${channel} did not follow the definition back`).toContain(HOME_COPY)
        expect(html, `${channel} held the reverted value`).not.toContain(MARKER)
      }
    },
    180000,
  )

  it(
    'test_UAT_AC1034_an_invalid_draft_is_reported_as_a_page_naming_the_field',
    async () => {
      // AC-1034 — a draft that stops describing a valid site is reported IN THE
      // PANE THE OPERATOR IS LOOKING AT — a page, not a machine envelope —
      // naming the field at fault. The last rendering that did validate is not
      // served in its place, and the report stops the moment it stops being true.
      const ws = await openWorkspace()

      const good = await ws.get(`/preview/${SLUG}/draft/`)
      expect(good.status).toBe(200)
      const goodHtml = await good.text()

      // Remove a required part of the definition.
      const home = JSON.parse(fs.readFileSync(homeJsonOf(ws.cwd), 'utf8')) as Record<
        string,
        unknown
      >
      const restore = JSON.stringify(home, null, 2)
      delete home.title
      fs.writeFileSync(homeJsonOf(ws.cwd), JSON.stringify(home, null, 2))

      for (const channel of DRAFT_SIDE) {
        const res = await ws.get(`/preview/${SLUG}/${channel}/`)
        expect(res.status, channel).toBeGreaterThanOrEqual(400)
        expect(res.headers.get('content-type'), channel).toContain('text/html')
        const body = await res.text()
        // A page an operator can read, naming the offending field…
        expect(body, channel).toMatch(/<!doctype html/i)
        expect(body, `${channel} does not name the offending field`).toContain('title')
        // …and NOT the last rendering that did validate.
        expect(body, `${channel} served the last good rendering instead`).not.toContain(HOME_COPY)
        expect(body.length, channel).toBeLessThan(goodHtml.length)
      }

      // Valid again: the next request succeeds, with no restart and no manual
      // re-render.
      fs.writeFileSync(homeJsonOf(ws.cwd), restore)
      for (const channel of DRAFT_SIDE) {
        const res = await ws.get(`/preview/${SLUG}/${channel}/`)
        expect(res.status, channel).toBe(200)
        expect(await res.text(), channel).toContain(HOME_COPY)
      }
    },
    180000,
  )

  it(
    'test_UAT_AC1035_the_published_channel_comes_from_the_publish_time_rendering',
    async () => {
      // AC-1035 — `published` is the immutable rendering publishing produced
      // from a locked revision, served as the public site will serve it. Moving
      // the draft moves both draft-side channels and leaves it where it was:
      // deriving all three from the draft is the obvious way to have one path
      // serve everything, and it would put unpublished work on the published
      // address.
      const ws = await openWorkspace()
      await cmdPublish(SLUG, { cwd: ws.cwd, message: 'first' })

      const publishedDir = distDirOf(ws.cwd, 'published')
      const artifactPath = path.join(publishedDir, 'index.html')
      const artifact = fs.readFileSync(artifactPath, 'utf8')

      // The origin REDIRECTS to where published bytes are served rather than
      // serving them (REQ-149 D4) — public-site owns that channel, and a second
      // origin answering the same question would be the duplicated
      // resolve-and-serve the seam exists to prevent. What matters for this UAT
      // is unchanged: the published channel is an ARTIFACT, not a re-derivation.
      const served = await ws.get(`/preview/${SLUG}/published/`, { redirect: 'manual' })
      expect(served.status).toBe(302)
      expect(served.headers.get('location')).toBe(`https://1stcontact.io/site/${SLUG}/`)

      // Move the draft on, without publishing again.
      const UNPUBLISHED = 'Work that has not been published yet.'
      setHomeCopy(ws.cwd, UNPUBLISHED)

      for (const channel of DRAFT_SIDE) {
        const html = await (await ws.get(`/preview/${SLUG}/${channel}/`)).text()
        expect(html, `${channel} did not follow the draft`).toContain(UNPUBLISHED)
      }

      // The artifact did not move with the draft. This is the whole claim, and
      // it is asserted against the bytes publishing produced rather than against
      // a response, because those bytes are what a publish puts in front of the
      // public — deriving the published channel from today's draft is exactly
      // the mistake this UAT exists to catch.
      const afterBody = fs.readFileSync(artifactPath, 'utf8')
      expect(afterBody, 'unpublished work reached the published artifact').not.toContain(
        UNPUBLISHED,
      )
      expect(afterBody, 'the published channel moved with the draft').toBe(artifact)
    },
    180000,
  )

  it(
    'test_UAT_AC1036_channel_addresses_resolve_as_before_and_never_leave_the_channel',
    async () => {
      // AC-1036 — where a channel's bytes are DECIDED does not change which
      // addresses RESOLVE, and a channel address never reaches outside its own
      // channel.
      const ws = await openWorkspace()

      // A directory address answers with that channel's home page.
      const rootRes = await ws.get(`/preview/${SLUG}/draft/`)
      expect(rootRes.status).toBe(200)
      const homeHtml = await rootRes.text()
      expect(homeHtml).toContain(HOME_COPY)
      expect(homeHtml).toBe(await (await ws.get(`/preview/${SLUG}/draft/home.html`)).text())

      // An address with no file extension answers with the corresponding page —
      // the addresses the public site serves.
      const clean = await ws.get(`/preview/${SLUG}/draft/about`)
      expect(clean.status).toBe(200)
      expect(await clean.text()).toBe(
        await (await ws.get(`/preview/${SLUG}/draft/about.html`)).text(),
      )

      // The two addresses the display panel resolves for a site are the two
      // channel addresses, built exactly as before — so a mode change swaps the
      // pane's source and nothing around it is rebuilt.
      const { previewUrl } = (await import('../apps/control-app/src/builder/api.js')) as {
        previewUrl: (slug: string, channel: string) => string
      }
      for (const channel of DRAFT_SIDE) {
        expect(previewUrl(SLUG, channel)).toBe(`/preview/${SLUG}/${channel}/`)
        expect((await ws.get(previewUrl(SLUG, channel))).status, channel).toBe(200)
      }

      // Never outside its own channel, and never answered from a neighbour.
      const probes: { url: string; secret: string; what: string }[] = [
        {
          what: 'traversal out of the site assets',
          url: `/preview/${SLUG}/draft/assets/../../../../../../etc/passwd`,
          secret: 'root:',
        },
        {
          what: 'the same traversal, percent-encoded',
          url: `/preview/${SLUG}/draft/assets/%2e%2e/%2e%2e/%2e%2e/%2e%2e/%2e%2e/%2e%2e/etc/passwd`,
          secret: 'root:',
        },
        {
          what: 'the same traversal, encoded separators',
          url: `/preview/${SLUG}/draft/assets/..%2f..%2f..%2f..%2f..%2f..%2fetc/passwd`,
          secret: 'root:',
        },
        {
          what: 'a page the channel does not contain',
          url: `/preview/${SLUG}/draft/no-such-page.html`,
          secret: HOME_COPY,
        },
        {
          what: 'a site the store does not hold',
          url: '/preview/no-such-site/draft/',
          secret: HOME_COPY,
        },
      ]
      for (const { url, secret, what } of probes) {
        const res = await ws.get(url)
        expect(res.ok, what).toBe(false)
        expect(res.status, what).toBeGreaterThanOrEqual(400)
        expect(await res.text(), what).not.toContain(secret)
      }
    },
    180000,
  )
})
