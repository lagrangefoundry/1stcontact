/**
 * [[REQ-237]], [[REQ-238]] — the `settings` surface: the business's own record
 * and its public address, as the assistant reads and changes them.
 *
 * TWO NAMES ON ONE SURFACE, WITH OPPOSITE LIFECYCLES, and that is the single
 * most important thing this declaration has to teach. The business's NAME is
 * internal, unique inside one account, and free to change whenever its owner
 * likes. The HOSTNAME is public, unique across every hostname ever issued,
 * chosen once and **final**. They live here together because they sit on one
 * settings tab and a customer saying *"change my name"* means one of them — and
 * a model that has not internalised the difference will treat a decision
 * somebody lives with as a text field.
 *
 * A SURFACE OF ITS OWN, for the reason `library-core.ts` is a fifth and
 * `ledger-core.ts` a third. `l1-surface.json` is the documented way to change a
 * SITE ([[DOC-30]]), and a business is not a site — it is the thing the site
 * belongs to, and it has a name whether or not any site exists. Folding a
 * business rename into the site surface would make that surface's claim about
 * itself false, and would put the two names — what the business IS CALLED and
 * what the SITE SAYS — behind one vocabulary, which is exactly the confusion
 * [[EPIC-4]]'s design discussion spent three turns undoing.
 *
 * THE PROSE IS HERE BECAUSE THE OPERATION IS. `roles.ts` states the rule: the
 * tool manual is PROJECTED from the declaration, so a hand-written inventory of
 * tools *"is worse than no inventory because the model believes it."* The
 * `overview`, every parameter description and every refusal below therefore live
 * in `settings-surface.json` beside the operation they describe, and nothing
 * restates them in a priming document.
 *
 * THE REFUSALS ARE THE HOST'S, RE-CODED AND NOT RE-DECIDED — the same treatment
 * `library-core.ts` gives `promoteToSiteAsset`'s gate. Whether a name is free is
 * decided by `apps/control-app/src/business.ts`, over the account that owns the
 * business, against the same comparison the database's unique index carries.
 * What this file does is give that refusal the declaration's code, so the model
 * reads the declaration's sentence and the diagnosis the call alone knows.
 *
 * A PORT, NOT A STORE. Everything the operations need arrives as
 * {@link SettingsDeps}: read the record, change the name. The implementation is
 * the Worker's, over D1 and the business's site store — neither of which can be
 * imported here without putting a runtime into a module the `1c` CLI also loads.
 *
 * IT IS COMPOSED BY WHOEVER GRANTS IT. This file ships the declaration, the
 * operations and the travelling grant; which role gets them is [[REQ-239]]'s —
 * the settings assistant — and the grant travels with the surface rather than
 * sitting in `instances.json` for the reason `image-core.ts` states: that file is
 * validated in CI against the declarations THIS repository hands the validator,
 * so a key there naming a surface built per deployment is a grant nothing can
 * check.
 */
import settingsSurface from './settings-surface.json'

/** The declaration, imported as data for the reason `toolbox-core.ts` gives. */
export const SETTINGS_DECLARATION: Record<string, unknown> =
  settingsSurface as unknown as Record<string, unknown>

/** The surface name, so nothing addresses it as a literal. */
export const SETTINGS_SURFACE = 'settings'

/** What a rename left out of date. Nothing in it was changed by the rename. */
export interface BusinessEffects {
  siteKey: string | null
  siteName: string | null
  siteNameDiffers: boolean
  pagesNamingPreviousName: string[]
}

/** The business's own record, as the host reports it. */
export interface BusinessView {
  businessId: string
  name: string
}

/** One public address, as the host reports it. Always the whole host. */
export interface PublicAddress {
  /**
   * The whole host — `alice.1stc.site`, never `alice`.
   *
   * THE LABEL IS NOT ON THIS SHAPE, and that is [[REQ-238]]'s presentation
   * requirement carried into the wire rather than left to whoever renders it. A
   * permanent name shown as a bare label is a name the customer never actually
   * read, and the one this surface hands the model is the one the public types.
   */
  host: string
  kind: string
  siteKey: string
}

/** What a check answered. */
export interface HostnameCheck {
  host: string
  available: boolean
  refusal: string | null
}

/** A rename, as the host reports it. */
export interface RenamedBusiness extends BusinessView {
  previousName: string
  effects: BusinessEffects
}

/** What this surface needs from the deployment it is composed into. */
export interface SettingsDeps {
  /** The business this conversation is with, or null where there is none. */
  read(): Promise<BusinessView | null>
  /**
   * Change what the business is called, and report what that left out of date.
   *
   * RAISES RATHER THAN RETURNING A REFUSAL. Whether a name is free is decided
   * over the owning account by the module that owns the rule, so that module is
   * what knows it fired; translating it into the declared code is
   * {@link settingsOperations}'s job.
   */
  rename(name: string): Promise<RenamedBusiness>
  /**
   * Every public address this business's site can be reached at, and the apex a
   * `1stc.site` hostname sits under ([[REQ-238]]).
   *
   * A LIST AND NOT A HOSTNAME. *"Does this business have an address"* is the
   * question every caller actually has, over a list that has two kinds and one
   * implementation today — so nothing above this line names `1stc.site`, and
   * [[EPIC-6]]'s custom domains arrive as a second entry rather than as a second
   * operation.
   */
  addresses(): Promise<{ apex: string; addresses: PublicAddress[] }>
  /**
   * Is this hostname available? No side effect, and it reserves nothing.
   *
   * IT ANSWERS RATHER THAN RAISING, unlike {@link claim}, and the asymmetry is
   * the design. *"Taken"* is the answer to the question and not a failure to
   * answer it — a check that threw would make the ordinary outcome of a
   * registrar's field an error, and a model reading an error looks for something
   * to fix rather than for another name to try.
   */
  check(label: string): Promise<HostnameCheck>
  /**
   * Take it. Final.
   *
   * RAISES RATHER THAN RETURNING A REFUSAL, exactly as {@link rename} does and
   * for the same reason: whether a hostname is free is decided by the unique
   * index in the deployment's own database, so the host is what knows which
   * refusal fired. Translating it into the declared code is
   * {@link settingsOperations}'s job.
   */
  claim(label: string): Promise<PublicAddress>
}

/**
 * Raised for the three ways a name can be refused.
 *
 * ITS CODES ARE THE DECLARATION'S. The Toolbox renders a failure from the
 * declaration when the error carries a declared code, so the sentence the model
 * reads is `settings-surface.json`'s — this class carries the *diagnosis*, which
 * is the part only the call knows.
 */
export class SettingsRefusedError extends Error {
  readonly name = 'SettingsRefusedError'
  constructor(
    readonly code:
      | 'NAME_TAKEN'
      | 'NAME_EMPTY'
      | 'NO_BUSINESS'
      // [[REQ-238]]'s four, and they are four rather than one because the model
      // does something different with each: try another name, try a different
      // word, fix the shape, or stop and say what they already have.
      | 'HOSTNAME_TAKEN'
      | 'HOSTNAME_RESERVED'
      | 'HOSTNAME_INVALID'
      | 'HOSTNAME_ALREADY_HELD'
      | 'NO_SITE',
    message: string,
  ) {
    super(message)
  }
}

type Params = Record<string, unknown>
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * What a session may do with the business's record. Travels with the surface.
 *
 * FOUR GROUPS AND NOT TWO SINCE [[REQ-238]], and the second pair splits on the
 * same line the first does: reading an address and checking whether a hostname
 * is free are both questions that change nothing, and TAKING one is the single
 * most consequential act on this surface. A deployment that wanted an assistant
 * which could advise on hostnames without being able to commit its client to one
 * withholds exactly one group, and the split is what makes that a configuration
 * change rather than a redesign.
 *
 * TWO GROUPS AND NOT ONE, on the original pair. A group is effect-homogeneous — the framework's
 * validator refuses a `write` group holding a `read` operation — but the split is
 * not merely mechanical. Reading what a business is called and changing it are
 * different acts, and a distinct group is what lets a deployment grant a
 * consultant the first without the second: a session that should know the
 * business's name in order to write it into page copy is not thereby a session
 * that may change the record.
 *
 * BOTH ARE GRANTED HERE, because an assistant that can read the name and not fix
 * the placeholder is the half-feature this ticket is about. The separation is
 * what makes narrowing it later a configuration change rather than a redesign.
 */
export function settingsInstanceConfig(): Record<string, unknown> {
  return {
    [SETTINGS_SURFACE]: {
      groups: ['ReadBusiness', 'RenameBusiness', 'ReadAddresses', 'ClaimHostname'],
    },
  }
}

/** The record as the model reads it — the declaration's `business` shape. */
function businessView(business: BusinessView): Record<string, unknown> {
  return {
    // `business` AND NOT `id`, because that is the noun the declaration uses
    // throughout and calling the field what the shape is called is what stops
    // the model translating.
    business: business.businessId,
    name: business.name,
  }
}

/** The effects as the model reads them — the declaration's `effects` shape. */
function effectsView(effects: BusinessEffects): Record<string, unknown> {
  return {
    site: effects.siteKey,
    site_says: effects.siteName,
    site_is_out_of_date: effects.siteNameDiffers,
    pages_naming_the_old_name: effects.pagesNamingPreviousName,
  }
}

/** One address as the model reads it — the declaration's `address` shape. */
function addressView(address: PublicAddress): Record<string, unknown> {
  return { host: address.host, kind: address.kind, site: address.siteKey }
}

/**
 * A host's refusal, as the declaration's code.
 *
 * RE-CODED AND NOT RE-DECIDED — the same treatment `rename_business` gives
 * `business.ts`. Whether a hostname is free is decided by a unique index in the
 * deployment's database and whether a word is reserved is decided by the list
 * that owns it; what this does is give each refusal the declaration's code, so
 * the model reads the declaration's sentence and the diagnosis only the call
 * knows.
 *
 * IT SWITCHES ON THE ERROR'S OWN NAME, which is the one thing every host in this
 * repository can be relied on to carry and the one thing a bundler cannot
 * rewrite. This module cannot import `apps/control-app/src/hostname.ts` — it is
 * the port, and that would put a Worker's D1 runtime into a module the `1c` CLI
 * also loads.
 */
function hostnameCode(error: unknown): SettingsRefusedError['code'] | null {
  const name = (error as { name?: unknown } | null)?.name
  switch (name) {
    case 'HostnameTakenError':
      return 'HOSTNAME_TAKEN'
    case 'ReservedHostnameError':
      return 'HOSTNAME_RESERVED'
    case 'InvalidHostnameError':
      return 'HOSTNAME_INVALID'
    case 'HostnameAlreadyHeldError':
      return 'HOSTNAME_ALREADY_HELD'
    case 'NoSiteError':
      return 'NO_SITE'
    default:
      return null
  }
}

/** The business this conversation is with, refusing when there is none. */
async function theBusiness(deps: SettingsDeps): Promise<BusinessView> {
  const business = await deps.read()
  if (!business) {
    throw new SettingsRefusedError(
      'NO_BUSINESS',
      'there is no business behind this conversation.',
    )
  }
  return business
}

/** The operations, bound to one deployment's business record. */
export function settingsOperations(
  deps: SettingsDeps,
): Record<string, (p: Params) => Promise<Untyped>> {
  return {
    read_business: async () => businessView(await theBusiness(deps)),

    rename_business: async (p: Params) => {
      // REFUSED HERE BECAUSE IT IS A PROPERTY OF THE CALL, not of the record: a
      // name made only of whitespace never reaches a host that could report
      // which business holds it, because none does. Every other refusal is the
      // host's and is translated rather than re-decided.
      const wanted = String(p.name ?? '').trim()
      if (wanted === '') {
        throw new SettingsRefusedError('NAME_EMPTY', 'a business needs a name.')
      }
      // ASKED FIRST SO THE REFUSAL CAN BE THE DECLARED ONE. Without it, a session
      // with no business would fail inside the rename with whatever the host
      // raises, rather than with the sentence the declaration promises.
      await theBusiness(deps)
      const renamed = await deps.rename(wanted)
      return {
        ...businessView(renamed),
        previous_name: renamed.previousName,
        // THE WHOLE POINT OF THE OPERATION, AND WHY IT DOES NOT ANSWER A
        // BOOLEAN. The rename propagated to nothing on purpose; what makes that
        // safe is that the caller is told what is now inconsistent and gets to
        // ask about each of it.
        effects: effectsView(renamed.effects),
      }
    },

    /**
     * Where this business's site can be reached ([[REQ-238]]).
     *
     * AN EMPTY LIST IS AN ORDINARY ANSWER AND NOT A REFUSAL. A business that has
     * not chosen a hostname has no public address and needs none until it
     * publishes — so this answers `[]` rather than raising, and the declaration
     * is where "empty means it cannot be published yet" is said.
     */
    read_addresses: async () => {
      await theBusiness(deps)
      const { apex, addresses } = await deps.addresses()
      return { apex, addresses: addresses.map(addressView) }
    },

    /**
     * Is this one free ([[REQ-238]])?
     *
     * IT ANSWERS AND DOES NOT RAISE, including for a name it refuses. "Taken" is
     * the answer to the question rather than a failure to answer it, and the
     * whole value of the operation is that the model may call it as fast as
     * somebody can type without a refusal in the transcript each time.
     *
     * AND IT RESERVES NOTHING. Two sessions can be told the same hostname is
     * free in the same second; the claim decides between them.
     */
    check_hostname: async (p: Params) => {
      await theBusiness(deps)
      return deps.check(String(p.label ?? ''))
    },

    /**
     * Take it ([[REQ-238]]). Final.
     *
     * ASKED FOR THE BUSINESS FIRST so the refusal can be the declared one, the
     * same order `rename_business` uses. Everything after that is the host's
     * decision, translated.
     *
     * IT DOES NOT RE-CHECK. A claim that consulted `check_hostname` first and
     * trusted the answer is this ticket's own falsifier: the unique index is the
     * authority, and a check between the two calls would be the same race with a
     * more confident-looking answer.
     */
    claim_hostname: async (p: Params) => {
      await theBusiness(deps)
      try {
        return addressView(await deps.claim(String(p.label ?? '')))
      } catch (error) {
        const code = hostnameCode(error)
        if (code === null) throw error
        throw new SettingsRefusedError(
          code,
          error instanceof Error ? error.message : String(error),
        )
      }
    },
  }
}

const bound = new WeakMap<object, Promise<Untyped>>()

function settingsToolboxClass(lib: Untyped): Promise<Untyped> {
  return Promise.resolve(lib).then((mod: Untyped) => {
    const existing = bound.get(mod as object)
    if (existing) return existing
    const built = Promise.resolve(
      class SettingsToolbox extends mod.ToolboxSurface {
        constructor(deps: SettingsDeps) {
          super(SETTINGS_DECLARATION)
          // Installed as OWN methods, not prototype ones, so the Toolbox's
          // startup binding check sees exactly the declared set and no more.
          for (const [op, run] of Object.entries(settingsOperations(deps))) {
            ;(this as unknown as Params)[op] = run
          }
        }
      },
    )
    bound.set(mod as object, built)
    return built
  })
}

/** The surface, bound to this deployment's business record. */
export async function settingsSurfaceFor(lib: Untyped, deps: SettingsDeps): Promise<Untyped> {
  const SettingsToolbox = await settingsToolboxClass(lib)
  return new SettingsToolbox(deps)
}
