import type { L1Node } from '@1stcontact/site-schema'
import { renderL1Fragment } from '../../l1/render'
import type { BehaviorProps } from '../behavior'
import { attr, escapeHtml } from '../html'
import { assertSafeUrl } from '../safety'
import { accountPortalControls } from './controls'

/** The single subtree bound to a non-repeated slot, or nothing. */
function subtree(slot: L1Node | L1Node[] | undefined): L1Node[] {
  // An array here is a repeated-slot binding, which is not a valid binding for a
  // single slot. Isolation ([[DOC-25]]): drop it rather than throw, so a
  // malformed instance costs its own section and not the page.
  return slot && typeof slot === 'object' && !Array.isArray(slot) ? [slot] : []
}

/**
 * `account-portal` behaviour ([[REQ-183]]).
 *
 * THE NO-JAVASCRIPT BASELINE IS THE EXPLANATION SHOWN IN FULL, and that is the
 * decision this component exists to encode. `contact-form` degrades to a real
 * `<form method=post>`; there is no equivalent here, because the thing being
 * disclosed is prose rather than a submission. So the server renders the erasure
 * explanation VISIBLE and `client.js` folds it away behind the control
 * ([[REQ-183]] D5).
 *
 * The direction matters. Rendering it hidden and revealing it with script would
 * mean a visitor without script meets a **Delete account** control that does
 * nothing and says nothing — a control claiming something the page cannot do,
 * which is exactly what [[DOC-37]] §6.2 forbids and what the acceptance turns
 * into a rule. Rendered this way round, script only ever subtracts, so every
 * degraded state shows MORE of the truth rather than less.
 *
 * THE ACCOUNT LINE IS EMPTY UNTIL IT IS FETCHED, deliberately, and it is not a
 * loading state to be dressed up. The page is site content — one definition, the
 * same bytes for every visitor — so there is nothing true to put there at render
 * time. What fills it comes from an endpoint that required an identity to answer
 * ([[REQ-183]] §2), which is the whole reason the portal is a page plus a module
 * plus an API rather than a per-request template.
 */
export function accountPortal({
  config = {},
  slots = {},
  instanceId = 'account-portal',
  edit = false,
}: BehaviorProps = {}): string {
  const account = typeof config.account === 'string' ? config.account : ''
  const revealLabel =
    typeof config.revealLabel === 'string' && config.revealLabel
      ? config.revealLabel
      : 'Delete account'
  const dismissLabel =
    typeof config.dismissLabel === 'string' && config.dismissLabel ? config.dismissLabel : 'Close'

  const erasureId = `${instanceId}-erasure`
  const controls = accountPortalControls(revealLabel, dismissLabel, erasureId)

  // Two slots, two fragments, two class namespaces — so two portals on one page
  // (which nothing needs today and nothing forbids) cannot collide.
  const body = renderL1Fragment(subtree(slots.body), `${instanceId}-body`, controls, { edit })
  const erasure = renderL1Fragment(subtree(slots.erasure), `${instanceId}-erasure`, controls, {
    edit,
  })

  /*
   * The endpoint is checked here rather than trusted, by the same
   * {@link assertSafeUrl} allowlist every other rendered URL passes — and it is
   * omitted in the edit render, where there is no identity to answer it and a
   * fetch would report a refusal as though the portal were broken. The edit
   * channel ships no client script at all, so this is belt and braces.
   */
  const accountAttr = attr('data-account-src', edit ? undefined : assertSafeUrl(account, 'account-portal account'))

  return `<section class="account-portal" data-account-portal${accountAttr}>
  <div class="account-portal__body" data-l1-slot="body">
    <p class="account-portal__identity" data-fc-invariant data-account-identity></p>
    ${body.htmls[0] ?? ''}
  </div>
  <div class="account-portal__erasure" id="${escapeHtml(erasureId)}" data-l1-slot="erasure" data-account-erasure>
    ${erasure.htmls[0] ?? ''}
    <p class="account-portal__holdings" data-fc-invariant data-account-holdings hidden></p>
  </div>
  <p class="account-portal__error" data-fc-invariant data-account-error hidden>${escapeHtml(
    'Your account details could not be loaded just now.',
  )}</p>
  ${body.css ? `<style>${body.css}</style>` : ''}
  ${erasure.css ? `<style>${erasure.css}</style>` : ''}
</section>`
}
