import type { BehaviorInstance } from '../behavior'

/**
 * `contact-form` v4 → v5 ([[BUG-86]]) — the endpoint stops being authorable.
 *
 * WHAT v5 BROKE. v4 declared `config.action` as `{ type: 'url', required: true }`,
 * so the submit target of this product's own lead capture was a string an author
 * had to supply. v5 removes the key: the module states its own endpoint
 * (`LEAD_ACTION` in `fields.ts`), and there is nothing left to configure.
 *
 * WHY THIS FUNCTION IS EMPTY, AND WHY IT EXISTS ANYWAY. The transformation is
 * entirely mechanical — `upgradeInstance` drops every key the target contract
 * does not declare, and reports each one in `droppedConfigKeys`, so `action`
 * falls away without a line of help from here. Nothing else about a v4 instance
 * changes: the fields, the asset triple, the copy and the whole `form` slot are
 * v5's unchanged.
 *
 * It is declared regardless because [[BUG-85]] made a declared step the
 * PRECONDITION for a bump rather than a courtesy: `migrationPathFor` refuses a
 * version with no step reaching it, and that refusal is the guard which would
 * have caught `account-chrome` 1 → 2 shipping with no migration and taking 1st
 * Contact's own site down. An identity step is the honest way to say "this bump
 * needs nothing carried", and it says so where a reviewer of the bump will see
 * it. Silence would say the same thing by being indistinguishable from the
 * omission that guard exists to catch.
 *
 * NOTHING IS INVENTED HERE, unlike `account-chrome`'s v1 → v2. That migration
 * had to author a card from a string and another from nothing at all; this one
 * discards a value that no longer has a meaning. There is no reading of a v4
 * `action` that v5 wants: the values actually in the stores were a route that
 * was never built, a third party's API, and a placeholder — see [[BUG-86]] for
 * the audit. Carrying any of them forward would preserve the defect.
 */
export function contactFormV4ToV5(instance: BehaviorInstance): BehaviorInstance {
  return instance
}

/** One item of v6's `config.assets`, as the v5 triple becomes one. */
interface AssetItem {
  key?: string
  name?: string
  url?: string
}

/** A config value as a trimmed string, or `''` when it is not one. */
function text(config: Record<string, unknown>, key: string): string {
  const value = config[key]
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * `contact-form` v5 → v6 ([[REQ-241]]) — the asset a form promises becomes a set.
 *
 * WHAT v6 BROKE. v5 declared the asset as three sibling strings —
 * `asset` (the ledger key), `assetName` (what the mail calls it) and
 * `assetUrl` (where the artifact lives) — because `config` had no object type
 * and a set of one would have been a shape pretending to be a set. Three
 * siblings can say exactly one thing, and the page this product's own site
 * gates on promises TWO whitepapers. v6 replaces them with `assets`, a list
 * whose items carry the same three parts.
 *
 * WHAT THIS FUNCTION CARRIES, AND WHY IT IS NOT AN IDENTITY. Unlike v4 → v5,
 * the old keys hold data the new contract still wants: an instance that
 * declared an asset must come out declaring the SAME asset, under the same key,
 * or the at-most-once ledger loses its handle on every delivery already made
 * and the next submission mails it again. So the triple becomes a one-item
 * list, verbatim.
 *
 * AND AN INSTANCE THAT PROMISED NOTHING COMES OUT PROMISING NOTHING — as an
 * EMPTY LIST rather than as an absent key. Both readings exist in the stores
 * (the two `xgd` forms and both `gigabytealchemy` forms carry no triple at
 * all), and an empty list is the honest way to say "this form gates nothing":
 * it is the same answer the receiver's loop reaches, written down.
 *
 * A HALF-DECLARATION IS CARRIED, NOT DISCARDED. A key with no URL was read as
 * no asset at all under v5 and is read as no asset under v6 — the rule moved
 * from the form to the item and did not change — so carrying it through
 * preserves the behaviour exactly while leaving the author's half-finished
 * intent where they left it. Discarding it here would be this migration
 * deciding something the contract already decides, silently.
 *
 * THE OLD KEYS ARE NOT DELETED HERE. `upgradeInstance` drops every key the
 * target contract does not declare and REPORTS each one in `droppedConfigKeys`,
 * which is where an operator running the upgrade will see them go. Doing it
 * again here would be a second implementation of that rule, free to disagree
 * with the first.
 */
export function contactFormV5ToV6(instance: BehaviorInstance): BehaviorInstance {
  const config = instance.config
  const item: AssetItem = {
    ...(text(config, 'asset') !== '' ? { key: text(config, 'asset') } : {}),
    ...(text(config, 'assetName') !== '' ? { name: text(config, 'assetName') } : {}),
    ...(text(config, 'assetUrl') !== '' ? { url: text(config, 'assetUrl') } : {}),
  }
  const assets = Object.keys(item).length > 0 ? [item] : []
  return { ...instance, config: { ...config, assets } }
}

/**
 * `contact-form` v6 → v7 ([[REQ-243]]) — a form names the message it sends.
 *
 * WHAT v7 BROKE. Through v6 the receiver rendered ONE hardcoded template
 * (`asset`) and rendered it only when the form declared an artifact. v7 makes
 * the message a property of the form — `config.template` names it — and makes
 * ABSENCE mean *send nothing*, which is what a form that only joins a mailing
 * list should do.
 *
 * SO SILENCE IS A NEW MEANING FOR AN OLD SHAPE, AND THAT IS WHY THIS STEP IS NOT
 * AN IDENTITY. Every gated download this product has ever delivered is a v6
 * instance carrying assets and, necessarily, no `template` — there was no such
 * key to carry. Read under v7's rule those forms name nothing and go quiet: an
 * artifact somebody asked for silently never arriving, which is the exact
 * failure `renderCopy`'s refusals exist to prevent, arriving through the door
 * nobody was watching. The step names `asset` for them, which is the template
 * they were already sending.
 *
 * A FORM THAT PROMISED NOTHING COMES OUT NAMING NOTHING, and that is not a
 * default declining to be helpful — it is the same behaviour it already had. A
 * v6 instance with no assets sent no mail, and an absent `template` is v7's way
 * of saying so. Inventing a welcome for it would be this migration deciding
 * what a business's copy says, which is the one thing it must not do.
 *
 * ANY NON-EMPTY LIST COUNTS, INCLUDING A HALF-FINISHED ITEM. The receiver reads
 * an item missing its key or its URL as no item ([[REQ-241]]), so such a form
 * delivers nothing under either version and the behaviour is preserved whichever
 * way this goes. Naming the template anyway is the forgiving direction: the
 * author's intent to gate a download is on the page, and completing the item
 * later then simply works rather than failing for a second, invisible reason.
 */
export function contactFormV6ToV7(instance: BehaviorInstance): BehaviorInstance {
  const declared = instance.config.assets
  const gated = Array.isArray(declared) && declared.length > 0
  if (!gated) return instance
  return { ...instance, config: { ...instance.config, template: 'asset' } }
}
