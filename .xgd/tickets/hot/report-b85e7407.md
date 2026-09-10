---
uid: report-b85e7407
id: REPORT-3662
type: report
title: 'UAT Coverage: Operator Access Gate: Who May Reach The Builder'
created_by: xgd
created_at: '2026-09-10T04:35:19.967887+00:00'
updated_at: '2026-09-10T04:35:19.967887+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-3606e35b
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# UAT Coverage Assessment: Operator Access Gate: Who May Reach The Builder

**Result**: PASS
**AC verdicts**: 14 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

## Cumulative Intent Considered

CAP-103 holds one story (STORY-120), whose `intent_uid` is BUNDLE-20 and whose
`updated_by` is BUNDLE-21. Both bundles are `free_and_reconciled`, so both count
toward cumulative intent.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-20 (REQ-147 + REQ-143/145/146/148 + 5 more) | free_and_reconciled | 2026-08-24 (merged `eef7a8b4`) | REQ-147 established the gate: Access on `app.1stcontact.io`; named `workers_dev = true` as a hole that a hostname policy cannot cover; required in-Worker JWT verification so the gate does not depend on routing; required the policy record in the repository; six numbered ACs (§4). REQ-145, later in the same bundle, added the loopback-only opening that supersedes REQ-147's "no local-development bypass" statement. | YES |
| BUNDLE-21 (BUG-36 + BUG-37 + BUG-38) | free_and_reconciled | 2026-08-26 (merged `96a76934`) | BUG-36's second finding + approved scope addition: `pushSite` sent `cf-access-jwt-assertion` as though it were an inbound credential, so every call to the deployed builder bounced to the sign-in page — and, the bounce being followed, surfaced as a `JSON.parse` doctype error rather than an auth refusal. Added the caller's side of admission (the client-id/secret pair, the partial-credential refusal, the bounce reporting, the provisioning command). | YES |

No intent in the ledger retires any behaviour this capability describes. Nothing
here is `abandoned`, `deprecated`, `wont_fix`, `draft` or `ready_to_implement`.

REQ-147 AC2 ("an identity not on the policy is refused after authenticating") is
the one intent clause with no criterion below it. That is correct and
deliberate: the identity gateway enforces it before the request reaches the
application, so the application never observes such a request and no test in
this repository can assert it. STORY-120's Technical Context states the
exclusion, and AC-1384 carries it into the policy record and asserts the record
says so (`/not on the policy is refused/i`). This is an intent clause discharged
by documentation, not an uncovered AC.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-120 | BUNDLE-20 (REQ-147, REQ-145), BUNDLE-21 (BUG-36) | aligned | Every behaviour in the story body traces to REQ-147 §2–§4 or to BUG-36's approved scope addition. The nine `## Reconciliation Decisions` entries account for every claim the intent tickets are silent on — key rotation (AC-1380), refusal cacheability/indexability (AC-1381), cookie-vs-header precedence (AC-1376), the opaque-response shape (inside AC-1452), the deletion rather than deprecation of the single-value credential name (AC-1451), the management-API base-URL seam (AC-1453), the automation criteria's ownership by this story (AC-1450…AC-1453), the deliberately-unformalized stale ACCESS.md note, and the two deliberate non-changes. Each is a recorded decision by an authorized stage, so each is treated as grounded, not as `needs_review`. |

The one place the ledger and the story could have drifted is the local-development
bypass. REQ-147's implementation record says "no local-development bypass … a
security control with an off switch is not one"; REQ-145, later in the same
bundle, adds a loopback-only opening and the operator's own review note names it
as a bypass. The story resolves this the right way round — the later intent
supersedes the earlier statement, the criteria assert only that a **configured**
gate has no exception path (true, durable, and survives the exception being
removed), and containment of the exception is left to the items that own the
configuration files it lives in. No criterion asserts "no bypass exists", which
would have set regression against intent the operator has since restated. This
is alignment, not drift.

## Evidence Reviewed

Two test files carry this capability, both driving real entry points:

- `tests/reconciliation-builder-private-access-gate.test.ts` (AC-1375…AC-1384) —
  **10 tests, all passing** (`npm test -- tests/reconciliation-builder-private-access-gate.test.ts`,
  509ms). The entry point is the control app's exported `fetch` handler, the same
  function workerd calls, driven with real `Request` objects; nothing reaches into
  `guardAccess` or `verifyAccessJwt` directly. JWTs are **minted, not fixtures**,
  with a genuinely separate attacker keypair, so the forged case is refused by
  `crypto.subtle.verify` rather than by a string comparison. The only stub is
  `globalThis.fetch` for the team's key publication — the network, which the
  repository does not own — and it errors on any unexpected URL. `DB`/`SITES`/
  `ASSETS` are **tripwires, not stubs of collaborators**: they record being
  touched, which is what turns "refused before anything behind the gate was
  reached" into an observation. AC-1377 then shows the same tripwires firing for
  an admitted caller, so an empty record cannot mean a tripwire that never armed.
  This is the evidence aesthetic TEST-STRATEGY.md asks for.

- `tests/reconciliation-builder-private-access-automation.test.ts` (AC-1450…AC-1453)
  — **3 of 4 passing**; AC-1453 blocked by the sandbox, see below. Claims are
  driven through `pushSite` and the real `1c` entry point (`run`), and the
  operator scripts through `spawn`/`spawnSync` as the processes an operator
  types. `fetch` is a **recorder**, which is what makes the negative claims
  ("no assertion header under any casing", "no request was made at all")
  observations of the request rather than of the code that built it.

Spot-checks on the sharper claims, all of which hold:

- AC-1376's "header wins" is asserted at the boundary in both directions — good
  token in header beside bad in cookie is admitted; the reverse is refused. Only
  a gate that reads the header first produces both answers. Reading the extractor
  would have proved nothing.
- AC-1377's audience case mints a token for a different application **signed by
  the same team key**, which is exactly the threat ("a signature alone proves
  only 'someone in this team'"). The `alg: none` case is genuinely unsigned.
- AC-1380 asserts the rotation was honoured *by re-reading the publication*
  (`net.calls.length` strictly increases), not by the gate having never cached —
  which distinguishes the correct implementation from a trivially-passing one.
- AC-1453 drives `bin/access-token` as a process against a stub management API
  and asserts on the **requests it makes** — the domain-matched application over
  a decoy whose display name is the recognisable one, `decision: 'non_identity'`,
  creations-only mutations, a `200 {success:false}` read as a refusal — and
  proves "no secret is written" by running with a writable cwd *and* `HOME` and
  asserting both are empty afterwards. Its own reconciliation note explains why
  the earlier source-pattern-matching approach was replaced; that reasoning is
  correct and the criterion is now behavioural.

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | uat | AC-1453 | — (environment, not code or test) | `test_UAT_AC1453_…` times out at 60s in this assessment sandbox with `Error: listen EPERM: operation not permitted 127.0.0.1`. The test stands up a real `http.createServer` on loopback to stand in for Cloudflare's management API — the right design, since the command under test is a separate process and the socket is the only seam. Probed directly: a bare `socket.bind(('127.0.0.1', 0)); listen(1)` also fails `EPERM`, so the sandbox forbids listening sockets outright. The pre-stub assertions (executable bit; refusal naming `CLOUDFLARE_API_TOKEN` and the required permissions) ran and passed before the hang. This is an environment artifact of the same family as the known Chromium and outbound-fetch restrictions, not a defect in the criterion, the test or `bin/access-token`. | No edit. Do **not** rewrite the test to monkey-patch `fetch` — that would trade a real process boundary for a weaker one and lose exactly what the criterion's reconciliation note says the assertion needs. Confirm AC-1453 green in a permissive environment during the UAT-validation run. |

**Violations: 0. Blocking needs_review: 0. Warnings: 1.**

No AC was found retired, contradicting intent, or unreviewed. No `needs_review`
finding arose, so the BUG-1306 impact screen had nothing to run against — every
behaviour in the story body is either traced to an intent ticket or covered by an
explicit `## Reconciliation Decisions` entry.

## Notes for the Editor

Nothing to fix. Three observations worth keeping:

1. **The nine reconciliation decisions are doing real work.** Almost every claim
   in this story that intent is silent on has a dated entry explaining what the
   landed code does and why the alternative was worse. This is why the capability
   assesses clean rather than accumulating `needs_review` findings — the decisions
   were made at reconciliation and recorded, so they are grounded rather than
   ambiguous. Future rounds should read that section before re-opening anything.

2. **Two criteria are file assertions, and correctly so.** AC-1382/AC-1383 read
   `wrangler.toml` and AC-1384 reads `ACCESS.md`. These are not structural tests
   masquerading as behavioural ones: the deployment configuration and the policy
   record *are* the artifacts those criteria are about, and the configuration
   governs every future deploy rather than one past one. AC-1384 in particular
   avoids the usual failure mode by asserting substance over headings — it parses
   the table body rows, drops the header and separator, and requires a reason
   longer than ten characters on every granted-identity row, so "a table with the
   right column titles and nothing in it" fails.

3. **The live-origin half is delegated, not missing.** That the deployed hostname
   challenges an unauthenticated caller, and that the platform-default hostname
   does not answer, belong to CAP-102 and are provable only against a deploy.
   STORY-120 owns the behaviour those checks observe and the configuration that
   produces it. Assessing CAP-103 in isolation should not read that delegation as
   a coverage gap.
