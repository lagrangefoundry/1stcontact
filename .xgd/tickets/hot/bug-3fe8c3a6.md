---
uid: bug-3fe8c3a6
id: BUG-97
type: bug
title: A gated download link names a hardcoded host and the wrong channel, not the
  site's own address
created_by: EPIC-10
created_at: '2026-09-16T00:46:18.723054+00:00'
updated_at: '2026-09-16T00:47:39.141387+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  severity: high
  epic_parent: epic-d6d7ea63
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-cf953dae
---

## Symptom

The whitepapers email arrives and its download button points at

    https://1stcontact.io/site/site_bca807fc7cdd0bf418b15e255f8c45c6/api/download/gate_…

which is the wrong host for this site, exposes the site's internal key to the recipient, and
cannot be followed at all in development.

## Root cause

`publicSiteUrl` composes every link from one hardcoded constant:

    export const PUBLIC_SITE_ORIGIN = 'https://1stcontact.io'
    return `${PUBLIC_SITE_ORIGIN}/site/${encodeURIComponent(siteKey)}${tail}`

**The reasoning behind that constant is still correct, and it does not cover this caller.**
It reads: *"a var would invite a per-environment override whose only reachable effect would be
to send an operator's 'view published' click somewhere else."* That was written when the
builder's own view-published link was the only consumer. There are three now, and they do not
share an audience:

| caller | audience | the rationale |
|---|---|---|
| `router.ts:3114` view-published | operator, inside the builder | holds |
| `router.ts:3961` preview redirect | operator, inside the builder | holds |
| `lead.ts:1344` gated download | **a stranger, by email** | does not hold |

**The product already knows each site's real address.** `site_domains` (`0008`) holds
`site_id`, `host`, `kind` and `status`; `PLATFORM_APEX` is `1stc.site`; [[REQ-238]] makes an
address **required before publishing**; and `kind: 'custom'` is declared-but-unimplemented,
waiting on [[EPIC-6]]. So for any published site a hostname always exists, and the one thing
the mail must not do is name a different one.

Sending a recipient to a domain other than the one they just signed up on is the signal the
`invite` seed's own comment is careful about — *"an anonymous From is most of what makes an
invitation from a domain with no reputation look like phishing."* The same argument applies to
the link as to the sender.

**The channel is wrong as well as the host.** `gateUrl` calls `publicSiteUrl` whatever channel
the submission came from, so a **draft** submission — the operator pressing the button on
their own preview, which [[BUG-78]] deliberately made work — mints a link into the *published*
site. On a site that has never been published that link cannot resolve, and `lead.ts` already
carries a `LeadChannel` that knows which case it is in.

## Fix

**The link is built from the address the site actually has, not from a constant** — the
`site_domains` row for that site, whichever `kind` it is. This is not the per-environment var
the comment warns against: nothing is overridden per deployment, and the value is read from
the store the product already keeps it in. The two operator-facing callers are unchanged.

**A draft submission's link points at the draft**, so a form tested in the preview delivers
something the operator can actually open. Which channel the submission arrived on is already
known at the call site.

A site with no address is a state publishing forbids; if one is somehow reached, the delivery
is refused and says so rather than composing a link into a domain nobody owns.

## Test plan

`tests/test_UAT_FC_BUG-97_download_host.test.ts`:

- A published site with a platform hostname mails a link on **that** host, and the site key
  does not appear in the URL's authority.
- A site with a `custom` address mails a link on the custom host — asserted through the `kind`
  rather than by matching `1stc.site`, so [[EPIC-6]] lands unchanged.
- A **draft**-channel submission mails a link that resolves against the draft, and a published
  one against the published revision. The two are different URLs from the same form.
- A site with no address at all refuses the delivery and reports why; no mail goes out carrying
  a composed-from-nothing link.
- The two operator-facing callers still produce what they produce today. Asserted directly, so
  the fix cannot quietly move the view-published click — the failure the constant's comment
  exists to prevent.
- The link a recipient receives is followable end to end in a development deployment, which is
  the symptom.