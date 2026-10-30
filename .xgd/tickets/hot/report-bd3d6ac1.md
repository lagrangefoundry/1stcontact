---
uid: report-bd3d6ac1
id: REPORT-5523
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T09:08:08.103148+00:00'
updated_at: '2026-09-29T09:09:11.431069+00:00'
completed_at: null
last_field_updated: body
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `tests/test_UAT_FC_BUG-42_markdown_rendering.test.ts` — class **DU** (deleted by
  us / modified by them), resolved under rule **2a** (deletion conflict) with
  **2f** (UAT test files) governing. Took **incoming** in full: the file is
  restored at the incoming blob `d3246f853e`.

      git checkout --theirs -- tests/test_UAT_FC_BUG-42_markdown_rendering.test.ts
      git add -- tests/test_UAT_FC_BUG-42_markdown_rendering.test.ts

  Path is inside the sparse-checkout cone (`git ls-files -v` reports `M`, not
  `S`), so plain `checkout`/`add` sufficed — no `--sparse` needed, unlike the
  `.xgd/tickets/**` conflicts earlier in this run.

  The other 12 paths in this pick auto-merged and were never unmerged.

### Why not the BUG-1301 PRECEDENCE exception

2a asks whether the HEAD-side deletion was a legitimate refactor or LLM churn.
The deletion is `6f83befde4` — *"Workflow fix_reconciliation_review completed:
done"*, `xgd-kind: reconcile`, `xgd-intent: bundle-8e1807f6`, 2026-09-14 — which
removed this file (360 lines) and `test_UAT_FC_REQ-160_two_kb_session.workers.test.ts`
(442 lines) outright. It is an ancestor of the resync base
(`9dc8a4df53`, merge-base of `main` and `resync-377b581e`), so it arrives from
main, not from this branch's replay.

Four facts say this is not a refactor whose target is gone:

1. **The subject code is fully alive in HEAD.** `markdownReady` is exported from
   `apps/control-app/src/builder/markdown.js:37` and consumed by `app.js`,
   `library.js` and `reader.js`; `setSanitizer` is re-exported at
   `markdown.js:68`. The seams the UAT drives — injected `markdownReady`,
   injected sanitizer, `renderSafe`'s escape-when-absent policy — are unchanged.
   Nothing the test targets was removed.
2. **The incoming hunk's target exists and is not obsolete.** The two changed
   lines are fixture fields in the `MATERIAL` array: `site_slug: 'alpha'` →
   `placed_on: ['alpha']`, `site_slug: null` → `placed_on: []`. That is exactly
   the rename this commit performs across `material.ts`, `router.ts`,
   `tickets.ts`, `library.js` and `api.js`. The hunk is live, not stranded.
3. **Nothing documents the deletion.** The commit message is the workflow's
   generic completion line. BUG-42's own ticket (`bug-034bf955`, status
   `free_and_reconciled`, `needs_review: false`, `commits[].working_sha:
   bd7612f977`) still names this file in its test plan and records no removal.
4. **The same commit's other deletion was undone.** `6f83befde4` also deleted
   `test_UAT_FC_REQ-160_two_kb_session.workers.test.ts`; `e820f08904` ("Merge
   branch 'free-REQ-160' into xgd-working") restored it on the line that leads to
   HEAD, where it lives today. That pass's deletions were not treated as final.

Per STEP 2's default — *"If you cannot tell whether a HEAD-side deletion was a
legitimate refactor or something murkier, default to NOT legitimate: 2f
governs, do not delete"* — and the resync doctrine that main's later automated
workflows do not outrank free-coded intent, the file is restored.

**One fact that cuts the other way, and why it does not change the resolution.**
HEAD carries `tests/reconciliation-builder-markdown-readiness.test.ts` (603
lines, authored by a sibling `fix_reconciliation_review` commit `5360513663`),
which covers both of BUG-42's surfaces — the chat transcript's cold-load
ordering *and* the Library's "What this is" (`createLibraryPanel` mounted alone,
lines 370–383). So the deletion plausibly accompanied a consolidation into a
reconciliation suite rather than being a bare drop. That is a *plausible*
reading, not a documented one, and 2f's bar is documentation, not plausibility.
It is flagged below rather than acted on.

## Incoming changes preserved

- `tests/test_UAT_FC_BUG-42_markdown_rendering.test.ts` — staged blob is
  `d3246f853e10f76a36bf651a134ff369c630f74c`, **byte-identical** to
  `f929d426eb:<path>`. Both incoming hunks present (`placed_on: ['alpha']` at
  L94, `placed_on: []` at L111); zero residual `site_slug` in the file.
- Auto-merged code files carry the incoming rename: `placed_on` occurs in
  `material.ts` (8), `library.js` (6), `builder/api.js` (2), `router.ts` (2),
  `tickets.ts` (1). The only surviving `site_slug` occurrences in staged
  `apps/control-app/src/` are three prose comments explaining the rename plus
  `tickets.ts:258`, which is `brief.site_slug` — a different field the commit
  message explicitly leaves untouched.
- `material.ts` differs from the incoming blob by one 13-line hunk, the HEAD-side
  `not_found → NotMaterialError` guard in `materialTicket`. That is main-side
  content the auto-merge kept alongside incoming's changes — both sides present,
  per the non-overlapping rule. Not a discard.
- **No hunks were dropped under the BUG-1301 precedence exception.** It was
  considered and rejected, for the reasons above.

## Verification

- `git ls-files -u` — empty; no unmerged stages remain.
- `git grep --cached -e '^<<<<<<<' -e '^>>>>>>>'` on the path — no matches.
- `git rev-parse :<path>` — `d3246f853e…`, equal to the incoming blob.
- `git status --porcelain` — 14 staged entries, no conflict classes; the path
  shows as `A` (added), correct for a DU resolved toward incoming.
- `CHERRY_PICK_HEAD` still live at
  `f929d426eb93cf9a23585c5d101eb9e60612fbd7`. No `--continue` / `--skip` /
  `--quit` / `--abort`, no `reset`, no `checkout <branch>`. The only index
  writes were the single `checkout --theirs` and `add` above, each issued as the
  sole content of its own call.
- This pick is **not** a no-op: the staged diff against HEAD is non-empty, so
  `resync_cherry_pick_finalize_resolution` should commit rather than skip.

## Post-merge review flag

Flagged, on the consolidation question. If `reconciliation-builder-markdown-readiness.test.ts`
was in fact written to replace `test_UAT_FC_BUG-42_markdown_rendering.test.ts`,
the branch now carries both, and BUG-42's two surfaces are asserted twice. That
is duplication, not breakage, and the resync is not the place to adjudicate it —
but someone should decide which suite owns the rule.

Related and more actionable: `reconciliation-builder-markdown-readiness.test.ts:149`
still reads `site_slug: 'alpha'`. The incoming commit retires that field from
`material`/`reference`, and could not have updated this file because it did not
exist in the developer's working line. That fixture is now stale against the
code this pick lands. Resolution may not author code, so it was left alone.

Finally, `bd7612f977` — the free-coded commit that *created* this UAT file and
is recorded as BUG-42's `working_sha` — is neither an ancestor of HEAD nor in
`is_applied_confirmed.json`. Worth confirming the queue's disposition of it;
this pick has now reintroduced the file it authored, one commit downstream of
where it would otherwise have arrived.

## Note on the invocation

The rendered prompt body arrived **empty again** — only the
`## Session Role: STAGE_RESOLVER` preamble, no mission text, no
`{resync_worktree_path}`, `{anchor_uid}`, `{apply_target}`,
`{conflict_enrichment}` or `{prior_stage_failure}` substitutions. This is the
**fourth consecutive** occurrence (`.xgd/tmp/resolve-b88b79fe.md`,
`resolve-01ea4eec.md`, `resolve-6893f6ea.md`). Policy was recovered by reading
`xgd_source/prompts/validation/resync_stage_resolution.yaml` directly, and the
anchor/target by inspecting REPORT-5522. Conflict enrichment was unavailable, so
the legitimate-refactor judgement above rests entirely on repository evidence.
Still worth fixing at the prompt-rendering layer.


## Addendum — the enrichment metadata, and why it did not decide this

The `conflict_enrichment` block was **not available** when the resolution above
was made (the rendered prompt body arrived empty; see the invocation note). It
arrived on a subsequent render. Recording it now, because read literally it
points the *other* way:

> **Ours (HEAD)**: `xgd-kind: reconcile`, `xgd-intent: bundle-8e1807f6`,
> *"Workflow fix_reconciliation_review completed: done"*
> **Theirs (incoming)**: *"fix(library): badge placement, not upload context
> [FREE-CODED]"*
> **Resolution rule**: *Intent unknown on one or both sides. Take the more
> recent commit by timestamp and flag this file for post-merge review.*

Ours is 2026-09-14; theirs is 2026-09-02. "More recent by timestamp" is
therefore **ours**, i.e. the deletion. The resolution kept **theirs** anyway.
Three reasons, in order of force:

1. **The enrichment rule does not contemplate a DU.** It is a generic
   tie-breaker for "intent unknown," phrased for picking between two *versions*
   of a file. Here one side has no version — it has a deletion. STEP 2's **2a**
   is the rule written for exactly this class, and it does not ask about
   timestamps; it asks whether the deletion was *"legitimate refactor or LLM
   churn."* The specific rule governs over the generic one.
2. **The BUG-1301 default is explicit and points at keeping the test.** *"If
   you cannot tell whether a HEAD-side deletion was a legitimate refactor or
   something murkier, default to NOT legitimate: 2f governs, do not delete."*
   A timestamp cannot establish legitimacy, and nothing else does — the commit
   message is the workflow's generic completion line.
3. **A timestamp-wins rule applied to a DU would invert the HARD RULES.** Main's
   automated workflows always run *after* the free-coded commits resync is
   replaying — that is the premise of the whole process (*"Main's current state
   reflects automated LLM workflows that ran AFTER those xgd-working commits
   were written. That does not make main more correct"*). If later-timestamp
   won on deletions, main could delete any free-coded artefact and resync would
   ratify it, which is the data loss the same section calls *"NEVER correct in
   this context."*

The enrichment's second instruction — *"flag this file for post-merge review"* —
**was** followed; see the post-merge review section above, which flags both the
consolidation question and the stale `site_slug` fixture.

Recorded so a reviewer can see the rule was read and deliberately not applied,
rather than missed.
