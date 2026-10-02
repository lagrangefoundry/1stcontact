---
uid: request-6efc8a37
id: REQ-359
type: request
title: 'Link elements reject tel: and mailto: URIs, so a phone number cannot be made
  tappable'
created_by: xgd
created_at: '2026-10-02T04:47:46.773737+00:00'
updated_at: '2026-10-02T04:47:46.773737+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
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