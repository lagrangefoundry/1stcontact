/**
 * [[REQ-400]] — **launch readiness: a tab icon and a share card, and a
 * consultant who tells the truth about going live.**
 *
 * DRIVEN THROUGH REAL ENTRY POINTS. Settings are written through the assistant's
 * own toolbox (`set_config`, `make_favicon`) and through the Settings pane's
 * route (`/api/launch`); pages are read back from the builder's draft preview,
 * which is the same `renderSiteFiles` a publish runs. The one thing faked is the
 * image renderer, which is Cloudflare Images in production — an external
 * boundary — so the fake records what it was asked for and answers bytes this
 * suite can recognise in the store afterwards.
 *
 * THE FALSIFIERS:
 *   - an icon or card that is set and does not reach EVERY page's head;
 *   - a site with neither that grows empty or default-only tags anyway;
 *   - an icon that needed an upload, or that was not cut square at both sizes;
 *   - a share image that can name an off-site URL, a script, or a missing file;
 *   - a share image a link-preview crawler cannot resolve on the served page;
 *   - a consultant who is still not told where the domain is connected, or what
 *     happens to a contact-form message.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { cmdNew, startBuilder, type BuilderHandle } from '../tools/generate/src/cli'
import { ctxOf } from '../tools/generate/src/cli/commands'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox'
import { primingConfig, primingText } from '../tools/generate/src/cli/ai/roles'
import { siteImageLibrary } from '../tools/generate/src/cli/edit'
import { iconMaker, type IconMaker } from '../tools/generate/src/cli/favicon'
import type { EditOp, ImageRenderer } from '../tools/generate/src/cli/image-recipe'
import { fsSiteStore } from '../tools/generate/src/store'
import { siteSchema } from '../packages/site-schema/src/index'
import { absolutizeShareImages } from '../packages/framework/src/share-card'
import { previewUrl } from '../apps/control-app/src/builder/api.js'

const REPO = path.resolve(__dirname, '..')
const SLUG = 'studio'

let cwd: string
let builder: BuilderHandle | null = null

interface Box {
  run: (tool: string, input: Record<string, unknown>) => Promise<string>
}

function consultant(icons?: IconMaker): Promise<Box> {
  return createL1Toolbox(SLUG, { cwd, ...(icons ? { icons } : {}) }) as Promise<Box>
}

function store() {
  return fsSiteStore(ctxOf({ cwd }))
}

function draftDir(): string {
  return path.join(cwd, 'storage', 'sites', SLUG, 'draft')
}

function storedSite(): { config: Record<string, unknown> } {
  return JSON.parse(fs.readFileSync(path.join(draftDir(), 'site.json'), 'utf8'))
}

async function page(name: string): Promise<string> {
  const res = await fetch(new URL(previewUrl(SLUG, 'draft', name), builder!.url))
  expect(res.status).toBe(200)
  return res.text()
}

function head(html: string): string {
  return html.slice(html.indexOf('<head>'), html.indexOf('</head>'))
}

/** The image renderer, faked at its external boundary: it records every ask. */
function fakeRenderer(size: { width: number; height: number }) {
  const asks: { recipe: readonly EditOp[]; width?: number; type?: string }[] = []
  const renderer: ImageRenderer = {
    measure: async () => size,
    render: async (_bytes, _type, recipe, opts = {}) => {
      asks.push({ recipe, width: opts.width, type: opts.type })
      return {
        bytes: new TextEncoder().encode(`icon-${opts.width}`),
        mediaType: 'image/png',
        width: opts.width ?? size.width,
        height: opts.width ?? size.height,
      }
    },
  }
  return { renderer, asks }
}

beforeEach(async () => {
  cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'req400-'))
  cmdNew(SLUG, { cwd })
  await store().write(SLUG, {
    assets: [
      { name: 'logo.png', bytes: new TextEncoder().encode('logo') },
      { name: 'team.jpg', bytes: new TextEncoder().encode('team') },
    ],
  })
  const box = await consultant()
  await box.run('add_page', { page: 'about', title: 'About', path: 'about' })
})

afterEach(async () => {
  await builder?.close()
  builder = null
  if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
})

async function openBuilder(): Promise<void> {
  builder = await startBuilder({ cwd, clientDir: path.join(REPO, 'apps/control-app/src/builder') })
}

describe('REQ-400 — the icon and card reach every page head', () => {
  it('test_UAT_FC_REQ-400_set_icon_and_card_render_in_every_page_head', async () => {
    const box = await consultant()
    await box.run('set_config', {
      key: 'config',
      settings: {
        favicon: { icon: 'logo.png', appleTouchIcon: 'logo.png' },
        shareCard: { image: 'team.jpg', description: 'Plumbing across Dublin' },
      },
    })
    await openBuilder()
    for (const slug of ['home', 'about']) {
      const h = head(await page(slug))
      expect(h).toContain('<link rel="icon" href="assets/logo.png" />')
      expect(h).toContain('<link rel="apple-touch-icon" sizes="180x180" href="assets/logo.png" />')
      expect(h).toContain('<meta property="og:image" content="assets/team.jpg" />')
      expect(h).toContain('<meta name="twitter:image" content="assets/team.jpg" />')
      expect(h).toContain('<meta name="twitter:card" content="summary_large_image" />')
      // The card's description was set, so it wins over the page's own SEO text.
      expect(h).toContain('<meta property="og:description" content="Plumbing across Dublin" />')
    }
  })

  it('test_UAT_FC_REQ-400_an_unset_card_title_falls_back_to_the_page_then_the_site_name', async () => {
    const box = await consultant()
    await box.run('set_config', { key: 'config', settings: { shareCard: { image: 'team.jpg' } } })
    const name = String(storedSite().config.businessName)
    const homeSeo = JSON.parse(fs.readFileSync(path.join(draftDir(), 'pages', 'home.json'), 'utf8')).seoMeta
    await openBuilder()
    // `about` was added bare and says nothing about itself: the site's name.
    expect(head(await page('about'))).toContain(`<meta property="og:title" content="${name}" />`)
    // `home` carries its own SEO title, which answers where the card is silent.
    expect(head(await page('home'))).toContain(`<meta property="og:title" content="${homeSeo.title}" />`)
  })

  it('test_UAT_FC_REQ-400_a_card_title_the_client_set_wins_on_every_page', async () => {
    const box = await consultant()
    await box.run('set_config', { key: 'config', settings: { shareCard: { title: 'Come on in' } } })
    await openBuilder()
    for (const slug of ['home', 'about']) {
      const h = head(await page(slug))
      expect(h).toContain('<meta property="og:title" content="Come on in" />')
      // No picture, so the small card and no image tags.
      expect(h).toContain('<meta name="twitter:card" content="summary" />')
      expect(h).not.toContain('og:image')
    }
  })

  it('test_UAT_FC_REQ-400_a_site_without_them_renders_no_icon_or_card_tags', async () => {
    await openBuilder()
    for (const slug of ['home', 'about']) {
      const h = head(await page(slug))
      expect(h).toContain('<title>')
      expect(h).not.toContain('rel="icon"')
      expect(h).not.toContain('apple-touch-icon')
      expect(h).not.toContain('og:')
      expect(h).not.toContain('twitter:')
    }
  })

  it('test_UAT_FC_REQ-400_a_page_override_replaces_the_site_card_for_that_page', async () => {
    const box = await consultant()
    await box.run('set_config', { key: 'config', settings: { shareCard: { image: 'team.jpg' } } })
    await box.run('update_page', { page: 'about', seo: { title: 'About us', description: 'Who we are', ogImage: 'logo.png' } })
    await openBuilder()
    const about = head(await page('about'))
    expect(about).toContain('<meta property="og:title" content="About us" />')
    expect(about).toContain('<meta property="og:image" content="assets/logo.png" />')
    expect(head(await page('home'))).toContain('<meta property="og:image" content="assets/team.jpg" />')
  })
})

describe('REQ-400 — the icon is made from a picture the site already has', () => {
  it('test_UAT_FC_REQ-400_make_favicon_cuts_both_sizes_from_an_existing_picture_without_upload', async () => {
    const before = (await store().listAssets(SLUG)).sort()
    const { renderer, asks } = fakeRenderer({ width: 200, height: 100 })
    const box = await consultant(iconMaker(siteImageLibrary(SLUG, store()), renderer))
    // By its stem, the way an assistant that has just looked at it names it.
    await box.run('make_favicon', { image: 'logo' })

    const after = (await store().listAssets(SLUG)).sort()
    expect(after).toEqual([...before, 'apple-touch-icon.png', 'favicon.png'].sort())
    expect(new TextDecoder().decode((await store().readAsset(SLUG, 'favicon.png'))!)).toBe('icon-32')
    expect(new TextDecoder().decode((await store().readAsset(SLUG, 'apple-touch-icon.png'))!)).toBe('icon-180')
    // Both sizes, as PNG, cut from the centred square of a 2:1 picture.
    expect(asks.map((a) => a.width).sort((x, y) => x! - y!)).toEqual([32, 180])
    for (const ask of asks) {
      expect(ask.type).toBe('image/png')
      expect(ask.recipe).toEqual([{ op: 'crop', left: 0.25, right: 0.25 }])
    }
    expect(storedSite().config.favicon).toEqual({ icon: 'favicon.png', appleTouchIcon: 'apple-touch-icon.png' })

    await openBuilder()
    const h = head(await page('about'))
    expect(h).toContain('<link rel="icon" href="assets/favicon.png" />')
    expect(h).toContain('href="assets/apple-touch-icon.png"')
  })

  it('test_UAT_FC_REQ-400_make_favicon_refuses_in_a_sentence_without_a_renderer', async () => {
    const box = await consultant()
    const answer = await box.run('make_favicon', { image: 'logo.png' })
    expect(answer).toContain('ENVIRONMENT')
    expect(answer).toContain('no image renderer')
    expect(storedSite().config.favicon).toBeUndefined()
  })
})

describe('REQ-400 — only the site\'s own assets, only typed fields', () => {
  it('test_UAT_FC_REQ-400_schema_rejects_non_asset_share_images_and_unknown_keys', () => {
    const site = { ...storedSite(), pages: [] } as Record<string, unknown> & { config: Record<string, unknown> }
    const withConfig = (extra: Record<string, unknown>) => ({ ...site, config: { ...site.config, ...extra } })

    expect(siteSchema.safeParse(withConfig({ shareCard: { image: 'team.jpg' } })).success).toBe(true)
    for (const image of ['https://elsewhere.example/x.png', 'javascript:alert(1)', '../secret.png', '/assets/team.jpg', 'a b.png']) {
      expect(siteSchema.safeParse(withConfig({ shareCard: { image } })).success, image).toBe(false)
    }
    expect(siteSchema.safeParse(withConfig({ shareCard: { image: 'team.jpg', html: '<script>' } })).success).toBe(false)
    expect(siteSchema.safeParse(withConfig({ favicon: { icon: 'logo.png', style: 'x' } })).success).toBe(false)
    expect(siteSchema.safeParse(withConfig({ favicon: { icon: 'data:image/png;base64,AAAA' } })).success).toBe(false)
  })

  it('test_UAT_FC_REQ-400_a_write_naming_a_missing_asset_is_refused', async () => {
    const box = await consultant()
    const answer = await box.run('set_config', { key: 'config', settings: { shareCard: { image: 'nowhere.jpg' } } })
    expect(answer).toContain('SCHEMA_INVALID')
    expect(answer).toContain('nowhere.jpg')
    expect(storedSite().config.shareCard).toBeUndefined()
  })
})

describe('REQ-400 — the Settings pane reads and changes them', () => {
  it('test_UAT_FC_REQ-400_settings_route_reads_and_replaces_the_share_card', async () => {
    await openBuilder()
    const url = new URL('/api/launch', builder!.url)
    const read = await (await fetch(`${url}?site=${SLUG}`)).json()
    expect(read.shareCard).toBeNull()
    expect(read.favicon).toBeNull()
    expect(read.defaults.title).toBe(String(storedSite().config.businessName))
    expect(read.images.sort()).toEqual(['logo.png', 'team.jpg'])

    const post = (body: Record<string, unknown>) =>
      fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ site: SLUG, ...body }) })

    const saved = await (await post({ op: 'card', image: 'team.jpg', title: 'Come on in', description: '' })).json()
    expect(saved.shareCard).toEqual({ image: 'team.jpg', title: 'Come on in' })
    expect(head(await page('home'))).toContain('<meta property="og:title" content="Come on in" />')

    // Emptying every box removes the card, and the head carries none again.
    const cleared = await (await post({ op: 'card', image: '', title: '', description: '' })).json()
    expect(cleared.shareCard).toBeNull()
    expect(head(await page('home'))).not.toContain('og:')
  })

  it('test_UAT_FC_REQ-400_settings_route_refuses_an_icon_without_a_renderer', async () => {
    await openBuilder()
    const res = await fetch(new URL('/api/launch', builder!.url), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ site: SLUG, op: 'icon', image: 'logo.png' }),
    })
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('ENVIRONMENT')
    expect(storedSite().config.favicon).toBeUndefined()
  })
})

describe('REQ-400 — a crawler can resolve the card picture on the served page', () => {
  it('test_UAT_FC_REQ-400_served_page_carries_an_absolute_share_image', async () => {
    const box = await consultant()
    await box.run('set_config', { key: 'config', settings: { shareCard: { image: 'team.jpg' } } })
    await openBuilder()
    const html = await page('about')
    const served = absolutizeShareImages(html, 'https://plumber.example/about')
    expect(served).toContain('<meta property="og:image" content="https://plumber.example/assets/team.jpg" />')
    expect(served).toContain('<meta name="twitter:image" content="https://plumber.example/assets/team.jpg" />')
    // Stamping twice is the identity, and a page with no card is untouched.
    expect(absolutizeShareImages(served, 'https://other.example/')).toBe(served)
    const plain = '<html><head><title>x</title></head><body></body></html>'
    expect(absolutizeShareImages(plain, 'https://plumber.example/')).toBe(plain)
  })
})

describe('REQ-400 — the consultant is told the going-live facts', () => {
  it('test_UAT_FC_REQ-400_consultant_priming_states_the_going_live_facts', () => {
    const text = primingText('going-live')
    expect(text).toContain('Settings tab')
    expect(text).toContain('settings assistant')
    expect(text).toContain('make_favicon')
    expect(text).toContain('Contacts tab')
    expect(text).toContain('not notified')
    expect(text).toContain('never give a date')
    expect(text).toContain('If you are not sure whether something exists, say so')
    for (const withCorpus of [true, false]) {
      const names = (primingConfig(withCorpus).priming as { name?: string }[]).map((e) => e.name)
      expect(names).toContain('going-live')
    }
  })
})
