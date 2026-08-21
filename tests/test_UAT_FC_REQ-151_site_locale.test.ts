import { readFileSync, readdirSync, statSync } from 'node:fs'
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
import { renderL1Page } from '../packages/framework/src/l1/render'
import { renderSiteFiles } from '../tools/generate/src/render'
import type { ModuleResolver } from '../tools/generate/src/render/render'
import type { BehaviorDefinition, BehaviorProps } from '../packages/framework/src/modules/behavior'
import { starterHomePage, starterSiteJson } from '../tools/generate/src/cli/scaffold'
import type { LoadedSite } from '../tools/generate/src/store/assemble'

/**
 * REQ-151 — a site knows where it is, and both renderers say so.
 *
 * The defect these pin is not a wrong pixel: `<html lang="en">` was a LITERAL in
 * two renderers, so every site the platform produced claimed to be English
 * regardless of its owner. A published revision is an immutable R2 snapshot
 * (DOC-12 §7), so a wrong `lang` shipped once is not recoverable by fixing the
 * renderer — it is a screen reader mispronouncing an Irish business's page and a
 * search index storing the wrong language, permanently, for that revision.
 *
 * The claims are asserted on RENDERED HTML wherever the AC is about rendering,
 * because the value that matters is the attribute in the artifact, not the
 * resolver's return value. AC-4 (the two paths agree) is asserted by rendering
 * BOTH and comparing, rather than by observing that both call the same function.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.join(HERE, '..')

/** The site definition a test renders: the scaffolder's, plus locale config. */
function siteJson(config: Record<string, unknown> = {}): Record<string, unknown> {
  const base = starterSiteJson('locale-fixture') as Record<string, unknown>
  return {
    ...base,
    config: { ...(base.config as Record<string, unknown>), ...config },
    pages: [starterHomePage('locale-fixture')],
  }
}

/** Validate, failing the test loudly with the projected errors rather than a cast. */
function validated(config: Record<string, unknown> = {}): Site {
  const result = validateSite(siteJson(config))
  if (!result.ok) throw new Error(`unexpected validation failure: ${JSON.stringify(result.errors)}`)
  return result.value
}

/** Render the site through the generator and return its `<html …>` opening tag. */
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

/** The same for the framework's standalone L1 page renderer. */
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

/** Every real site under `storage/sites/` — the ones AC-1 must not regress. */
function realDraftDefinitions(): { slug: string; json: Record<string, unknown> }[] {
  const sites = path.join(REPO, 'storage', 'sites')
  return readdirSync(sites)
    .filter((slug) => statSync(path.join(sites, slug, 'draft'), { throwIfNoEntry: false })?.isDirectory())
    .map((slug) => ({
      slug,
      json: JSON.parse(
        readFileSync(path.join(sites, slug, 'draft', 'site.json'), 'utf8'),
      ) as Record<string, unknown>,
    }))
}

/**
 * A stand-in behavior module that renders nothing but what it was handed.
 *
 * Injected rather than asserted against a real module because no shipping
 * behavior formats money yet — the payments and calendar modules are the ones
 * that will. The claim under test is the *seam*, so the module that proves it
 * should be the smallest thing that can observe the seam and nothing else.
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

describe('REQ-151 — site locale identity, and rendered lang/dir', () => {
  it('test_UAT_FC_REQ-151_a_site_declaring_no_locale_renders_exactly_as_before', async () => {
    // AC-1. The migration cost of this ticket has to be ZERO, and "zero" is not
    // "it still validates" — it is that the bytes a pre-existing site renders to
    // do not move. `en`, region-free, is what the deleted literal said, and it is
    // also the honest value: nobody told us this business is American.
    const tag = await generatorHtmlTag()
    expect(langDir(tag)).toEqual({ lang: 'en', dir: 'ltr' })
    expect(resolveSiteLocale({}).locale).toBe(UNDECLARED_LOCALE)
  })

  it('test_UAT_FC_REQ-151_every_real_site_on_disk_still_validates', () => {
    // AC-1, the other half — asserted against the ACTUAL sites in the repo
    // rather than a fixture, because "no migration required" is a claim about
    // them specifically. A fixture cannot fail this; they can.
    const sites = realDraftDefinitions()
    expect(sites.length).toBeGreaterThan(0)
    for (const { slug, json } of sites) {
      const result = validateSite({ ...json, pages: [starterHomePage(slug)] })
      expect(result.ok, `${slug} no longer validates: ${JSON.stringify((result as { errors?: unknown }).errors)}`).toBe(true)
    }
  })

  it('test_UAT_FC_REQ-151_country_alone_derives_locale_currency_and_timezone', async () => {
    // AC-2. Ireland is the first customer cohort and the reason for the ticket:
    // one declared fact — `country: 'IE'` — has to be enough for a site to stop
    // claiming to be American, with no further authoring.
    expect(resolveSiteLocale({ country: 'IE' })).toEqual({
      country: 'IE',
      locale: 'en-IE',
      currency: 'EUR',
      timezone: 'Europe/Dublin',
      dir: 'ltr',
    })
    expect(langDir(await generatorHtmlTag({ country: 'IE' }))).toEqual({
      lang: 'en-IE',
      dir: 'ltr',
    })
    // GB is the other half of that cohort, and differs from IE in the field a
    // single combined locale/currency value would have collapsed.
    expect(resolveSiteLocale({ country: 'GB' })).toMatchObject({
      locale: 'en-GB',
      currency: 'GBP',
      timezone: 'Europe/London',
    })
  })

  it('test_UAT_FC_REQ-151_each_field_overrides_independently', async () => {
    // AC-3. The three derived fields are individually overridable — the case
    // that matters is a business in a country whose *default* is wrong for it
    // (a Dublin company invoicing in USD, a US business three zones from the
    // default pick). Overriding one must not drag the other two with it.
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
    // An explicit locale reaches the rendered attribute, not merely the resolver.
    expect(langDir(await generatorHtmlTag({ country: 'IE', locale: 'ga-IE' }))).toEqual({
      lang: 'ga-IE',
      dir: 'ltr',
    })
    expect(resolveSiteLocale({ country: 'IE', locale: 'ga-IE' })).toMatchObject({
      currency: 'EUR',
      timezone: 'Europe/Dublin',
    })
  })

  it('test_UAT_FC_REQ-151_both_render_paths_emit_the_same_lang_and_dir', async () => {
    // AC-4. The failure this forecloses is divergence: two renderers, one
    // literal each, is exactly how they came to be wrong together — and how one
    // could be fixed while the other stayed wrong. Both are rendered here and
    // compared; agreement is observed in the artifacts, not assumed from a
    // shared import.
    const cases = [{}, { country: 'IE' }, { country: 'IL' }, { country: 'US', locale: 'es-US' }]
    for (const config of cases) {
      const fromGenerator = langDir(await generatorHtmlTag(config))
      const fromFramework = langDir(frameworkHtmlTag(config))
      expect(fromFramework, `paths disagree for ${JSON.stringify(config)}`).toEqual(fromGenerator)
      expect(fromGenerator.lang).toBeTruthy()
    }
  })

  it('test_UAT_FC_REQ-151_a_right_to_left_locale_renders_dir_rtl', async () => {
    // AC-5. `dir` is not cosmetic: without it an RTL page lays out backwards
    // regardless of the language it declares.
    expect(langDir(await generatorHtmlTag({ country: 'IL' }))).toEqual({
      lang: 'he-IL',
      dir: 'rtl',
    })
    expect(langDir(await generatorHtmlTag({ country: 'AE' }))).toEqual({
      lang: 'ar-AE',
      dir: 'rtl',
    })
    // Direction follows the SCRIPT when one is stated, which is the only way to
    // get `az-Arab` and `az-Latn` both right; a language-only table gets one
    // of the pair wrong by construction.
    expect(localeDirection('az-Arab')).toBe('rtl')
    expect(localeDirection('az-Latn')).toBe('ltr')
    expect(localeDirection('en-IE')).toBe('ltr')
  })

  it('test_UAT_FC_REQ-151_a_bad_locale_field_is_a_validation_error_with_a_path', () => {
    // AC-6. Every one of these has a plausible silent-fallback reading, and the
    // fallback is the dangerous outcome: a site told it is fine while rendering
    // as somewhere else. The path is asserted because an AI author self-corrects
    // from the path it is handed (DOC-8 §6).
    const bad: [string, unknown][] = [
      ['country', 'XX'], // well-shaped, no row — not silently US
      ['country', 'ie'], // ISO 3166-1 alpha-2 is uppercase
      ['country', 'IRL'], // alpha-3, the other standard
      ['locale', 'en_US'], // POSIX spelling, not BCP 47
      ['locale', 'english'],
      ['currency', 'eur'],
      ['currency', 'EURO'],
      ['timezone', 'Europe/Dubland'], // shaped like a zone, is not one
      ['timezone', 'GMT+1'],
    ]
    for (const [field, value] of bad) {
      const result = validateSite(siteJson({ [field]: value }))
      expect(result.ok, `${field}=${String(value)} was accepted`).toBe(false)
      if (result.ok) continue
      expect(result.errors.map((e) => e.path)).toContain(`/config/${field}`)
    }
  })

  it('test_UAT_FC_REQ-151_a_behavior_module_is_handed_the_resolved_locale', async () => {
    // "What to change" §4 — the payments and calendar modules both need the
    // locale, the currency AND the zone, and the alternative to handing them
    // over is each module deriving its own. That is how two modules on one page
    // end up disagreeing about the same business, and it is not detectable by
    // looking at either module.
    const base = siteJson({ country: 'IE' })
    const page = {
      id: 'home',
      slug: 'home',
      title: 'Home',
      modules: [{ id: 'm1', type: 'echo-locale', version: 1 }],
    }
    const result = validateSite({ ...base, pages: [page] })
    expect(result.ok).toBe(true)
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
    // And it reached the rendered artifact, not merely the prop bag.
    expect(rendered.files.get('index.html')).toContain('data-currency="EUR"')
  })

  it('test_UAT_FC_REQ-151_the_country_table_is_data_and_is_internally_consistent', () => {
    // The derivation table is the thing a future country is added to, and the
    // failure mode of a hand-maintained table is a row that is subtly wrong —
    // a mistyped zone the tz database does not know, a lowercase currency — that
    // nothing notices until a customer in that country signs up. Every row is
    // held to the same rules a site's own declaration is held to.
    for (const [country, row] of Object.entries(COUNTRY_DEFAULTS)) {
      const result = validateSite(siteJson({ country, ...row }))
      expect(result.ok, `${country} row is not itself valid config`).toBe(true)
      expect(resolveSiteLocale({ country })).toEqual({ country, ...row, dir: localeDirection(row.locale) })
    }
    // The cohort the ticket exists for, and the fallback, are all present.
    expect(Object.keys(COUNTRY_DEFAULTS)).toEqual(expect.arrayContaining(['IE', 'GB', 'US']))
  })
})
