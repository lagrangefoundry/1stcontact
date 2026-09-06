---
uid: comment-33d260ac
id: COMMENT-2290
type: comment
title: Comment on request REQ-192
created_by: xgd
created_at: '2026-09-06T18:10:22.354594+00:00'
updated_at: '2026-09-06T19:45:30.324564+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-3a032190
  kind: chat_transcript
---

<!-- xgd-turn id="4f15cb4c-ed7f-40fb-848d-009c3a079c2e-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T18:09:49.089443+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="4f15cb4c-ed7f-40fb-848d-009c3a079c2e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-06T18:15:58.755242+00:00" -->
#### Claude
Now let me look at the routes: what HTTP surfaces exist for invite, business provisioning, and grants.

I've read the ticket and surveyed the code. Two questions genuinely change the shape; everything else I'll decide myself.

## What I found

**Entry points that exist and are HTTP-reachable** (`router.ts`): `POST /api/admin/businesses` → `provisionBusiness`, `POST /api/people/invite` → `invitePerson`, `POST /api/grants` → `openGrant`, `POST /api/terms/accept` → `acceptTerms`, `POST /api/import` (for the `xgd` site). Gates are `ownsPlatformBusiness` (fulfilment) and `ownsBusiness` (invite) — so Alice must invite Bob *as Alice*, which `bin/access-sim` can mint a token for. Good: the seed exercises both gates, which is the point.

**Two personas have no entry point at all:**
- **"a contact never invited"** — `grep 'INSERT INTO users'` returns exactly two writers: `ensurePlatformOperator` and `invitePerson`. Both stamp `invited_at` and `pipeline_stage='invited'`. Nothing in the product creates a *lead*. The contact-form module posts to a configured external `action`; there is no capture endpoint here.
- **"a person with two addresses"** — REQ-191's `user_emails` is still `draft`; `users.email` is a single `NOT NULL` column in `0001_baseline.sql`.

## Question 1 — the two unreachable states

Acceptance says *"every persona and every state in the table above is present"*, but also *"the seed uses the product's own entry points, not direct SQL"*. For these two, those conflict.

**My recommendation:** honour the entry-point rule. The seed produces every state a product path can produce, and *prints* the ones it cannot with the reason and the ticket that would supply them (`REQ-191` for the second address; "no contact-capture surface exists" for the lead). A gap stated by the command every time it runs is better evidence than a row inserted by SQL that proves nothing. I'd record the deferral in this ticket's body.

The alternative is that I add a small `POST /api/people/contact` (record a contact without inviting) — which is arguably a real product hole, since the CRM has no way to add anyone — but that is building product surface to satisfy a fixture, and it lands in `REQ-195`'s territory. Say the word if you want it.

## Question 2 — phase 1

The ticket says phase 1 is one in-process `ensurePlatformOperator(env, address)` call, because an empty database has nobody to authenticate as. That argument has a hole: `admit` **already** calls `ensurePlatformOperator` when the address is in `PLATFORM_ADMINS` (`identity.ts:604`) — before `findUser`, precisely so it works on an empty database. So setting that var makes the bootstrap happen on the seed's *first HTTP request*, and phase 1 disappears.

That matters practically. In-process means a second process (`getPlatformProxy`) opening the same local D1 SQLite that the running `wrangler dev` has open — a real risk, and it also makes the seed unusable against a deployed Worker.

**My recommendation:** drop phase 1. `1c seed --operator <addr>` is pure HTTP, top to bottom. `bin/access-sim --print-env --operator <addr>` gains `PLATFORM_ADMINS` alongside the two Access vars, so it lands in `.dev.vars.local` in the step you already take. The seed verifies the operator was bootstrapped and, if not, fails naming the exact line to add. This also makes the second "added acceptance" block agree with the first (*"PLATFORM_ADMINS is the documented way to bring up an empty deployment"*), which the phase-1 block currently contradicts.

If you'd rather keep the in-process call as written, I'll do that instead — but I'd want to prove the concurrent-D1 question first.

## Decisions I'm making myself (flagging, not asking)

- **Command is `1c seed`**, with the recipe in a transport-agnostic module taking `{fetch, mintToken}` — so the same recipe runs in a `*.workers.test.ts` UAT against the real router with real D1 and real RS256 tokens (the `REQ-186` harness already does exactly this). That's how "re-running it changes nothing" and "every persona is present" become executable evidence rather than a manual look.
- **Bob cannot sign in to the builder**, and that is the product's honest answer, not a seed defect: `admit` resolves users in the platform tenant only, so a row in Alice's tenant gets `no_user`. The level-2 door doesn't exist yet. access-sim will still offer him, and the refusal is the informative part.
- **The `xgd` site restore** is part of the seed: it reuses `readSitePayload` and posts to `/api/import` with the operator's minted token, then diffs what came back. `pushSite` itself needs no change (it takes an injected `fetch`, but discards a path-prefixed origin, so I'll call the exported reader directly).
- **`bin/access-sim` gets committed under this ticket** — it's currently untracked.

Tell me on 1 and 2 and I'll cut the branch and build it.

<!-- xgd-turn id="02aec5ab-ca15-402c-a25d-54bb541c8877-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T18:28:37.932784+00:00" -->
#### You
I think the "products own entry points" is an unnecessary constraint - its desirable but not required. Please don't overengineer this I want a simple script that populates the test data.

This may only run once? Really don't over engineer

<!-- xgd-turn id="02aec5ab-ca15-402c-a25d-54bb541c8877-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-06T18:58:41.181437+00:00" -->
#### Claude
Understood — simple script, direct SQL is fine. Let me gather the last few facts and then cut the branch.

Now let me scope the ticket with the simplification decision.

Now the seed SQL.

Now the runner:

Now the workers UAT:

REQ-191 landed while I was working — `user_emails` now exists. That changes the seed. Let me re-read the current schema.

REQ-191 landing means the two-addresses persona is now seedable. Rewriting the seed against the current schema:

Now let me actually run it against a scratch SQLite to check the SQL parses and satisfies every constraint:

Now update the workers UAT for the current schema and add the two-addresses case:

Now add the two-addresses case and fix the snapshot to cover `user_emails`:

Now the access-sim UAT — the strongest claim in the ticket is that it exercises the real gate:

Now let me run the whole affected suite plus the neighbours that touch the same files:

Now let me verify the seeded data really is reachable through `access-sim`'s live D1 read:

`access-sim` still queries `users.email`, which REQ-191 removed — the login list is empty. Fixing:

Now add a regression guard for the `access-sim` schema bug I just found, then reseed and verify the live ordering:

All 17 failures are pre-existing (confirmed with my work stashed). Now the ticket correction — REQ-191 landed mid-session and changes the cast:

Both are strictly superseded by the branch versions (backed up to `.xgd/tmp/premerge/`). Merging:

A concurrent session is merging REQ-197 into `xgd-working`. Let me check whether that settled before touching anything:

<!-- xgd-turn id="322b1930-6b53-4d6c-8f8b-352f056528ac-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T19:12:34.058764+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="322b1930-6b53-4d6c-8f8b-352f056528ac-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-06T19:22:45.561168+00:00" -->
#### Claude
My work is merged and reachable; only the `free_coded` promotion remains. Let me sync the branch with the (much-advanced) working branch and re-run the UATs first:

REQ-193 already built on my seed (moving names into `user_names`). Let me verify my UATs still pass against the merged state — foreground:

All 24 pass. Now the promotion — lock, bump, fast-forward, promote in one window:

Even holding the lock, concurrent ticket commits land on `xgd-working` between the fast-forward and the check. Retrying in a loop until a clean window:

Word-splitting bug in my loop (zsh) — the shas went as one argument. Fixing and retrying:

Free-coding of REQ-192 is complete.

## What landed

**`db/dev-seed.sql`** — the DOC-42 §1 cast as rows. Alice (in the deployment's own business, no membership on it, per §4) owning three businesses: two with open-ended grants, one whose grant *ended* so it is present in the switcher and unselectable. Her people in Alice's Plumbing across three combinations of DOC-44 §3's two axes — Bob (invited, came), Carol (invited, never came), Dave (a lead, never invited). Every key is a fixed 128-bit value minted once, which is what makes `INSERT OR IGNORE` the whole of the idempotence.

**`bin/seed`** — one command, local by default; `--remote` has to be typed, because a fixture carrying invented people reaching a deployment is the defect REQ-190 removed from migration `0005`. It holds wrangler's per-statement JSON back unless something fails.

**`bin/access-sim`** — committed (it was untracked from CHAT-23), plus a section in `apps/control-app/ACCESS.md`.

**24 UATs across three files**, all passing on `xgd-working`.

## Two things I changed course on, and why

**Direct SQL, per your call.** The ticket's "product's own entry points" requirement is recorded in the ticket body and in the file header as withdrawn, with the reasoning, so reconciliation sees a decision rather than drift.

**REQ-191 merged mid-session, which reopened a persona I had told you was blocked.** `users.email` became `user_emails`, so "a person with two addresses" went from unwritable to seedable — Alice now holds `alice@plumbing.example` (primary) and `alice@oldsalon.example` (not primary). The cast is complete; nothing is missing. That also exposed a live bug: `bin/access-sim`'s login list queried `SELECT email FROM users`, which failed silently because `knownPeople` swallows errors by design — the page kept rendering and had stopped listing anybody. Fixed, and pinned by a regression guard.

## Two things I did not fix

- **`apps/control-app/src/session-knowledge.ts` fails `tsc`** — `SHIPPED_SOURCE` is not exported from `./system-knowledge`. Pre-existing; I touched nothing under `src/`.
- **17 test failures across the KB/knowledge/priming suites.** Confirmed pre-existing by re-running with my work stashed.

## On the promotion

It took many attempts. `move-to-free-coded` requires the version-bump commit to be the tip of `xgd-working`, but every `xgd ticket` call by any agent commits there and bypasses the merge lock — so a concurrent commit lands on top within seconds and the gate refuses. It succeeded at **0.2.113**, and the burnt version numbers between 0.2.104 and 0.2.112 are the cost of the retries. Ticket is `free_coded` with three commits recorded; the branch and worktree are cleaned up. I've saved both that race and the "repo moves under you" hazard to memory.

<!-- xgd-turn id="928dd8eb-42af-4901-8bca-9e79c67d3e60-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T19:43:39.353688+00:00" -->
#### You
Please report an xgd bug for this xgd report-bug

<!-- xgd-turn id="928dd8eb-42af-4901-8bca-9e79c67d3e60-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-06T19:45:28.026543+00:00" -->
#### Claude
Filed as **BUG-1340** (`bug-5794c720`) against the `xgd` project, severity high.

**The defect:** `move-to-free-coded` requires the version-carrying commit to *be* the tip of `xgd-working` — a precondition the caller establishes and then cannot hold, because other sessions commit to that branch continuously. I backed the report with what the repo actually records: **77 commits landed on `xgd-working` during the 25-minute promotion window, 27 of them `xgd(ticket)` commits and the rest branch merges.** The specific commit that beat me while I *held* the merge lock was `5c77f692` — `Merge branch 'free-REQ-198' into xgd-working`.

Two contributing causes I could evidence rather than guess:

- `xgd(ticket)` commits bypass the merge lock, so holding it doesn't quiesce the branch.
- The command spends ~15s loading its index *after* the caller has set up the precondition and *before* testing it (`index_load_ms: 3681 / 3180 / 2023` per attempt, 14–20s per attempt end to end). That's the window.

**The message is also part of the problem.** "Someone else already published this version — re-run `xgd_version_bump`, recommit, and retry" is wrong in the common case (nobody published it; a later commit inherited it), and following its advice re-enters the same race. That is what burnt 0.2.87–0.2.90, 0.2.104, 0.2.106 and 0.2.113. I said plainly in the report that 0.2.107–0.2.112 were my own shell-quoting mistake, not xgd's.

I proposed four fixes in preference order, the first being to ask whether the bump is an *ancestor* of the tip rather than the tip itself — which preserves what the rule is actually for (attributing the bump to a recorded commit) without caring what lands afterwards.

I also included, clearly labelled as not a defect, a note that the `invalid SHA` message quotes an 81-character string and reports it as "not 40 characters" — naming whitespace as the cause would have saved a round trip.

<!-- xgd-chat-end -->