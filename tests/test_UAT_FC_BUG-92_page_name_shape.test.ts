import { existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { validateSite } from '../packages/site-schema/src'
import type { ValidationError } from '../packages/site-schema/src/validate'
import { starterHomePage, starterSiteJson } from '../tools/generate/src/cli/scaffold'
import { loadSite } from '../tools/generate/src/store/loadSite'
import { readHistory } from '../tools/generate/src/store/history'
import { editPageAdd, editPageList, editPageUpdate } from '../tools/generate/src/cli/edit'
import { CommandError } from '../tools/generate/src/cli/errors'
import { renderSiteFiles } from '../tools/generate/src/render/render'
import { makeMemorySite } from './support/site-factory'
import { L1_CORPUS_CWD, L1_CORPUS_SITES } from './fixtures/l1-corpus/corpus'

/**
 * BUG-92 — a page name is one segment, refused at the write.
 *
 * WHAT WENT WRONG. The assistant added a page with the address
 * `papers/download`. Nothing between the tool call and the store looked at the
 * shape of the value, so the write was accepted. Every render after it threw —
 * `renderSiteFiles` refuses a nested slug, correctly, because REQ-109 emits
 * asset URLs document-relative and that is only sound while pages sit flat at
 * the snapshot root — and because that guard runs inside the page loop, ONE bad
 * page took down EVERY page. The draft preview, the publish and the live site
 * went dark together.
 *
 * WHAT THESE PIN is therefore not "the renderer refuses it" (REQ-109 already
 * pins that, and it still holds) but that **the renderer never gets the
 * chance**: the value is refused where the author can still act on it, and the
 * site the author already had keeps rendering.
 *
 * Asserted on `validateSite` — the contract every writer funnels through — and
 * on the real authoring entry points (`editPageAdd` / `editPageUpdate`, which
 * are what the AI toolbox's `add_page` / `update_page` call), never on a
 * hand-built approximation of them.
 */


/** A one-page site whose home page carries `slug`. */
function siteWithSlug(slug: string): Record<string, unknown> {
  const base = starterSiteJson('slug-fixture')
  return { ...base, pages: [{ ...starterHomePage('slug-fixture'), slug }] }
}

/** Validation errors for a site whose only page is slugged `slug` (empty = valid). */
function errorsFor(slug: string): ValidationError[] {
  const result = validateSite(siteWithSlug(slug))
  return result.ok ? [] : result.errors
}

/** The error reported against the page's slug, if there is one. */
function slugIssue(slug: string): ValidationError | undefined {
  return errorsFor(slug).find((e) => e.path === '/pages/0/slug')
}

describe('BUG-92 — a slug that is not one segment is refused', () => {
  // The reported value first, then the family it belongs to. A backslash is
  // here because the renderer refused it too: a Windows-shaped separator is a
  // separator to a later reader even when it is not one to this one.
  const refused = [
    'papers/download',
    'papers\\download',
    '/leading',
    'trailing/',
    'a/b/c',
    '..',
    '.',
    '../escape',
    '.hidden',
    '',
    'two words',
    'question?',
    'hash#tag',
    'per%20cent',
  ]

  it.each(refused)('refuses %j at a machine-readable path', (slug) => {
    const issue = slugIssue(slug)
    expect(issue, `no error at /pages/0/slug for ${JSON.stringify(slug)}`).toBeDefined()
  })

  it('says why, and names a slug that would work', () => {
    // An AI author self-corrects from the refusal text (DOC-8 §6). A message
    // that only says "invalid" costs a round trip to discover what to write
    // instead — so the flat form of the slug they actually wrote is in it.
    const message = slugIssue('papers/download')!.message
    expect(message).toContain('papers/download')
    expect(message).toMatch(/flat|one segment/i)
    expect(message).toContain('papers-download')
  })

  it('reports one issue per slug, not one per rule', () => {
    // `de/luxe` is malformed AND has a locale-shaped head. Reporting both
    // invites the author to fix the wrong half.
    const errors = errorsFor('de/luxe').filter((e) => e.path === '/pages/0/slug')
    expect(errors).toHaveLength(1)
    expect(errors[0]!.message).toMatch(/flat|one segment/i)
  })
})

describe('BUG-92 — a slug the snapshot already spends is refused', () => {
  it('refuses `index`, because that is the home page', () => {
    // `renderSiteFiles` writes `index.html` from the home page AFTER the page
    // loop, so a second page slugged `index` is rendered and then silently
    // overwritten — its address serves somebody else's bytes, with no error.
    const message = slugIssue('index')!.message
    expect(message).toMatch(/home/i)
  })

  it('refuses a `.html` tail, which collides the other way', () => {
    // A page slugged `about.html` renders to `about.html.html`, so `/about.html`
    // resolves to whatever `about.html` is — the page slugged `about`, if there
    // is one. Two addresses, one page, nothing raised anywhere.
    const message = slugIssue('about.html')!.message
    expect(message).toContain('about.html')
    expect(message).toContain('about')
  })
})

describe('BUG-92 — the rule is not over-eager', () => {
  const allowed = [
    // The slugs the real sites use.
    'home',
    'contact',
    'whitepapers',
    // The flat form of the slug that caused this.
    'papers-download',
    // Every character the set admits, including the ones a stricter rule would
    // have cost: an underscore and a dot are unreserved in RFC 3986 and survive
    // a URL, an R2 key and a filename with no encoding.
    'about_us',
    'Products',
    'v1.2',
    'a',
    '2026-review',
    // REQ-153's allowed list, which this rule must not narrow.
    'design',
    'de-luxe',
    'zh-Hans',
  ]

  it.each(allowed)('accepts %s', (slug) => {
    expect(errorsFor(slug)).toEqual([])
  })
})

describe('BUG-92 — a page id is one segment too', () => {
  it('refuses a nested id, which would be a nested store key', () => {
    // The id is the key the page is stored under (`<id>.json`), so a separator
    // in it produces a nesting nobody asked for on the other path.
    const base = starterSiteJson('id-fixture')
    const result = validateSite({
      ...base,
      pages: [{ ...starterHomePage('id-fixture'), id: 'papers/download', slug: 'download' }],
    })
    expect(result.ok).toBe(false)
    const issue = result.ok ? undefined : result.errors.find((e) => e.path === '/pages/0/id')
    expect(issue).toBeDefined()
    expect(issue!.message).toContain('papers-download')
  })
})

describe('BUG-92 — the authoring path refuses it, and the site keeps working', () => {
  it('test_UAT_FC_BUG-92_add_page_refuses_a_nested_address', async () => {
    const site = makeMemorySite()
    try {
      const attempt = editPageAdd(site.slug, 'download', {
        ...site.opts,
        path: 'papers/download',
      })
      await expect(attempt).rejects.toBeInstanceOf(CommandError)
      const error = await attempt.catch((e: unknown) => e as CommandError)

      // The refusal reaches the caller as itself, not flattened into
      // "definition failed schema validation" — the path names the offending
      // field and the message carries the slug to write instead.
      expect(error.code).toBe('SCHEMA_INVALID')
      expect(error.path).toBe('/pages/1/slug')
      expect(error.message).toContain('papers-download')

      // Total: no half-written page is left behind.
      const pages = ((await editPageList(site.slug, site.opts)).data as { pages: { id: string }[] })
        .pages
      expect(pages.map((p) => p.id)).toEqual(['home'])
    } finally {
      site.dispose()
    }
  })

  it('test_UAT_FC_BUG-92_the_site_still_renders_after_the_refusal', async () => {
    // THE SYMPTOM, ASSERTED DIRECTLY. Before this change the bad page was
    // written and every page stopped rendering. The strong observation is not
    // that the call failed — it is that the site the author already had is
    // still there afterwards, bytes and all.
    const site = makeMemorySite()
    try {
      await editPageAdd(site.slug, 'download', { ...site.opts, path: 'papers/download' }).catch(
        () => undefined,
      )

      const draft = await site.store.loadDraft(site.slug)
      expect(draft!.result.ok, draft!.result.ok ? '' : JSON.stringify(draft!.result)).toBe(true)
      const loaded = draft!.result.ok ? draft!.result.value : null

      const out = await renderSiteFiles(loaded!)
      expect(out.pages).toContain('home.html')
      expect(out.pages).toContain('index.html')
      expect(out.files.get('home.html')).toContain('<!DOCTYPE html>')
    } finally {
      site.dispose()
    }
  })

  it('test_UAT_FC_BUG-92_the_flat_address_is_accepted', async () => {
    // The guard refuses a shape, not the page: what the author was trying to do
    // is one edit away, and the message already said which edit.
    const site = makeMemorySite()
    try {
      await editPageAdd(site.slug, 'download', { ...site.opts, path: 'papers-download' })
      const pages = (
        (await editPageList(site.slug, site.opts)).data as { pages: { id: string; slug: string }[] }
      ).pages
      expect(pages.map((p) => p.id).sort()).toEqual(['download', 'home'])
      expect(pages.find((p) => p.id === 'download')!.slug).toBe('papers-download')
    } finally {
      site.dispose()
    }
  })

  it('test_UAT_FC_BUG-92_update_page_refuses_a_nested_address', async () => {
    // `add_page` is not the only way in: the same value arrives through a
    // rename, and one rule behind `validateSite` is what makes both refuse.
    const site = makeMemorySite()
    try {
      const attempt = editPageUpdate(site.slug, 'home', { ...site.opts, path: 'a/b' })
      await expect(attempt).rejects.toBeInstanceOf(CommandError)
      const error = await attempt.catch((e: unknown) => e as CommandError)
      expect(error.code).toBe('SCHEMA_INVALID')
      expect(error.path).toBe('/pages/0/slug')
    } finally {
      site.dispose()
    }
  })
})

describe('BUG-92 — a site already holding a nested slug is repairable', () => {
  it('test_UAT_FC_BUG-92_a_stored_nested_slug_is_named_and_then_fixed', async () => {
    // The rule must not brick the sites it was written for. A definition that
    // predates it fails to LOAD — loudly, naming the field, which is already
    // better than the render throw it replaces — while the edit path reads
    // pages raw from the store, so the repair is an ordinary `update_page`.
    const site = makeMemorySite()
    try {
      // As the store found it: written before the rule existed.
      await editPageAdd(site.slug, 'download', { ...site.opts, path: 'download' })
      const stored = await site.store.readPages(site.slug)
      const broken = stored.find((f) => f.page.id === 'download')!
      await site.store.write(site.slug, {
        pages: [{ name: broken.name, page: { ...broken.page, slug: 'papers/download' } }],
      })

      const before = await site.store.loadDraft(site.slug)
      expect(before!.result.ok).toBe(false)
      const errors = before!.result.ok ? [] : before!.result.errors
      expect(errors.some((e) => e.path.endsWith('/slug'))).toBe(true)

      await editPageUpdate(site.slug, 'download', { ...site.opts, path: 'papers-download' })

      const after = await site.store.loadDraft(site.slug)
      expect(after!.result.ok, after!.result.ok ? '' : JSON.stringify(after!.result)).toBe(true)
      const loaded = after!.result.ok ? after!.result.value : null
      const out = await renderSiteFiles(loaded!)
      expect(out.pages).toContain('papers-download.html')
    } finally {
      site.dispose()
    }
  })
})

describe('BUG-92 — every stored site still validates', () => {
  const sitesRoot = L1_CORPUS_SITES
  const slugs = existsSync(sitesRoot)
    ? readdirSync(sitesRoot).filter((n) => statSync(path.join(sitesRoot, n)).isDirectory())
    : []

  it('finds sites to check', () => {
    // Guards the suite against passing on an empty list.
    expect(slugs.length).toBeGreaterThan(0)
  })

  it.each(slugs)('%s: draft loads and validates', (slug) => {
    const result = loadSite({ cwd: L1_CORPUS_CWD, root: 'sites' }, slug, 'draft')
    expect(result.ok, result.ok ? '' : JSON.stringify(result.errors)).toBe(true)
  })

  // A published revision is frozen: a rule that broke one could not be edited
  // out of it. Checking every revision that exists is the only honest form.
  const revisions = slugs.flatMap((slug) =>
    readHistory({ cwd: L1_CORPUS_CWD, root: 'sites' }, slug).revisions.map((r) => [slug, r.id] as const),
  )

  it.each(revisions)('%s: published revision %i still validates', (slug, id) => {
    const result = loadSite({ cwd: L1_CORPUS_CWD, root: 'sites' }, slug, id)
    expect(result.ok, result.ok ? '' : JSON.stringify(result.errors)).toBe(true)
  })
})
