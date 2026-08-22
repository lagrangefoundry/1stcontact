import { existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { validateSite } from '../packages/site-schema/src'
import type { ValidationError } from '../packages/site-schema/src/validate'
import { starterHomePage, starterSiteJson } from '../tools/generate/src/cli/scaffold'
import { loadSite } from '../tools/generate/src/store/loadSite'
import { readHistory } from '../tools/generate/src/store/history'
import { editPageAdd, editPageList } from '../tools/generate/src/cli/edit'
import { CommandError } from '../tools/generate/src/cli/errors'
import { makeMemorySite } from './support/site-factory'

/**
 * REQ-153 — a page slug may not be mistaken for a locale.
 *
 * What these pin is not a crash but an *irreversible* ambiguity. A published
 * revision is an immutable snapshot (DOC-12 §7) and its URLs are what inbound
 * links, search rankings and anything a customer printed all point at — so a
 * page live at `/de` cannot later be moved out of the way of a `/de/about`
 * language prefix, only broken. The guard is worth having only if it fires
 * before the first publish, which is why it lives in the schema every authoring
 * path already runs through rather than in a lint someone remembers to call.
 *
 * The claims are asserted on `validateSite` — the real entry point every writer
 * (`1c edit page add`, the AI toolbox, the store loader) funnels through — and
 * on the actual definitions in `storage/sites/`, not on hand-built fixtures
 * standing in for them.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.join(HERE, '..')

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

describe('REQ-153 AC-1 — a locale-shaped slug is refused, with a reason', () => {
  // Bare ISO 639-1, the language-region form in both cases, and the numeric
  // region form (`/es-419/…`). Mixed case is here because `/DE` collides with a
  // `de` prefix exactly as `/de` does.
  const reserved = ['de', 'fr', 'pt-BR', 'pt-br', 'DE', 'es-419', 'en', 'ga']

  it.each(reserved)('rejects %s at a machine-readable path', (slug) => {
    const errors = errorsFor(slug)
    expect(errors.length).toBeGreaterThan(0)

    // The path is what an AI author self-corrects from (DOC-8 §6): it must name
    // the offending field, not the document.
    const issue = errors.find((e) => e.path === '/pages/0/slug')
    expect(issue, `no error at /pages/0/slug — got ${JSON.stringify(errors)}`).toBeDefined()

    // Actionable: says WHY it is refused, and gives a slug that would work.
    // A message that reads as arbitrary gets worked around, not obeyed.
    const message = issue!.message
    expect(message).toContain(slug)
    expect(message).toMatch(/locale/i)
    expect(message).toMatch(new RegExp(`${slug.toLowerCase()}-services`))
    expect(message).toMatch(new RegExp(`about-${slug.toLowerCase()}`))
  })
})

describe('REQ-153 AC-2 — only the exact locale forms, never a prefix', () => {
  const allowed = [
    // Begin with a language code and are plainly not locales.
    'design',
    'deals',
    'delivery',
    'french-lessons',
    'portfolio',
    'english',
    // Two letters, but no language bears these codes.
    'zz',
    'qq',
    // Language-shaped head, but the tail is not a region subtag. The
    // four-letter tails matter most: reserving them would cost ordinary English
    // slugs to defend a script-qualified prefix nobody serves.
    'no-fee',
    'de-luxe',
    'no-cost',
    'it-team',
    'zh-Hans',
    'pt-brazil',
    // The slugs both real sites actually use.
    'home',
    'contact',
    'whitepapers',
  ]

  it.each(allowed)('accepts %s', (slug) => {
    expect(errorsFor(slug)).toEqual([])
  })
})

describe('REQ-153 AC-3 — every stored site still validates', () => {
  const sitesRoot = path.join(REPO, 'storage', 'sites')
  const slugs = existsSync(sitesRoot)
    ? readdirSync(sitesRoot).filter((n) => statSync(path.join(sitesRoot, n)).isDirectory())
    : []

  it('finds sites to check', () => {
    // Guards the suite against silently passing on an empty list — an AC that
    // asserts nothing is worse than an absent one.
    expect(slugs.length).toBeGreaterThan(0)
  })

  it.each(slugs)('%s: draft loads and validates', (slug) => {
    const result = loadSite({ cwd: REPO, root: 'sites' }, slug, 'draft')
    expect(result.ok, result.ok ? '' : JSON.stringify(result.errors)).toBe(true)
  })

  // A published revision is frozen: if the rule broke one, no edit could rescue
  // it. Checking every revision that exists is the only honest form of AC-3.
  const revisions = slugs.flatMap((slug) =>
    readHistory({ cwd: REPO, root: 'sites' }, slug).revisions.map((r) => [slug, r.id] as const),
  )

  it.each(revisions)('%s: published revision %i still validates', (slug, id) => {
    const result = loadSite({ cwd: REPO, root: 'sites' }, slug, id)
    expect(result.ok, result.ok ? '' : JSON.stringify(result.errors)).toBe(true)
  })
})

describe('REQ-153 AC-1 — the authoring path refuses it too', () => {
  // `validateSite` is the contract, but nobody types JSON at it: an author adds
  // a page with `1c edit page add` (or the AI toolbox's `add_page`, which is the
  // same call). Asserting there is what proves the guard is reachable, and that
  // the message survives the projection into a CLI error rather than being
  // flattened to "definition failed schema validation".
  it('cannot create a page at /de, and says why', async () => {
    const site = makeMemorySite()
    try {
      const attempt = editPageAdd(site.slug, 'languages', { ...site.opts, path: 'de' })
      await expect(attempt).rejects.toBeInstanceOf(CommandError)
      const error = await attempt.catch((e: unknown) => e as CommandError)

      expect(error.code).toBe('SCHEMA_INVALID')
      expect(error.path).toBe('/pages/1/slug')
      expect(error.message).toMatch(/locale/i)
      expect(error.message).toContain('about-de')

      // The refusal is total: no half-written page is left behind.
      const pages = ((await editPageList(site.slug, site.opts)).data as { pages: { id: string }[] })
        .pages
      expect(pages.map((p) => p.id)).toEqual(['home'])
    } finally {
      site.dispose()
    }
  })

  it('creates the same page at a qualified slug', async () => {
    const site = makeMemorySite()
    try {
      await editPageAdd(site.slug, 'languages', { ...site.opts, path: 'de-services' })
      const pages = ((await editPageList(site.slug, site.opts)).data as { pages: { id: string }[] })
        .pages
      expect(pages.map((p) => p.id).sort()).toEqual(['home', 'languages'])
    } finally {
      site.dispose()
    }
  })
})
