---
uid: request-6efc8a37
id: REQ-359
type: request
title: 'Link elements reject tel: and mailto: URIs, so a phone number cannot be made
  tappable'
created_by: xgd
created_at: '2026-10-02T04:47:46.773737+00:00'
updated_at: '2026-10-02T05:37:30.162463+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-4ff977a7
---

## What I was trying to achieve

Build a home page for a trades business whose primary audience arrives on a mobile phone in an urgent situation. The single most important interaction on the page is tapping the phone number to place a call. The number appears in four places: the header, the hero call-to-action button, a line of body copy, and the footer.

## What stopped me

The link element's href validator accepts only `http`/`https` URLs, site-relative paths, and `#anchor` fragments. A `tel:` URI is rejected, so the change is refused.

The consequence is that a phone number can only ever be rendered as inert text. On a mobile viewport the visitor must memorise or copy the digits and switch to the dialler manually. For an emergency-callout business this is the difference between the site working and the site not working — it is the page's only real conversion action.

## Why this is not a styling workaround

A box styled to look like a button is achievable today, and that is what the page currently has. It looks tappable and does nothing when tapped, which is worse than plain text, because it actively invites a gesture it cannot honour.

## What would have let me finish

Allow `tel:` and `mailto:` in the set of accepted href schemes for link elements. Both are standard, both are inert from a security standpoint in the way that `javascript:` is not, and `mailto:` has the same problem for any site wanting a clickable email address.

If the scheme allowlist exists to block script execution, the fix is to keep blocking `javascript:` and `data:` while admitting `tel:` and `mailto:`, rather than to allowlist only the two web schemes.

## How to reproduce

1. On any page, create a link element whose destination is `tel:+15555550123`.
2. The write is refused by the href validator.
3. The same element with `https://example.com` is accepted.

Observed via the builder role's page-editing tools; the refusal is at validation time, so the draft is left unchanged.


## Fix (scope agreed for free-coding)

L1 gains a **link-only** href allowlist, `isSafeHref`, exported from `@1stcontact/site-schema` next to `isSafeUrl`:

- Admits everything `isSafeUrl` admits (http/https, relative, root-relative, `#anchor`), **plus** `tel:` and `mailto:` URIs with a non-empty body.
- A `tel:`/`mailto:` href must still be free of whitespace/control characters, quotes, backslash and angle brackets (so it cannot break out of the HTML attribute). Parentheses are allowed, since an href is never emitted into a CSS `url()`.
- `javascript:`, `data:`, `vbscript:`, `file:` and every other scheme stay refused.

`isSafeUrl` itself is unchanged: image `src`, `backgroundImageUrl`, zoom sources and font `src` still accept only http(s)/relative, because `tel:`/`mailto:` mean nothing there.

`isSafeHref` is used at every **link** sink, on both layers of the security policy:
- Validator (`validateL1`): the node-level `link.href` and a text run's `link.href`. The refusal message now reads "(http/https, mailto, tel, relative, or #anchor only)".
- Renderer (`renderL1Document`): the node-level link retag and the run-level `<a>`. A `tel:`/`mailto:` href passes through unchanged (it is not root-relative, so it is not relativized).
- Email renderer: the shared `anchor()` sink, so an email body can carry a tappable phone number or address too.
- The generator's `foldLink` checks against the same allowlist the validator now applies.

Out of scope: capture (`hrefOf` in the capture extract script) still records only http(s) targets, so a reproduced site's `tel:` links still fold to text. That is a separate fidelity change.

## Test plan

`tests/test_UAT_FC_REQ-359_tel_and_mailto_links.test.ts`, through the real entry points (`validateL1`, `renderL1Document`, `renderL1Email`):
- A node-level link and a run-level link to `tel:+15555550123` / `mailto:hello@example.com` validate clean and render as live `<a href="tel:…">` / `<a href="mailto:…">`.
- `javascript:`, `data:`, `vbscript:`, an empty `tel:` and a `tel:` carrying a quote or angle bracket are still refused by the validator and degrade to the un-linked element in the renderer.
- An image `src` of `tel:…`/`mailto:…` is still refused, which pins that the widening is link-only.

Regression scope: `req106-l1-links`, the REQ-331 run-link test, `req107-authored-l1-envelope`, `reconciliation-l1-*`, and the L1 email-render tests.