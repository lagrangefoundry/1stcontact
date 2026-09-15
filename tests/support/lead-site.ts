import { env } from 'cloudflare:test'
import { d1r2SiteStore } from '../../tools/generate/src/store/d1r2-store'
import type { SiteStoreEnv } from '../../tools/generate/src/store/d1r2-store'
import { defaultEmailDocument } from '../../packages/framework/src/l2/email-page'
import type { L1Document } from '@1stcontact/site-schema'
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

/**
 * One email page the seeded site holds ([[REQ-247]]).
 *
 * A MESSAGE IS A PAGE OF THE SITE THAT SENDS IT, so a fixture that seeds a form
 * naming one has to seed the page too — exactly as a real site must, and exactly
 * as `configure_component` and `publish` both now refuse when it does not.
 */
export interface SeedEmailPage {
  /** The page id, which is what a form's `config.template` names. */
  id: string
  subject?: string
  /** The tokens the copy promises. Defaults to what the naming forms need. */
  placeholders?: string[]
  /** Extra lines the message says, appended to the default copy. */
  lines?: string[]
}

export interface SeedFormOptions extends SeedForm {
  tenantId: string
  instanceId?: string
  /**
   * The email pages this site holds, by id.
   *
   * MATERIALISED AUTOMATICALLY FOR ANY TEMPLATE A FORM NAMES AND THIS LIST DOES
   * NOT COVER, with default copy and with the placeholders the naming form
   * actually needs — `cta_url` and `asset_name` for a form that gates a
   * download, none for one that merely welcomes. That is not a convenience: a
   * form naming a page the site does not hold is refused at publish and reports
   * `no_template` at the send, so a fixture that skipped the page would make
   * every delivery UAT assert silence.
   */
  emails?: SeedEmailPage[]
  /**
   * Template keys deliberately left UNMATERIALISED, defeating the auto-seed above.
   *
   * WHAT IT IS FOR is the case the auto-seed exists to stop happening by
   * accident: a form naming a message its site does not hold ([[REQ-247]] §4).
   * That state is real — a page removed with `--force`, a typo that reached a
   * draft, or a credential name a form may never send — and it is reachable only
   * from a draft, because publish refuses it and so does the operation that
   * configured the form. Saying it out loud here is what keeps it distinguishable
   * from a fixture that simply forgot.
   */
  omitEmails?: string[]
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
  /**
   * Further objects the published revision holds, by store key ([[REQ-244]]).
   *
   * WHAT A GATED ARTIFACT ACTUALLY IS. §5 says the bytes are site assets — the
   * site's own published output — so proving the gate serves one needs a
   * revision that really contains it. The real papers do not exist yet, so this
   * is the fixture the ticket asks for rather than a stand-in for the serving
   * path itself: what comes back is what R2 stored.
   */
  outFiles?: Record<string, string>
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

/**
 * The tokens the message a form sends must promise ([[REQ-247]] §3, AC-12).
 *
 * DERIVED FROM WHAT THE FORM ACTUALLY SENDS, because the two paths substitute
 * different things and `renderCopy` refuses a declared token it is given no
 * value for. A form gating artifacts renders with `{{cta_url}}` and
 * `{{asset_name}}`; a form that merely welcomes renders with nothing at all, so
 * declaring either token on one of those would refuse every send it makes.
 */
function placeholdersFor(forms: readonly SeedForm[]): string[] {
  const gates = forms.some((form) => (form.assets ?? []).length > 0 || form.legacyAsset)
  return gates ? ['cta_url', 'asset_name'] : []
}

/**
 * One email page, in the shape a stored page carries it ([[REQ-247]] §2).
 *
 * BUILT THROUGH `defaultEmailDocument`, AND NOT BY HAND. That is the same copy
 * `add_page --kind email` writes, so a fixture message is the message a real
 * author would be starting from — and a test asserting what a recipient reads is
 * asserting against the product's own default rather than against a shape
 * invented here.
 */
function emailPageFor(
  spec: SeedEmailPage,
  placeholders: readonly string[],
): Record<string, unknown> {
  const declared = spec.placeholders ?? placeholders
  const title = `Message ${spec.id}`
  const document = defaultEmailDocument(title, declared) as L1Document & {
    root: { children: unknown[] }
  }
  // APPENDED RATHER THAN SUBSTITUTED, so the default copy — the button, the
  // pasteable fallback, the declared tokens — is still exactly what it would be
  // on a page an author had just made. What a test adds is the one sentence it
  // then asserts a recipient can read.
  for (const line of spec.lines ?? []) {
    document.root.children.push({
      kind: 'text',
      text: line,
      axes: { fontFamily: 'Helvetica, sans-serif', fontSizePx: 16, lineHeightPx: 24, color: '#1a1a1a' },
    })
  }
  return {
    id: spec.id,
    slug: spec.id,
    title,
    kind: 'email',
    email: {
      subject: spec.subject ?? title,
      ...(declared.length > 0 ? { placeholders: [...declared] } : {}),
    },
    modules: [],
    l1: document,
  }
}

/**
 * Every email page this site holds, as stored page records.
 *
 * MATERIALISED FOR ANY TEMPLATE A FORM NAMES, whether the caller listed it or
 * not. A form naming a page the site does not hold reports `no_template` and
 * mails nobody, so a fixture that made the caller remember would turn every
 * forgotten page into a delivery UAT quietly asserting silence — which is the
 * exact failure [[REQ-247]] §1 exists because of.
 */
function emailPagesFor(
  options: SeedFormOptions,
): Array<{ name: string; page: Record<string, unknown> }> {
  const forms: SeedForm[] = [options, ...(options.alsoForms ?? [])]
  const declared = new Map<string, SeedEmailPage>()
  for (const spec of options.emails ?? []) declared.set(spec.id, spec)

  // The caller's own list first, in the order given, so a page nothing names is
  // still seeded — that is how a test proving a refusal gets a site that holds
  // email pages for the refusal to be able to list.
  const ids: string[] = [...declared.keys()]
  for (const form of forms) {
    const key = templateOf(form)
    if (key !== '' && !ids.includes(key)) ids.push(key)
  }
  const omitted = new Set(options.omitEmails ?? [])

  return ids
    .filter((id) => !omitted.has(id))
    .map((id) => ({
      name: `${id}.json`,
      page: emailPageFor(
        declared.get(id) ?? { id },
        placeholdersFor(forms.filter((form) => templateOf(form) === id)),
      ),
    }))
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
  // [[REQ-247]] — the messages this site's forms send are pages of it, so they
  // are written into the very same draft and frozen into the very same revision
  // as the page carrying the form. That is not tidiness: it is what makes the
  // copy a visitor is sent the copy that was PUBLISHED (AC-6).
  const emails = emailPagesFor(options)
  const pages = [{ name: 'home.json', page }, ...emails]

  const siteKey = await store.createDraft()
  await store.write(siteKey, { siteJson, pages, assets: [] })

  if (options.publish !== false) {
    await store.writeRevision(
      siteKey,
      {
        id: 1,
        publishedAt: '2026-09-10T00:00:00.000Z',
        message: 'fixture',
        by: null,
        basedOn: null,
        changes: { added: pages.map((entry) => entry.name), modified: [], removed: [] },
        sha: 'fixture',
      },
      {
        source: { siteJson, pages, assets: [] },
        out: new Map([
          ['index.html', options.outHtml ?? '<!doctype html><title>Home</title>'],
          ...Object.entries(options.outFiles ?? {}),
        ]),
      },
    )
  }

  return { siteKey, instanceId }
}
