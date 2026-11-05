---
uid: request-2f9b6446
id: REQ-452
type: request
title: 'Builder replay evaluation: score a builder configuration on real briefs before
  changing it'
created_by: EPIC-20
created_at: '2026-10-24T20:51:54.417491+00:00'
updated_at: '2026-10-25T00:46:03.060573+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-0923bb64
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-5363562d
  story_points: 20
  commits:
  - working_sha: a2b1dafd2d7c3ed41e8119d62649eff47e3f4f30
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 222e704cfb072d90300ad1b78f0a2845a8147432
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  version: 0.2.627
---

## Why

Builder quality is already the main source of builder cost: most builder spend on recent builds was rework (DOC-68, EPIC-20 reviews of Bob's Salon 3 and Ariel's). Several pending changes could affect it:
- moving builders to Haiku 5.5 (REQ-451);
- trimming the builder's prompt and removing unused tools from its grant (DOC-68 second pass);
- shrinking what accumulates during a run (framework REQ-217 and others).

The operator's condition is that none of these may make builder work worse. Without a measurement, "carefully" can't be shown. This tool is that measurement: replay real briefs against a fixed starting site and compare configurations side by side.

## What

A command that runs a set of recorded builder briefs under two or more **builder configurations** and reports how each did. A configuration is any combination of:
- backend model and settings (a `backends.json` override for `claude_builder`);
- builder priming (a `priming.json` builder order, or a file holding a variant);
- builder tool grant (the builder role's `tools`).

Configurations come from files the operator writes, so a proposed change is evaluated without being merged.

### Corpus

*Revised 2026-10-24 after this ticket's session found the original sources unusable. See "Decisions" below.*

- **Built from recorded builds**, not hand-written. Each case is the brief exactly as the consultant sent it (the `Delegate` input: brief, `scope`, `accept` checks) plus **the site's state immediately before that delegation**. If a case's state can't be reproduced exactly, the case is skipped and the reason recorded. Never approximate.
- **Primary source: recorded at delegation time, from now on (option 2).** The host already takes a full snapshot of the draft at the start of every delegation: the `mark` behind host-record checks. Today it keeps it in memory only. It is now saved to R2 next to the builder session. The saved case holds:
  - the **site draft**: every page, `site.json`, and the asset list, with the asset bytes reachable;
  - the **plan**. Since REQ-448 a `Delegate` is refused with `design_first` until the plan records a design, so a case without its plan would fail every replay at that gate. Save whatever else the plan holds that the delegation or its checks read;
  - the client's **Library catalogue** (builders read it with `list_library` / `get_library_item`);
  - the **exact `Delegate` input**: brief, `scope`, `accept`;
  - the **builder configuration that actually ran**: model, `backends.json` settings, a fingerprint of its priming and its tool grant. A recorded run can then be compared with a replay, and a case says which configuration produced its original result.
- **One-off import of historical builds: measure first (option 1). DROPPED 2026-10-24 after the measurement; see "Option 1 measurement" below. Nothing was built for it.** Replay a site's history from its first draft: audited writes from the R2 tool audit (complete parameters for every consultant and builder write) plus client edits from the journal (`copy.set` before/after text), in time order. Each brief's state is the replayed state just before its `Delegate`. Exactness check: the replayed final state equals today's live draft byte for byte, and each delegation's recorded change list matches the replay. A site that fails is skipped whole, with the reason.
  - **Time-boxed measurement before any replay machinery is built.** Try Bob's Salon 3 and Ariel's Arc Welding (1) first, the two most informative builds. If both pass, import them, and others that pass. If they don't, drop option 1, record why here, and build nothing further for it.
  - Known risks: today's code may replay old calls differently (schema drift since mid-October); assets need their old bytes; early client edits may have fallen out of the journal's 500-record window (Ariel's journal starts at record 284).
- **If option 1 is dropped:** the corpus comes from new builds. Each build yields 40–70 briefs, and the failure kinds recur (header/logo, per-width fixes, price tables, galleries, fonts), so one or two builds after option 2 lands are enough. Default set: ~30 briefs, mixing kinds that went wrong with ones that went right.
- The corpus is saved as a reusable fixture set, so every evaluation runs the same cases.

### Run

- **Where it runs:** a `1c` command, `1c eval-builder extract|run` (the working name `1c builder-eval` collides with the retired `1c builder` verb, which BUG-150 keeps out of the help), on the Node host. **The Node host can't open a session today:** `tools/generate/src/cli/ai/host.ts:202` passes `logDir`, and the current framework rejects it (`SessionManager: unknown option logDir`). Either the eval supplies `junctions` itself, or `host.ts` is fixed here first (preferred: the fix is small and the eval depends on it).
- **The real host path:** a scripted consultant issues exactly the recorded `Delegate` call, and only builder requests go to the real model. Each run therefore goes through the same role, scope lease, host-record checks and layout check as a real delegation, with no second implementation of any of them.
- **Configurations** are small files naming a `backends.json` override for `claude_builder`, a priming variant and/or a `tools` grant. They're applied through the existing configure hooks, so nothing is merged to run them. **A configuration names every setting it depends on.** In particular, the baseline names `claude-haiku-4-5` explicitly: REQ-451 has already moved the live builder to `claude-haiku-5-5`, so a baseline read from live config would compare Haiku 5.5 with itself. **The first comparison to run is Haiku 4.5 vs Haiku 5.5 on unchanged priming.**
- Each case runs on a fresh copy of its snapshot, under each configuration, **N times** (default 2; models aren't deterministic). It goes through the same host path a real delegation uses: same role, scope enforcement, host-record checks and layout check after.
- **Real model calls cost money**:
  - the command prints its estimated cost first;
  - it refuses to start without an explicit budget;
  - it stops cleanly when the budget is reached, reporting what completed.

### Scores per run, and per configuration in aggregate

1. **Checks:** host-record checks (containment, text, scope) passed / failed.
2. **Report accuracy:** each check the builder answered, compared with the host's own verdict where one exists. A check claimed passed that the host found failed is counted separately: it's the costly failure.
   - *As built:* the host settles every check it can verify itself and never sends that check to the builder, so a builder-answered check never has a host verdict beside it. A **false pass** is therefore counted from the host's change record: each page the builder's `changed` names that the record shows untouched, plus every check the builder passed in a run where the record shows nothing written at all ("done", and nothing done — the BUG-71/BUG-243 failure). Builder verdicts are tallied as passed / failed / unverified / unreported.
3. **Page health after the run:** `describe_page` attention counts (`broken` / `inconsistent` / `worth_a_look`) and layout-check findings at desktop and phone, as a delta from the snapshot.
4. **Out-of-scope writes:** anything the change record shows outside the brief's scope or outside what its checks name. Scope refusals are counted too.
5. **Completion:** report delivered, report refused / repeated (the BUG-243/BUG-253 loop), hit the context or budget limit, items the builder said it didn't do.
6. **Cost:** requests, tokens by type, cost priced with the meter's own code (`spend-core.ts`), and wall time.

### Output

- A side-by-side table per configuration with the difference from the first (baseline) configuration, plus per-case detail, as markdown and JSON under `.xgd/tmp/` (or a path given).
- The per-run session ids, so any run can be read in full afterwards.
- **No pass/fail threshold is built in.** The operator judges the comparison.

## Decisions (2026-10-24)

From this ticket's first session and the operator's review in EPIC-20:
- **The originally named sources can't reproduce a pre-brief state.**
  - `site_changes` records summaries, not elements: a `set_l1` keeps a text summary as `before`/`after`. It keeps only the last 500 records per site.
  - Site revisions are nearly empty: one in the whole dev store.
  - The host's delegation snapshot is discarded after use.

  Hence the corpus revision above.
- **Option 3 with an exit:** record at delegation time (option 2) is the permanent source. The historical import (option 1) is a time-boxed measurement on Bob's Salon 3 and Ariel's, abandoned if they fail the exactness check.
- **The saved case includes the plan, Library catalogue, exact `Delegate` input and the builder configuration that ran**, not only the draft.
- **The baseline configuration pins `claude-haiku-4-5`**, and the first comparison is Haiku 4.5 vs Haiku 5.5.
- **The Node host's `logDir` breakage is fixed or bypassed** as a prerequisite.

## Option 1 measurement (2026-10-24): dropped

Measured on the local dev store before anything was built:
- **Bob's Salon 3** (`site_c5fa13bc…`): the journal keeps records 40–539; 1–39 are gone. The R2 tool audit starts at 18:34, four hours after the draft was created (14:29). Before record 40 the audit holds **32** successful site writes against **39** lost journal records.
- **Ariel's Arc Welding** (`site_555cd8ac…`): the journal keeps 284–783. The audit starts at 16:43 (draft created 15:57). Before record 284 it holds **276** site writes against **283** lost records.

In both, the window before the first retained journal record holds writes that no recorded source accounts for (host writes, client edits, uploads — indistinguishable now), and the state the audit starts from is unrecorded. Neither site's pre-build state can be shown exact, so per the rule above option 1 is dropped and the corpus comes from new builds recorded by option 2.

## What landed

- **Node host opens sessions again.** `host.ts` passes `junctions: fileJunctions(storage/chat/live)` instead of the retired `logDir`, which the framework now rejects; `HostDeps.logDir` is gone.
- **Each delegation is saved as a case** (`tools/generate/src/cli/ai/builder-case-core.ts`). The host's `Delegate` wrapper tells a recorder of each `Delegate` that passed every refusal (never a REQ-409 replacement); the opening mark of `draftAccount` hands it the draft capture it already takes; the two are paired by the brief. The case holds the `Delegate` input exactly (`goal`, `scope`, `accept`, the rest unchanged), the draft outline at the mark, the plan, the Library catalogue (each item's listing, description and text), and the builder configuration that ran (backend name, its `backends.json` entry, a SHA-256 of its priming configuration, its grant). Asset bytes are copied once per digest. Saving never fails a delegation.
  - Worker: R2 `SITES`, `cases/<tenant>/<site>/<builder session>.json` and `cases/<tenant>/blobs/<digest>`, beside the tool audit.
  - Node: the same keys under `storage/chat/` with scope `local`.
- **Configurations** (`builder-config-core.ts`): `name`, `backends` (entries replacing the shipped ones whole), `priming` (the builder's orders, or the path of a file holding them) and `tools` (the builder grant). One installed configuration is read by `backends.ts` (so the meter prices what ran), `roles.ts` (builder priming) and the host (builder grant). `setBuilderConfiguration` installs it and clears the manager cache.
- **`1c eval-builder extract [--out] [--only <site>] [--r2-local <persist> --tenant <id>]`** copies cases into a corpus directory (`corpus.json` lists kept and skipped). A case is kept only if its draft is put back byte-exact: the draft is written as files (not through `store.write`, which clears starter scaffolding, BUG-267) and re-captured; any difference skips it with the reason. `--r2-local` reads a dev Worker's local R2 through miniflare.
- **`1c eval-builder run <config>… --corpus <dir> --budget <USD> [--runs N] [--out <dir>]`** replays each case on a fresh copy of its draft, under each configuration, N times (default 2), through the real Node host and the local builder server (camera, layout check): a scripted consultant sends exactly the recorded `Delegate`; only requests carrying `ReportResult` reach the real model. The case's plan and Library are the host's for the run. Prints its estimate first, refuses without a budget, stops cleanly when spend reaches it and reports what completed.
- **Scores** come from the host's own records: its verdicts on the checks it settles; the change record (`draftChanges`) for out-of-scope writes (by draft file: `site.json`, `page.json`, `page.json#section`, `page.json#style`, `assets/x`) and false passes; lease refusals from the audit; `describe_page`'s attention counts (`auditPage`) and layout-check findings before and after; the delegation's outcome, report refusals and `ended`; cost from the meter's own priced request records. A measurement that could not run (no browser) is `null` with the reason in the run's `notes`, never an empty count. Pictures of each page at desktop and phone are kept under the output directory.
- **Report**: `eval-builder.md` (side-by-side table, each configuration's difference from the first, per-run rows with session ids and notes) and `eval-builder.json`, default under `.xgd/tmp/eval-builder/<time>/`.

## Not in scope

- The prompt changes, grant changes and model switch themselves (their own tickets).
- Judging visual quality by model. Scores come from the host's own records and checks only. A rendered picture of each page after each run is kept for the operator to look at.

## Test plan

These run with the scripted fake model client; real-model runs are not part of the test suite.
- UAT: a `Delegate` run through the host saves a case to R2 holding the pre-delegation draft, the plan, the Library catalogue, the exact `Delegate` input and the builder configuration that ran. Extracting that case yields a draft identical to the site's state immediately before the call.
- UAT: a saved case replayed under the configuration recorded with it reaches the delegation gate. Its plan clears `design_first`, so the `Delegate` is not refused.
- UAT: a configuration file that names `claude-haiku-4-5` runs its builder on `claude-haiku-4-5` whatever the live `backends.json` says.
- ~~UAT (only if option 1 is kept): a fixture site whose replayed history doesn't reproduce its final draft is skipped whole, with the reason.~~ Option 1 dropped; no UAT.
- UAT: two configurations (differing in priming) run over a two-case fixture corpus produce a side-by-side report with each score above for each configuration, and the run session ids.
- UAT: a scripted builder that writes outside its scope is reported as an out-of-scope write. A scripted builder that claims a check passed which the host record shows failed is counted as a false pass.
- UAT: the command refuses to start without a budget, and stops at the budget, reporting the completed runs.

As landed: `tests/test_UAT_FC_REQ-452_builder_replay_eval.test.ts` (case saved and extracted exactly; `design_first` cleared by the case's plan and refused without it; Haiku 4.5 pin; two-configuration report; out-of-scope write, scope refusal and false pass; budget) and `tests/test_UAT_FC_REQ-452_builder_case_in_r2.workers.test.ts` (the Worker saves the case to R2). The browser half of a run (layout check, pictures) is not exercised by the suite; it was tried by hand, and Chromium cannot start inside the agent sandbox, which the run reports as notes.