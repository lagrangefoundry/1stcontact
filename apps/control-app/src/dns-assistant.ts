/**
 * **The assistant's domain surface, wired to this deployment** ([[REQ-260]]).
 *
 * THE WIRE, AND NOTHING ELSE — `businessSettings`'s rule exactly. The surface
 * decides what a refusal is called and what shape the model reads; this decides
 * nothing. It binds the operations to one business, resolves which zone that
 * business's domain lives in, and lets the module that owns each rule raise.
 *
 * WHY THE ZONE IS RESOLVED PER CALL RATHER THAN CAPTURED. A conversation can
 * outlive the state it started in: a client who attaches a domain mid-session
 * would otherwise be talking to an assistant that still believes they have none,
 * and one who releases it would be talking to an assistant still holding a zone
 * it may no longer write to. Each operation asks, which costs one indexed read
 * and cannot go stale.
 *
 * AND IT IS THE ATTACHED DOMAIN, NOT THE POOL. An account may hold several
 * domains; the one this business's conversation is about is the one currently
 * serving its site, because that is the one the client means when they say *"my
 * domain"*. A second domain in the pool is not this conversation's to change,
 * and reaching it would mean the assistant choosing between a client's assets.
 */

import type { CloudflareClient } from './cloudflare'
import type { IdentityEnv } from './identity'
import type { DnsResolver } from './resolver'
import { attachedDomain, UnknownDomainError } from './domains'
import { addressesOf, siteOf } from './hostname'
import { zoneById, zoneForHost, type Zone } from './zones'
import {
  changeById,
  changesFor,
  undoChange,
  UnknownDnsChangeError,
  type DnsChange,
} from './dns-changes'
import {
  addVerification,
  allowSender,
  pointSubdomain,
  publishDmarcMonitoring,
  restoreSigningKey,
} from './dns-ops'
import type {
  DnsChangeView,
  DnsDeps,
  DnsDomainView,
  DnsReadingView,
} from '../../../tools/generate/src/cli/ai/dns-core'

/** One change, as the surface and the routes both report it. */
export function changeView(change: DnsChange): DnsChangeView {
  return {
    id: change.id,
    summary: change.summary,
    settlesBy: change.suppressedUntil,
    undone: change.undoneAt !== null,
  }
}

/**
 * The domain this business's conversation is about, and the zone it lives in.
 *
 * EXPORTED, because the undo route needs the same answer and a second derivation
 * of *"which domain is this business's"* would be the second opinion that ends
 * up disagreeing.
 */
export async function businessDomain(
  env: IdentityEnv,
  businessId: string,
): Promise<{ domain: string; zone: Zone } | null> {
  const siteKey = await siteOf(env, businessId)
  if (siteKey === null) return null
  const domain = attachedDomain(await addressesOf(env, siteKey))
  if (domain === null) return null
  const zone = await zoneForHost(env, domain)
  if (zone === null) return null
  return { domain, zone }
}

/** The domain, or the surface's own refusal. */
async function requireDomain(
  env: IdentityEnv,
  businessId: string,
): Promise<{ domain: string; zone: Zone }> {
  const held = await businessDomain(env, businessId)
  // `UnknownDomainError` AND NOT A NEW CLASS. It is already what every other
  // path in this product raises for *"there is no such domain here"*, the routes
  // already answer 404 to it, and `dns-core.ts` already translates it into the
  // declaration's `NO_DOMAIN` — a second class meaning the same thing would need
  // all three taught about it.
  if (!held) {
    throw new UnknownDomainError(
      'This business has no domain with us, so there is nothing to read or change.',
    )
  }
  return held
}

/**
 * Put a change back, for the route the card's Undo and the history both post to.
 *
 * THE BUSINESS IS CHECKED HERE AND NOT IN `dns-changes.ts`, because whose a
 * change is, is an authorisation question and that module is about compare-and-
 * swap. A change id belonging to another business is reported as *"not one of
 * yours"* — the same answer an id that never existed gets, which is what stops
 * the route being a way to discover that somebody else's change exists.
 */
export async function undoDnsChange(
  env: IdentityEnv,
  client: CloudflareClient,
  businessId: string,
  changeId: string,
): Promise<DnsChange> {
  const change = await changeById(env, changeId)
  if (!change || change.businessId !== businessId) throw new UnknownDnsChangeError()
  const zone = await zoneById(env, change.zoneId)
  if (!zone) throw new UnknownDnsChangeError()
  return undoChange(env, client, zone.cfZoneId, change)
}

/**
 * The port, bound to one business.
 *
 * `client` AND `resolver` ARE THE ROUTE'S, handed in rather than constructed
 * here: they are the same two the domain routes already build per request, and a
 * second construction would be a second credential read and a second place a
 * deployment with none is discovered.
 */
export function businessDns(
  env: IdentityEnv,
  client: CloudflareClient,
  resolver: DnsResolver,
  businessId: string,
): DnsDeps {
  const ctxFor = async () => {
    const { zone } = await requireDomain(env, businessId)
    return { businessId, zone }
  }
  return {
    domain: async (): Promise<DnsDomainView | null> => {
      const held = await businessDomain(env, businessId)
      // `serving` IS TRUE BY CONSTRUCTION HERE, and the field is on the shape
      // anyway: the domain this answers with is the one attached to the site, so
      // a business that holds a domain it has not attached answers `null` — which
      // is the honest answer to *"is there a domain for this conversation to be
      // about"* and keeps the shape truthful when [[EPIC-6]] makes the two come
      // apart.
      return held ? { domain: held.domain, serving: true } : null
    },

    reading: async (): Promise<DnsReadingView> => {
      const { domain } = await requireDomain(env, businessId)
      // [[REQ-257]]'S RESOLVER AND NEVER A SECOND READER. It reads from OUTSIDE,
      // by following the domain's delegation, which is the only way to answer
      // *"what do their customers' mail servers actually see"* — reading our own
      // zone back would answer *"what have we written"*, which is a different
      // question and the one that cannot detect anything we got wrong.
      const snapshot = await resolver.snapshot(domain)
      return {
        domain: snapshot.domain,
        web: snapshot.web,
        mail: snapshot.mail,
        senders: snapshot.senders,
        signing: snapshot.dkim,
        live: snapshot.live,
        takenAt: snapshot.takenAt,
      }
    },

    changes: async () => (await changesFor(env, businessId)).map(changeView),

    allowSender: async (request) => {
      const ctx = await ctxFor()
      return changeView(
        await allowSender(env, client, ctx, {
          // THE DOMAIN ITSELF IS THE DEFAULT, because that is what a provider
          // means when it says *"add this to your SPF record"* — and a model that
          // had to compose the apex would be a model that can get it wrong.
          host: request.host ?? ctx.zone.apex,
          include: request.include,
          who: request.who,
        }),
      )
    },

    publishEmailReporting: async () =>
      changeView(await publishDmarcMonitoring(env, client, resolver, await ctxFor())),

    addVerification: async (request) => {
      const ctx = await ctxFor()
      return changeView(
        await addVerification(env, client, ctx, {
          host: request.host ?? ctx.zone.apex,
          value: request.value,
          who: request.who,
        }),
      )
    },

    pointSubdomain: async (request) =>
      changeView(await pointSubdomain(env, client, await ctxFor(), request)),

    restoreSigningKey: async (request) =>
      changeView(await restoreSigningKey(env, client, resolver, await ctxFor(), request)),
  }
}
