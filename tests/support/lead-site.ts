import { env } from 'cloudflare:test'
import { d1r2SiteStore } from '../../tools/generate/src/store/d1r2-store'
import type { SiteStoreEnv } from '../../tools/generate/src/store/d1r2-store'
import { nextSlug } from './site-seed'

/**
 * A PUBLISHED site carrying a `contact-form`, for [[REQ-223]]'s UATs.
 *
 * WHY IT PUBLISHES RATHER THAN DRAFTS. The receiver reads a form's asset and its
 * consent wording out of the site's LIVE PUBLISHED REVISION, because that is the
 * definition the visitor was actually served — the draft is whatever the operator
 * has edited since, and evidencing a sentence that was never on the page is the
 * specific failure §7 exists to prevent. A fixture that only wrote a draft would
 * prove the fallback path and nothing else.
 *
 * NOTHING HERE IS A DOUBLE: `env.DB` and `env.SITES` are a real D1 database and a
 * real R2 bucket inside workerd, so a site this returns is a site the serving
 * Worker could serve.
 */

/** One `config.fields` entry, in the shape the module's schema declares. */
export interface SeedField {
  name: string
  label: string
  type: 'text' | 'email' | 'tel' | 'textarea' | 'checkbox'
  required?: boolean
  /** Which acceptance this box is, when it is one ([[REQ-242]]). */
  acceptance?: string
}

/**
 * What ONE seeded `contact-form` on the page declares.
 *
 * SPLIT OUT OF {@link SeedFormOptions} BY [[REQ-243]], because a page may now
 * carry more than one form and the two of them differ in exactly these fields.
 * What is left behind in `SeedFormOptions` is site-level — the tenant, whether
 * to publish — and belongs to the page rather than to any form on it.
 */
export interface SeedForm {
  fields?: SeedField[]
  submitLabel?: string
  /** The assets the form promises, in declaration order ([[REQ-241]]). */
  assets?: Array<{ key: string; name: string; url: string }>
  /**
   * The message the form sends ([[REQ-243]]).
   *
   * DEFAULTS TO `asset` WHEN THE FORM PROMISES ARTIFACTS, and to nothing when it
   * does not — which is exactly what `contactFormV6ToV7` writes into an instance
   * already in the stores. A fixture that defaulted to nothing would make every
   * pre-[[REQ-243]] delivery UAT assert silence, which is the migration's whole
   * job to prevent. Pass `''` to seed a form that gates a download and
   * deliberately names no message.
   */
  template?: string
  /**
   * The acceptances pressing the button asserts ([[REQ-242]]).
   *
   * `wording` IS OPTIONAL HERE AND REQUIRED BY THE CONTRACT, deliberately: a
   * fixture has to be able to write the shape the contract refuses, because the
   * revisions `formDefinitionOf` reads are immutable and one written before the
   * refusal existed is the case the receiver's own reading has to survive.
   */
  accepts?: Array<{ key: string; wording?: string }>
  /**
   * Seed the instance as a PRE-[[REQ-241]] v5 carrying the old asset triple.
   *
   * WHY A FIXTURE CAN STILL WRITE A SHAPE THE CONTRACT NO LONGER DECLARES.
   * `site_revisions` rows are immutable by design and `formDefinitionOf` reads
   * module instances straight out of those frozen snapshots — so revisions in
   * this shape exist and will keep existing, and the only way to prove the
   * receiver still resolves one is to write one.
   */
  legacyAsset?: { key: string; name: string; url: string }
}

export interface SeedFormOptions extends SeedForm {
  tenantId: string
  instanceId?: string
  /**
   * Further forms on the SAME page, each naming its own id ([[REQ-243]]).
   *
   * TWO FORMS ON ONE SITE IS THE CASE THE TICKET EXISTS FOR — a delivery on the
   * whitepapers page and a welcome on the beta page — and it is not provable by
   * seeding two SITES. The receiver resolves a form by its instance id within
   * one served definition, so two sites would exercise the site lookup and leave
   * the instance lookup, which is the half that has to pick between them,
   * untested.
   */
  alsoForms?: Array<SeedForm & { instanceId: string }>
  /** Publish the definition. Off proves the unpublished-site fallback. */
  publish?: boolean
  /**
   * The bytes the revision's `index.html` holds.
   *
   * Supplied when a test needs the SERVING path rather than the write path —
   * the sitekey stamp is applied to what comes out of the bucket, so proving it
   * needs a revision whose rendered output actually carries a form.
   */
  outHtml?: string
}

export interface SeededSite {
  /**
   * The site's 128-bit key — the token a published URL carries, and since
   * [[REQ-236]] the only name the store has for it.
   */
  siteKey: string
  instanceId: string
}

/** Which message a seeded form sends — see {@link SeedForm.template}. */
function templateOf(options: SeedForm): string {
  if (options.template !== undefined) return options.template
  // NOT FOR `legacyAsset`, which seeds a PRE-[[REQ-241]] v5 instance. v5 had no
  // `template` key, so a frozen revision in that shape cannot carry one — and
  // writing one would make the fixture prove something no stored revision does.
  return (options.assets ?? []).length > 0 ? 'asset' : ''
}

/** One `contact-form` instance, in the shape a stored page carries it. */
function moduleFor(options: SeedForm, instanceId: string): Record<string, unknown> {
  return {
    id: instanceId,
    type: 'contact-form',
    version: options.legacyAsset ? 5 : 7,
    config: {
      submitLabel: options.submitLabel ?? 'Send',
      fields: options.fields ?? [
        { name: 'email', label: 'Your email', type: 'email', required: true },
      ],
      ...(options.assets ? { assets: options.assets } : {}),
      ...(templateOf(options) === '' ? {} : { template: templateOf(options) }),
      ...(options.accepts ? { accepts: options.accepts } : {}),
      ...(options.legacyAsset
        ? {
            asset: options.legacyAsset.key,
            assetName: options.legacyAsset.name,
            assetUrl: options.legacyAsset.url,
          }
        : {}),
    },
    slots: {},
  }
}

/** The page definition a seeded site publishes — every form on it, in order. */
function pageWith(options: SeedFormOptions, instanceId: string): Record<string, unknown> {
  return {
    slug: 'home',
    title: 'Home',
    modules: [
      moduleFor(options, instanceId),
      ...(options.alsoForms ?? []).map((form) => moduleFor(form, form.instanceId)),
    ],
  }
}

/** Seed one site, publish it, and hand back the key a URL would carry. */
export async function seedFormSite(options: SeedFormOptions): Promise<SeededSite> {
  const root = d1r2SiteStore(env as unknown as SiteStoreEnv)
  await root.createTenant({ id: options.tenantId, name: options.tenantId })
  const store = await root.forTenant(options.tenantId)

  const label = nextSlug('req223')
  const instanceId = options.instanceId ?? `form-${label}`
  const page = pageWith(options, instanceId)
  const siteJson = { name: label, config: { businessName: 'Fixture' } }

  const siteKey = await store.createDraft()
  await store.write(siteKey, {
    siteJson,
    pages: [{ name: 'home.json', page }],
    assets: [],
  })

  if (options.publish !== false) {
    await store.writeRevision(
      siteKey,
      {
        id: 1,
        publishedAt: '2026-09-10T00:00:00.000Z',
        message: 'fixture',
        by: null,
        basedOn: null,
        changes: { added: ['home.json'], modified: [], removed: [] },
        sha: 'fixture',
      },
      {
        source: { siteJson, pages: [{ name: 'home.json', page }], assets: [] },
        out: new Map([
          ['index.html', options.outHtml ?? '<!doctype html><title>Home</title>'],
        ]),
      },
    )
  }

  return { siteKey, instanceId }
}
