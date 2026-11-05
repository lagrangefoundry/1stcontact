---
uid: doc-2eff252f
id: DOC-68
type: doc
title: 'Builder model costing: Haiku 4.5 vs Haiku 5.5, Sonnet 5.5 and hosted open-weights
  models'
created_by: EPIC-20
created_at: '2026-10-24T20:31:52.428018+00:00'
updated_at: '2026-10-24T21:08:04.218111+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  doc_kind: architecture
  parent_uid: epic-0923bb64
---

# Builder model costing: Haiku 4.5 vs Haiku 5.5, Sonnet 5.5 and hosted open-weights models

*Analysis from EPIC-20, 2026-10-24. Raw model output: `.xgd/tmp/epic20/open-weights-builder-costing.txt`.*

## Question

Delegated builders are about half the cost of a site build. How much would we save by moving them to a hosted open-weights model at (a) a Haiku level or (b) a Sonnet level?

## Baseline

Builders run on **Claude Haiku 4.5** (`backends.json` → `claude_builder`): $1 input, $5 output, $0.10 cache read, $1.25 5-minute write, $2 1-hour write, per million tokens.

Six recent builds (Bob's Salon 1–3, Ariel's Arc Welding 1–2, Dina's Diner), from the dev store's `turn_spend.attributed` (local miniflare D1):

| build | builder runs | consultant $ | builders $ (today's rates) | builder share |
|---|---|---|---|---|
| Bob's Salon | 15 | 9.09 | 7.09 | 44% |
| Bob's Salon 2 | 51 | 17.32 | 18.30 | 51% |
| Bob's Salon 3 | 38 | 16.87 | 25.74 | 60% |
| Ariel's | 71 | 27.92 | 24.02 | 46% |
| Ariel's 2 | 67 | 41.67 | 22.38 | 35% |
| Dina's Diner | 7 | 9.67 | 2.45 | 20% |
| **total** | 249 | 122.53 | 99.99 | **45%** |

Builder figures are re-priced at today's settings (`cache_ttl` system 1h / messages 5m, about 96% of writes at the 5-minute rate), so older builds differ slightly from what they were metered at.

### Token mix: cache reads decide everything

Across those builds the builders consumed **568M prompt tokens and 3.5M output tokens**. Of the prompt tokens:
- **96.1% cache reads**
- 3.7% cache writes
- 0.14% fresh input

So the **cache-read price** decides a builder model's cost. Headline input and output prices barely matter.

### Prompt size

From `request_spend`, 1,033 builder requests, 46 runs:
- **every run starts at ~46.7K prompt tokens** (46.4–48.7K), a fixed overhead;
- prompts grow ~2.2K tokens per request, and a run makes a median of 23 requests;
- median request 77K, p90 115K, max 146K; the median run ends at ~105K;
- 31 of 46 runs cross 77K, typically around request 11–14.

## Candidates and prices

Open-weights prices are from the providers' pages (DeepSeek API pricing, Together AI serverless pricing) on 2026-10-24. Anthropic prices are from the Claude API reference.

- **Haiku 5.5** (Anthropic's current Haiku). Two rate cards chosen by prompt length: **$0.10 / $0.50 at ≤100K tokens, $0.50 / $2.50 above**. Cache reads 0.1× input, writes 1.25× (5m) / 2× (1h). Its newer tokenizer counts the same text as **~30% more tokens**. 1M context. Described as substantially better than Haiku 4.5 at instruction following and as a sub-agent.
- **Sonnet 5.5**: $2 / $10, cache read $0.20.
- **Open-weights hosts** charge no cache-write premium: a miss is an ordinary input token. Caching is automatic prefix caching with no published hit-rate guarantee.

Tier placement (Haiku-level vs Sonnet-level) is a judgement from aggregator leaderboards (BenchLM, Morph, Gumloop), which disagree with each other. It is not our own evaluation.

## Result: builder spend for the six builds

Method:
- Same token counts and the same cache hit pattern for every model.
- Haiku 5.5 and Sonnet 5.5 are scaled by +30% for the tokenizer.
- For Haiku 5.5, 62% of prompt tokens sit in requests over 100K once scaled, so they pay the 5× card.

| tier | model | builders | per build | vs today | whole build |
|---|---|---|---|---|---|
| — | **Haiku 4.5 (today)** | $100 | $16.66 | — | — |
| Anthropic | **Haiku 5.5** | $45 | $7.54 | −55% | −25% |
| (a) Haiku-level | DeepSeek V4.1 Flash, peak ($0.30 / cached $0.006 / $1.20) | $14 | $2.35 | −86% | −39% |
| | DeepSeek V4.1 Flash, off-peak (half price) | $7 | $1.17 | −93% | −42% |
| | MiniMax M3.1 Flash ($0.15 / $0.015 / $0.60) | $14 | $2.26 | −86% | −39% |
| | Nemotron 3.5 Super VL ($0.15 / $0.02 / $0.50) | $16 | $2.66 | −84% | −38% |
| | GLM-5.3-Flash ($0.15 / $0.03 / $0.50) | $21 | $3.57 | −79% | −35% |
| Anthropic | Sonnet 5.5 | $260 | $43.33 | +160% | +72% |
| (b) Sonnet-level | DeepSeek V4 Pro, from DeepSeek ($1.32 / $0.044 / $3.96) | $67 | $11.14 | −33% | −15% |
| | DeepSeek V4 Pro, from Together (cached $0.13) | $114 | $18.97 | +14% | +6% |
| | GLM-5.3 ($1.40 / $0.26 / $4.40) | $188 | $31.34 | +88% | +40% |
| | Qwen3.8-2.4T ($2.00 / $0.25 / $6.00) | $201 | $33.56 | +101% | +46% |
| | Kimi K3 ($3.00 / $0.30 / $15.00) | $282 | $47.04 | +182% | +82% |

**If builder prompts stayed at or under 100K Haiku 5.5 tokens** (about 77K by today's count), Haiku 5.5 would cost about **$13** for the six builds (−87%). That's close to the open-weights figures without leaving Anthropic.

## Risks and conditions

**(a) Haiku-level open weights**
- **Cache hit rate is the main risk.** We get 96% today. DeepSeek Flash still breaks even with Haiku 4.5 at a 45% hit rate, but needs 77% to match Haiku 5.5. MiniMax M3.1 Flash needs 55% to match Haiku 5.5. Measure it before committing.
- **Quality and rework.** Most builder spend on recent builds was rework, from scope violations, width-setting mistakes and report loops. A model that makes more of these gives back the saving. None of these models has been tried on our tool surface.
- **Engineering.** The framework has only `ClaudeAPIBackend`. An open-weights builder needs a new framework backend adapter covering tool calls, image input, cache semantics and usage reporting.
- **Vision.** Builders take screenshots to check their work. DeepSeek V4.1 Flash and Nemotron 3.5 Super VL take images. Check the others.
- **Data.** Client content and PII go to the host. DOC-5 requires disclosing which AI providers receive data. DeepSeek direct processes in China, Together in the US.

**(b) Sonnet-level**
- Every Sonnet-level option except DeepSeek V4 Pro bought directly costs more per token than Haiku 4.5. It would need to cut builder runs by about half (GLM-5.3: −47%) just to break even.
- DeepSeek V4 Pro direct is 33% cheaper but has no image input, and the data residency issue above.

## Recommendation

1. **Move builders to Haiku 5.5.** It needs a config change plus meter support for the two rate cards (child request under EPIC-20).
2. **Keep builder prompts at or under 100K Haiku 5.5 tokens.** That turns −55% into about −87%. See the prompt-size section.
3. **Then trial one Haiku-level open-weights model**, likely DeepSeek V4.1 Flash on Together, on a replayed set of briefs. Compare cache hit rate, rework and cost per completed brief using `request_spend`. That needs the framework adapter first.
4. **Don't move builders to a Sonnet-level model** unless a trial shows it roughly halves the number of runs.

## Sources

- DeepSeek API pricing, https://api-docs.deepseek.com/quick_start/pricing
- Together AI pricing, https://www.together.ai/pricing
- Price aggregators: https://aitokenprice.com/, https://intuitionlabs.ai/articles/llm-api-pricing-cost-per-task-comparison, https://www.morphllm.com/llm-api
- Capability rankings: https://benchlm.ai/best/agents, https://benchlm.ai/llm-agent-benchmarks, https://www.morphllm.com/best-open-source-llm, https://www.gumloop.com/blog/open-weight-ai-models

## Builder prompt size: what it's made of, and what keeping it ≤77K would take

*Measured 2026-10-24 by capturing a real builder first request in the workers test pool (throwaway copy of the BUG-182 test). Character counts are measured. Token splits are estimates, calibrated to production's 46.7K first request at ~3.7 characters per token.*

### Why 77K

Haiku 5.5 bills a request at the 5× card once its prompt passes 100K tokens, and it counts ~30% more tokens than Haiku 4.5. 100K Haiku 5.5 tokens ≈ **77K by today's count**. The prompt includes cached tokens. (Assumption: the threshold counts cache reads, as the per-request pricing in REQ-451 treats them. Confirm against the first metered build.)

### The starting prompt: ~46.7K tokens, identical every run

**Tool definitions: ~27K tokens (57%), 99K characters, 61 tools.**
- ~82K of the 99K characters is prose: tool descriptions plus parameter descriptions. Enums are negligible.
- **~16K characters are repeated word for word across tools.** The picture spec appears in 4 places (compare / screenshot / check_fidelity); the page-id text appears 17 times.
- The four fidelity tools (compare, screenshot, check_fidelity, capture_site) are 28K characters by themselves.
- All 61 tools are sent in full on every request. Neither the framework nor the host defers any tool.

**System prompt: ~19.5K tokens (42%), ~74K characters.**
- builder vocabulary 16.9K
- L1 manual 17.1K
- fidelity manual 9.3K
- builder-role prose 8.5K
- KB landscape ~7.9K
- library 4.0K
- knowledge system 3.6K
- delegation manual 5.0K
- memory/conversation blocks ~0.9K

Content aimed at the wrong reader:
- ~6K characters don't apply to a builder: the delegation manual (a builder only holds `ReportResult`), the conversation-memory blocks (turn ids and a chat ticket it doesn't have), and "Not available" text telling it to ask the client.
- The "Not available" sections total 8.7K.

**Brief:** 1–8K characters, at most 1–2K tokens.

### Growth during a run: ~58K tokens from first to last request (median)

Builder tool-result sizes, from 13.5K audit records:
- `update_page` returns a median **58K bytes** and `copy_page` **73K**: whole pages echoed back.
- `describe_page`: median 12K, p90 26K.
- `describe_site` 4.6K; `get_l1` 2K.

A median run accumulates ~110K characters of text results (~35K tokens), plus a median of 3 screenshots.

**Nothing ages out inside a run.**
- Image ageing only happens when a new user turn opens, and a builder lives for one turn. So every tool result and screenshot stays to the end.
- The screenshot tool's description tells the builder images "age out" after two turns, which is false for a builder.
- There's no live cap on tool-result size.

The existing limits are generous:
- The builder's window is 200K (Haiku 4.5 default), minus 32K reply room, which leaves 168K.
- "Call ReportResult now" fires at 0.8 of that, ~134K.
- The hard stop is at 0.9, ~151K.

### What keeping requests ≤77K would take (today's tokens)

The budget after the starting prompt is ~30K tokens, against a median growth of ~58K. Both halves have to shrink.

**1. Starting prompt, 46.7K → ~25K target**
- *Tool definitions (1stcontact surface JSON):*
  - write each shared parameter description once (−~4K tokens);
  - shorten the fidelity tool descriptions;
  - stop describing what the summary manual already says.
- *Deferred tool loading (framework):* send the handful of tools every brief uses, and let the rest load on demand through tool search. Likely the biggest single cut (−10–15K). It needs framework support and a check that Haiku 5.5 supports it.
- *System prompt (priming / roles):*
  - drop the three wrong-reader blocks and most of "Not available" (−~3–4K);
  - trim vocabulary and manual overlap.

**2. Growth, ~58K → ≤~50K at p75**
- *Result shapes (1stcontact):* `update_page` / `copy_page` return a short account (what changed, by element), not the whole page, as BUG-252 does for Delegate results. `describe_page` gets a compact form.
- *Compact JSON (framework REQ-217)* roughly halves every structured result.
- *Age screenshots and old results within a run (framework):* keep the last few screenshots live and older ones as pointers. Clearing old results (server-side context editing) invalidates the cache from the cleared point, so weigh it against cache-write cost.
- *Fix the screenshot description's "ages out" claim.*

**3. A backstop: the builder's report point.** Lowering the builder's `context_window` would make "Call ReportResult now" fire before 100K Haiku 5.5 tokens. That's blunt: unfinished briefs come back as more runs, and Bob's Salon / Ariel's show rework is what costs us. Use it only after 1 and 2.

**Payoff.** Haiku 5.5 builders go from ~$45 to ~$13 for the six builds. Separately from price, smaller prompts make every request faster, and the builder is likely to follow its brief better with less irrelevant text.

**Where the work lives.** 1stcontact covers tool-description dedupe, priming trims, result shapes and the screenshot text. The framework covers deferred tool loading, in-run ageing and compact JSON (REQ-217, already filed).

## Second pass (2026-10-24): a line-by-line read of the builder prompt, with confidence levels

*This corrects the section above. The operator's condition is that builder quality must not get worse. I read the full captured system text and all 61 tool definitions, and cross-checked against builder tool use in 13,201 audit records from 329 builder sessions.*

### Corrections to the section above

- **The starting prompt can't safely go to ~25K.** Cuts that are safe on the evidence take it to about 38–39K. The rest of the starting prompt is either core to building correctly (the page vocabulary, the L1 manual's workflows, the screenshot instructions) or would need an evaluation to justify.
- **`update_page` / `copy_page` result shapes don't matter.** Builders called them 16 and 5 times in 329 sessions. Run growth comes from `describe_page` (~58K bytes per session, 1,480 calls), `get_l1` (~48K bytes per session, 3,047 calls), the builder's own `set_l1` writes kept in history, and screenshots (2,349 calls, ~7 per session, each held for the rest of the run).
- **Deferred tool loading adds little.** The tools a builder doesn't use can simply be taken out of its grant, which is a role change and not framework work. The tools it does use are needed on most runs.

### The builder's prompt is largely written for the consultant

The surface manuals and tool descriptions are shared with the consultant, and much of the text addresses a reader who talks to the client. The builder never does. In the builder's own prompt:

- "Fetching a picture… ASK FOR IT HERE… the client can drop a file straight onto this conversation";
- "Tell your user the page exists and is empty"; "acknowledge it to your user"; "say that you saw it";
- "Say the number, not the name… say *the crucible, IMAGE-5* when you talk to your client";
- "post the link `make_alternatives` answered with"; "Never tell your client something is in the menu"; "get their yes first";
- the full delegation manual (written for whoever hands work out — the builder holds only `ReportResult`);
- "Your memory of this conversation" / "Reaching the rest of this conversation" (turn ids, a chat ticket, a recent window — none apply to a one-turn worker);
- the screenshot tool's claim that a picture "ages out" after two turns (false for a builder);
- the screenshot `client` viewport ("the width your client is viewing… where to look first when they tell you…").

These contradict the builder's role section ("A consultant is talking to the client… you are not"). Removing or rewording them is **as likely to help builder quality as to cost tokens**. That is reasoning, not a measurement.

### Confidence by component

| component | size | proposal | confidence nothing it does is lost | why |
|---|---|---|---|---|
| Conversation-memory blocks | ~1.5K chars | remove for builders | **High (~90%)** | Describe machinery a one-turn worker doesn't have. |
| Delegation manual | ~5K chars | replace with the one `ReportResult` line it needs | **High (~85–90%)** | The builder's own Reporting section already covers checks and reporting more precisely. |
| Tools never called (11: capture_site, check_fidelity, describe_reference, list_references, solve, group_l1, rename_palette_color, rename_text_style, remove_text_style, share_section, KnowledgeChanges) + their manual text | ~16K + ~3K chars | remove from the builder grant | **High (~80–85%)** | 0 calls in 329 sessions. Residual risk: a future brief type such as "reproduce this captured site". The consultant keeps them. |
| Client-facing lines inside shared manuals and tool descriptions | ~3–5K chars | builder-worded variants | **Medium-high (~75%)** | Needs per-role text. Some content is still true for a builder and must survive in builder words: the client may edit while it works, and it must never overwrite their change. Rewording risks dropping that. |
| Library manual | 4K chars | shrink to a few lines | **Medium-high (~70–75%)** | 15 builder calls in total. The catalogue-number guidance is for talking to the client. |
| compare `b` repeating `a`'s full picture spec | ~3.5K chars | "same shape as `a`" | **Medium-high (~75%)** | 122 calls; the model may lean on the repeated text. |
| measure_drawing / relate / solve | ~4.6K chars | remove | **Medium (~60%)** | 97 measure_drawing calls in 52 sessions, but builders don't draw. Probably the throwaway-SVG measuring that Ariel's priming now forbids. Removing them is a behaviour change, not only a trim. |
| Page vocabulary | 16.9K chars | **keep** | — | Generated from the validator's schemas. It's what stops invalid writes. |
| L1 manual workflows ("How these fit together") | ~6K chars | **keep** | — | High-value procedure for a small model. |
| Screenshot instructions | ~10K chars | keep; fix the "ages out" claim | — | Third most-used tool; 106 wrong-option calls on Bob's Salon 3 show the instructions matter. |
| Knowledge manual | 3.6K chars | keep | — | Used deliberately (REQ-355: look a limit up before reporting). |

**High-confidence cuts total about 8K tokens**: start 46.7K → ~38.7K. Adding the medium items gets to ~12K.

### What that buys on Haiku 5.5 (rate-card effect only, six builds)

| change | builder cost |
|---|---|
| today's prompts | ~$45 |
| start −8K (high-confidence cuts only) | ~$41 |
| start −12K (+ medium cuts) | ~$38 |
| start −8K and growth −30% | ~$28 |
| start −12K and growth −40% | ~$20 |
| everything ≤100K Haiku 5.5 tokens | ~$13 |

The instructions alone are a small lever. **Growth is the larger one, and it isn't instruction text.** The growth levers, with their quality risk:

- **Compact JSON in tool results** (framework REQ-217). Same content in a shorter form. **High confidence.**
- **Screenshots ageing within a run** (framework). Keep the last few live and older ones as pointers; this also makes the tool's "ages out" text true. **Medium-high confidence**: a builder rarely needs a picture from ten requests ago.
- **Stale `describe_page` maps leaving history** (framework context editing). Addresses regenerate on every write, so old maps are already wrong. But clearing invalidates the cache from that point. **Medium**: needs measuring for cost as well as quality.

### Condition for doing any of it

None of this should land without a **replay evaluation**:
- a fixed set of real briefs taken from Bob's Salon, Ariel's and Dina's, each run against a snapshot of the site as it stood when the brief was given;
- old prompt vs new, two runs each;
- scored on the host's own checks (containment, text, scope), `describe_page` attention counts, layout-check failures, report accuracy, requests per brief and cost.

At ~$0.34 per run on Haiku 4.5, 30 briefs × 2 arms × 2 runs is about $40. Without that harness, "carefully" can't be shown, and the answer should be "not at all".

## Deletion review of the 11 tools builders never call (2026-10-24)

The operator's view: a tool kept only out of the instructions becomes code debt, so unused tools should be deleted, not just hidden.

Evidence:
- builder audit records: 13,201 calls, 329 sessions;
- consultant tool transcripts in the dev store: 33 consultant sessions, 2026-09-08 → 2026-10-24.

Production's remote store holds almost nothing, so this is all the usage there is.

| tool | consultant calls (sessions, last) | builder calls | lives in | verdict |
|---|---|---|---|---|
| `check_fidelity` | 0 | 0 | `fidelity-surface.json` (engine also used by the repro console and `1c gate`) | **Delete the chat tool**; keep the gate engine. |
| `group_l1` | 0 | 0 | `l1-surface.json` (engine in `l1/fold.ts`, also used by `1c edit`) | **Delete the chat tool**; keep the engine. |
| `share_section` | 0 | 0 | `l1-surface.json` | **Delete.** A one-off migration for sites built before shared headers. |
| `rename_text_style` | 0 | 0 | `l1-surface.json` | **Delete**, or keep for palette/type symmetry (operator's call). |
| `remove_text_style` | 0 | 0 | `l1-surface.json` | Same as above. |
| `rename_palette_color` | 1 (1, 2026-09-11) | 0 | `l1-surface.json` | Same as above. |
| `solve` | 2 (1, 2026-09-10) | 0 | `l1-surface.json` | **Delete candidate.** `measure_drawing` stays: consultant 7 calls, last 2026-10-23. |
| `relate` | 0 | 1 | `l1-surface.json` | **Delete candidate** (with `solve`). |
| `capture_site` | 48 (11, 2026-10-24) | 0 | `fidelity-surface.json` | **Keep.** Consultant comps. Remove from the builder grant only. |
| `list_references` / `describe_reference` | 4 / 2 | 0 | `fidelity-surface.json` | **Keep** for the consultant; remove from the builder grant. |
| `KnowledgeChanges` | 7 (3, 2026-10-23) | 0 | framework (`@lagrangefoundry/ai` knowledge surface) | **Keep.** Remove from the builder grant only. |

Adjacent and not in the eleven: `flow_l1` (3 calls in total) is the partner of `group_l1` for positioned reproductions. Review it with `group_l1`.

Deleting a chat tool also removes its implementation path in `toolbox-core.ts`, its manual text, its priming references (`share_section` is named in `priming.json`) and its UATs and ACs (an upgrade story at reconcile).

## Reproduction safety of the proposed tool deletions (added from EPIC-19, 2026-10-24)

**Operator requirement:** the deletions must not affect the site **reproduction**
capability: capture → fold → `1c gate` / l1-gate, the repro console, and the
REQ-82 round trip.

**Finding: they don't, provided the code below is kept.** Reproduction never goes
through chat tools.
- The repro console (`tools/repro-console`) runs `1c` steps as separate processes
  (`capture`, `refold`, `repro`, `page`, `render`, `gate`;
  `src/iteration.ts:25,93,144,158-159,494`).
- Its AI rounds are `claude -p` sessions using Bash and file reads against the
  engine source, granted no chat tool by name.
- No consultant or builder session runs during reproduction.
- `instances.json` has no reproducer role.

**Keep (reproduction or other live callers depend on them); delete only the chat
handler:**

| Deleted chat tool | Must keep | Why |
|---|---|---|
| `check_fidelity` | all of `gate-core.ts` (`cmdL1Gate`, `reconcileGates`, `referenceCoverage`, `diffManifests`) and `gate.ts` | `1c gate`, the repro console's gate step and the l1-gate tests call them directly. Retire the REQ-157 test that pins the chat tool and `1c gate` sharing reconciliation (`tests/test_UAT_FC_REQ-157_fidelity_surface.test.ts:795-900`), and update the stale comments. |
| `group_l1` | `l1/rebase.ts`, and `editL1Group` (`1c structure group`) | `l1/fold.ts:84` imports `frameAt`, `rebaseInto`, `responseAt` and `surfaceBorderInset` from `rebase.ts`. |
| `flow_l1` | `editL1Flow` (`1c structure flow`) | CLI caller. The host page measurer passed only for this tool (`host-core.ts:2960`) can go. |
| `relate` | `relateAnchors` | Used by `evaluateRelations` beside `measure_drawing`, which stays. |
| `rename_text_style`, `remove_text_style` | `editTextStyleRename`, `editTextStyleRm` | `1c` CLI callers (and superseded by REQ-447's `site.design`). |
| `rename_palette_color` | `editPaletteRename` | The control app's palette route (`router.ts:6674`), the `1c` CLI and the site-store contract tests. |
| `share_section` | (no other caller) | `editShareSection` can go too. Edit `priming.json:750,1517`, and note in BUG-260 that this path no longer needs fixing. |
| `solve` | (no other caller) | `solveTranslation` can go. Edit `draw_image`'s description, which names `relate`/`solve`. |

**Builder-only removals** (`capture_site`, `list_references`,
`describe_reference`, `KnowledgeChanges`) don't touch reproduction:
- **`1c capture`** uses `cli/capture/*`, not the chat handler.
- **`capture_site`'s handler** stays for the consultant and the comp board
  (`router.ts:6029`).
- **Mechanics:**
  - the builder gets SeeSite as a whole group (`instances.json`), so either list
    its fidelity operations explicitly or split the group;
  - for `KnowledgeChanges`, pass an operations list to
    `knowledgeInstanceConfig` in `builderKnowledge` (`roles.ts:2193`), which the
    framework already supports.

**The "Reproduce a site you were shown" manual sequence**
(`fidelity-surface.json:318-327`: `capture_site` → `describe_reference` →
`screenshot` → `check_fidelity`) is chat-assistant guidance, not the
reproduction pipeline. Rewrite or remove it when `check_fidelity` goes, so no
model is pointed at a deleted tool.

**Acceptance for the deletion ticket:**
- the repro console's gate step and `1c gate` produce identical reports on a
  committed capture before and after the deletions;
- the REQ-82 round-trip and l1-gate suites pass unchanged;
- `rebase.ts` and `gate-core.ts` are untouched by the diff.

**Housekeeping:** `talker.json` withhold list, `slow-tools.json`, and the tool-list
pin tests (REQ-126, REQ-157, REQ-206, REQ-216, REQ-295, REQ-386, the
assistant-control-surface and palette reconciliation tests, and the knowledge
grant tests).
