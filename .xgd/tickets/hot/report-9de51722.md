---
uid: report-9de51722
id: REPORT-5707
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-30T08:14:25.022124+00:00'
updated_at: '2026-09-30T08:14:25.022124+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync resolve conflicts — `4c87210002` (REQ-247, "an email a form sends is a page of the site")

Anchor `report-377b581e`, apply target `9ac98712a708888db67f8aff21f22b16bd98094e`,
HEAD `a5d9e25e9d` (unmoved), `prior_stage_failure` empty.

A CODE pick, so the HARD RULES for code and implementation files govern: incoming
(xgd-working) is authoritative, non-overlapping changes keep BOTH, overlapping ones
are integrated, and a resolution that keeps only main's version is data loss. Two
`UU` paths, 2 conflict regions each; the commit's other 24 files auto-merged.

**The enrichment's rule was wrong on both paths and was not followed.** It said
"Intent unknown on one or both sides. Take the more recent commit by timestamp" —
ours is the later commit on both files, so the naive rule pointed at main on every
region, straight into the data-loss HARD RULE. Both sides carry real, named intent
(REQ-247 incoming; REQ-248 and REQ-236 on the ours side), so the decision was made
from the code rather than from timestamps.

## Files resolved

### `tests/test_UAT_FC_REQ-243_publish_template_gate.workers.test.ts` — INCOMING, whole file

Resolution is byte-identical to `:3:` (`git diff <:3: blob> -- <path>` is empty).

Two regions conflicted, both test bodies that REQ-247 rewrites for the new
semantics. The decisive finding is about the parts that did *not* conflict.

Ours' entire delta from base (`:1:`) is a **reversion of REQ-236's per-business
isolation** in this file and nothing else: `nextBusiness()`/`ensureTenant` replaced
by a shared `const TENANT`, `call(tenant, path)` collapsed to `call(path)`, and the
publish body changed from `{ site, message }` back to `{ slug: seed.slug, message }`.
There is no ours-side invention here to preserve — it is a strictly older state.

That older state is **already broken against this branch's own HEAD**:

- `git show HEAD:apps/control-app/src/router.ts` — `/api/publish` (line 3065ff)
  answers `400 {"error":"site is required"}` unless `body.site` is a non-empty
  string. Ours posts `{ slug: … }`, so every case in the suite would fail 400 on the
  gate's own transport rather than on the template check.
- The same HEAD router's `/api/import` resolves the receiving business's single site
  and returns `{ site }` — exactly the handle incoming's `publishWith` reads and
  ours' discards.

So ours is stale relative to main's *own* application code, and the REQ-236 merge
`b6a695ae50` is absent from ours' ledger for this path (ours has replays of its
neighbours `7665f4edba`→`5ef74ab75f` and `4b10b9dc9f`→`0aefb4e137`, but nothing
between them). Taking ours would have kept a suite that cannot pass.

Git had auto-merged that plumbing to ours, because incoming left it untouched
relative to base. Resolving only the two marked regions would therefore have
produced an incoherent hybrid — incoming's rewritten bodies calling a `publishWith`
whose signature ours had rolled back. Taking incoming for the whole file removes the
hybrid and restores the shape the router requires.

### `tools/generate/src/cli/edit.ts` — INTEGRATED, both sides kept

Both regions are in `editPageList`, and the two sides add **different, independent
fields to the same listing** — 2c step 1, keep BOTH. Nothing here is incompatible;
git conflicted only because the two edits are neighbours in one object literal and
one `.map`.

- Region 1 (the per-page object): incoming's `kind: 'email' | 'web'` and its
  `email` block, plus ours' `reachable`. Both survive verbatim.
- Region 2 (the human line): `id\tslug\ttitle\tkind` — incoming's column, unchanged —
  followed by ours' conditional `\t(unreachable: nothing links to it)`.

Dropping either side would break live tests on that side:
`tests/test_UAT_FC_REQ-247_email_page.test.ts` asserts `listed.pages[…].kind` is
`'email'`/`'web'`, and `tests/test_UAT_FC_REQ-248_page_reach.test.ts` +
`test_UAT_FC_REQ-248_pages_route.workers.test.ts` assert `reachable`. Both consume
`data.pages`, not the human string, so the column ordering is free.

## Incoming changes preserved

**Test file** — everything, by construction: the resolution is byte-identical to
`:3:`. That includes the `emailPage()` fixture built on `defaultEmailDocument`, the
`emails: string[]` parameter and its rationale, the `defaultEmailDocument` import,
the rewritten AC-4 case that publishes a message the *site* holds, and the inverted
AC-8 case (a seeded system key is now an ordinary missing message: 400, the refusal
names the form, the key and `add_page`, and adding the page is the whole of the
difference). No test function was removed — 2f satisfied; the two `it(...)` blocks
are the same two, with incoming's bodies.

**`edit.ts`** — `git diff <:3: blob> -- <path> | grep '^-[^-]'` yields three groups
and **none is incoming content**:

1. The `UPSTREAM FINDING, recorded where it bites` docblock on `editL1Set` — ours'
   own earlier prose, superseded by ours' own longer `UPSTREAM FINDING, CLOSED`
   rewrite. Incoming never touches this docblock; it appears as `-` only because
   incoming still carries the base text.
2. `await requireDraft(slug, opts)` and the old one-liner `const pages = (await
   readPageFiles(…)).map(…)` — superseded by ours' `readBase` + `readPageFiles` +
   `reachablePages`. The draft check is **subsumed, not lost**: `readBase`
   (`edit.ts:191`) opens with `await requireDraft(slug, opts)`.
3. The old human `.map` one-liner — replaced by the integrated version that retains
   incoming's `\t${p.kind}` verbatim.

Incoming's other additions to this file all auto-merged and are staged untouched:
the `L1_EMAIL_TARGET` and framework imports, `PageWriteOptions.kind/subject/
placeholders/from`, `emailBlockOf`, `refuseEmailOnlyFields`, the email branch of
`editPageAdd`, the email merge in `editPageUpdate`, the sending-form guard in
`editPageRm`, and `assertNamedMessagesExist` wired into `editModuleAdd` and
`editModuleConfigure`.

## Arbitration of last resort (BUG-1460)

Not applicable — STEP 3h never fired. Neither path needed it: the test file resolved
to incoming outright under the HARD RULES, and `edit.ts` was a clean keep-both with
no incompatibility to arbitrate.

## Flagged for post-merge review

Two items, neither of which blocks this pick:

1. **An email page will list as unreachable.** `reachablePages` walks from the home
   page over in-site hrefs; an email page is never served and nothing links to it,
   so it comes out `reachable: false` and the human line appends
   `(unreachable: nothing links to it)` — literally true, but the implied remedy is
   meaningless for a mailed page. Neither ticket could have anticipated the other
   (REQ-248 predates email pages; REQ-247 predates `reachable`), and no test
   constrains the interaction. Exempting `kind: 'email'` from the mark would be a
   design decision neither side made, so it is left to the owning ticket rather than
   invented here.
2. **`ticketStoreFor` and `TEMPLATE_TYPE` are imported and unused** in the resolved
   test file. This is incoming's own state, not an artefact of the resolution — the
   `:3:` blob has exactly the same two dead imports and no other reference to either
   symbol. Kept so the file stays byte-identical to incoming.

## State on exit

`git status --porcelain` has no unmerged entries and no untracked leftovers; HEAD is
unmoved at `a5d9e25e9d` and `CHERRY_PICK_HEAD` is intact at `4c87210002`. Unlike the
ticket-path picks on this branch, this one stages a **real net change** —
`git diff --cached --stat HEAD` is non-empty, which is correct for a code pick, and
finalize will commit it rather than skip.

## Forecast for the next picks in this series

More REQ-247-era code commits are expected. Two things from this pick generalise:

- **Check the ours side for staleness against main's own app code before trusting
  it.** The test file's ours blob was a REQ-236 reversion that HEAD's router already
  contradicts. One `git show HEAD:<the module under test>` settled it, and it is a
  far better test than any timestamp.
- **A commit's auto-merged regions can silently pick the stale side.** Resolving only
  the marked regions would have left a broken hybrid here. On a code pick, diff
  `:1:`→`:2:` for the whole file and ask what ours' delta actually *is* — if it is
  purely a rollback of an earlier incoming feature, take incoming for the file.
