import { latestModuleVersion, presetSlots } from '../../packages/framework/src/worker'
import { nextSlug, siteSeed, type SiteSeed } from './site-seed'
import { starterHomePage } from '../../tools/generate/src/cli/scaffold'

/**
 * A site whose home page MOUNTS A BEHAVIOR MODULE, reachable from every runtime
 * (REQ-148).
 *
 * WHY IT LIVES BESIDE `site-seed.ts`. The same reasoning: the seed is a
 * `site.json` and a page, and the workerd suite has to build the identical one
 * the Node suite builds or the two runtimes are being compared on two different
 * sites. Nothing here touches a filesystem, so both projects can import it.
 *
 * WHY IT EXISTS AT ALL. Until REQ-148 there was no such fixture, because there
 * could not be one: rendering a behavior module needed Astro's transform, so a
 * Worker asked for this page answered with an error naming the ticket. This is
 * the definition that used to be unrenderable there.
 */

/** The behavioural half — an endpoint and a field schema, no aesthetics. */
export const CONTACT_FORM_FIELDS = [
  { name: 'name', label: 'Your name', type: 'text' as const, required: true },
  { name: 'email', label: 'Email', type: 'email' as const, required: true },
  { name: 'message', label: 'Message', type: 'textarea' as const, required: true },
]

export const CONTACT_FORM_CONFIG = {
  action: 'https://forms.example/contact',
  submitLabel: 'Send message',
  successMessage: 'Thanks — we will be in touch.',
  fields: CONTACT_FORM_FIELDS,
}

/** The presentation half — the vetted L1 default (L2), so the fixture authors none. */
export const CONTACT_FORM_SLOTS = presetSlots('contact-form', CONTACT_FORM_CONFIG)!

/** The props the renderer hands the module for this instance. */
export function contactFormProps(edit = false) {
  return {
    config: CONTACT_FORM_CONFIG,
    slots: CONTACT_FORM_SLOTS,
    instanceId: 'contact',
    edit,
  }
}

/** The scaffolder's starter site, with a `contact-form` mounted into an L1 seam. */
export function contactFormSeed(slug = nextSlug('behavior')): SiteSeed {
  const home = starterHomePage(slug) as Record<string, unknown>
  const l1 = home.l1 as { root: { children: unknown[] } }
  // REQ-93 — a behavior joins the L1 document at a declared seam, never beside it.
  l1.root.children.push({ kind: 'slot', name: 'contact' })
  home.modules = [
    {
      id: 'contact',
      type: 'contact-form',
      version: latestModuleVersion('contact-form'),
      slot: 'contact',
      config: CONTACT_FORM_CONFIG,
      slots: CONTACT_FORM_SLOTS,
    },
  ]
  return siteSeed({ slug, pages: { 'home.json': home } })
}
