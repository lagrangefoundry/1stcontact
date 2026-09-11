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
}

export interface SeedFormOptions {
  tenantId: string
  instanceId?: string
  fields?: SeedField[]
  submitLabel?: string
  asset?: { key: string; name: string; url: string }
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
  /** The site's 128-bit key — the token a published URL carries. */
  siteKey: string
  slug: string
  instanceId: string
}

/** The page definition a seeded site publishes. */
function pageWith(options: SeedFormOptions, instanceId: string): Record<string, unknown> {
  return {
    slug: 'home',
    title: 'Home',
    modules: [
      {
        id: instanceId,
        type: 'contact-form',
        version: 4,
        config: {
          action: '/api/lead',
          submitLabel: options.submitLabel ?? 'Send',
          fields: options.fields ?? [
            { name: 'email', label: 'Your email', type: 'email', required: true },
          ],
          ...(options.asset
            ? { asset: options.asset.key, assetName: options.asset.name, assetUrl: options.asset.url }
            : {}),
        },
        slots: {},
      },
    ],
  }
}

/** Seed one site, publish it, and hand back the key a URL would carry. */
export async function seedFormSite(options: SeedFormOptions): Promise<SeededSite> {
  const root = d1r2SiteStore(env as unknown as SiteStoreEnv)
  await root.createTenant({ id: options.tenantId, name: options.tenantId })
  const store = await root.forTenant(options.tenantId)

  const slug = nextSlug('req223')
  const instanceId = options.instanceId ?? `form-${slug}`
  const page = pageWith(options, instanceId)
  const siteJson = { name: slug, config: { businessName: 'Fixture' } }

  await store.createDraft(slug)
  await store.write(slug, {
    siteJson,
    pages: [{ name: 'home.json', page }],
    assets: [],
  })

  if (options.publish !== false) {
    await store.writeRevision(
      slug,
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

  const siteKey = await store.siteKey(slug)
  if (!siteKey) throw new Error('the fixture site has no key')
  return { siteKey, slug, instanceId }
}
