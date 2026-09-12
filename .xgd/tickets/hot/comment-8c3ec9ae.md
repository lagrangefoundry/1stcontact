---
uid: comment-8c3ec9ae
id: COMMENT-2843
type: comment
title: Comment on bug BUG-85
created_by: xgd
created_at: '2026-09-12T00:14:49.418413+00:00'
updated_at: '2026-09-12T00:25:03.809036+00:00'
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

<!-- xgd-turn id="8f325965-5fb9-4bc9-8499-6b5b8bce0286-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T00:22:22.960336+00:00" -->
#### You
Why did only this site break?

<!-- xgd-turn id="8f325965-5fb9-4bc9-8499-6b5b8bce0286-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T00:23:41.271988+00:00" -->
#### Claude
Three things had to line up, and they only did here.

**1. It's the only site that has an `account-chrome` instance at all.** The module is gated on `config.capabilities.accounts`, declared per site and never derived. Across all seven sites in D1, exactly one declares it:

```
1stcontact      caps= {'accounts': True}
gigabytealchemy caps= None
xgd             caps= None
alpha           caps= None
unnamed ×2      caps= None
xgd (2nd)       caps= None
```

Everything else is a brochure site whose only module is `contact-form`, which BUG-76 didn't touch. The blast radius of an `account-chrome` bump is "every site with accounts" — a set with one member today.

**2. `contact-form` has never been exposed to this, so it never demonstrated the hazard.** Its last bump (3→4) landed in `3d35dec430` on **2026-07-25**. The earliest site in D1 was created **2026-09-06** — six weeks later. Every stored `contact-form` instance was *born* at v4; there has never been a stored instance on an old `contact-form` pin. The bump that would have taught us this happened before there was any data to break.

**3. The copy that got migrated was the one visible in the repo.** `0b5a32d465` did update `storage/sites/1stcontact/draft/pages/home.json` to v2 — +68 lines adding the `sent`/`error` slots. But that's the file-backed fixture, module `id: "chrome"`. Your draft is a different copy in a different store, module `id: "signin"`. The stored draft was last written `2026-09-11T02:14Z`; the bump landed ~21 hours later and never reached it.

Point 3 is the one that generalises: **a migration done by editing files in the repo can only ever reach the fixtures.** As long as that's how a version bump migrates data, the live stores are structurally guaranteed to be missed — and the only reason this cost one site rather than all of them is point 1. The next bump to `contact-form` hits six.

That sharpens my earlier recommendation: the guard can't just check the repo fixtures, it has to walk a real `SiteStore`. Ticket updated with the analysis.

<!-- xgd-turn id="bfcec88a-d388-4180-b6e5-0fd5b6e19c7b-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T00:24:46.749822+00:00" -->
#### You
What is account-chrome?

<!-- xgd-turn id="bfcec88a-d388-4180-b6e5-0fd5b6e19c7b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T00:25:03.133922+00:00" -->
#### Claude
It's the module that provides the two controls a site with accounts owes its visitor: **a way in, and a way to their own portal**. Introduced in REQ-200; the contract lives at `packages/framework/src/modules/account-chrome/meta.ts`.

**What it renders** — four visitor states, all painted into the page at render time, with the serving Worker choosing which is current from the session cookie:

| state | control |
|---|---|
| signed out | a Sign In button that opens a dialog |
| signed in | a link to this site's account portal |
| signed in *and* operates a business | additionally, a link to the builder |
| dialog open | an email field + submit, POSTing to the site's sign-in endpoint |

Plus, since BUG-76, two more slots: `sent` (the confirmation card) and `error` (the network-failure card).

**Four design decisions worth knowing**, because they explain why it looks the way it does:

- **It is not platform chrome.** The obvious build was the apex Worker painting a "Sign In" link into 1st Contact's own corner. DOC-40 §2.1 names that as a failure mode — a capability built for the platform that every customer needs too. Any customer site can have accounts; 1st Contact's is just the first.
- **It's not on every site either.** Gated per site by `config.capabilities.accounts`, never derived. A login link on a brochure site is a dead end. (That gate is exactly why your bug hit one site and not seven.)
- **It's a module rather than Worker markup so L1 owns placement and look.** Each state is a slot, so a site can put the portal link in the footer and Sign In in the header. It ships an L2 preset (`l2/account-chrome.ts`) so you don't have to author four subtrees just to get a Sign In link.
- **It authenticates nothing and gates nothing.** It renders every state and lets the Worker pick. No published content varies by who's looking — the only verb is the address POST.

There's one deliberate carve-out: the `<label>` on the email field is an *invariant* element, clipped to 1×1px and not bindable from L1 — an accessibility obligation, not taste. The visitor reads the prompt via `config.emailLabel` + `labelMode`. That invariant was mis-documented, which is what kicked off BUG-76 and the v2 bump your draft is now stranded behind.

<!-- xgd-chat-end -->