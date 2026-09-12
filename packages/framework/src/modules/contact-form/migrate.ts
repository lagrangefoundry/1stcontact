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
