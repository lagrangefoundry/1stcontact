import { STARTER_WIDTHS, starterSiteJson } from '../../../tools/generate/src/cli/scaffold'
import {
  memorySiteStore,
  type MemorySiteStore,
} from '../../../tools/generate/src/store/memory-store'
import type { Admission } from './identity'
import type { Scope } from './scope'

/**
 * The customer portal's shipped default definition ([[REQ-183]]).
 *
 * WHAT THIS IS, AND WHAT IT IS NOT. It is a SITE — a `site.json` and one page,
 * in exactly the shape `1c new` scaffolds and the builder edits. It is not a
 * template, not a route table, and nothing renders it except the renderer that
 * renders every other page ([[REQ-183]] D3). The moment a business holds a
 * `portal` site of its own, that site serves and this is never read again.
 *
 * WHY IT SHIPS AT ALL. A business provisioned before this ticket existed holds no
 * portal site, and the store is D1 plus R2, which no migration can reach. So the
 * default is what makes the surface reachable everywhere on the day it lands,
 * rather than for whoever is provisioned next. Seeding it at provisioning time is
 * the obvious next step and is deliberately not done here.
 *
 * WHY THE COPY LIVES IN THIS FILE. Two reasons, and neither is convenience. It is
 * the one surface where a sentence that overstates is the failure ([[DOC-37]]
 * §6.2), so it belongs where the [[REQ-180]] §3 vocabulary guard walks — which is
 * the two apps' own source. And it is L1 rather than markup, so a hand editing it is editing
 * site content, with the validator between them and the page.
 *
 * WHAT THE COPY MAY CLAIM. Only what is true today. The control opens this
 * explanation and does nothing else — no deletion is built, no request is
 * recorded — so the words say that the erasure is done by asking, and the
 * inventory below describes what erasure *means* rather than what this page just
 * did. That is [[REQ-183]] §4.2's whole constraint: a **Delete account** button
 * that does not delete the account converts a missing feature into a lie, and the
 * only defence is that nothing here says otherwise.
 *
 * WHAT IS DELIBERATELY ABSENT. No plan, no charges, no editing of details, no
 * export, and no route to adding a business ([[REQ-183]] §5) — the last because
 * `provisionBusiness` writes a live grant while we are pre-billing, so a
 * customer-reachable creation control is an unbounded free-plan mint
 * ([[REQ-180]] D2).
 *
 * THERE IS NO "GET IN TOUCH" LINK, and its absence is the honest answer rather
 * than an omission. No contact address exists in this deployment, and a `mailto:`
 * to an unrouted mailbox is precisely the kind of claim the paragraph above
 * forbids — worse than no link, because it looks like a working remedy. The
 * sentence names the act without naming a channel; the link is an ordinary L1
 * edit for whoever routes the mailbox.
 */

/** The reserved slug the portal is authored under, in every business's store. */
export const PORTAL_SLUG = 'portal'

/** Where the portal is reached on this origin. */
export const PORTAL_PATH = '/account'

const INK = '#111827'
const MUTED = '#4b5563'
const PAPER = '#ffffff'
const RULE = '#e5e7eb'

/** A paragraph, at the one size the portal sets prose in. */
function para(text: string, color: string = INK): Record<string, unknown> {
  return {
    kind: 'text',
    text,
    axes: { color, fontSizePx: 16, lineHeightPx: 26 },
    sizing: { width: { mode: 'fixed', px: 640 } },
  }
}

/** One retained item: what survives, and why it is for the reader ([[DOC-37]] §6.1). */
function survivor(what: string, why: string): Record<string, unknown> {
  return {
    kind: 'container',
    layout: 'stack',
    gapPx: 4,
    children: [
      {
        kind: 'text',
        text: what,
        axes: { color: INK, fontSizePx: 16, fontWeight: 600, lineHeightPx: 26 },
        sizing: { width: { mode: 'fixed', px: 640 } },
      },
      para(why, MUTED),
    ],
  }
}

/**
 * The portal's own presentation — the `body` slot.
 *
 * The account line is NOT here: it is the module's invariant element, filled from
 * the endpoint, because it is the reader's own facts rather than copy
 * ([[REQ-183]] D4).
 */
function bodySlot(): Record<string, unknown> {
  return {
    kind: 'container',
    layout: 'stack',
    gapPx: 20,
    children: [
      {
        kind: 'text',
        text: 'Your account',
        axes: { color: INK, fontSizePx: 34, fontWeight: 700, lineHeightPx: 42 },
      },
      para(
        'This is your account and the businesses it operates. Your plan and your ' +
          'payment history are not shown here yet.',
        MUTED,
      ),
      {
        kind: 'control',
        control: 'reveal',
        axes: {
          color: PAPER,
          fontSizePx: 16,
          fontWeight: 600,
          surfaceFill: INK,
          borderRadiusPx: 8,
        },
        padding: { topPx: 12, rightPx: 20, bottomPx: 12, leftPx: 20 },
        interaction: {
          transition: { durationMs: 120, easing: 'ease-out' },
          focus: { ring: { widthPx: 2, color: INK, offsetPx: 2 } },
        },
      },
    ],
  }
}

/**
 * The [[DOC-37]] §6.1 explanation — the `erasure` slot.
 *
 * THE ORDER IS DESTROYED, THEN RETAINED, THEN THE PROMISE. Leading with the
 * exceptions would read as a list of reasons we will not do it; leading with what
 * goes makes the three survivors read as what they are — each one a thing kept
 * because deleting it would harm the person asking.
 */
function erasureSlot(): Record<string, unknown> {
  return {
    kind: 'container',
    layout: 'stack',
    gapPx: 18,
    padding: { topPx: 24, rightPx: 0, bottomPx: 0, leftPx: 0 },
    children: [
      // A hairline rule, as L1 rather than as a border axis: the surface axes
      // carry a uniform `border` and a left accent and no top edge, and a full
      // box outline is the wrong look here. A filled one-pixel box is the same
      // mark with nothing invented.
      {
        kind: 'box',
        children: [],
        axes: { surfaceFill: RULE },
        sizing: { width: { mode: 'fluid' }, height: { mode: 'fixed', px: 1 } },
      },
      {
        kind: 'text',
        text: 'Closing your account',
        axes: { color: INK, fontSizePx: 22, fontWeight: 700, lineHeightPx: 30 },
      },
      para(
        'This page does not close your account on its own. Ask us and we will do ' +
          'it. What follows is what closing it means, and it is the same either way.',
      ),
      {
        kind: 'text',
        text: 'What is destroyed',
        axes: { color: INK, fontSizePx: 16, fontWeight: 600, lineHeightPx: 26 },
      },
      para(
        'Your email address, your name and your phone number. Your enquiries and ' +
          'what they said, your place on any list, where you came to us from, your ' +
          'sessions, and every conversation you have had with the assistant.',
        MUTED,
      ),
      {
        kind: 'text',
        text: 'What survives, and why each one is for you',
        axes: { color: INK, fontSizePx: 16, fontWeight: 600, lineHeightPx: 26 },
      },
      survivor(
        'A one-way fingerprint of your email address.',
        'It cannot be turned back into an address. Its only job is to keep you off ' +
          'any list we import later — which is the exact thing you asked us to stop. ' +
          'Delete it and the next import adds you again.',
      ),
      survivor(
        'The dates you gave permission and withdrew it — not what you said.',
        'It is the evidence that we were allowed to hold your details, and that we ' +
          'did what you asked on the day you asked it.',
      ),
      survivor(
        'Your invoices and payments, with you reduced to the least the law allows.',
        'Financial records have to be kept for several years. That requirement is ' +
          'not ours to waive, and it is usually far less about you than people expect.',
      ),
      para(
        'So the accurate promise is not "everything". It is everything we are ' +
          'allowed to delete, and the three above are the whole of the difference.',
      ),
      {
        kind: 'control',
        control: 'dismiss',
        axes: {
          color: INK,
          fontSizePx: 15,
          fontWeight: 600,
          borderRadiusPx: 8,
          border: { widthPx: 1, color: RULE },
        },
        padding: { topPx: 10, rightPx: 16, bottomPx: 10, leftPx: 16 },
        interaction: {
          transition: { durationMs: 120, easing: 'ease-out' },
          hover: { border: { widthPx: 1, color: INK } },
          focus: { ring: { widthPx: 2, color: INK, offsetPx: 2 } },
        },
      },
    ],
  }
}

/**
 * The portal's `site.json` — the scaffolder's, with its label replaced.
 *
 * DERIVED RATHER THAN WRITTEN OUT, so the portal's theme, nav shape and
 * whatever the scaffolder acquires next are the same ones every site starts
 * with. A second literal here would be a second answer to "what does a new site
 * look like", drifting silently from the first.
 */
export function portalSiteJson(): Record<string, unknown> {
  return {
    ...starterSiteJson(PORTAL_SLUG),
    id: PORTAL_SLUG,
    config: { businessName: 'Your account' },
  }
}

/**
 * The portal's one page.
 *
 * `slug: 'home'` so the site's index IS the portal: the route serves `/` of this
 * site, and a site whose only page is not its home would render a portal nobody
 * could reach without knowing its file name.
 *
 * @param accountEndpoint where the module reads who is asking. PASSED RATHER
 *   THAN IMPORTED, and not only to keep this file free of a cycle with the route
 *   table: the endpoint is a property of the ORIGIN the portal is served from,
 *   and the origin is the provisional half of this design ([[REQ-183]] D1). A
 *   literal here would be the one thing in the definition that could not move
 *   with it.
 */
export function portalHomePage(accountEndpoint: string): Record<string, unknown> {
  return {
    id: 'account',
    slug: 'home',
    title: 'Your account',
    seoMeta: { title: 'Your account', description: 'Your account and what it holds.' },
    modules: [
      {
        id: 'account-portal',
        type: 'account-portal',
        version: 1,
        slot: 'portal',
        config: {
          // The endpoint that requires an identity and answers only about the
          // caller. Relative, so it follows the origin the portal is served from
          // rather than pinning one ([[REQ-183]] D1 — the origin is provisional).
          account: accountEndpoint,
          revealLabel: 'Delete account',
          dismissLabel: 'Close',
        },
        slots: { body: bodySlot(), erasure: erasureSlot() },
      },
    ],
    l1: {
      widths: [...STARTER_WIDTHS],
      background: PAPER,
      textColor: INK,
      root: {
        kind: 'container',
        id: 'root',
        layout: 'stack',
        align: 'center',
        padding: { topPx: 64, rightPx: 24, bottomPx: 96, leftPx: 24 },
        children: [{ kind: 'slot', id: 'portal', name: 'portal', behavior: 'account-portal' }],
      },
    },
  }
}

/**
 * The portal as an in-memory site — the source used when a business has not
 * authored one of its own ([[REQ-183]] D3).
 *
 * A REAL {@link SiteStore}, not a special case in the renderer. `memorySiteStore`
 * holds real definitions, applies real writes and validates through the same
 * `assembleSite` the D1/R2 adapter does, so the fallback and the authored portal
 * reach the renderer through one interface and there is nowhere for the two to
 * diverge. The alternative — a second render entry that takes a definition
 * instead of a store — is the second rendering path §2 forbids.
 */
export function portalFallbackStore(accountEndpoint: string): MemorySiteStore {
  const cached = FALLBACKS.get(accountEndpoint)
  if (cached) return cached
  const store = memorySiteStore()
  store.seed(PORTAL_SLUG, {
    siteJson: portalSiteJson(),
    pages: { 'home.json': portalHomePage(accountEndpoint) },
  })
  FALLBACKS.set(accountEndpoint, store)
  return store
}

/**
 * The fallback store, memoised per endpoint, for the isolate's lifetime.
 *
 * SAFE TO HOLD BECAUSE NOTHING WRITES TO IT. A store handle is otherwise
 * constructed per request on purpose — `forTenant` performs the tenant check and
 * a cached handle would carry a check made against a row that may since have
 * been deactivated. There is no such check here and no such row: this store is a
 * constant, and re-seeding it per request would also defeat the renderer's own
 * memoisation, which is keyed by the store object and would therefore re-render
 * the same page for every asset the page pulls.
 */
const FALLBACKS = new Map<string, MemorySiteStore>()

/**
 * Which business hosts this caller's portal ([[REQ-183]] D2).
 *
 * THE BUSINESS THE ACCOUNT IS AN ACCOUNT **OF**, which is where their `users`
 * row lives — never `env.TENANT_ID` ([[REQ-168]] leaves that variable two
 * readers and a portal is not the third), and never the business they are
 * OPERATING. Those last two differ for every customer: Alice's scope is Alice's
 * Plumbing and her portal is 1st Contact's, because 1st Contact is who she is a
 * customer of. One level down the same expression answers Bob's portal as
 * Alice's Plumbing, which is the whole of [[DOC-42]] §6's relativity and the
 * reason this needs no second implementation when the portal moves origins.
 *
 * THE SCOPE IS THE FALLBACK AND ONLY FOR THE DEV-OPEN PATH, where there is no
 * admission at all — `resolveScope` answered from configuration there, so the
 * one business it names is by construction the deployment's own and reporting it
 * is reporting the truth.
 *
 * NULL WHEN THERE IS NEITHER, which is a host with no identity and no scope. The
 * caller answers 404 rather than inventing a business to render.
 *
 * Pure, and exported, so the relativity is provable without a database.
 */
export function portalBusinessId(admission: Admission | null, scope: Scope | null): string | null {
  if (admission?.ok) return admission.user.tenant_id || null
  return scope?.businessId || null
}
