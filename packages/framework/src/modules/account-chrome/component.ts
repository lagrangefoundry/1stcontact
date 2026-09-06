import type { L1Node } from '@1stcontact/site-schema'
import { renderL1Fragment } from '../../l1/render'
import type { BehaviorProps } from '../behavior'
import { escapeHtml } from '../html'
import { assertSafeUrl } from '../safety'
import { accountChromeControls } from './controls'
import { ACCOUNT_CHROME_SIGNED_OUT } from './session'

/** The single subtree bound to a non-repeated slot, or nothing. */
function subtree(slot: L1Node | L1Node[] | undefined): L1Node[] {
  // An array here is a repeated-slot binding, which is not a valid binding for a
  // single slot. Isolation ([[DOC-25]]): drop it rather than throw, so a
  // malformed instance costs its own corner of the page and not the page.
  return slot && typeof slot === 'object' && !Array.isArray(slot) ? [slot] : []
}

function str(value: unknown, fallback: string): string {
  return typeof value === 'string' && value ? value : fallback
}

/**
 * `account-chrome` behaviour ([[REQ-200]]).
 *
 * IT RENDERS EVERY STATE, ALWAYS, AND MARKS WHICH ONE IS CURRENT. A published
 * site is an immutable snapshot of bytes ([[DOC-12]] §7); there is no per-request
 * render to select a state in. So all three states go into the snapshot and the
 * serving Worker rewrites one attribute ({@link ./session}). The states that are
 * not current are hidden by the module's own CSS, which is an invariant rule and
 * not taste: which state is current is behavioural, and a static L1 subtree has
 * no axis to say it with — the same reasoning the carousel's current-dot rule
 * already rests on.
 *
 * THE NO-JAVASCRIPT BASELINE IS A WORKING SIGN-IN. The dialog is a real
 * `<form method="post">` against the issue endpoint and the server renders it
 * OPEN; `client.js` folds it away behind the Sign In control and upgrades the
 * submit to a `fetch`. So script only ever SUBTRACTS: every degraded state is a
 * page where the address can still be sent, rather than a control that claims
 * something the page cannot do.
 *
 * IT RENDERS NOTHING AT ALL ON A SITE WITH NO ACCOUNTS. The gate is the site's
 * own declaration (`config.capabilities.accounts`), handed down as a prop. It is
 * checked HERE rather than in the renderer because only the module knows what it
 * should do when its capability is absent, and because a page authored with the
 * control on a site that has no accounts must show a dead end to nobody.
 *
 * THERE IS NO BRANCH ANYWHERE BELOW ON WHICH SITE OR WHICH BUSINESS THIS IS.
 * Every difference between one site's chrome and another's is its config, its
 * slots, and the session the Worker resolved — never a name this file knows.
 */
export function accountChrome({
  config = {},
  slots = {},
  instanceId = 'account-chrome',
  edit = false,
  capabilities = {},
}: BehaviorProps = {}): string {
  // The site-level gate. Absent is the default and the common case: most sites
  // have no accounts, and the control that would lead them nowhere is simply not
  // in the page.
  if (capabilities.accounts !== true) return ''

  const signInAction = assertSafeUrl(str(config.signIn, ''), 'account-chrome signIn')
  const portalHref = assertSafeUrl(str(config.portal, ''), 'account-chrome portal')
  const businessesHref = assertSafeUrl(str(config.businesses, ''), 'account-chrome businesses')

  const dialogId = `${instanceId}-dialog`
  const emailId = `${instanceId}-email`
  const emailLabel = str(config.emailLabel, 'Email address')

  const controls = accountChromeControls({
    signInLabel: str(config.signInLabel, 'Sign in'),
    portalLabel: str(config.portalLabel, 'Your account'),
    businessesLabel: str(config.businessesLabel, 'My businesses'),
    emailLabel,
    submitLabel: str(config.submitLabel, 'Send me a link'),
    dismissLabel: str(config.dismissLabel, 'Close'),
    portalHref,
    businessesHref,
    dialogId,
    emailId,
  })

  // Four slots, four fragments, four class namespaces — so two chromes on one
  // page (a header and a footer, which is the placement freedom this module is a
  // module for) cannot collide.
  const render = (name: string) =>
    renderL1Fragment(subtree(slots[name]), `${instanceId}-${name}`, controls, { edit })
  const signedOut = render('signedOut')
  const signedIn = render('signedIn')
  const businesses = render('businesses')
  const dialog = render('dialog')

  // Omitted in the edit render, where there is no session to post to and a live
  // endpoint on the page the author is editing would be a submit waiting to
  // happen. The edit channel ships no client script at all, so this is belt and
  // braces — the same treatment `account-portal` gives its endpoint.
  const action = edit ? '' : ` action="${escapeHtml(signInAction)}"`

  const css = [signedOut.css, signedIn.css, businesses.css, dialog.css]
    .filter(Boolean)
    .map((rules) => `<style>${rules}</style>`)
    .join('')

  return `<section class="account-chrome" ${ACCOUNT_CHROME_SIGNED_OUT}>
  <div class="account-chrome__state" data-account-chrome-when="signed-out" data-l1-slot="signedOut">
    ${signedOut.htmls[0] ?? ''}
  </div>
  <div class="account-chrome__state" data-account-chrome-when="signed-in" data-l1-slot="signedIn">
    ${signedIn.htmls[0] ?? ''}
  </div>
  <div class="account-chrome__state" data-account-chrome-when="businesses" data-l1-slot="businesses">
    ${businesses.htmls[0] ?? ''}
  </div>
  <form class="account-chrome__dialog" id="${escapeHtml(dialogId)}" method="post"${action} data-account-chrome-dialog data-l1-slot="dialog">
    <label class="account-chrome__label" data-fc-invariant for="${escapeHtml(emailId)}">${escapeHtml(
      emailLabel,
    )}</label>
    ${dialog.htmls[0] ?? ''}
    <p class="account-chrome__sent" data-fc-invariant data-account-chrome-sent hidden>${escapeHtml(
      str(config.sentMessage, 'Check your email for a sign-in link.'),
    )}</p>
    <p class="account-chrome__error" data-fc-invariant data-account-chrome-error hidden>${escapeHtml(
      'Could not reach the server. Please try again.',
    )}</p>
  </form>
  ${css}
</section>`
}
