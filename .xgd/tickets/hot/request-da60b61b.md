---
uid: request-da60b61b
id: REQ-169
type: request
title: 'Terms of service: accepted before the builder loads'
created_by: xgd
created_at: '2026-09-01T00:51:21.466375+00:00'
updated_at: '2026-09-04T00:02:07.258463+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  story_points: 2
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-76256ec4
  commits:
  - working_sha: f205968b1950b43a4c27d6e3728a333282801aa0
    reconcile_sha: null
    main_sha: null
  - working_sha: fe95f12f061fa5e7bfcda04a7ef3ec48c759d61b
    reconcile_sha: null
    main_sha: null
  version: 0.2.62
---

# Terms of service: accepted before the builder loads

## The gap

External people are about to be onboarded and there is nothing recording what
they agreed to. [[DOC-40]] §4 puts acceptance between login and the builder;
[[REQ-167]] provides the `tos_version` and `tos_accepted_at` columns to record it.

## The version is the point, not the timestamp

A timestamp alone says *when* someone clicked and not *what they clicked*.
Acceptance stamps a **version identifier** — `2026-09-01`, a date string — so
that months later the terms in force at acceptance can be identified from the
row.

Bumping the constant re-prompts everyone whose `tos_version` does not match. A
UAT changes the version and asserts an already-accepted user is prompted again.

The comparison is against the constant, not a null check: `tos_version IS NULL`
answers "has this person ever accepted anything", which is the same question as
"do they owe one" only until the first time the terms change. A never-accepted
user and a staled-out one are therefore the same case, forever.

## The interstitial

After a successful login ([[REQ-167]] step 5) and before any builder asset is
served, a user whose `tos_version` does not match the current constant is served
the terms and an accept control. Acceptance writes both columns and continues to
where they were going.

**It blocks the builder, not just the chrome.** The Access gate's own lesson
([[REQ-147]]) applies: bytes served before the check are bytes served to someone
who has not passed it. Asset requests from an unaccepted session are refused,
not merely un-navigated-to.

Declining is not a state. There is no "no" button that records a refusal —
declining is closing the tab, and the account is simply never entered.

## The text

**Lorem ipsum for now**, with real text to follow. This is deliberate and is not
a placeholder to be forgotten: the mechanism is what is being built and the
copy is a content dependency with its own lead time. The text lives in one
constant beside the version so that supplying it later is an edit and not a
search.

## Not in scope

Privacy policy acceptance as a separate act, re-acceptance flows for material
changes, and per-jurisdiction variants.

---

## What was built

`apps/control-app/src/terms.ts`, a new module holding the version constant, the
text constant, the interstitial, and the gate. It is called from `index.ts`
between `admit` and `resolveScope` — the fourth check in the same place and for
the same reason as the other three: before a store handle exists and before a
path is examined, so no route can be reached by a session that has not accepted.

Acceptance is a property of the **person**, not of a business, so it is checked
once an admission exists and before a business has been chosen.

### Continuing to where they were going

The interstitial is served **at the URL that was requested**, and acceptance
completes by reloading that URL. There is no return-path bookkeeping and no
redirect chain to get wrong: the same address that answered with the terms
answers with the thing that was asked for as soon as the columns are stamped.

### Navigations get the page; everything else gets a 403

The interstitial is only useful to a request the browser is going to *render*.
A module script, an `<img>` or a `fetch()` is refused `403` with a plain-text
explanation instead, because answering one of those with an HTML document breaks
the page more confusingly than refusing it does. A navigation is recognised by
`Sec-Fetch-Dest: document`, falling back to an `Accept` that names `text/html`;
a wildcard `Accept` is deliberately not enough, and anything unrecognised is
refused — the direction a gate should fail in.

### The page references nothing

No stylesheet link, no module script, no import map. It cannot have any: the
session it is served to is being refused every asset, so a page that linked one
would render as unstyled text with a button that does nothing — the worst
possible presentation of a legal agreement. Styles and the accept script are
inline.

### Acceptance cannot be posted from another origin

`POST /api/terms/accept` requires an `application/json` content type. A form can
only send three content types, none of them JSON, and anything able to set JSON
has been through a CORS preflight this Worker never answers. Acceptance of a
legal agreement is precisely the thing that must not be forgeable cross-site; a
missing or wrong content type is `415` and leaves the row untouched.

### The terms stay readable after they are accepted

`GET /terms` answers for any admitted caller. When an acceptance is outstanding
it carries the accept control; when it is not, it carries the date accepted in
place of the button. Terms that vanish the moment they are accepted are terms
nobody can check they agreed to, and this is also the natural home for the
constant that holds them.

### The loopback dev server is unaffected

`ACCESS_DEV_OPEN` skips the Access gate and `admit`, so on that branch there is
no admission and therefore no person to have accepted anything. The terms check
sits inside the same block, gated on the same predicate, rather than beside it
on a second condition that happens to agree today.

### One existing UAT changed

`test_UAT_FC_REQ-167_an_invited_and_entitled_person_reaches_the_builder` asserted
that admission was the last check. It is not any more, so that case now accepts
the terms for its invitee first — its claim is about the second gate letting the
right person through, not about the third.

## Test plan

`tests/test_UAT_FC_REQ-169_terms.workers.test.ts`, in workerd, against a real D1
database with the deployed schema, driving the Worker's own `fetch` with real
RS256 Access tokens verified against a real JWKS. Every subject is invited
through `provisionInvite` and admitted through `admit`, so what is proved is that
an otherwise perfectly entitled caller is stopped by this and nothing else. The
assets binding returns a recognisable body so that a fall-through would be
visible rather than inferred.

- an admitted person who has not accepted is served the terms, not the builder
- it blocks the builder and not just the chrome — assets and API routes are 403
- a navigation gets the page and everything else gets a refusal
- neither the terms nor the refusal are cacheable or indexable
- accepting stamps the version and the time, read back out of D1
- acceptance continues to where they were going — the same URLs then answer
- acceptance cannot be posted from another origin, and the row is untouched
- declining is not a state — one control, no refusal language, no route
- bumping the version prompts an accepted user again, driven both by moving the
  constant and by moving the stored value
- a never-accepted user and a stale one are the same case
- the text lives in one constant and every paragraph of it reaches the page
- the interstitial references nothing it would be refused
- the terms stay readable after they are accepted
- `/terms` answers before the assets binding does

Regression scope: `REQ-167`, `REQ-168` (both suites), `REQ-147`, `REQ-178`,
`REQ-145`, `BUG-49`, `naming`, plus the whole `workers` and `node` vitest
projects.

-