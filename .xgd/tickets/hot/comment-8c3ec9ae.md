---
uid: comment-8c3ec9ae
id: COMMENT-2843
type: comment
title: Comment on bug BUG-85
created_by: xgd
created_at: '2026-09-12T00:14:49.418413+00:00'
updated_at: '2026-09-12T00:18:56.504303+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-776609f0
  kind: chat_transcript
---

<!-- xgd-turn id="5be409d9-fcd4-40b3-9bad-ada0326b9365-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T00:14:44.069966+00:00" -->
#### You
The first contact site is not showing in the builder. Instead I get: Module not found in catalog: 'account-chrome' v1. Known modules: contact-form@4, carousel@3, account-portal@1, account-chrome@2.

<!-- xgd-turn id="5be409d9-fcd4-40b3-9bad-ada0326b9365-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T00:18:55.207560+00:00" -->
#### Claude
Diagnosed. Ticket BUG-85 is populated.

## What's wrong

Your live 1st Contact draft lives in D1, and its `account-chrome` instance (`id: "signin"`) is pinned to **version 1**. Commit `0b5a32d465` (BUG-76) took that module's contract to **v2 and dropped v1 from the catalog**, so the pin no longer resolves — and one unresolvable module instance kills the whole page load.

v2 is genuinely breaking against what's stored:

| v2 requires | stored instance has |
|---|---|
| `sent` slot (required) | absent |
| `error` slot (required) | absent |
| no `sentMessage` config | `sentMessage` present |
| strict config keys | stray `account` key |

**Scope: exactly one orphan.** I audited every stored instance in both stores — the other nine (`contact-form@4` ×8, `account-chrome@2` ×1) all resolve. 1st Contact has no published revisions, so only the draft row is hit.

**Why nothing caught it:** the bump commit *did* migrate `storage/sites/1stcontact/draft/pages/home.json` to v2 — but that's the file-backed fixture (module `id: "chrome"`), a completely separate copy from your D1 draft (`id: "signin"`). The fixture going green is what hid the orphan.

## The systemic gap

A breaking version bump silently orphans every stored instance on the old version. No migration facility, no compatibility window, nothing that fails at bump time — the first signal is the site going dark. `latestModuleVersion`'s own comment claims "existing instances still pin their own version", which is only true if the catalog keeps resolving those pins. It doesn't. DOC-25 defines `version` as "bumped on a breaking contract change" and says nothing about what happens to instances already carrying the old number.

## What I need from you before coding

**1. The repair itself** — I'd rewrite the stored instance as a valid v2: drop `sentMessage`/`account`, and add authored `sent` and `error` cards matching your dialog's own paint (paper fill, accent border, radius 16, 24px padding, 380px max). The `sent` card carries your existing wording: *"Please check your email. If you are already a member we have just sent you a sign up link."* The `error` card needs words that don't exist yet — suggestion: *"That didn't send. Please check your connection and try again."* Happy with both, or want different copy?

**2. How far to close the class.** Three options, increasing cost:

- **(a) Guard only** — a test that walks every stored instance in both stores and asserts it resolves in the catalog. Cheap, would have caught this at bump time, fixes nothing automatically.
- **(b) Guard + declared migrations** — each bump ships an `N-1 → N` migration on the meta, plus a `1c` upgrade pass over a `SiteStore`. The honest fix; real work.
- **(c) Keep old versions resolvable** — I'd argue against: it means keeping v1's component and stylesheet alive forever, and BUG-76 deleted that behaviour deliberately.

My recommendation is **(a) now**, with (b) filed as its own request — the guard is what turns this from "site goes dark" into "the bump fails in CI", which is the whole difference, and (b) is a design decision DOC-25 should settle rather than something to improvise inside a bug fix.

Say the word and I'll cut the branch. I'll back up the D1 row before touching it.

<!-- xgd-chat-end -->