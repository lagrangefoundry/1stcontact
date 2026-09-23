import { env } from 'cloudflare:test'
import { d1r2SiteStore } from '../../tools/generate/src/store/d1r2-store'
import type { SiteStoreEnv } from '../../tools/generate/src/store/d1r2-store'
import { defaultEmailDocument } from '../../packages/framework/src/l2/email-page'
import type { L1Document } from '@1stcontact/site-schema'
import { formHandle } from '../../packages/framework/src/modules/contact-form/fields'
import { nextSlug } from './site-seed'
import { giveSiteAnAddress } from './site-address'
import { starterSiteJson } from '../../tools/generate/src/cli/scaffold'
import { snapshotSha } from '../../tools/generate/src/store/revision-model'

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
  /**
   * The contract version the instance is PINNED AT in the store ([[BUG-95]]).
   *
   * WHY A FIXTURE NEEDS TO CHOOSE. `site_revisions` rows are immutable and the
   * receiver reads module instances straight out of them, so a revision frozen
   * before a bump keeps its old pin forever — and the only way to prove the
   * receiver still reads one correctly is to write one. Defaults to 5 when
   * {@link legacyAsset} is set and 7 otherwise, which is what every fixture
   * before this asked for implicitly.
   *
   * THE CONFIG IS WRITTEN IN THAT VERSION'S SHAPE AND NOT TODAY'S. Below v7
   * there is no `template` key to carry — v7 invented it — so a fixture that
   * wrote one would be seeding a revision no store has ever held, and would
   * prove the migration is unnecessary by doing its job for it.
   */
  storedVersion?: 5 | 6 | 7
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

/**
 * A FURTHER PAGE of the seeded site, carrying its own forms ([[BUG-93]]).
 *
 * WHY A SECOND PAGE IS A DIFFERENT FIXTURE FROM A SECOND FORM. {@link
 * SeedFormOptions.alsoForms} puts two forms on ONE page, which is what
 * [[REQ-243]] needed: two forms the receiver must tell apart by id. This puts
 * two forms on TWO pages, which is the shape [[BUG-93]] exists for — and the two
 * are not interchangeable, because a component name is unique per page, so the
 * case that broke is precisely two pages each holding a form called `signup`.
 * Seeding two SITES would not reach it either: the site lookup would do the
 * telling apart, and the page lookup — the half that actually has to pick — would
 * stay untested.
 */
export interface SeedPage {
  /** The page's id. A handle's first half names this. */
  id: string
  forms: Array<SeedForm & { instanceId: string }>
}

export interface SeedFormOptions extends SeedForm {
  tenantId: string
  instanceId?: string
  /** Further pages of this same site, each with its own forms ([[BUG-93]]). */
  alsoPages?: SeedPage[]
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
  /**
   * Further stored modules on the home page, verbatim ([[BUG-95]]).
   *
   * NOT A FORM, WHICH IS THE POINT. `alsoForms` seeds another `contact-form`;
   * this seeds whatever a page may actually be carrying beside one — including a
   * module type the catalogue has never heard of, which is the case the upgrade
   * path has to leave alone rather than throw on.
   */
  alsoModules?: Array<Record<string, unknown>>
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
  /**
   * Bytes under the DRAFT's own `assets/`, by name ([[BUG-97]]).
   *
   * NOT THE SAME FIXTURE AS {@link outFiles}, and the difference is the whole
   * point. That one writes objects into a frozen revision, which is where
   * `public-site` reads a published artifact from. This writes the draft's
   * assets, which is where the preview's renderer reads one — so a gated
   * download minted from a preview submission has real bytes to arrive as. A
   * test that needed both would supply both, exactly as a real site holds both.
   */
  draftAssets?: Record<string, string>
}

export interface SeededSite {
  /**
   * The host a RECIPIENT's link to this site names, or `null` for a site this
   * fixture did not publish ([[BUG-97]]).
   *
   * HANDED BACK BECAUSE A TEST CANNOT SPELL IT. The label is random — see
   * `giveSiteAnAddress` — so the only honest way to assert that a mail names the
   * site's own host is to compare against the host the fixture actually gave it.
   */
  host: string | null
  /**
   * The site's 128-bit key — the token a published URL carries, and since
   * [[REQ-236]] the only name the store has for it.
   */
  siteKey: string
  instanceId: string
  /** The id of the page the primary form sits on ([[BUG-93]]). */
  pageId: string
  /**
   * What the primary form puts in its hidden handle — `<pageId>:<instanceId>`
   * ([[BUG-93]]).
   *
   * BUILT BY THE SAME FUNCTION THE COMPONENT USES, and not spelled here. Three
   * parties have to agree on this grammar; a fixture that wrote its own `${a}:${b}`
   * would be a fourth, free to drift from the other three in silence — which is
   * the whole reason the vocabulary lives in one module.
   */
  formHandle: string
}

/** The handle a form called `instanceId` on `pageId` submits under ([[BUG-93]]). */
export function handleFor(pageId: string, instanceId: string): string {
  return formHandle(pageId, instanceId)
}

/** The contract version a seeded instance is pinned at — see {@link SeedForm.storedVersion}. */
function versionOf(options: SeedForm): number {
  if (options.storedVersion !== undefined) return options.storedVersion
  return options.legacyAsset ? 5 : 7
}

/**
 * Which message a seeded form sends, AS THE STORED CONFIG SPELLS IT.
 *
 * EMPTY BELOW v7 WHATEVER ELSE IS ASKED FOR. `template` is v7's key; v5 and v6
 * had none, so no frozen revision at those pins can carry one. What such a form
 * ends up sending is {@link sendsTemplateOf}'s answer, which is the migration's
 * and not the fixture's.
 */
function templateOf(options: SeedForm): string {
  if (versionOf(options) < 7) return ''
  if (options.template !== undefined) return options.template
  return (options.assets ?? []).length > 0 ? 'asset' : ''
}

/** True when this form declares an artifact, in whichever shape its pin uses. */
function gates(options: SeedForm): boolean {
  return (options.assets ?? []).length > 0 || options.legacyAsset !== undefined
}

/**
 * The message a seeded form ACTUALLY SENDS once it is read ([[BUG-95]]).
 *
 * WHY THIS IS NOT {@link templateOf}. A pre-v7 instance names no message in the
 * store and sends one anyway, because `contactFormV6ToV7` names `asset` for any
 * form declaring an artifact — which is the whole of what that migration is for.
 * The email pages a fixture materialises have to follow the SEND and not the
 * stored key, or a legacy form would resolve a message its site does not hold,
 * report `no_template`, and mail nobody: the fixture quietly asserting the very
 * silence this ticket exists to end.
 */
function sendsTemplateOf(options: SeedForm): string {
  if (versionOf(options) >= 7) return templateOf(options)
  return gates(options) ? 'asset' : ''
}

/**
 * The `form` slot every seeded instance carries.
 *
 * REQUIRED BY THE CONTRACT, AND THE FIXTURE USED TO OMIT IT. Nothing read it —
 * the receiver reads config and never slots — so `slots: {}` cost nothing until
 * [[BUG-95]] made the receiver carry a stale instance across its migrations, and
 * `upgradeInstance` validates what it produces. A stored shape the contract
 * refuses is not what any real store holds (every `contact-form` in both stores
 * carries this slot), so the fixture writes what they write.
 */
function formSlot(): Record<string, unknown> {
  return { kind: 'container', layout: 'stack', children: [] }
}

/** One `contact-form` instance, in the shape a stored page carries it. */
function moduleFor(options: SeedForm, instanceId: string): Record<string, unknown> {
  const version = versionOf(options)
  return {
    id: instanceId,
    type: 'contact-form',
    version,
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
    slots: { form: formSlot() },
  }
}

/**
 * The page a seeded site's primary form sits on — every form on it, in order.
 *
 * IT CARRIES AN `id` ([[BUG-93]]). It did not, and nothing read one, because
 * nothing addressed a page: the receiver scanned every page for an instance id.
 * The handle a form puts on the wire now names the page, and the id is what it
 * names — so a fixture without one seeds a site whose forms cannot be submitted,
 * exactly as a real site without one would be.
 */
function pageWith(options: SeedFormOptions, instanceId: string): Record<string, unknown> {
  return {
    id: HOME_PAGE_ID,
    slug: 'home',
    title: 'Home',
    modules: [
      moduleFor(options, instanceId),
      ...(options.alsoForms ?? []).map((form) => moduleFor(form, form.instanceId)),
      ...(options.alsoModules ?? []),
    ],
  }
}

/** The id — and so the store key `home.json` — of the page {@link pageWith} builds. */
const HOME_PAGE_ID = 'home'

/** One further page and its forms, in the shape a stored page carries them. */
function extraPage(spec: SeedPage): Record<string, unknown> {
  return {
    id: spec.id,
    slug: spec.id,
    title: spec.id,
    modules: spec.forms.map((form) => moduleFor(form, form.instanceId)),
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
  return forms.some(gates) ? ['cta_url', 'asset_name'] : []
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
  // EVERY FORM ON THE SITE AND NOT ONLY THE ONES ON THE HOME PAGE ([[BUG-93]]).
  // A form on a further page names a message exactly as one on the first page
  // does, and a fixture that materialised only the first page's would leave the
  // second page's form reporting `no_template` — which is silence, which is the
  // symptom this whole ticket is about, arriving from the fixture instead.
  const forms: SeedForm[] = [
    options,
    ...(options.alsoForms ?? []),
    ...(options.alsoPages ?? []).flatMap((spec) => spec.forms),
  ]
  const declared = new Map<string, SeedEmailPage>()
  for (const spec of options.emails ?? []) declared.set(spec.id, spec)

  // The caller's own list first, in the order given, so a page nothing names is
  // still seeded — that is how a test proving a refusal gets a site that holds
  // email pages for the refusal to be able to list.
  const ids: string[] = [...declared.keys()]
  for (const form of forms) {
    // THE MESSAGE THE FORM SENDS, NOT THE KEY ITS CONFIG SPELLS ([[BUG-95]]) —
    // a pre-v7 instance names none and sends `asset` all the same.
    const key = sendsTemplateOf(form)
    if (key !== '' && !ids.includes(key)) ids.push(key)
  }
  const omitted = new Set(options.omitEmails ?? [])

  return ids
    .filter((id) => !omitted.has(id))
    .map((id) => ({
      name: `${id}.json`,
      page: emailPageFor(
        declared.get(id) ?? { id },
        placeholdersFor(forms.filter((form) => sendsTemplateOf(form) === id)),
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
  /**
   * A `site.json` THE PRODUCT'S OWN SCAFFOLD WROTE ([[BUG-97]]).
   *
   * IT USED TO BE `{ name, config: { businessName } }`, which is not a site: it
   * carries no `id`, no `theme` and no `nav`, so the draft it produced FAILED TO
   * VALIDATE. Nothing noticed, because every suite using this fixture read the
   * definition out of the store and none of them ever RENDERED it — and the
   * moment one does ([[BUG-97]]'s draft gate, which serves an artifact out of the
   * draft), the renderer refuses the whole site. This file's own header claims *"a
   * site this returns is a site the serving Worker could serve"*; `starterSiteJson`
   * is what makes that true, and it is the same function `1c new` seeds with, so
   * the fixture starts from what a real site starts from.
   *
   * `businessName` IS KEPT AT `Fixture`, because suites assert on it.
   */
  const siteJson = {
    ...starterSiteJson(label),
    name: label,
    config: { ...(starterSiteJson(label).config as Record<string, unknown>), businessName: 'Fixture' },
  }
  // [[REQ-247]] — the messages this site's forms send are pages of it, so they
  // are written into the very same draft and frozen into the very same revision
  // as the page carrying the form. That is not tidiness: it is what makes the
  // copy a visitor is sent the copy that was PUBLISHED (AC-6).
  const emails = emailPagesFor(options)
  const pages = [
    { name: `${HOME_PAGE_ID}.json`, page },
    ...(options.alsoPages ?? []).map((spec) => ({
      name: `${spec.id}.json`,
      page: extraPage(spec),
    })),
    ...emails,
  ]

  const siteKey = await store.createDraft()
  await store.write(siteKey, {
    siteJson,
    pages,
    assets: Object.entries(options.draftAssets ?? {}).map(([name, body]) => ({
      name,
      bytes: new TextEncoder().encode(body),
    })),
  })
  /*
   * THE SNAPSHOT NAMES ITS ASSETS BY CONTENT ([[REQ-304]]).
   *
   * A revision holds identities rather than bytes, so the fixture asks the store
   * what it just stored rather than restating it: the digests have to be the
   * ones the store recorded, because `writeRevision` refuses a reference to
   * content it does not hold and `snapshotSha` is taken over exactly these.
   */
  const siteContent = { siteJson, pages, assets: await store.assetManifest(siteKey) }

  /**
   * A PUBLISHED SITE HAS A PUBLIC ADDRESS, because [[REQ-238]] makes one required
   * before publishing ([[BUG-97]]).
   *
   * WHY THE FIXTURE HAS TO CARRY IT. This helper writes the revision directly
   * rather than going through `POST /api/publish`, so it walks past the gate that
   * would have refused a site with no address — and since [[BUG-97]] the send path
   * reads that address to compose a recipient's link. A fixture without one would
   * seed a state the product forbids and then assert the refusal it earns, which
   * is silence: every delivery UAT in this suite quietly proving that nothing was
   * sent.
   *
   * AND NOT FOR AN UNPUBLISHED ONE, which is equally load-bearing. A site being
   * built has no address and needs none — the draft channel's link names the
   * builder — so `publish: false` seeds exactly the state [[BUG-97]]'s draft half
   * exists to serve.
   */
  const address = options.publish === false ? null : await giveSiteAnAddress(siteKey)

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
        // THE REAL DIGEST OF THE SNAPSHOT BESIDE IT ([[REQ-266]] §4). It used
        // to be the literal 'fixture', which was harmless only while nothing
        // compared the two; `readRevision` verifies now, and the capture path
        // reads a form's frozen definition through it — so a made-up digest
        // would seed a state no publish can produce and then refuse every read
        // of it.
        sha: await snapshotSha(siteContent),
      },
      {
        // THE REVISION'S SOURCE IS THE DRAFT'S, assets included — a publish
        // freezes what the site held, and a fixture that dropped the assets
        // would freeze a revision no publish could produce.
        source: siteContent,
        out: new Map([
          ['index.html', options.outHtml ?? '<!doctype html><title>Home</title>'],
          ...Object.entries(options.outFiles ?? {}),
        ]),
      },
    )
  }

  return {
    siteKey,
    host: address?.host ?? null,
    instanceId,
    pageId: HOME_PAGE_ID,
    formHandle: formHandle(HOME_PAGE_ID, instanceId),
  }
}
