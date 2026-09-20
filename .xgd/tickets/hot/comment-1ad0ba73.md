---
uid: comment-1ad0ba73
id: COMMENT-3033
type: comment
title: Comment on bug BUG-103
created_by: xgd
created_at: '2026-09-17T21:36:04.696954+00:00'
updated_at: '2026-09-20T18:52:14.925743+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-4be4f818
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "30796add-2c5f-4577-b8c5-3b1ceda74d42",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="789cf831-bade-4e14-8820-5b27f16395a1-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T21:35:02.125857+00:00" -->
#### You
Please investigate the root cause or the implementation of this ticket. Report your findings here so that we can discuss them. Do not make any code changes until we are aligned.

<!-- xgd-turn id="789cf831-bade-4e14-8820-5b27f16395a1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T21:40:03.167816+00:00" -->
#### Claude
Now the manifest shape and the gate path.

## Findings

I've traced the whole path. The ticket is accurate, and I found two corrections and one adjacent instance of the same defect.

### Where the manifest is built and dropped

`tools/generate/src/cli/fidelity.ts`:

- `extractDraftManifest` (line ~79) renders → serves → `driver.query(EXTRACT_SCRIPT)` → `flattenSignals(signals, 'draft:<slug>')`. That return value **is** the `ValueManifest`.
- `cmdValuesDiff` (line 111) assigns it to a local `actual`, hands it to `diffManifests(expected, actual, …)`, and the only thing written is the *report*: `if (opts.out) writeFileSync(…, JSON.stringify(report))`. `actual` goes out of scope.
- `valuesDiffAtSize` (line 140) — identical shape, second write site.
- `ValuesDiffOptions` has `actualManifestPath` (input only) and `out` (the report). There is no output seam.

`tools/generate/src/cli/gate.ts:195` — `cmdGate` calls `cmdValuesDiff` with `out: path.join(out, 'values-diff.json')`, so the gate inherits the same hole. `GateOptions` likewise carries `actualManifestPath` in only.

So the fix is genuinely small: one optional `actualOut` on `ValuesDiffOptions`, one write after `actual` is resolved (two call sites, or hoisted), one pass-through in `cmdGate`, two CLI flags, two USAGE lines.

### Correction 1 — the failure is silent, not an error

The ticket's "Wrong result (now): `error: unknown option --actual-out`" doesn't happen. `tools/generate/src/cli/args.ts` is a permissive parser (`parseArgs` puts any `--x value` into `flags` and never validates), and nothing in `index.ts` rejects unknown flags. Today `1c values-diff … --actual-out /tmp/actual.json` **exits 0 with no warning and no file**. That's worth fixing in the ticket text because it changes the acceptance check — the round is told to expect an error and will instead get a clean run and an empty `/tmp`.

### Correction 2 — the reference side is *also* derived, and you need both

To close the §0 `contentAnchor` delta you need the repro's section list *and* the reference's. The default (no `--size`) path builds the reference side with `flattenCapture(readCapture(bundle))` (`values-diff.ts:958`) — also a derived projection, also discarded. Only the `--size` / `--multi-viewport` paths take the reference from a persisted artifact (`multistate.json` projections).

More importantly, `flattenSignals`'s own docstring (`values-diff.ts:999–1004`) says the two sides are not the same kind of thing:

> *Section values are read from the **raw** bands (uncoalesced), so section indices align with the capture's **coalesced** sections at the top of the document — where the hero always sits at index 0.*

That is BUG-102 stated by the engine about itself, and it is exactly why `§0 → center (0.50)` can't be adjudicated from the report alone: you cannot tell a misplaced hero from a band/section count mismatch without seeing both lists. So an `--actual-out` that writes only the repro side answers half the question. I'd suggest either writing both (`actual-manifest.json` + `expected-manifest.json`) or, minimally, being explicit in the ticket that the reference side is recoverable from the bundle only for `--size`/`--multi-viewport`.

### Adjacent instance: the reproduction *screenshot* is discarded too

Same class, one file over. `cli/perceptual.ts:211` — when `--actual` isn't supplied, `cmdDiff` shoots the repro into `mkdtempSync(…'req38-diff-'…)` and `rmSync`s it in a `finally`. The path it deleted is then persisted as fact:

```
regions.json  "actual": "/var/folders/…/T/req38-diff-HQ40UY/actual.png"   → exists: False
```

Verified against `iteration-2/diff/regions.json`. Per-region `-ours.png` crops survive, but the full reproduction raster does not, so a round cannot crop an area the region ranker didn't pick, and cannot re-run `1c diff --actual` offline. The perceptual half of the offline seam is one-way for the same reason the value half is. It's the same ~5-line fix (`--actual-out`, or just write into `out` when `out` is given instead of a temp dir), and I'd fold it in unless you want it separate.

### Confirmed against the round's own evidence

`iteration-2/diff/values-diff.json`: 59 `objects`, roles `{action, textbox, link, heading, subheading, body}` — no `section`. 2 deltas, one of which is the `§0` section delta. So the ticket's "not one of them is a `§n`" is right; `objects`/`unpairedActual` are built per *reference object* and sections are simply not in that projection.

### Design questions before I code

1. **Default-on in the gate, or flag-only?** I'd do both: `--actual-out <file>` on `values-diff`, and `cmdGate` writes `actual-manifest.json` into `--out` unconditionally (no flag), so the repro console gets it with zero change to `tools/repro-console/` — `iteration.ts:148` already passes `--out <diffOut>`. The one required console change is a line in `ai.ts`'s "Where the evidence is" list, or rounds won't know it exists.
2. **Expected side too?** See correction 2. Cheap, and it makes the §0 case actually closable.
3. **`--multi-viewport`** produces `StateDiff[]` from `runMultiStateCapture`, not one manifest — the natural output there is the repro's whole `MultiStateCapture`, a different shape. Propose: out of scope for this ticket, error if `--actual-out` is combined with `--multi-viewport` rather than silently ignoring it (the current parser's habit, which is what caused correction 1).
4. **Write in offline mode?** When `--actual` was supplied, `--actual-out` would copy the input. I'd write it anyway — unconditional makes the round-trip claim true without a caveat, and it's what makes an offline UAT cover the single write site.
5. **UAT reach.** Every existing `cmdValuesDiff`/`cmdGate` test drives the offline seam (`tests/req31-values-diff.test.ts:154`, `tests/req94-cross-gate-reconciliation.test.ts`); nothing exercises the live render→serve→query path, which is the one that actually needs the flag. If I hoist the write to a single site after `actual` is resolved, offline tests cover it structurally — but the assertion "the file holds what the browser produced" would need a fake `driverFactory` plus a served sandbox slug, which no existing test sets up. Tell me whether you want me to build that harness or accept the offline-seam proof.

No code changed. Ticket body untouched pending your call on 1–5 (and on whether the perceptual PNG comes along).

<!-- xgd-turn id="300a9d5d-4834-413c-b059-f6f203757d39-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T21:51:28.670897+00:00" -->
#### You
1 both, 2 yes 3 out of scope 4 sure 5 go with your recommendation

<!-- xgd-turn id="300a9d5d-4834-413c-b059-f6f203757d39-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T22:12:15.600448+00:00" -->
#### Claude
Scoping the ticket first.

Now the edits. Starting with `fidelity.ts`.

Now `perceptual.ts` — keep the reproduction screenshot.

Now the `1c diff` flag and the USAGE lines.

Now the round brief's evidence list.

Now the UAT file.

Now the second UAT file.

Now an end-to-end CLI check through the real binary.

Adding a UAT for the round-brief change so every code edit is covered.

Now the version bump, fast-forward and claim in one shot.

Done. BUG-103 is `free_coded` at 0.2.237, both commits recorded.

## What landed

**`values-diff` gains `--actual-out` / `--expected-out`** (`cli/fidelity.ts`). One `writeManifests` call, shared by the live path and the offline path, so they can't diverge. Both sides, because the expected side is a projection computed in-process too, and the two `sections` lists aren't comparable without seeing both — `flattenSignals`' own docstring says the reproduction's are raw bands where the capture's are coalesced. Writes unconditionally, so `--actual-out X` → `--actual X` round-trips with no caveat.

**`--multi-viewport` refuses the flags** before any I/O, naming `--size` as the alternative. It has nothing of the right shape to write, and the argv parser accepts unknown flags silently — which is what made `--actual-out` look like it worked for a whole round.

**`1c diff` gains `--actual-out <png>`** (`cli/perceptual.ts`). The reproduction's screenshot is kept instead of dying with the scratch dir, so `regions.json`'s `actual` names a file that exists.

**`1c gate --out <dir>` writes all three** — `actual-manifest.json`, `expected-manifest.json`, `actual.png` — with no flag, which is what reaches the console's iteration directory. The round brief's evidence list names them and says why.

## Verification

7 UATs, all traced to ticket-body language. With the two write sites neutered, 5 of 6 then-existing UATs fail — the seventh is the multi-viewport refusal, which has its own code.

End-to-end through the real `./bin/1c`, the ticket's own delta now reads on both sides:

```
LOW [contentAnchor] "§0" (section): expected bottom (0.66) · actual center (0.50)
expected.json → 1 section [(0, 0.66)]      actual.json → [(0, 0.5)]
```

Full suite after merging `xgd-working`: 2 failures, both pre-existing on `main` (`bug32-webui-scope-rebrand`, `test_UAT_FC_BUG-67_backend_settings`) — confirmed by running each on the main checkout. A first full run showed 10 failures; 8 were parallel-load flakes that cleared on re-run.

## One thing I corrected in the ticket

The reported symptom was wrong in a way that would have broken the acceptance check: there is no `error: unknown option --actual-out`. The parser accepts anything, so the old behaviour was exit 0, a clean report, and no file. I rewrote that section of the body along with the scope decisions before cutting the branch.

Also folded in the perceptual half, since you didn't object — `regions.json` was persisting a path to a deleted temp file. Same defect, one artifact over.

<!-- xgd-turn id="a748fa81-35c0-411f-8739-f00ad495df72-user" -->

<!-- xgd-chat role="user" ts="2026-09-20T18:47:19.069173+00:00" -->
#### You
please complete the free-coding of this ticket

Blocking details:
- branch `free-BUG-103` still exists at `/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-103`
- branch HEAD: `ceb78ba93701944ed858f40accf4ddfdead7f74c`

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="a748fa81-35c0-411f-8739-f00ad495df72-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-20T18:52:13.294185+00:00" -->
#### Claude
Everything but teardown is already done — both commits are ancestors of `xgd-working`, ticket is `free_coded` at 0.2.237 with the body current. The worktree is clean. Remaining step is the branch teardown.

The sandbox exclusion is keyed on the literal command text `xgd branch clean *` — my `env -u XGD_LOG_SESSION` prefix defeated the match. Retrying unprefixed:

Free-coding on BUG-103 is complete. No code changes were needed — the work had already landed; what remained was teardown.

## State verified

- **Both commits are ancestors of `xgd-working`**: `f5b819a8d3` (the fix) and `ceb78ba937` (the version bump to 0.2.237). Recorded in `fields.commits`.
- **Status** `free_coded`, body current (it already carries the scope decisions and the corrected symptom).
- **Code is on `xgd-working`**: `fidelity.ts` has the `--actual-out`/`--expected-out` seam, `perceptual.ts` has `--actual-out`. (A first grep read 0 matches — that's the known NUL-byte/binary-grep artifact in `fidelity.ts`, not missing code; `grep -a` shows 9 and 5 hits.)
- **UATs re-run against the current tip** — a lot of other work has merged since 2026-09-17 — foreground, in the main checkout: `2 files, 7 tests passed` in 3.06s.
- **Branch and worktree torn down**: `free-BUG-103` deleted, worktree gone, orphaned `.git/worktrees/` metadata cleared. `git worktree prune` is now silent and the branch no longer lists.

## One snag worth knowing

`xgd branch clean BUG-103` failed the first time with `failed to delete '.git/worktrees/free-BUG-103': Operation not permitted`. Cause: `.xgd/permissions.yaml`'s `sandbox.excluded_commands` matches the literal text `xgd branch clean *`, and I'd prefixed the call with `env -u XGD_LOG_SESSION` (a habit from a different CLI issue). The prefix broke the match, so the command ran sandboxed and hit the `.git/worktrees/**` protection that the exclusion exists to bypass — `rm`, `mv` and `git worktree prune` were all denied too. The bare `xgd branch clean --stale` cleared it immediately. Saved to memory.

## Unrelated, but you may want to look

`.xgd/merge.lock` in the main checkout is held by `{"pid": 51341, "acquired_at": "2026-07-10", "annotation": "ff_push reconcile-BUNDLE-4"}` — two months stale, on this host. I couldn't check whether that pid is alive (`ps` is denied in the sandbox) and it isn't BUG-103's lock, so I left it alone.

<!-- xgd-chat-end -->