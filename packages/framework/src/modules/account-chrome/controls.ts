import type { L1ControlElement } from '../../l1/render'

/**
 * `account-chrome`'s **attribute bundles** — the module's half of the control
 * contract ([[DOC-25]] §10, REQ-96). The module says which elements exist and
 * what makes them work; L1 says what they look like.
 *
 * Three details are load-bearing rather than defaults:
 *
 * `aria-expanded` STARTS TRUE on the sign-in control, because the server renders
 * the dialog OPEN and `client.js` folds it away. A visitor with no script meets a
 * real `<form method=post>` they can actually use, so script only ever subtracts
 * — the same direction `account-portal` chose, for the same reason.
 *
 * `type="submit"` on the submit and `type="button"` on the dismiss. The dialog
 * IS a form, so a bare `<button>` inside it would submit; a Close that mails
 * somebody a sign-in link is worse than no Close at all.
 *
 * THE LINKS CARRY THEIR `href` AND NOTHING ELSE. Both targets are asserted
 * through the URL allowlist before they arrive here, so a control can never
 * navigate somewhere the safety layer refused.
 */
export function accountChromeControls(labels: {
  signInLabel: string
  portalLabel: string
  businessesLabel: string
  emailLabel: string
  submitLabel: string
  dismissLabel: string
  portalHref: string
  businessesHref: string
  dialogId: string
  emailId: string
}): Record<string, L1ControlElement> {
  return {
    signIn: {
      tag: 'button',
      attrs: {
        type: 'button',
        'aria-expanded': 'true',
        'aria-controls': labels.dialogId,
        'data-account-chrome-open': true,
      },
      text: labels.signInLabel,
    },
    portal: {
      tag: 'a',
      attrs: { href: labels.portalHref, 'data-account-chrome-portal': true },
      text: labels.portalLabel,
    },
    businesses: {
      tag: 'a',
      attrs: { href: labels.businessesHref, 'data-account-chrome-builder': true },
      text: labels.businessesLabel,
    },
    email: {
      tag: 'input',
      attrs: {
        type: 'email',
        name: 'email',
        id: labels.emailId,
        required: true,
        autocomplete: 'email',
        'data-account-chrome-email': true,
      },
    },
    submit: { tag: 'button', attrs: { type: 'submit' }, text: labels.submitLabel },
    dismiss: {
      tag: 'button',
      attrs: { type: 'button', 'data-account-chrome-close': true },
      text: labels.dismissLabel,
    },
  }
}
