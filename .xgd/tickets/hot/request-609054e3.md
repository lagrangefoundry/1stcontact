---
uid: request-609054e3
id: REQ-203
type: request
title: An accepted invitee gets a business, a starter site, and lands on the Site
  tab
created_by: CHAT-39
created_at: '2026-09-06T23:26:46.818016+00:00'
updated_at: '2026-09-06T23:57:13.432367+00:00'
completed_at: null
last_field_updated: story_points
status: free_coding
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-13cf5c3c
---

**Design ref:** [[CHAT-39]]. Depends on [[REQ-202]] for the invitee being able to
authenticate at all. Closes [[DOC-42]] §10.1's admitted-but-unentitled gap, which
[[REQ-188]] named and deferred.

## What happens today

An invited contact who reaches the front door is refused. They hold a `users` row and
an address; `invitePerson` deliberately writes neither a membership nor an entitlement
([[DOC-42]] §5), so `admit` answers `no_membership` and they are shown
`DENIED_MESSAGE` — *"Your access to 1st Contact has ended"* — five minutes after being
invited. Nothing ended. They never had access, and the sentence is false in the one
case it is most often read.

Every beta invitee travels this path. It is the last thing between an invite and a
working onboarding.

## A person who signs up gets a business

1st Contact is a site builder. An invitee who signs in and owns no business has nothing
to be signed in *to* — no site, no builder, no reason to have come. So signing up
provisions one. This is not a convenience or a shortcut around billing; it is what the
product is.

`provisionBusiness` already does the whole of it: the `tenants` row, an `owner`
membership for **every person on the owning account**, an entitlement, and a starter
site via `createStarterSite`. It returns `{ businessId, name, siteSlug }`.

**The account already exists and must not be created again.** `addContact` mints an
`accounts` row alongside every contact — including a Lead nobody will ever bill —
precisely so there is no row that names none. So this passes `users.account_id` to
`provisionBusiness` and creates nothing. Minting a second account here would give one
person two, and would put the payer somewhere no reader expects.

**Falsifier:** an `INSERT INTO accounts` on this path.

## It happens on terms acceptance

Not on redemption, and not on first admission.

Acceptance is the person's own act and the fact that makes them a Member
([[REQ-188]]): `tos_accepted_at` is what separates somebody we asked from somebody who
came. `guardTerms` already blocks everything until it happens, so provisioning any
earlier would build a business, a site and a grant for a person who then closes the tab
without agreeing.

## It must be idempotent, and the reason is not hypothetical

`needsAcceptance` compares `tos_version` against `TERMS_VERSION`. **The day the terms
change, every existing member re-accepts** — and a naive implementation would provision
each of them a second business, with a second starter site, on a document revision.

So the guard is a condition and not a comment: provision only when this account owns no
business. `tenants.owner_account_id` is the column that answers it.

**Falsifier:** a second acceptance producing a second business.

## What the business is called

They have not been asked yet, because the flow that asks does not exist. So: the
contact's display name where they have one, otherwise a neutral placeholder — and it
must read as obviously provisional, because the operator will see it in the Contacts
tab before the invitee ever renames it.

`tenants.name` is an attribute and may change ([[REQ-190]]), so this costs nothing to
get approximately right and would cost something to leave blank.

## The grant is open-ended for the beta

`provisionBusiness` takes a `plan` and writes the entitlement. A beta invitee gets an
open-ended grant: a dated one would expire somebody out of their own business at a
wall-clock time nobody chose, in the middle of the trial they were invited to — the
same reasoning `0005` used for the operator's own grant.

## The door has to open first, and today it does not

Stated because it is a consequence of the above rather than a separate wish, and
because nothing works without it. `guardTerms` runs AFTER `admit` — deliberately,
so that the terms are checked against a person rather than against a token — and
`admit` refuses `no_membership` before the invitee ever reaches the interstitial.
Provisioning on acceptance is therefore unreachable until admission stops
refusing the state it is supposed to end.

So `admit` admits a contact holding nothing, on two conditions taken together:

- **they have not signed up** — `tos_accepted_at` is null, the membership marker
  ([[DOC-44]] §3), and the access axis rather than the pipeline one; and
- **their account owns no business** — the same `tenants.owner_account_id`
  question the idempotency guard asks, so the door opens exactly when there is
  something behind it.

**The second condition is what preserves every refusal that should survive.** A
person whose membership was *withdrawn*, or whose membership rows were lost
between the two writes that make an account, has an account that already owns a
business — so they are refused exactly as before, and re-inviting them is still
the repair. `no_membership` keeps naming a relationship that ENDED, which is the
one state `DENIED_MESSAGE` is true about.

**It opens no route, and that is why relaxing it is safe.** `guardTerms` runs
immediately afterwards and refuses an unaccepted session every asset and every
API route, so the only doors this admission opens are the interstitial and the
accept route — the two that end the state. Admission is still bounded by there
being a `users` row at all, so self-signup remains as absent as it was.

**Falsifier:** a session holding no membership reaching anything but the terms.

### It supersedes REQ-186's refusal

[[REQ-186]] asserts, as the composition being load-bearing, that *"invited and no
more is `no_membership`"*. That is the sentence this ticket overturns, and it is
named here rather than left for reconciliation to discover. What survives of that
claim is the half that did not change — the invite writes no business, so the
admitted set is EMPTY — and it is asserted in that form instead.

## The guard is one question asked in two places

`admit` asks it to decide whether signing up still has anything to give somebody;
the provisioning hook asks it to decide whether to provision. If those two ever
disagreed, the door would open onto a hook that does nothing. So the ownership
question is one exported function with two readers, not two queries that happen
to match today.

The call site adds one condition of its own: it provisions only for an admission
holding **no business at all**. That set is the one `admit` already resolved, so
it costs no query — and it is what keeps an operator re-accepting bumped terms
from being handed a business of their own. The 1st Contact business names no
owner ([[REQ-194]]), so the ownership question alone answers "no" for them.

**Provisioning runs before the acceptance is stamped.** If it fails,
`tos_accepted_at` stays null, so the person is still admitted, is served the
interstitial again, and their next press retries. Stamping first would leave a
member with no business and no membership — which `admit` refuses — so one failed
write would lock them out permanently, with the remedy on the far side of the
lock. They have already clicked agree by the time either runs.

**The hook is a module of its own** (`onboarding.ts`), because this ticket is
explicitly a placeholder: when the real onboarding flow lands it takes this
module's place at the same hook rather than being threaded through four lines
inside the terms gate. It returns the business it made and null when it made
none, so a no-op is distinguishable from the act at any call site that reports.

## Where they land

**The Site tab of the builder.** `SITE_TAB` is already first in `TABS`, so the
requirement is that acceptance returns them to the builder root and the default tab
stands — not that a new destination is invented.

They arrive at a starter site they can immediately edit, which is the shortest path
from "I was invited" to "I am using it".

One detail follows from where the interstitial is served. It answers AT the URL
that was asked for, so accepting reloads and the builder is what comes back —
except at `/terms` itself, where a reload correctly answers with the terms again
(an accepted caller may still read what they agreed to) and would leave a brand
new invitee reading the document they have just accepted. From that one path the
accept control goes to the builder root instead.

## This is a placeholder for an onboarding flow

Stated so it is not mistaken for a finished design. A real flow asks what the business
is called and what it is for, and probably picks a starting point from that. None of
that exists, and until it does the invitee is dropped straight into the builder. When
the onboarding flow lands it takes this ticket's place at the same hook.

## What this does not do

- no onboarding flow, no questions asked, no template chosen
- no payment, no plan selection, no trial expiry
- no second person on an account — that is a `users` row carrying an existing
  `account_id` and nothing here writes one
- no change to what an operator sees; provisioning from the Contacts tab still works
  and is still how a business gets made by hand

## Acceptance

- accepting the terms provisions a business for the accepting contact when their
  account owns none
- the business is created through `provisionBusiness`, passing the contact's existing
  `users.account_id`
- no `accounts` row is written on this path
- accepting a second time — including after `TERMS_VERSION` changes — provisions
  nothing further, and the check is on `tenants.owner_account_id`
- the provisioned business carries an `owner` membership for the contact and an
  open-ended active entitlement
- a starter site exists and is servable immediately
- the contact is no longer refused: `admit` returns `ok` and the business is selectable
- after accepting, the contact lands in the builder with the **Site** tab active
- an invitee who was never invited — a Lead who somehow reaches the terms page — is
  treated identically; nothing here branches on pipeline stage
- an invited contact holding nothing is admitted rather than told their access has
  ended, and reaches the terms and the accept route and nothing else
- a person who HAS signed up and still holds nothing is refused `no_membership`, as
  are a withdrawn membership and a lost one — re-inviting is still the repair
- an operator re-accepting bumped terms is not given a business of their own
- the business is named after the contact's display name, or a visibly provisional
  placeholder when they have none
- from the terms path itself, the accept control sends them to the builder root
  rather than back to the terms