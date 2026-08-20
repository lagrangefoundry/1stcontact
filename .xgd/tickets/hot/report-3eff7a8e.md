---
uid: report-3eff7a8e
id: REPORT-2437
type: report
title: 'Fix implementation drift: reconcile-BUNDLE-19'
created_by: xgd
created_at: '2026-08-20T12:45:24.130640+00:00'
updated_at: '2026-08-20T12:45:24.130640+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: fix_implementation_drift
  subject_uid: reconcile-BUNDLE-19
---

## Verdict

**No implementation edits were made. All seven failing UATs are case 2b** — the
owning intent is EARLIER on the working timeline than the merging branch's
intent, so the merging intent supersedes the pinned matrix entry. Per the
`fix_implementation_drift` contract this layer cannot fix it: the corrective
action is an explicit invalidation declaration for the superseded ACs, which is
above this prompt's authority.

Crucially, this is not merely a timeline-ordering technicality. In both
contentions the *evidence in the branch itself* shows deliberate supersession:
the anchor intent introduced the replacement convention and ships its own newer,
passing ACs that encode it. Making the old UATs pass would require either
editing the UAT (prohibited) or reverting the anchor intent's headline feature.

## Failing UATs addressed

All seven are in files that exist unchanged on `main` (`git diff main...HEAD`
reports no delta for either file) — the branch modified the implementation
beneath them without the reconcile declaring the older ACs invalid.

### Contention 1 — story-a58a0974 / bundle-e59210c5 (6 UATs), case 2b

File: `tests/reconciliation-assistant-conversation.test.ts`

- `test_UAT_AC1052_opening_answers_with_an_identifier_the_turns_so_far_and_readiness`
- `test_UAT_AC1054_a_site_changing_turn_streams_its_activity_and_leaves_the_change_in_the_draft`
- `test_UAT_AC1056_each_conversation_changes_only_its_own_site_and_holds_only_its_own_turns`
- `test_UAT_AC1057_turns_persist_under_the_workspace_and_are_replayed_after_a_restart`
- `test_UAT_AC1059_a_refused_operation_returns_a_named_refusal_into_the_same_turn`
- `test_UAT_AC1060_a_missing_credential_is_explained_without_losing_the_conversation`

Owning intent: `bundle-e59210c5` (story `story-a58a0974`). Files edited: **none**.

**Confirmed root cause** (reproduced directly at the `host.ts` layer — see "Local
verification"): every one of these six is a case whose assertions require a turn
to *succeed*. Each fails with

```
TypeError: stream is not async iterable
  at runToolLoop (@lagrangefoundry/ai/src/backends/api_tools.js:261)
  at ClaudeAPIBackend.promptStream (@lagrangefoundry/ai/src/backends/claude_api.js:142)
  at streamPrompt (tools/generate/src/cli/ai/host.ts:522)
```

`ClaudeAPIBackend._callModel` now calls `client.messages.create({… stream: true})`
and `runToolLoop` does `for await (const event of stream)`. The `scriptedClient`
double in this UAT file returns a finished message object
(`{ content: [{ type: 'text', text }] }`), which is not async-iterable.

This is *superseded convention, not a regression*. The anchor intent's own newly
added reconciliation UATs use the streamed-wire-event double and **pass** in the
same run:

- `tests/reconciliation-draft-change-journal.test.ts` (AC-1253…AC-1268) — `says`/`calls`
  are `async function*` generators yielding `content_block_start` /
  `content_block_delta` / `content_block_stop`.
- `tests/reconciliation-assistant-conversation-knowledge.test.ts` (AC-1317…AC-1320) —
  the double's own comment states the rule: *"It answers in the backend's own
  streamed wire events rather than in a finished message, because that is what
  the backend consumes."*

Both AC ranges were inside this run's `test_filter` and are among the 183 passes.
The exactly-consistent split within the failing file corroborates the diagnosis:
the five cases in it that do **not** need a turn to succeed all pass —
AC-1051 (only asserts the transcript dir appeared), AC-1053 and AC-1055 (refuse
before any turn begins), AC-1058 (inspects `client.seen[0]`, which is populated
before the stream is iterated) and AC-1061 (asserts a *failing* model call).

No implementation-side fix exists. Our host passes the injected client straight
through to `lib.ClaudeAPIBackend` (`host.ts:275-291`); the streaming contract is
the library's. The only way to make these six pass is to update the double in the
UAT file — prohibited by this prompt. Adding a non-streaming compatibility shim in
`host.ts` was rejected: it is dead code against the real SDK (which always
streams) and is exactly the "legacy/fallback mode" `CLAUDE.md` forbids.

### Contention 2 — story-3bf94bd4 / bundle-15c1f647 (1 UAT), case 2b

File: `tests/reconciliation-copy-edit-parameter-sheet.test.ts`

- `test_UAT_AC1123_words_open_in_the_box_and_parameters_in_a_bounded_sheet_staging_into_one_save`

Owning intent: `bundle-15c1f647` (story `story-3bf94bd4`). Files edited: **none**.

**Cause, established by source inspection** (this case could not be executed here —
see "Local verification"): the UAT hardcodes the descriptor-type set a text run
exposes beside its words:

```ts
const parameters = declared.filter((f) => f.type !== 'string')
expect(new Set(parameters.map((f) => f.type))).toEqual(new Set(['integer', 'enum', 'boolean']))
```

The anchor intent widened that set. `copyFieldsOf` now derives a colour row for
every `text` node — `packages/site-schema/src/l1/edit.ts:966-973` calls
`colorField('color', axes.color, …)`, which emits `{ name: 'color', type: 'color' }`
(`edit.ts:637-648`). So the actual set is
`{'color', 'integer', 'enum', 'boolean'}` and the assertion fails. The dialog was
widened to match in the same intent: `apps/control-app/src/builder/editor.js:381-390`
now fills the sheet from `propertyFields || colorFields`.

That widening is the anchor intent's own deliverable, landed under
`[FREE-CODED]` commits on this branch:

- `25362247b feat(editor): text and panel colour, picked from the site palette` (REQ-140)
- `5a0ffb031 feat(editor): lock a control that cannot express what the element holds` (REQ-139)

`packages/site-schema/src/l1/edit.ts` is `+477/-68` on this branch. Making AC-1123
pass would mean deleting the colour descriptor from the derivation — reverting the
feature this merge exists to deliver. That is supersession, not drift.

The first three assertions in this case (the `.builder-modal__props` stylesheet
rules) were checked and are satisfied: `apps/control-app/src/builder/builder.css:344-350`
declares `max-height: min(38vh, 340px)` and `overflow: auto`. The failure is not there.

## Timeline comparisons

`xgd working-timeline bundle-77b28def bundle-e59210c5 bundle-15c1f647`:

| intent | role | timestamp | ISO | n_commits | anchor_sha |
|---|---|---|---|---|---|
| `bundle-77b28def` | anchor (merging) | 1786844263 | 2026-08-16T01:37:43+00:00 | 14 | `8581a924ff56bc405b155186e11ad8ff3cc03cce` |
| `bundle-e59210c5` | owner, AC-1052/54/56/57/59/60 | 1786359649 | 2026-08-10T11:00:49+00:00 | 1 | `0198704b7e29db3c53cf569070042cec0eb467bc` |
| `bundle-15c1f647` | owner, AC-1123 | 1786076192 | 2026-08-07T04:16:32+00:00 | 1 | `1741ee5d1d20eb5ff9bb81564ed3c088ff47731f` |

- `bundle-e59210c5` (2026-08-10) < anchor (2026-08-16) → **case 2b**, by 5d 14h 37m.
- `bundle-15c1f647` (2026-08-07) < anchor (2026-08-16) → **case 2b**, by 8d 21h 21m.

No failing UAT resolved to case 2a or 2c.

## Local verification

**Contention 1 — reproduced and root-caused.** The suite itself cannot be executed
in this session: its `beforeAll` calls `startBuilder`, and this sandbox denies
socket binding on every address (`listen EPERM: operation not permitted` for
`0.0.0.0`, `127.0.0.1` and `::1` alike — probed explicitly). The suite therefore
dies in `beforeAll` after the 180s hook timeout, which is an artefact of this
sandbox and **not** the upstream failure.

To get real evidence anyway, a throwaway diagnostic drove `openSession` /
`streamPrompt` from `tools/generate/src/cli/ai/host.ts` **directly**, bypassing
HTTP, replaying this UAT file's own fixture (`cmdNew` + seeded page), its own
`scriptedClient` / `says` / `calls` doubles, and the shapes of AC-1052, AC-1054,
AC-1059 and AC-1060. `openSession` succeeded (`sessionId: "site-studio"`,
`turns: []`, `ready: true`); every subsequent turn failed with the identical
`TypeError: stream is not async iterable`. That reproduces the upstream failure
set exactly and is the basis for the diagnosis above. The scratch file was
deleted; `git status --porcelain` is clean.

**Contention 2 — not executed.** `tests/reconciliation-copy-edit-parameter-sheet.test.ts`
also stands up a real builder origin, so it is blocked by the same sandbox
restriction, and its assertions run through a mounted `webui-fields` component
rather than a callable seam — there was no equivalent bypass. Its cause is
therefore established by source inspection (cited line-for-line above) rather
than by execution, and is reported as such rather than claimed as verified.

**No UAT passes were achieved, because no implementation edit was made** — none is
available at this layer for either contention.

## What is needed next

A corrective intent that explicitly invalidates the superseded ACs, and re-derives
their evidence against the behaviour the anchor intent actually delivers:

1. **AC-1052 / 1054 / 1056 / 1057 / 1059 / 1060** (`story-a58a0974`) — the model
   double in `tests/reconciliation-assistant-conversation.test.ts` must be
   re-derived to the streamed-wire-event shape already used by
   `reconciliation-draft-change-journal.test.ts` and
   `reconciliation-assistant-conversation-knowledge.test.ts`. The ACs' *claims*
   are unchanged and still true; only the double is stale.
   Note also that `@lagrangefoundry/ai` is consumed via `require.resolve` from an
   out-of-band install and is recorded in **no** manifest in this repo, so its
   streaming contract can move under the suite again with no signal.
2. **AC-1123** (`story-3bf94bd4`) — the AC must be restated to admit the `color`
   descriptor the anchor intent added (REQ-139 / REQ-140), including how a colour
   row, which is mounted by `mountColorField` rather than by the fields component,
   is to be observed in the sheet.
