/**
 * What a per-contact link OPENS, and what opening it records ([[REQ-244]]).
 *
 * WHY THIS LIVES IN CONTROL-APP AND NOT WHERE THE REQUEST ARRIVES, for `lead.ts`'s
 * reason exactly: `recordEvent` is the one definition of how a fact enters a
 * contact's history ([[DOC-44]] §4.1), and a second implementation in the site
 * server would be two answers to that question, free to drift. So the request is
 * received by `public-site`, which owns the refusals a hostile caller meets, and
 * the WRITE is handed here over a service binding — see {@link module:worker}'s
 * `AssetGate`.
 *
 * IT RETURNS DATA AND NEVER BYTES. The artifacts themselves are served by
 * `public-site`, which is already the Worker that serves bytes out of a published
 * revision and already holds the bucket; an R2 body does not want to cross a
 * service binding, and a second copy of the serving path over here would be a
 * second opinion about content types and cache headers.
 *
 * NOTHING IN THE REQUEST MAY ASSERT WHO THIS IS. The token names the contact; the
 * grant names the site and the form. The site key in the URL is checked AGAINST
 * the grant rather than trusted by it, so a valid token presented under another
 * business's site key reaches nothing — which is the whole of §6's sideways rule.
 *
 * EVERY REFUSAL IS `null`. Unknown, malformed, revoked, wrong site, wrong asset,
 * unpublished form — one answer, because the caller is answered one response for
 * all of them and a reason that reached this return type would be a temptation to
 * pass it through.
 */

import { PAGE_ACCESSED, ASSET_DOWNLOADED } from './builder/contact-events.js'
import { recordEvent } from './events'
import { businessOfSite, formDefinitionOf, type FormDefinition, type LeadEnv } from './lead'
import { resolveGrant, type AssetGrant } from './grants'

/** Everything this module needs of the deployment — the same as `lead.ts`. */
export type GateEnv = LeadEnv

/** One artifact, as the page lists it. The URL is deliberately not here. */
export interface GatedAsset {
  key: string
  name: string
}

/** What a valid token opens. */
export interface GatePage {
  /** The contact the link was minted for — for the log, never for the visitor. */
  contactId: string
  /**
   * Exactly what this form promises, in declaration order, and no others.
   *
   * READ FROM THE LIVE PUBLISHED DEFINITION rather than from a list frozen onto
   * the grant. The grant names the form; a copy of its artifacts here would be a
   * second answer to what the form promises, and the first thing it would do is
   * offer a paper the operator has since unpublished.
   */
  assets: GatedAsset[]
}

/** Where one artifact's bytes are, as the AUTHOR wrote it. */
export interface GatedArtifact {
  name: string
  /** The `url` the form's own definition declares for this key. */
  url: string
}

/** A resolved token, and the form it opens. */
interface Resolved {
  grant: AssetGrant
  definition: FormDefinition
}

/**
 * Resolve a token to the form it opens, or `null`.
 *
 * THE SITE KEY IN THE URL IS A CHECK AND NEVER A SOURCE. It arrived on the path
 * and the grant arrived from the database; the grant wins, and a disagreement is
 * a refusal rather than a silent preference for one of them. That is what stops a
 * token being walked sideways into another business's artifacts — the only site
 * this token can ever reach is the one it was minted against.
 *
 * THE BUSINESS IS RE-DERIVED FROM THE SITE AND COMPARED. The grant already
 * carries one, derived from its contact when it was written; `sites` carries one
 * too. They cannot disagree unless a site has changed hands, and if they ever do,
 * refusing is the only answer that cannot serve one business's paper out of
 * another's contact record.
 */
async function resolve(env: GateEnv, siteKey: string, token: string): Promise<Resolved | null> {
  const grant = await resolveGrant(env, token)
  if (!grant) return null
  if (grant.siteId !== siteKey) return null

  const site = await businessOfSite(env, siteKey)
  if (!site || site.businessId !== grant.businessId) return null

  const definition = await formDefinitionOf(env, grant.businessId, siteKey, grant.formHandle)
  if (!definition) return null
  return { grant, definition }
}

/**
 * Someone arrived at their downloads page ([[REQ-244]] §4).
 *
 * THE EVENT IS WRITTEN BEFORE THE ANSWER IS RETURNED, so a page that was listed
 * is a page whose arrival was recorded. The reverse order would lose exactly the
 * arrival that mattered — the one where something then went wrong.
 */
export async function openGate(
  env: GateEnv,
  siteKey: string,
  token: string,
): Promise<GatePage | null> {
  const resolved = await resolve(env, siteKey, token)
  if (!resolved) return null
  const { grant, definition } = resolved
  const assets = definition.assets.map(({ key, name }) => ({ key, name }))

  await recordEvent(
    env,
    { businessId: grant.businessId },
    {
      contactId: grant.contactId,
      kind: PAGE_ACCESSED,
      // WHAT THEY WERE OFFERED, which is what makes an arrival that took nothing
      // legible: no download event can say which papers were on the page.
      detail: { site: siteKey, form: grant.formHandle, assets: assets.map((a) => a.key) },
    },
  )
  return { contactId: grant.contactId, assets }
}

/**
 * Someone took one artifact ([[REQ-244]] §4).
 *
 * THE ASSET IS LOOKED UP IN THE FORM'S OWN PROMISED SET, so a key that form does
 * not promise reaches nothing — whatever else holds it. That is the second half
 * of §6's sideways rule, and it is a property of where the list came from rather
 * than of a check somebody has to remember to write.
 *
 * RECORDED BEFORE THE BYTES ARE SERVED, by the caller's own ordering: this
 * function writes the event and then reports where the artifact is, so a served
 * byte is always a recorded one.
 */
export async function takeAsset(
  env: GateEnv,
  siteKey: string,
  token: string,
  assetKey: string,
): Promise<GatedArtifact | null> {
  const resolved = await resolve(env, siteKey, token)
  if (!resolved) return null
  const { grant, definition } = resolved
  const asset = definition.assets.find((candidate) => candidate.key === assetKey)
  if (!asset) return null

  await recordEvent(
    env,
    { businessId: grant.businessId },
    {
      contactId: grant.contactId,
      kind: ASSET_DOWNLOADED,
      // THE SAME TWO KEYS `asset.sent` CARRIES, so *sent* and *taken* read as one
      // sequence about one artifact rather than as two shapes about two.
      detail: { asset: asset.key, name: asset.name },
    },
  )
  return { name: asset.name, url: asset.url }
}
