/**
 * A business's own name — the one place `tenants.name` is compared and written
 * ([[REQ-237]], [[EPIC-4]]).
 *
 * THE NAME IS STORED EXACTLY ONCE, and this module is what makes that claim
 * checkable rather than aspirational. `tenants.name` is what the business IS
 * CALLED: the switcher's label, the Contacts tab's heading, the string an
 * operator reads. Nothing addresses a business by it — that is `tenants.id`,
 * opaque and permanent ([[REQ-190]], [[DOC-43]] §1) — and after [[REQ-236]]
 * nothing derives an addressing token from it either, so changing it moves no
 * URL, orphans no session and migrates nothing.
 *
 * THE SECOND STRING IS NOT A COPY OF IT. `site.config.businessName` is what the
 * SITE SAYS, sitting beside `tagline` and `contact.…` in `siteConfigSchema` —
 * every one of them authored content, changed only by an explicit site edit. A
 * business renamed from `Foo` to `Bar` may want the site to follow, and may
 * equally be mid-rebrand, trading under both, or correcting an internal label
 * that was never the trading name. So {@link renameBusiness} deliberately
 * propagates to NOTHING, and the whole of how that stays safe is that it REPORTS
 * WHAT IS NOW OUT OF DATE instead of answering a boolean. The caller — a form or
 * the settings assistant — decides what to do about it, and *"your site still
 * calls you Foo — shall I change that too?"* is an offer rather than an action.
 *
 * UNIQUENESS IS PER OWNING ACCOUNT AND IS DATA INTEGRITY, NOT A UI GUARANTEE.
 * Two accounts may each hold an `Unnamed business`; one account may not hold two,
 * because its switcher would draw two rows nobody can tell apart. Grants span
 * accounts, though, so a person holding grants on two businesses owned by
 * DIFFERENT accounts can still see two identical entries — that is a
 * disambiguation-on-display problem and this module does not claim to solve it.
 * Claiming otherwise would be the more dangerous outcome.
 *
 * THE COMPARISON IS NORMALISED AND THE STORED NAME IS NOT FOLDED. What the
 * customer typed is what is stored and shown, case and all; what is COMPARED is
 * {@link businessNameKey}. `0007_business_name_unique.sql` carries the same rule
 * as an index and is deliberately the weaker of the two — see that file.
 */

import { d1r2SiteStore } from '../../../tools/generate/src/store/d1r2-store'
import type { IdentityEnv } from './identity'
import {
  PLATFORM_APEX,
  businessAddresses,
  checkHostname,
  claimHostname,
} from './hostname'
import type { SettingsDeps } from '../../../tools/generate/src/cli/ai/settings-core'

/** One business, as this module reports it. */
export interface BusinessRecord {
  businessId: string
  /** `tenants.name`, exactly as it is stored. */
  name: string
  /** The account that owns it — NULL for the platform business and nothing else. */
  ownerAccountId: string | null
}

/**
 * What a rename left inconsistent, and did not change.
 *
 * EVERY FIELD IS AN OFFER, NEVER A RECORD OF AN ACTION. Nothing below was
 * touched by the rename; this is the list of places that still say what they
 * said, so that somebody can be asked about each of them.
 */
export interface BusinessRenameEffects {
  /** The customer's site, or null where the business holds none. */
  siteKey: string | null
  /**
   * What that site's `config.businessName` says — UNCHANGED by the rename.
   *
   * IT WILL GO ON SAYING THIS UNTIL SOMEBODY EDITS THE SITE. Not "until the next
   * publish": publishing re-renders what the site says, and what it says has not
   * changed.
   */
  siteName: string | null
  /** True when {@link siteName} is not the business's new name. */
  siteNameDiffers: boolean
  /**
   * Pages whose authored copy contains the previous name, in load order.
   *
   * PROSE, WHICH CAN ONLY BE FOUND AND REWRITTEN. A headline, a wordmark's alt
   * text or a sentence naming the business is page content; there is no field to
   * update and no synchroniser that could be right, so what is offered is the
   * list of pages worth reading.
   */
  pagesNamingPreviousName: string[]
}

/** What a rename did, and what it left behind. */
export interface BusinessRename extends BusinessRecord {
  /** The name before this call. Equal to {@link BusinessRecord.name} for a no-op. */
  previousName: string
  effects: BusinessRenameEffects
}

/** Refused because of what was typed. */
export class InvalidBusinessNameError extends Error {
  readonly name = 'InvalidBusinessNameError'
}

/** There is no such business, so there is nothing to name. */
export class NoSuchBusinessError extends Error {
  readonly name = 'NoSuchBusinessError'
}

/**
 * Refused because the account already holds a business by that name.
 *
 * IT CARRIES THE OTHER BUSINESS. *"That name is already one of your businesses"*
 * is only useful at the moment of the collision and only if it says WHICH — so
 * the refusal names it rather than leaving the caller to go and look.
 */
export class BusinessNameTakenError extends Error {
  readonly name = 'BusinessNameTakenError'
  constructor(
    readonly takenBy: BusinessRecord,
    message: string,
  ) {
    super(message)
  }
}

/**
 * The storage form of a typed name: trimmed, and internal whitespace collapsed.
 *
 * TIDYING, NOT FOLDING. Case is preserved exactly — `Cole's Bakery` is stored as
 * `Cole's Bakery` and never as `cole's bakery`, because what the customer typed
 * is what the switcher shows. What is removed is whitespace nobody typed on
 * purpose and no rendering would show: a leading space, a trailing newline from a
 * paste, a double space between two words. Doing it at the door rather than at
 * the comparison is what leaves {@link businessNameKey} with only case to fold,
 * which in turn is what lets a SQLite index carry the same rule (see
 * `0007_business_name_unique.sql`).
 */
export function normaliseBusinessName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim()
}

/**
 * The comparison form: {@link normaliseBusinessName}, case-folded.
 *
 * `toLowerCase` IS UNICODE AND THE INDEX'S `lower()` IS ASCII, so this refuses
 * strictly more pairs than the database would. That direction is the safe one
 * and is chosen rather than tolerated: every collision the index would catch,
 * this catches first and reports with a sentence.
 */
export function businessNameKey(name: string): string {
  return normaliseBusinessName(name).toLowerCase()
}

/**
 * Every business this account owns.
 *
 * A NULL ACCOUNT OWNS NOTHING, and that is the platform exemption stated as a
 * decision rather than left to be discovered. `tenants.owner_account_id` is NULL
 * for 1st Contact and for nothing else, so answering "no siblings" here is what
 * makes the platform business uncollidable — the same answer
 * `0007_business_name_unique.sql` gives by treating NULLs as distinct, written
 * once on each side so neither can drift into being the only one that knows.
 */
export async function businessesOwnedBy(
  env: IdentityEnv,
  accountId: string | null,
): Promise<BusinessRecord[]> {
  if (accountId === null || accountId.trim() === '') return []
  const { results } = await env.DB.prepare(
    'SELECT id, name, owner_account_id FROM tenants WHERE owner_account_id = ? ORDER BY id',
  )
    .bind(accountId)
    .all<{ id: string; name: string; owner_account_id: string | null }>()
  return (results ?? []).map(toRecord)
}

function toRecord(row: { id: string; name: string; owner_account_id: string | null }): BusinessRecord {
  return { businessId: row.id, name: row.name, ownerAccountId: row.owner_account_id }
}

/** One business, or null when the id names none. */
export async function businessRecord(
  env: IdentityEnv,
  businessId: string,
): Promise<BusinessRecord | null> {
  const row = await env.DB.prepare('SELECT id, name, owner_account_id FROM tenants WHERE id = ?')
    .bind(businessId)
    .first<{ id: string; name: string; owner_account_id: string | null }>()
  return row ? toRecord(row) : null
}

/**
 * The account's business already holding this name, or null.
 *
 * `except` IS THE BUSINESS BEING RENAMED, and it is not an optimisation: without
 * it, correcting the case of a name — `cole's bakery` to `Cole's Bakery` — would
 * collide with itself and be refused, which is the one rename a customer is
 * certain to want first.
 */
export async function businessNamedBy(
  env: IdentityEnv,
  accountId: string | null,
  name: string,
  except: string | null = null,
): Promise<BusinessRecord | null> {
  const key = businessNameKey(name)
  const held = await businessesOwnedBy(env, accountId)
  return (
    held.find((b) => b.businessId !== except && businessNameKey(b.name) === key) ?? null
  )
}

/**
 * A free name for this account, starting from one the SYSTEM chose.
 *
 * FOR SYSTEM-CHOSEN NAMES ONLY, and the distinction is the whole reason this is
 * a separate function rather than a behaviour of the write. A name the customer
 * TYPED and that is taken must be refused — silently storing `Cole's Bakery-1`
 * for somebody who asked for `Cole's Bakery` is a lie about what happened. A name
 * the PRODUCT picked for them, before anybody was asked, must not fail: a
 * constraint the system itself can trip is a constraint that gets worked around.
 *
 * THE SCHEME IS BASE, THEN `-1`, `-2`, FIRST FREE WINS, compared through
 * {@link businessNameKey} — the same comparison the constraint uses, so this
 * cannot propose a name the write will then refuse.
 *
 * THE SUFFIX IS NOT A COUNT AND NOTHING MAY READ IT AS ONE. It is whatever
 * number was free at the time. An account that provisions three businesses and
 * renames the middle one leaves a gap, and the next provision fills it — so
 * `Unnamed business-2` does not mean "the third business" and never did.
 *
 * ONE QUERY, NOT ONE PER CANDIDATE. The account's names are read once and the
 * search runs over them, so a pathological run of taken names costs a loop in
 * memory rather than a round trip each.
 */
export async function availableBusinessName(
  env: IdentityEnv,
  accountId: string | null,
  base: string,
): Promise<string> {
  const root = normaliseBusinessName(base)
  if (root === '') throw new InvalidBusinessNameError('A business needs a name.')
  const held = new Set(
    (await businessesOwnedBy(env, accountId)).map((b) => businessNameKey(b.name)),
  )
  if (!held.has(businessNameKey(root))) return root
  for (let n = 1; ; n += 1) {
    const candidate = `${root}-${n}`
    if (!held.has(businessNameKey(candidate))) return candidate
  }
}

/**
 * Refuse a name this account cannot have, saying which business holds it.
 *
 * SHARED BY PROVISIONING AND BY RENAMING, because they are the same question
 * asked at two moments and a second spelling of it is how the two come to
 * disagree about what `Cole's  Bakery` means.
 */
export async function requireFreeBusinessName(
  env: IdentityEnv,
  accountId: string | null,
  name: string,
  except: string | null = null,
): Promise<string> {
  const wanted = normaliseBusinessName(name)
  if (wanted === '') throw new InvalidBusinessNameError('A business needs a name.')
  const taken = await businessNamedBy(env, accountId, wanted, except)
  if (taken) {
    throw new BusinessNameTakenError(
      taken,
      `'${taken.name}' is already one of your businesses. Pick a different name for this one.`,
    )
  }
  return wanted
}

/**
 * Change what a business is called, and report what that left out of date.
 *
 * IT WRITES ONE COLUMN AND NOTHING ELSE. No site is edited, nothing is
 * published, no address moves and no session is orphaned — see this file's
 * header for why each of those is a decision rather than an omission.
 *
 * IT PUBLISHES NOTHING, EMPHATICALLY. Publication has its own meaning and its own
 * moment; a rename that published as a side effect would push a draft live that
 * the customer never asked to release.
 *
 * A NO-OP IS AN ORDINARY CALL. Renaming a business to the name it already has —
 * or correcting only its case — writes the column and reports the same effects,
 * which is also how a caller asks *"what is currently out of step?"* without
 * having to invent a second operation for it.
 */
export async function renameBusiness(
  env: IdentityEnv,
  businessId: string,
  raw: string,
): Promise<BusinessRename> {
  const current = await businessRecord(env, businessId)
  if (!current) throw new NoSuchBusinessError('There is no business with that id.')

  const name = await requireFreeBusinessName(env, current.ownerAccountId, raw, businessId)
  await env.DB.prepare('UPDATE tenants SET name = ? WHERE id = ?').bind(name, businessId).run()

  return {
    businessId,
    name,
    ownerAccountId: current.ownerAccountId,
    previousName: current.name,
    effects: await renameEffects(env, businessId, current.name, name),
  }
}

/**
 * What still says the old thing.
 *
 * READ AFTER THE WRITE, over the store rather than over a cache, because the
 * question is about the site as it stands now and the assistant may have edited
 * it in the same conversation.
 *
 * A BUSINESS WITH NO SITE IS AN ORDINARY ANSWER, not an error: provisioning
 * makes one, but a business whose site has been forgotten still has a name, and
 * a rename of it should report nothing rather than fail.
 */
async function renameEffects(
  env: IdentityEnv,
  businessId: string,
  previousName: string,
  name: string,
): Promise<BusinessRenameEffects> {
  const none: BusinessRenameEffects = {
    siteKey: null,
    siteName: null,
    siteNameDiffers: false,
    pagesNamingPreviousName: [],
  }

  const store = await d1r2SiteStore(env).forTenant(businessId)
  // `'site'` — THE CUSTOMER'S SITE, NOT THE PORTAL. A portal is authored under
  // the same business ([[REQ-236]]'s `kind`) and is not what "your site still
  // calls you Foo" is about.
  const keys = await store.siteKeys('site')
  if (keys.length === 0) return none
  const siteKey = keys[0]

  const siteJson = await store.readSiteJson(siteKey)
  const config = (siteJson?.config ?? null) as { businessName?: unknown } | null
  const siteName = typeof config?.businessName === 'string' ? config.businessName : null

  return {
    siteKey,
    siteName,
    // COMPARED THROUGH THE SAME KEY THE CONSTRAINT USES. `Cole's Bakery` and
    // `cole's  bakery` are not a divergence worth telling a customer about, and
    // offering to "fix" one would be an offer to change nothing they can see.
    siteNameDiffers: siteName !== null && businessNameKey(siteName) !== businessNameKey(name),
    pagesNamingPreviousName: await pagesNaming(store, siteKey, previousName),
  }
}

/** Which pages' authored copy contains this name. */
async function pagesNaming(
  store: { readPages(site: string): Promise<Array<{ name: string; page: Record<string, unknown> }>> },
  siteKey: string,
  previousName: string,
): Promise<string[]> {
  const needle = businessNameKey(previousName)
  // A NAME TOO SHORT TO MEAN ANYTHING IS NOT SEARCHED FOR. One or two characters
  // match half the prose on a page, and a list of every page is the same as no
  // list — it tells the customer nothing about where to look.
  if (needle.length < 3) return []
  const pages = await store.readPages(siteKey)
  // OVER THE SERIALISED DEFINITION, deliberately. The business's name can be in a
  // heading, a paragraph, a link's text, a picture's alt text or a page's SEO
  // prose, and walking the tree looking for the places copy is allowed to live
  // would be a second, quietly incomplete model of where copy lives.
  return pages
    .filter((p) => JSON.stringify(p.page).toLowerCase().includes(needle))
    .map((p) => p.name)
}

/**
 * This business's record and its public address, as the settings surface's port
 * ([[REQ-237]], [[REQ-238]], `settings-core.ts`).
 *
 * THE WIRE, AND NOTHING ELSE. The surface decides what a refusal is called and
 * what shape the model reads; this decides nothing — it binds the operations to
 * one business and lets the module that owns each rule raise. Keeping it beside
 * the record rather than in the host is what stops a second opinion about what a
 * name means appearing on the assistant's side of the boundary.
 *
 * IT CARRIES BOTH NAMES AND OWNS ONLY ONE ([[REQ-238]]). The last three entries
 * are the PUBLIC address and are decided in `hostname.ts`; they arrive on this
 * wire because the settings surface is one surface and the customer is looking
 * at one tab, not because this module has an opinion about hostnames. The rules
 * stay where they are — case-folded uniqueness inside an account here, a
 * reserved list and a global unique index there — and the two do not borrow from
 * each other.
 *
 * `read` ANSWERS NULL FOR A BUSINESS THAT IS GONE rather than raising, because
 * "there is no business behind this conversation" is the surface's own declared
 * refusal and it is the surface that should say it.
 */
export function businessSettings(env: IdentityEnv, businessId: string): SettingsDeps {
  return {
    read: async () => {
      const record = await businessRecord(env, businessId)
      return record ? { businessId: record.businessId, name: record.name } : null
    },
    rename: async (name: string) => {
      const renamed = await renameBusiness(env, businessId, name)
      return {
        businessId: renamed.businessId,
        name: renamed.name,
        previousName: renamed.previousName,
        effects: renamed.effects,
      }
    },
    // THE PUBLIC ADDRESS HALF OF THE SAME PORT ([[REQ-238]]), bound to the same
    // business and decided in `hostname.ts` — where the reserved list, the
    // syntactic rule and the unique index that settles a race all live. This
    // file holds the INTERNAL name and that one holds the PUBLIC address; both
    // arrive on one wire because they are one settings tab, and neither borrows
    // the other's rules.
    addresses: async () => ({
      apex: PLATFORM_APEX,
      addresses: await businessAddresses(env, businessId),
    }),
    check: (label: string) => checkHostname(env, label),
    claim: (label: string) => claimHostname(env, businessId, label),
  }
}
