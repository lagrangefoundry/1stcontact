---
uid: report-6a589d68
id: REPORT-3127
type: report
title: 'Reconciliation Review: commits (BUG-39 + REQ-154)'
created_by: xgd
created_at: '2026-08-31T23:39:09.981808+00:00'
updated_at: '2026-08-31T23:39:09.981808+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-8eef3846
  anchor_uid: bundle-8eef3846
---

# Reconciliation Review: Story Coverage

**Result**: PASS
**Mode**: commits
**Surface**: —
**Anchor**: bundle-8eef3846 (type `bundle` — the anchor IS the intent)
**Stories Reviewed**: 2 (story-080c6036, story-7fa314f5) — 17 acceptance criteria (AC-1459…AC-1475)
**Commits read**: `759cd87` (BUG-39), `29c0e86` (REQ-154)

---

## Step 1 — Intent, as the operator stated it

Read: the bundle body, both source tickets (`bug-23d1ec27`, `request-b88b79fe`) and both of their chat comments. The comments matter here and were not skipped:

- **REQ-154's investigation comment** corrects the ticket body in three places, and the correction that bites is (a): `bin/publish --production` does **not** use a service-token pair — it sends a pre-minted JWT. So candidate 1 is a *new* credential with a new lifecycle, not a reuse of an existing mechanism. The comment also proposes the fourth option (request interception) that eventually shipped, and names a fifth, now-deleted option (REQ-149 removed public-site's link-private draft channel).
- **BUG-39's implementation comment** confirms the commit's declared scope — one shared streaming double, four transcriptions collapsed — and flags the two surviving REQ-127/AC-1055 failures as an intent conflict for the operator rather than a defect of this ticket.

## Step 2 — Behavior Inventory

Read independently of the stories: `capture/cf-driver.ts`, `capture/screenshot.ts`, `capture/page-scripts.ts`, `capture/types.ts`, `capture/index.ts`, `capture/playwright-driver.ts`, `cli/preview.ts`, `cli/shot.ts`, `apps/control-app/src/shot.ts`, `apps/control-app/src/router.ts`, `apps/control-app/wrangler.toml`, and the BUG-39 commit's file list.

**16 behaviors identified.** Confirmed by `git show --stat 759cd87`: the BUG-39 commit touches `tests/**` plus a version bump and **no product code** — 11 files, 317+/275-, all under `tests/` except `package.json`.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | Second `BrowserDriver` over a puppeteer-shaped surface the module names rather than imports; selected by injection | Covered | story-080c6036 | AC-1459, AC-1468 |
| 2 | PNG bytes at three named presets from inside workerd; omitted preset = `desktop` | Covered | story-080c6036 | AC-1459 |
| 3 | Unknown preset refused by name, before any lease is taken | Covered | story-080c6036 | AC-1460. `resolveViewport` runs before `withBrowserSession`, and the UAT asserts `launches() === 0` |
| 4 | Missing `[browser]` binding is an ordinary state: `BrowserNotConfiguredError`, not a boot failure; `BROWSER?` optional on `RouterEnv` | Covered | story-080c6036 | AC-1461, driven through the Worker's own `fetch` (import → palette write → read-back → preview → publish) before the screenshot |
| 5 | `withBrowserSession` leases one browser per run; a fresh context per driver; context destroyed on `close()`, browser is not | Covered | story-080c6036 | AC-1462 |
| 6 | Lease released on success, throw and timeout; `BrowserSessionTimeoutError` names the ceiling; default 120s | Covered | story-080c6036 | AC-1463, three scenarios in one UAT |
| 7 | One navigation per driver; `diagnostics().requestedUrls` never merges two pages | Covered | story-080c6036 | AC-1464 |
| 8 | `actuate`/`canActuate` absent → multi-state loop restricts to `rest` and emits a skip note | Covered | story-080c6036 | AC-1465, run through the real `runMultiStateCapture` against two drivers differing only in actuation |
| 9 | Shared settle/font/decode scripts; both drivers evaluate the same imported constants | Covered | story-080c6036 | AC-1466, AC-1467. Verified independently: `playwright-driver.ts:101,119,152,157,162` and `cf-driver.ts:186,190,202,203,204` evaluate the same five imports |
| 10 | `1c shot` split along the runtime line; width applied at capture time, not at load | Covered | story-080c6036 | AC-1467 asserts the `[desktop, mobile]` viewport order explicitly |
| 11 | No `playwright` reachable from the Worker graph; barrel never imported from `apps/`; `@cloudflare/puppeteer` named once and declared on the control app only | Covered | story-080c6036 | AC-1468 |
| 12 | Per-HOST in-process fulfilment: navigation and every subresource on the owned host answered in-process; nothing reaches the network | Covered | story-7fa314f5 | AC-1469, AC-1470 |
| 13 | Unowned paths on the owned host → 404 in-process (favicon, build asset, unknown channel) | Covered | story-7fa314f5 | AC-1470 |
| 14 | Any other host is `continue()`d to the network | Covered | story-7fa314f5 | AC-1471 |
| 15 | Unknown slug → 404 in-process; resolver throw → 500 in-process, never `continue()`d | Covered | story-7fa314f5 | AC-1472, AC-1473 |
| 16 | The capture uses the *same memoised* `previewRenderer` the `/preview/*` route uses | Covered | story-7fa314f5 | AC-1474 |
| 17 | `published` deliberately fetched over the network | Covered | story-7fa314f5 | AC-1475 |
| 18 | `[browser]` restated under `[env.production]` | Covered *elsewhere* | story-d5167ced / AC-1341 | **Verified, not taken on trust** — `tests/support/wrangler-toml.ts` finds bindings structurally (`/^\[\[?([^\]]+)\]\]?$/` matches a plain `[browser]` table, and any section assigning `binding` counts). I ran `test_UAT_AC1341` against the branch: **1 passed**. story-080c6036 correctly declines to restate it |
| 19 | Browser Rendering is Chromium-only; other engines report unavailable | Recorded, not an AC | story-080c6036 | Reconciliation Decision with reasons: the reporting is pre-existing local engine-availability behaviour and the cloud path has no engine selector. Below materiality |
| 20 | BUG-39 — shared streaming model double | No story, correctly | — | The commit changes no product code. A story whose sole output is tests is forbidden; the criteria its repaired suites now honestly assert are story-a58a0974's, and that story's Technical Context already records the streaming-double property |

**Uncovered behaviors: none.**

## Ungrounded Stories

None. Every claim in both stories was checked against the code and holds. Two specifically hunted for and cleared:

- story-7fa314f5's decision record does **not** repeat the ticket body's factual error about `bin/publish` reusing a service-token pair — it describes candidate 1 neutrally as "a long-lived service credential the deployment holds to talk to itself". The story is more accurate than the intent body it documents.
- story-7fa314f5 claims the record is "in DOC-13 §6.1–§6.3, §8". Verified: `doc-4866a486` carries `### 6.1 The cloud has the same eyes, and Access is why it nearly did not (REQ-154)`, `### 6.2 One session, many contexts`, `### 6.3 What the CF driver does not do`, and §8. Intent's AC4 is discharged in fact, not only in prose.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Cloud Browser Capture — the Browser Rendering driver behind the `BrowserDriver` seam (feature, 3pt) | story-080c6036 (STORY-124, 10 ACs) | ✓ |
| 2. Self-Origin Fulfilment — screenshotting our own access-gated output (feature, 2pt) | story-7fa314f5 (STORY-125, 7 ACs) | ✓ |

No plan items dropped. The plan produced no item for BUG-39 and recorded why; nothing is silently missing.

## Step 5b — Evidence Sufficiency

**17 of 17 active ACs have a covering UAT, 1:1.**

| ACs | UAT file | Runtime |
|---|---|---|
| 1459, 1460, 1462, 1463, 1464 | `tests/reconciliation-cloud-browser-capture.workers.test.ts` | workerd |
| 1461 | `tests/reconciliation-cloud-browser-capture-absent.workers.test.ts` | workerd |
| 1465, 1466, 1467, 1468 | `tests/reconciliation-cloud-browser-capture-preconditions.test.ts` | node |
| 1469–1475 | `tests/reconciliation-self-origin-capture.workers.test.ts` | workerd |

**The one fake is at the boundary.** `tests/support/fake-puppeteer.ts` fakes the Browser Rendering session — a third party reached over a wire protocol — and nothing inside it. It does not answer the driver, it **drives** it: `goto` emits the navigation through the driver's own real `request` handler, takes whatever the handler fulfils as the document, parses that document for subresources, and issues each one resolved against the page's real `baseURI`. It also enforces the production invariants (exactly one request listener; a request resolved twice throws). The interception decision, per-host rule, response cache, context lifecycle, lease, preset resolution and named errors are all real production code under test. No repository-owned component is mocked in any of the 17 UATs.

**Could a broken implementation pass?** Checked per AC; the answers that matter:

- **AC-1459** asserts the PNG *signature*, not byte length — an HTML error document cannot forge it — and asserts the preset's dimensions were the ones actually applied (`viewports.at(-1)`).
- **AC-1460** asserts `launches() === 0` and `viewports === []`, so a silent fallback that produced a picture at some other width fails rather than passing.
- **AC-1463** distinguishes the timeout outcome from the page error by class (`not.toBeInstanceOf(BrowserSessionTimeoutError)` on the navigation-failure leg, `toBeInstanceOf` on the timeout leg) and asserts `timeoutMs` on the error, so the two exits cannot be conflated.
- **AC-1469/1474** use the **real `/preview/*` route over the Worker's own `fetch`** as the oracle rather than re-deriving the expected document from the renderer the capture already used. Comparing a capture against the object that produced it would be a tautology; this is a claim. AC-1474's step 3 (edit, then re-capture, then re-compare against the route) is what would catch a second, independently-produced renderer — the exact failure the memoisation exists to prevent.
- **AC-1470/1472/1473** all assert `escapedToNetwork(log)` is `[]` — the empty list, not a short one — and AC-1470 additionally asserts positively that every request addressed to the owned host appears in `fulfilled`, so it cannot be satisfied by a page that simply made no requests.
- **AC-1473** asserts both halves the criterion names: the 500 body carries the underlying failure *and* nothing escaped. An implementation that logged and continued fails the second.
- **AC-1465** runs the real `runMultiStateCapture` against two stub drivers differing in exactly one respect (whether `actuate`/`canActuate` exist), and asserts both directions — rest-only + skip note for the non-actuating one, all states + no note for the actuating one. A silent no-op emitting an unactuated frame labelled `hover` fails it.

**Two ACs use structural assertions, and both are judged sufficient:**

- **AC-1468** is a property of the *bundle graph*, and its own Verification says so ("this cannot be asserted by running anything"). The UAT performs a real transitive local-import resolution from two entry points (`apps/control-app/src/index.ts`, `apps/control-app/src/shot.ts`) — not a string-presence check — plus a repo-wide sweep proving `@cloudflare/puppeteer` is named in exactly one file, plus package.json dependency placement on both sides. The claim under test *is* structural, so structural evidence is the right kind, not a proxy for behaviour.
- **AC-1467** has a source half and a runtime half. The source half is the AC's own declared drift guard (a second transcription must be a *detectable regression*, and drift here would not surface as a failure — the capture would still succeed and simply measure the wrong page). The runtime half is real: the cloud path is driven and `browser.log.evaluated` is asserted to contain the exact imported constants, and the width order is pinned to `[desktop, mobile]`. I verified independently that both drivers evaluate the same five imported symbols rather than paraphrases; the local path's runtime settle behaviour additionally has the pre-existing real-Chromium blocks in `req36-capture-settle`.

Neither is a Step 5b failure: no AC is evidenced *only* by asserting that a name appears in a file.

**Test execution, stated plainly.** I ran `tests/reconciliation-cloud-browser-capture-preconditions.test.ts` on this branch: **4 passed** (AC-1465, 1466, 1467, 1468). I also ran `test_UAT_AC1341`: **1 passed**. The 13 workerd-project UATs **could not be executed in this session's sandbox** — `@cloudflare/vitest-pool-workers` dies at startup with `listen EPERM 127.0.0.1`, which is an environment restriction and not a test failure. Their passing status is taken from the two generation reports (REPORT-3119: 10/10; REPORT-3123: 7/7, with the full workers project reported green at 23 files / 125 tests). This is recorded so the limit of what I verified first-hand is visible.

## Judgment Calls

- **Chromium-only engine reporting omitted as an AC — acceptable.** story-080c6036 records it under Reconciliation Decisions with the reason (the reporting is pre-existing local behaviour; the cloud path has no engine selector, so an AC here would have no behaviour of this story behind it). A developer would not be surprised.
- **Intent's AC4 ("record the decision in DOC-13") discharged as documentation rather than as an AC — acceptable.** An AC asserting the presence of prose could be satisfied by a string match while the system did the wrong thing. The story records the decision *and* its rejected alternatives in Technical Context so the record survives the document, and the document itself was verified to contain §6.1–§6.3.
- **The fifth candidate is not on the record — flagged, below materiality.** REQ-154's investigation comment named a fifth option (shooting an unauthenticated link-private draft URL) and said it was "worth recording so nobody re-proposes it", noting REQ-149 deliberately deleted that channel. Neither story nor DOC-13 §6.1 records it. Intent's AC4 asks only for the reasons the *body's* alternatives were rejected, and all three of those are recorded in both places. Noted for the operator as a cheap future addition to DOC-13 §6.1, not scored as a gap.
- **BUG-39 producing no story — correct, and verified rather than accepted.** `git show --stat 759cd87` confirms the commit is `tests/**` plus a version bump. A plan item here would have produced a story whose sole output is tests, which the process forbids.
- **The REQ-127 / AC-1055 intent conflict BUG-39 flagged "for the operator to decide" — not absorbed by these stories, and out of their scope.** The plan's Step 3b established the decision was already taken in the matrix under BUNDLE-21 in the operator's favour, and AC-1055 now states the resolving outcome. Neither story reviewed here documents behaviour contradicting it. Regenerating those two stale UATs is story-a58a0974's maintenance, not this bundle's.
- **`tests/test_UAT_FC_REQ-154_cloud_eyes.workers.test.ts` overlaps both stories' ACs.** Noted by the UAT generator; disposition belongs to the FC-orphan gate, not to this review.

## Verdict

**PASS.** Stories accurately and completely document the behavior surface, and they document the operator's *intent* rather than only the code — every criterion REQ-154 states for both halves is honoured, the one genuine design question (AC3/AC4) is answered with its rejected alternatives on the record in two places, and where the stories depart from the intent's literal framing (Chromium-only, AC4-as-documentation, the published channel stated positively) each departure is written down under `## Reconciliation Decisions` with its reason rather than absorbed. No story claims behaviour the code does not have. Both plan items produced output. All 17 active ACs carry 1:1 UAT evidence that enters through real entry points, fakes only the browser at its wire boundary, and asserts observable outcomes that a broken implementation would fail.

A developer reading these two stories would have a correct mental model of what the operator intended to build and of what this code does.
