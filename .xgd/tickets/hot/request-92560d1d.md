---
uid: request-92560d1d
id: REQ-466
type: request
title: 'Prompt budget: measure everything the model reads (instructions and tool text),
  not system text times two'
created_by: EPIC-20
created_at: '2026-10-26T01:49:44.376818+00:00'
updated_at: '2026-10-26T20:58:35.071137+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  parent_uid: epic-0923bb64
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-28c2955c
  commits:
  - working_sha: 858a29e8e5e7dec1d313512c2c2fc91ea0ae2aef
    reconcile_sha: null
    main_sha: null
  - working_sha: f8426eb96651f0a9bcf42068a115f2157f28abb0
    reconcile_sha: null
    main_sha: null
  version: 0.2.673
  story_points: 5
---

## Why

`MAX_PRIMING_CHARS` (`host-core.ts`) is 200,000 characters: an outage backstop. Assembly over it refuses to open the session (BUG-129: at the old 60,000 cap, every builder session refused). The BUG-129 UAT (`test_UAT_FC_BUG-129_a_deployment_grant_primes_inside_the_ceiling`) asserts `priming.length * 2 < MAX_PRIMING_CHARS` on a seeded tenant. Doubling stands in for a real client's knowledge landscape being larger than the test tenant's. In practice it works as a **100,000-character budget**, and it now sits at 99,986. Live, the consultant's system text was 119,372 (FDT 4), 60% of the backstop.

As a budget it measures the wrong thing:
- **It counts only part of the prompt.** Priming sections and the manual's summary projection count. Op descriptions, parameter text, shapes and error text are free, and they're another 123,098 characters on the consultant. Staying under has meant moving text into tool descriptions, so the model reads the same amount.
- **Anyone can turn it red for everyone.** Clean `xgd-working` was already over during REQ-432 and REQ-444, so unrelated tickets had to trim.
- **It mixes two things:** authored text, which we control, and the client's knowledge landscape, which grows with no repo change.

## What

1. **Keep the backstop as it is.** `MAX_PRIMING_CHARS` stays a hard refusal with no truncation. The BUG-129 UAT keeps proving that the deployment's real grant opens a session and reaches the manual. Its headroom check becomes a plain `< MAX_PRIMING_CHARS` with a stated margin for the knowledge landscape, measured separately (item 3), instead of `× 2`.
2. **A budget on authored prompt text, covering everything the model reads.** For each role (consultant, builder, critic, talker), the size of everything this repository authors that reaches the model: priming sections, projected manuals, and tool definitions (name, description, input schema), with the knowledge landscape excluded. Each role has a stated target in configuration (for example `prompt_budget` in `backends.json` or `priming.json`). A UAT measures it from a request built by the deployment's real grant. The target is set at today's measured size plus a small margin, so it doesn't block current work, and lowered as the audit's cuts land.
3. **Measure the knowledge landscape on its own,** so its growth for a large client can be tracked against the backstop margin without counting against authored text.
4. **Report it live.** Per-request `system_chars` / `tools_chars` already exist (REQ-218). Add the authored-text figure to the spend console or the spend report beside them, so growth shows on real builds.

## Acceptance

- The BUG-129 UAT no longer doubles. It asserts the backstop with a stated landscape margin, and still fails when a deployment surface is added without revisiting the ceiling.
- A per-role authored-prompt UAT fails when a change grows priming, manuals or tool definitions past the role's configured target, including a change that moves text from priming into a tool description.
- Moving a paragraph from priming into an op description leaves the authored-prompt figure unchanged (proving the loophole is closed).
- The live report shows the authored-prompt size per role.

## Implementation

**The figure.** `authored = system_chars + tools_chars − landscape_chars`, per request. The two parts are the framework's own REQ-218 sizes: the system text as sent, and the tool list serialised (names, descriptions, input schemas). So a paragraph moved from priming into a tool description leaves the sum where it was. The figure lives in `tools/generate/src/cli/ai/prompt-budget-core.ts`.

**The landscape, measured where it is produced.** `registerCorpusProviders` (`roles.ts`) re-registers the landscape provider (`km.landscape`, and `builder.km.landscape` for workers) through `measuringLandscape`. That records the length of what it rendered against the session it was assembled for. Each request row looks its session up. A role with no corpus records 0. The client's other per-turn content (the standing note, the site digest) rides the per-turn tail rather than the system text (BUG-83), so the landscape is the only client-derived part of `system`.

**Stored per request.** Migration `0035_request_spend_authored.sql` adds `request_spend.authored_chars` and `landscape_chars`. `RequestSpendRecord` carries `authored` and `landscape`. Both are written on every request row; `authored` is NULL where either part was not recorded.

**Targets are configuration.** `priming.json` has a new `prompt_budget` block: `roles` (consultant 235,000, builder 137,000, critic 8,600) and `landscape_margin` (50,000). The targets are the REQ-466 UAT's measurement on 2026-10-26 plus about 2.5%: consultant 229,242, builder 133,853, critic 8,309. They are to be lowered as DOC-70's cuts land.

**The talker has no target of its own.** It is a framework fork of the consultant that reads the consultant's system bytes and a subset of its tools, and the host meters it under `consultant`. So the consultant's target covers it. The coordinator and settings roles have no target either: they are reported live, with the target shown as a dash.

**The backstop is unchanged.** `MAX_PRIMING_CHARS` is still 200,000 with a hard refusal. The BUG-129 UAT and the CLI-side REQ-182 headroom UAT no longer double. Both now assert `priming.length + prompt_budget.landscape_margin < MAX_PRIMING_CHARS`. BUG-129 still asserts the deployment's grant reaches the manual (`list_pages`, `capture_site`, `list_library`, `list_assets`).

**Reported live.** `GET /api/admin/spend` answers a new `prompt` list. For each role in the period it gives the latest request's `authoredChars`, `largestChars`, `landscapeChars`, `systemChars`, `toolsChars`, the role's `target` (or null) and `recordedAt`. The console's *Business cost* pane shows a *Prompt size* grid with Role, Authored, Target and Landscape columns. A role over its target carries `data-over`, and its authored figure is shown in the danger colour. Only rows written since this change have the figure.

**Live figures run above the UAT's.** On First-Draft-Test Dina's Diner 5 (DOC-70) the consultant's live request was 118,698 system + 127,833 tools characters, with about 3.9K of landscape, so roughly 242.6K authored. That is above the 229K the seeded test tenant measures, so the live console will show the consultant over its target until DOC-70's cuts land. The target governs the UAT, which builds the request from the deployment's grant on a seeded tenant.

## Test plan

- `tests/test_UAT_FC_REQ-466_the_authored_prompt_budget.workers.test.ts`. Real route in workerd with the deployment's grant (browser, `OPENAI_API_KEY`, `FAL_KEY`) and a system KB:
  - `each_role_s_authored_prompt_is_measured_and_inside_its_target`: one consultant turn delegates a builder and runs the critic.
    - For the consultant, builder and critic, the `request_spend` row has `authored = system + tools − landscape` and is within the role's `prompt_budget` target.
    - The consultant's `system_chars` and `tools_chars` equal the system text and serialised tools the model was sent.
    - The consultant's and builder's landscape is non-zero; the critic's is 0.
    - `GET /api/admin/spend` reports each role's latest figures and target.
  - `moving_priming_into_a_tool_description_moves_nothing`: a plain sentence is moved from `plan-panel` into a plan-surface op description. `system_chars` falls and `tools_chars` rises by the same amount, and `authored_chars` is unchanged.
- `tests/test_UAT_FC_REQ-466_the_console_shows_prompt_size.test.ts` (jsdom):
  - The pane paints the headed grid with thousands-separated counts, a dash for a role with no target, and `data-over` on a role past its target.
  - A period with no measured request says so.
- Changed: `test_UAT_FC_BUG-129_a_deployment_grant_primes_inside_the_ceiling` and `test_UAT_FC_REQ-182_the_assembled_priming_fits_the_declared_cap_with_headroom` (stated margin instead of × 2).
- Regression scope: the spend, priming, knowledge, migration, console, BUG-272, REQ-355, REQ-416 and REQ-470 suites (45 files). All pass except three REQ-416 `worker_and_talker` cases, which fail identically on clean `xgd-working`.