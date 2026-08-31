import { existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  COUNTRY_DEFAULTS,
  UNDECLARED_LOCALE,
  localeDirection,
  resolveSiteLocale,
  validateSite,
} from '../packages/site-schema/src'
import type { L1Document, Site } from '../packages/site-schema/src'
import type { ValidationError } from '../packages/site-schema/src/validate'
import { renderL1Page } from '../packages/framework/src/l1/render'
import { renderSiteFiles } from '../tools/generate/src/render'
import type { ModuleResolver } from '../tools/generate/src/render/render'
import type { BehaviorDefinition, BehaviorProps } from '../packages/framework/src/modules/behavior'
import { starterHomePage, starterSiteJson } from '../tools/generate/src/cli/scaffold'
import type { LoadedSite } from '../tools/generate/src/store/assemble'
import { loadSite } from '../tools/generate/src/store/loadSite'
import { readHistory } from '../tools/generate/src/store/history'
import { editPageAdd, editPageList } from '../tools/generate/src/cli/edit'
import { CommandError } from '../tools/generate/src/cli/errors'
import { makeMemorySite } from './support/site-factory'

/**
 * Story story-17ba490e — a site says where it is, and every page declares it.
 *
 * The claims are asserted on RENDERED ARTIFACTS wherever the AC is about
 * rendering: the value that matters is the attribute baked into a published
 * revision, not the resolver's return value. A published revision is an
 * immutable snapshot, so a wrong `lang` or a colliding slug cannot be rescued
 * by fixing the renderer afterwards.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.join(HERE, '..')
const SITES_ROOT = path.join(REPO, 'storage', 'sites')
const STORE_CTX = { cwd: REPO, root: 'sites' } as const

/** The site definition a test renders: the scaffolder's, plus locale config. */
function siteJson(config: Record<string, unknown> = {}): Record<string, unknown> {
  const base = starterSiteJson('locale-fixture') as Record<string, unknown>
  return {
    ...base,
    config: { ...(base.config as Record<string, unknown>), ...config },
    pages: [starterHomePage('locale-fixture')],
  }
}

/** Validate, failing loudly with the projected errors rather than casting. */
function validated(config: Record<string, unknown> = {}): Site {
  const result = validateSite(siteJson(config))
  if (!result.ok) throw new Error(`unexpected validation failure: ${JSON.stringify(result.errors)}`)
  return result.value
}

/** Render through the generator path and return the opening `<html …>` tag. */
async function generatorHtmlTag(config: Record<string, unknown> = {}): Promise<string> {
  const site = validated(config)
  const loaded: LoadedSite = {
    slug: 'locale-fixture',
    sourceDir: '(memory)',
    site,
    assetFiles: [],
  }
  const rendered = await renderSiteFiles(loaded)
  const html = rendered.files.get('index.html')
  expect(html, 'the generator rendered no index.html').toBeTruthy()
  return /<html[^>]*>/.exec(html!)![0]
}

/** The same for the framework's standalone L1 page render path. */
function frameworkHtmlTag(config: Record<string, unknown> = {}): string {
  const site = validated(config)
  const doc = site.pages[0].l1 as L1Document
  return /<html[^>]*>/.exec(renderL1Page(doc, 'locale-fixture', site.config))![0]
}

/** `lang` / `dir` read back off an opening `<html …>` tag. */
function langDir(tag: string): { lang: string | null; dir: string | null } {
  return {
    lang: /\blang="([^"]*)"/.exec(tag)?.[1] ?? null,
    dir: /\bdir="([^"]*)"/.exec(tag)?.[1] ?? null,
  }
}

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

/** The platform's stored sites, discovered at verification time. */
function storedSiteSlugs(): string[] {
  if (!existsSync(SITES_ROOT)) return []
  return readdirSync(SITES_ROOT).filter((name) => statSync(path.join(SITES_ROOT, name)).isDirectory())
}

/**
 * A stand-in behavior module that renders nothing but what it was handed.
 *
 * Injected rather than asserted against a shipping module because the modules
 * that will consume the locale (payments, calendar) do not exist yet. The claim
 * under test is the seam, so the module proving it should be the smallest thing
 * that can observe the seam and nothing else.
 */
function echoLocaleResolver(seen: BehaviorProps[]): ModuleResolver {
  const definition = {
    meta: {
      id: 'echo-locale',
      version: 1,
      kind: 'behavior',
      config: {},
      slots: {},
      conformance: { isolation: 'none', invariantElements: [] },
    },
    Component: (props: BehaviorProps) => {
      seen.push(props)
      return `<div data-locale="${props.locale?.locale ?? ''}" data-currency="${props.locale?.currency ?? ''}"></div>`
    },
  } as unknown as BehaviorDefinition
  return () => definition
}

describe('story-17ba490e — site locale identity', () => {
  it('test_UAT_AC1428_undeclared_locale_renders_region_free_en_and_stored_sites_still_validate', async () => {
    // AC-1428. The migration cost has to be zero, and "zero" is not "it still
    // validates" — it is that a site authored before the field existed renders
    // the same `en` the deleted literal emitted. It is also the honest value:
    // nobody told us this business is American, so a country nobody stated must
    // not become a region nobody stated.
    expect(langDir(await generatorHtmlTag())).toEqual({ lang: 'en', dir: 'ltr' })
    expect(resolveSiteLocale({}).locale).toBe(UNDECLARED_LOCALE)

    // The other half, asserted against the ACTUAL stored sites rather than a
    // fixture, because "no migration required" is a claim about them
    // specifically. A published revision is frozen: if the capability broke one,
    // no edit could rescue it, so every revision is checked and not just drafts.
    const slugs = storedSiteSlugs()
    expect(slugs.length, 'no stored sites found — the criterion would pass vacuously').toBeGreaterThan(0)
    for (const slug of slugs) {
      const draft = loadSite(STORE_CTX, slug, 'draft')
      expect(draft.ok, `${slug} draft no longer validates: ${draft.ok ? '' : JSON.stringify(draft.errors)}`).toBe(true)
      for (const revision of readHistory(STORE_CTX, slug).revisions) {
        const published = loadSite(STORE_CTX, slug, revision.id)
        expect(
          published.ok,
          `${slug} revision ${revision.id} no longer validates: ${published.ok ? '' : JSON.stringify(published.errors)}`,
        ).toBe(true)
      }
    }
  })

  it('test_UAT_AC1429_country_alone_derives_locale_currency_timezone_and_reaches_rendered_lang', async () => {
    // AC-1429. Ireland is the first customer cohort and the reason the
    // capability exists: one declared fact has to be enough for a site to stop
    // claiming to be American, with no further authoring.
    expect(resolveSiteLocale({ country: 'IE' })).toEqual({
      country: 'IE',
      locale: 'en-IE',
      currency: 'EUR',
      timezone: 'Europe/Dublin',
      dir: 'ltr',
    })
    expect(langDir(await generatorHtmlTag({ country: 'IE' }))).toEqual({ lang: 'en-IE', dir: 'ltr' })

    // GB is the other half of that cohort. It shares Ireland's language and
    // differs in exactly the two fields a single combined value would have
    // collapsed — which is why they are separately reported.
    const gb = resolveSiteLocale({ country: 'GB' })
    const ie = resolveSiteLocale({ country: 'IE' })
    expect(gb).toMatchObject({ locale: 'en-GB', currency: 'GBP', timezone: 'Europe/London' })
    expect(gb.currency).not.toBe(ie.currency)
    expect(gb.timezone).not.toBe(ie.timezone)
    expect(gb.locale.split('-')[0]).toBe(ie.locale.split('-')[0])
  })

  it('test_UAT_AC1430_locale_currency_and_timezone_each_override_independently', async () => {
    // AC-1430. The case that matters is a business whose country default is
    // wrong for it — a Dublin company invoicing in USD, a US business three
    // zones from the largest-population pick. Overriding one must not drag the
    // other two with it.
    expect(resolveSiteLocale({ country: 'IE', currency: 'USD' })).toEqual({
      country: 'IE',
      locale: 'en-IE',
      currency: 'USD',
      timezone: 'Europe/Dublin',
      dir: 'ltr',
    })
    expect(resolveSiteLocale({ country: 'US', timezone: 'America/Los_Angeles' })).toEqual({
      country: 'US',
      locale: 'en-US',
      currency: 'USD',
      timezone: 'America/Los_Angeles',
      dir: 'ltr',
    })
    expect(resolveSiteLocale({ country: 'IE', locale: 'ga-IE' })).toMatchObject({
      locale: 'ga-IE',
      currency: 'EUR',
      timezone: 'Europe/Dublin',
    })
    // The locale override is observed in the ARTIFACT, not only the resolution.
    expect(langDir(await generatorHtmlTag({ country: 'IE', locale: 'ga-IE' }))).toEqual({
      lang: 'ga-IE',
      dir: 'ltr',
    })
  })

  it('test_UAT_AC1431_both_render_paths_declare_the_same_lang_and_dir', async () => {
    // AC-1431. The failure this forecloses is divergence: two renderers with one
    // hardcoded literal each is exactly how they came to be wrong together, and
    // how one could be fixed while the other stayed wrong. Both are rendered and
    // compared, so agreement is observed in the two artifacts rather than
    // inferred from a shared import.
    const cases = [{}, { country: 'IE' }, { country: 'IL' }, { country: 'US', locale: 'es-US' }]
    for (const config of cases) {
      const fromGenerator = langDir(await generatorHtmlTag(config))
      const fromFramework = langDir(frameworkHtmlTag(config))
      expect(fromFramework, `paths disagree for ${JSON.stringify(config)}`).toEqual(fromGenerator)
      expect(fromGenerator.lang, `empty lang for ${JSON.stringify(config)}`).toBeTruthy()
    }
  })

  it('test_UAT_AC1432_a_right_to_left_locale_renders_dir_rtl_decided_by_script_when_present', async () => {
    // AC-1432. `dir` is not cosmetic: without it an RTL page lays out backwards
    // regardless of the language it declares.
    expect(langDir(await generatorHtmlTag({ country: 'IL' }))).toEqual({ lang: 'he-IL', dir: 'rtl' })
    expect(langDir(await generatorHtmlTag({ country: 'AE' }))).toEqual({ lang: 'ar-AE', dir: 'rtl' })

    // Direction follows the SCRIPT when the locale states one — the only way to
    // get both of a language's two scripts right. A language-only table gets one
    // of this pair wrong by construction.
    expect(localeDirection('az-Arab')).toBe('rtl')
    expect(localeDirection('az-Latn')).toBe('ltr')
    expect(localeDirection('en-IE')).toBe('ltr')
  })

  it('test_UAT_AC1433_a_bad_locale_field_is_a_validation_error_at_a_machine_readable_path', () => {
    // AC-1433. Every one of these has a plausible silent-fallback reading, and
    // the fallback is the dangerous outcome: a business told its site is fine
    // while it renders as somewhere else. Each bad value is paired with the
    // corrected one so the refusal is attributable to the field and not to the
    // fixture.
    const cases: { field: string; bad: string; corrected: string }[] = [
      { field: 'country', bad: 'XX', corrected: 'IE' }, // well-shaped, no row — not silently US
      { field: 'country', bad: 'ie', corrected: 'IE' }, // alpha-2 is uppercase
      { field: 'country', bad: 'IRL', corrected: 'IE' }, // alpha-3, the other standard
      { field: 'locale', bad: 'en_US', corrected: 'en-US' }, // POSIX spelling, not BCP 47
      { field: 'locale', bad: 'english', corrected: 'en' }, // a language name, not a tag
      { field: 'currency', bad: 'eur', corrected: 'EUR' },
      { field: 'currency', bad: 'EURO', corrected: 'EUR' },
      { field: 'timezone', bad: 'Europe/Dubland', corrected: 'Europe/Dublin' }, // shaped like a zone, is not one
      { field: 'timezone', bad: 'GMT+1', corrected: 'Europe/London' }, // an offset, not a zone id
    ]
    for (const { field, bad, corrected } of cases) {
      const rejected = validateSite(siteJson({ [field]: bad }))
      expect(rejected.ok, `${field}=${bad} was accepted`).toBe(false)
      if (!rejected.ok) {
        expect(
          rejected.errors.map((e) => e.path),
          `${field}=${bad} reported no error at /config/${field}`,
        ).toContain(`/config/${field}`)
      }
      // The same definition with the field corrected, and with it removed
      // altogether, both validate.
      expect(validateSite(siteJson({ [field]: corrected })).ok, `${field}=${corrected} was refused`).toBe(true)
      expect(validateSite(siteJson()).ok).toBe(true)
    }
  })

  it('test_UAT_AC1434_a_behavior_module_is_handed_the_resolved_locale_identity', async () => {
    // AC-1434. The alternative to handing modules one resolved answer is each
    // module deriving its own — which is how two modules on one page end up
    // disagreeing about the same business, undetectably by reading either.
    const page = {
      id: 'home',
      slug: 'home',
      title: 'Home',
      modules: [{ id: 'm1', type: 'echo-locale', version: 1 }],
    }
    const result = validateSite({ ...siteJson({ country: 'IE' }), pages: [page] })
    expect(result.ok, result.ok ? '' : JSON.stringify((result as { errors?: unknown }).errors)).toBe(true)
    if (!result.ok) return

    const seen: BehaviorProps[] = []
    const rendered = await renderSiteFiles(
      { slug: 'locale-fixture', sourceDir: '(memory)', site: result.value, assetFiles: [] },
      { resolveModule: echoLocaleResolver(seen) },
    )
    expect(seen).toHaveLength(1)
    expect(seen[0].locale).toEqual({
      country: 'IE',
      locale: 'en-IE',
      currency: 'EUR',
      timezone: 'Europe/Dublin',
      dir: 'ltr',
    })
    // And what the module did with it reached the rendered page.
    expect(rendered.files.get('index.html')).toContain('data-currency="EUR"')
  })

  it('test_UAT_AC1435_every_country_row_is_valid_config_and_resolves_back_to_itself', () => {
    // AC-1435. The table is the thing a future country is added to, and the
    // failure mode of a hand-maintained table is a subtly wrong row — a mistyped
    // zone, a lowercase currency — that nothing notices until a customer in that
    // country signs up. Every row is held to the same rules a site's own
    // declaration is held to, so the row fails when it is added instead.
    const countries = Object.keys(COUNTRY_DEFAULTS)
    expect(countries.length).toBeGreaterThan(0)
    for (const country of countries) {
      const row = COUNTRY_DEFAULTS[country]!
      const result = validateSite(siteJson({ country, ...row }))
      expect(
        result.ok,
        `${country} row is not itself valid config: ${result.ok ? '' : JSON.stringify(result.errors)}`,
      ).toBe(true)
      expect(resolveSiteLocale({ country }), `${country} does not resolve back to its row`).toEqual({
        country,
        ...row,
        dir: localeDirection(row.locale),
      })
    }
    // The cohort the capability exists for, and the default country, are present.
    expect(countries).toEqual(expect.arrayContaining(['IE', 'GB', 'US']))
  })

  it('test_UAT_AC1436_a_locale_shaped_slug_is_refused_with_a_reason_and_two_alternatives', async () => {
    // AC-1436. What this pins is not a crash but an irreversible ambiguity: a
    // page published at `/de` cannot later be moved out of the way of a `/de/…`
    // language prefix, only broken. Bare language, language-region, the numeric
    // region form, and every one of them in any case — a capitalised segment
    // collides with a language prefix exactly as a lower-case one does.
    const reserved = ['de', 'fr', 'en', 'ga', 'pt-BR', 'es-419', 'pt-br', 'DE']
    for (const slug of reserved) {
      const errors = errorsFor(slug)
      expect(errors.length, `${slug} was accepted`).toBeGreaterThan(0)

      // The path is what an AI author self-corrects from: it must name the
      // offending page's slug, not the document.
      const issue = errors.find((e) => e.path === '/pages/0/slug')
      expect(issue, `${slug}: no error at /pages/0/slug — got ${JSON.stringify(errors)}`).toBeDefined()

      // Actionable: says WHY it is refused, and gives two slugs that would work.
      // A message that reads as arbitrary gets worked around, not obeyed.
      const message = issue!.message
      const lower = slug.toLowerCase()
      expect(message).toContain(slug)
      expect(message).toMatch(/locale/i)
      expect(message).toContain(`${lower}-services`)
      expect(message).toContain(`about-${lower}`)
    }

    // Nobody types JSON at the validator: an author adds a page through
    // `1c edit page add` (the same call the AI toolbox makes). Asserting there
    // is what proves the guard is REACHABLE, and that the message survives the
    // projection into a CLI error rather than flattening to "schema invalid".
    const site = makeMemorySite()
    try {
      const attempt = editPageAdd(site.slug, 'languages', { ...site.opts, path: 'de' })
      await expect(attempt).rejects.toBeInstanceOf(CommandError)
      const error = (await attempt.catch((e: unknown) => e)) as CommandError
      expect(error.code).toBe('SCHEMA_INVALID')
      expect(error.path).toBe('/pages/1/slug')
      expect(error.message).toMatch(/locale/i)
      expect(error.message).toContain('about-de')

      // The refusal is total: no half-written page is left behind.
      const before = (await editPageList(site.slug, site.opts)).data as { pages: { id: string }[] }
      expect(before.pages.map((p) => p.id)).toEqual(['home'])

      // The same page is then created successfully under a qualified slug.
      await editPageAdd(site.slug, 'languages', { ...site.opts, path: 'de-services' })
      const after = (await editPageList(site.slug, site.opts)).data as { pages: { id: string }[] }
      expect(after.pages.map((p) => p.id).sort()).toEqual(['home', 'languages'])
    } finally {
      site.dispose()
    }
  })

  it('test_UAT_AC1437_slugs_that_resemble_or_extend_a_language_code_still_validate', () => {
    // AC-1437. The reservation is anchored whole, so a slug that merely begins
    // with, resembles or extends a language code is an ordinary page. Reserving
    // shapes that could never become a locale (`zz`, `qq`) would be a tax with
    // no collision behind it, and reserving four-letter tails would cost
    // ordinary English slugs to defend a script-qualified prefix nobody serves.
    const allowed = [
      'design',
      'deals',
      'delivery',
      'french-lessons',
      'portfolio',
      'english',
      'pt-brazil', // a language code with a non-region tail
      'zz',
      'qq',
      'no-fee',
      'de-luxe',
      'no-cost',
      'it-team',
      'zh-Hans', // the script subtag form is deliberately not reserved
    ]

    // The slugs the platform's stored sites already use, read at verification
    // time rather than named, so the criterion cannot go stale against them.
    const storedSlugs = new Set<string>()
    for (const slug of storedSiteSlugs()) {
      const loaded = loadSite(STORE_CTX, slug, 'draft')
      expect(loaded.ok, `${slug} draft did not load`).toBe(true)
      if (!loaded.ok) continue
      for (const page of loaded.value.site.pages) storedSlugs.add(page.slug)
    }
    expect(storedSlugs.size, 'no stored page slugs found to check').toBeGreaterThan(0)

    for (const slug of [...allowed, ...storedSlugs]) {
      expect(errorsFor(slug), `${slug} was refused`).toEqual([])
    }
  })
})
