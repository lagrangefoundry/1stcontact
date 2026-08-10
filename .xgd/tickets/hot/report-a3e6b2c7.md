---
uid: report-a3e6b2c7
id: REPORT-1788
type: report
title: 'Reconciliation Review: commits (BUNDLE-17)'
created_by: xgd
created_at: '2026-08-10T09:54:36.432986+00:00'
updated_at: '2026-08-10T09:54:36.432986+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-e59210c5
  anchor_uid: bundle-e59210c5
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: (n/a — commits mode)
**Anchor**: bundle-e59210c5
**Stories Reviewed**: 8 (story-e674c60a, story-3bf94bd4, story-37a3921b, story-a58a0974, story-7f437d57, story-93905de4, story-189fc1ac, story-b3de4571)

## What was read

Intent first: the full 72k-char bundle body (eight requirement sections, REQ-119 / 122 / 121 / 126 / 128 / 127 / 129 / 130). No comments on the bundle. Then the code entry points named in the plan's behavior inventory, then all eight stories and their 134 acceptance criteria, then the UAT suites — which I **executed**, because the workflow's own scoped-quality reports all read `0 tests, 0 failed` and therefore proved nothing:

- `reconciliation-builder-request-time-render`, `reconciliation-copy-edit-form-presentation`, `reconciliation-copy-edit-background-selection` — 3 files, **19 passed**
- `reconciliation-assistant-conversation`, `reconciliation-builder-assistant-pane`, `reconciliation-assistant-control-surface`, `reconciliation-page-composition-surface`, `reconciliation-beyond-l1-authoring` — 5 files, **59 passed**

78 UATs, 0 failures, 0 skips.

## Intent fidelity — the hard cases, all handled correctly

This bundle is unusually dense in declared supersessions and self-amendments. Every one is recorded in a story rather than absorbed:

| Intent event | Handled |
|---|---|
| **REQ-119 declares its own AC-1 unreachable** — the render was NOT relocated into the edge Worker | story-e674c60a carries an explicit "Deviation, declared" paragraph naming the Worker, the reason (no filesystem, no transform, needs DOC-12 §7 phase 2), and states the matrix does not claim it. AC-1031–1036 say "the origin", never the Worker. **Faithful.** |
| **REQ-119 supersedes AC-992 / AC-1026** (`storage/dist`, "before it reports success") | Both re-pointed to the origin observable; "before it reports success" dropped with the stated reason that no artifact remains to keep in step. CLI-side disk claim correctly retained in AC-1026. **Faithful.** |
| **REQ-122 implicitly supersedes AC-973** (`.builder-chat-placeholder`) | AC-973 rewritten to "the assistant panel", with an explicit note that the criterion is about the split's halves and not their contents. **Faithful.** |
| **REQ-127 withdraws its own scope clause** (site binding as a declared scope predicate) and replaces it with locating the binding in the session; REQ-122's `{slug,text}` turn becomes `{sessionId,text}` | story-a58a0974 Technical Context records both withdrawals by name and states the criteria follow the amended intent. AC-1053 asserts a turn is addressed to a conversation and that naming a site is refused. **Faithful.** |
| **REQ-126's stated grant includes publish**; what shipped withholds publish *and* asset management | story-93905de4 records this as a divergence, names the reason found in the tree (synchronous invocation path cannot host an awaited publish), and writes the criteria as "declared and not granted" rather than fixing the granted set. **Divergence recorded, not absorbed.** |
| **REQ-122 promised refusals carry code, path and hint**; since REQ-126 the tool layer drops path/hint | Recorded in story-a58a0974 *and* story-189fc1ac; the ACs assert the mitigation that exists (a named refusal correctable in-turn) and explicitly do not claim the per-call address is delivered. **Divergence recorded.** |
| **REQ-129 relocates a security guarantee** (from "no operation accepts markup" to "the vocabulary is closed") | story-189fc1ac states the relocation and that any hole in the closure is a security finding against the story. AC-1089 measures it. **Faithful.** |
| **REQ-130 opens a new security boundary** (assistant-authored SVG) | story-b3de4571 states why the URL-scheme allowlist does not help and describes closed-by-construction. AC-1105/1106 measure it. **Faithful.** |
| **REQ-128 argues re-phasing, not a REQ-118 gap** | Reflected in story-37a3921b's framing (second half of the same surface) and in the change-never-add / no-empty-option criteria. **Faithful.** |
| **Known gaps the intents file upstream** (enum control shows raw handles; single field at half width; toolbox refusal drops the pointer) | Named in the stories as not-claimed-closed; no AC asserts any of them. **Correct.** |

I found **no invented behaviour** and **no ungrounded story** across the eight.

## Coverage Map

| # | Behavior (from the code + intent) | Coverage | Story | Notes |
|---|---|---|---|---|
| 1 | Draft + edit channels answer from the origin with no artifact on disk; serving writes nothing back | Covered | story-e674c60a | AC-1031 |
| 2 | One render implementation backs the build-time writer and the request-time reader — same file set, same bytes, both channels | Covered | story-e674c60a | AC-1032; UAT compares every artifact `1c render` writes against the origin's bytes, stylesheet included |
| 3 | Out-of-band definition change shows on the next request, and unwinds | Covered | story-e674c60a | AC-1033 |
| 4 | An invalid draft is reported at the origin naming the field, instead of the last good render | Covered | story-e674c60a | AC-1034 |
| 5 | `published` still comes from the publish-time render | Covered | story-e674c60a | AC-1035 |
| 6 | Channel path resolution unchanged; a preview URL cannot escape its channel | Covered | story-e674c60a | AC-1036 |
| 7 | The save path lost its two render-to-disk calls; both renderings current when next requested | Covered | story-37a3921b | AC-992, AC-1026 (re-pointed) |
| 8 | Modal mounts inside the themed subtree, resolves tokens, follows a theme switch | Covered | story-3bf94bd4 | AC-1037 |
| 9 | One self-hosted application typeface through the shell's own font token | Covered | story-3bf94bd4 | AC-1038 |
| 10 | Fields modal sheds heading + label column, keeping both accessible names; error/message keep the heading | Covered | story-3bf94bd4 | AC-1039 |
| 11 | Control mirrors the page's typography and the paint stack *in paint order* (not an ancestor walk) | Covered | story-3bf94bd4 | AC-1040 |
| 12 | The site's `@font-face` rules cross into the parent document, and only those | Covered | story-3bf94bd4 | AC-1041 |
| 13 | Rendered size clamped to an editing range while other axes are exact | Covered | story-3bf94bd4 | AC-1042 |
| 14 | Panel sized for copy; tall resizable area; Save always reachable | Covered | story-3bf94bd4 | AC-1043 |
| 15 | A lone field opens in its control | Covered | story-3bf94bd4 | AC-1044 |
| 16 | A painted container carrying a background exposes one closed picker of the site's images, and nothing else of its paint | Covered | story-37a3921b | AC-1045 |
| 17 | Choosing a background moves one axis; every other axis and every asset byte survives | Covered | story-37a3921b | AC-1046 |
| 18 | The current handle is always among the options | Covered | story-37a3921b | AC-1047 |
| 19 | An off-list handle is refused at the field, whole-or-nothing, before the shared validator | Covered | story-37a3921b | AC-1048 |
| 20 | Paint but no background → empty field list (change never add; no empty option) | Covered | story-37a3921b | AC-1049; AC-981 and AC-1001 correctly sharpened to match |
| 21 | **Clicking a painted panel opens the background picker over the same transport; a rejected choice returns field-scoped with page and draft unchanged** | **Uncovered (inert)** | story-3bf94bd4 | **AC-1050 exists but is `pending` and has no UAT — see Gap 1** |
| 22 | `GET /api/ai/roles` — role and whether the assistant can run, without opening a session | Covered | story-a58a0974 | AC-1051 |
| 23 | `POST /api/ai/session {slug}` — the only route that turns a site into a session; returns transcript, ready, why not | Covered | story-a58a0974 | AC-1052 |
| 24 | A turn is addressed to a session, never a site | Covered | story-a58a0974 | AC-1053 |
| 25 | A turn that changes the site streams text + tool activity, ends in exactly one completion | Covered | story-a58a0974 | AC-1054 |
| 26 | An unminted session id is refused before any header is written | Covered | story-a58a0974 | AC-1055 |
| 27 | Two sites are two conversations over two tool surfaces | Covered | story-a58a0974 | AC-1056 |
| 28 | Transcripts persisted beside the store, replayed after restart; both tiers workspace-scoped | Covered | story-a58a0974 | AC-1057 |
| 29 | No filesystem tool; no operation naming a site | Covered | story-a58a0974 | AC-1058 |
| 30 | A refused tool call is correctable within the turn, draft byte-identical | Covered | story-a58a0974 | AC-1059 |
| 31 | Missing API key explained without losing the conversation | Covered | story-a58a0974 | AC-1060 |
| 32 | Mid-turn failure delivered inside the stream, followed by the completion | Covered | story-a58a0974 | AC-1061 |
| 33 | The secondary pane is a live conversation surface for the displayed site | Covered | story-7f437d57 | AC-1062 |
| 34 | Replay on first open and after reload | Covered | story-7f437d57 | AC-1063 |
| 35 | Site change changes the conversation; exactly one site selector in the workspace | Covered | story-7f437d57 | AC-1064 |
| 36 | A sent message goes to the conversation on screen; reply arrives progressively | Covered | story-7f437d57 | AC-1065 |
| 37 | Tool activity shown in the pane | Covered | story-7f437d57 | AC-1066 — asserted in the DOM activity area, not only in the stream |
| 38 | Composer draft keyed per session and survives a round trip | Covered | story-7f437d57 | AC-1067 |
| 39 | Unavailable assistant / unreachable origin each explained in the pane | Covered | story-7f437d57 | AC-1068, AC-1069 |
| 40 | Fast site switching lands on the site last chosen | Covered | story-7f437d57 | AC-1070; stated as outcome not mechanism, correctly, since REQ-127 removed the generation token |
| 41 | Declaration + grant validate before anything runs | Covered | story-93905de4 | AC-1071 — run through the framework's own standalone validator, not a local re-read |
| 42 | The surface carries its own version, distinct from the format version | Covered | story-93905de4 | AC-1072 — read from the shipped JSON so the two cannot drift |
| 43 | Everything callable is declared and vice versa; the write set is closed and enumerated | Covered | story-93905de4 | AC-1073 — enumerates all 12 writes, so a new write cannot appear unnoticed |
| 44 | An operation can be declared and withheld: not offered, not documented, refused as a capability decision | Covered | story-93905de4 | AC-1074 |
| 45 | A read-only grant cannot reach a write | Covered | story-93905de4 | AC-1075 |
| 46 | Arguments validated before any value reaches the write path | Covered | story-93905de4 | AC-1076 |
| 47 | Refusal names declared code + meaning; draft byte-identical | Covered | story-93905de4 | AC-1077 |
| 48 | Reads marked untrusted; the marking explained; own confirmations unmarked | Covered | story-93905de4 | AC-1078 |
| 49 | Every call audited — operation, effect, arguments, decision, rule, outcome | Covered | story-93905de4 | AC-1079 |
| 50 | The manual is a projection of declaration + grant | Covered | story-93905de4 | AC-1080 |
| 51 | Addressing contract stated once; every address-taking operation takes the same kind | Covered | story-93905de4 | AC-1081 |
| 52 | One write path — the surface is a third caller and gains no bypass | Covered | story-93905de4 | AC-1082 |
| 53 | The page map emits every node, including nodes with no editable field | Covered | story-189fc1ac | AC-1083 — compared against an independent walk of the seed |
| 54 | Labels recognisable; no styling in the map | Covered | story-189fc1ac | AC-1084 |
| 55 | `get_l1` returns the subtree verbatim — refs stay refs, tracks stay tracks | Covered | story-189fc1ac | AC-1085 |
| 56 | Read → write back unchanged is accepted (not merely "unchanged") | Covered | story-189fc1ac | AC-1086 |
| 57 | Replace at an address replaces the whole subtree, siblings untouched | Covered | story-189fc1ac | AC-1087 |
| 58 | Add/remove expressed as group replacement, and the result renders | Covered | story-189fc1ac | AC-1088 |
| 59 | The relocated security guarantee: markup / stylesheet / `javascript:` / undeclared kind / mistyped axis all refused whole | Covered | story-189fc1ac | AC-1089 |
| 60 | A refusal tells the caller nothing was written and what to do | Covered | story-189fc1ac | AC-1090 — asserts the mitigation, not the upstream fix |
| 61 | A bad address is refused as not-found, writing nothing | Covered | story-189fc1ac | AC-1091 |
| 62 | Exactly one way to change a page (`get_copy`/`set_copy` retired); every offered op is declared | Covered | story-189fc1ac | AC-1092 |
| 63 | The operator's click-to-edit form still opens/saves on AI-authored elements, styling intact | Covered | story-189fc1ac | AC-1093, AC-1094 — over the real `/api/copy` transport |
| 64 | `set_config` takes a typed object + optional group; merges at every depth, lists/scalars replace | Covered | story-b3de4571 | AC-1095 |
| 65 | Omitting the group writes at the top level; a non-object top-level write refused | Covered | story-b3de4571 | AC-1096 |
| 66 | A settings value the schema rejects is refused whole | Covered | story-b3de4571 | AC-1097 |
| 67 | The behaviour catalog is listable and closed, with required config and default-look flag | Covered | story-b3de4571 | AC-1098 |
| 68 | A component is added from config alone and arrives rendering (L2 preset by behaviour id) | Covered | story-b3de4571 | AC-1099 |
| 69 | Instance config validated against the behaviour's own contract before the site validator | Covered | story-b3de4571 | AC-1100 |
| 70 | Reconfigure merges; removal leaves the mount seam | Covered | story-b3de4571 | AC-1101 |
| 71 | `describe_page` reports instances with their config | Covered | story-b3de4571 | AC-1102 |
| 72 | Page SEO written on add, merged on update, present in the rendered document | Covered | story-b3de4571 | AC-1103 |
| 73 | A composed drawing becomes an ordinary site image and ships into the render unaltered | Covered | story-b3de4571 | AC-1104 |
| 74 | Hostile SVG refused whole, no byte written, no registry change | Covered | story-b3de4571 | AC-1105 |
| 75 | The validator is closed by construction; size and element counts bounded | Covered | story-b3de4571 | AC-1106 |
| 76 | Generated filename from a plain name; conflict unless replace | Covered | story-b3de4571 | AC-1107 |
| 77 | Drawing is its own grantable capability, separate from managing supplied files | Covered | story-b3de4571 | AC-1108 |
| 78 | All four capabilities reachable from the command line | Covered | story-b3de4571 | AC-1109 |

## Ungrounded Stories

None. Every story claim traces to the intent body or to the code, and the four new stories each carry an explicit "divergences recorded rather than absorbed" section.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Builder origin — request-time channel rendering | story-e674c60a (+AC-1031..1036, AC-973 modified), story-37a3921b (AC-992, AC-1026 modified) | OK |
| 2. Click-to-edit modal — themed chrome, page-faithful box | story-3bf94bd4 (+AC-1037..1044) | OK (8 added vs 7 planned; the extra AC-1041 for `@font-face` crossing is grounded in REQ-121's own text) |
| 3. Structured edit — a container's background image | story-37a3921b (+AC-1045..1049) **and** story-3bf94bd4 (+AC-1050) | **PARTIAL — the story-3bf94bd4 half is inert** |
| 4. Assistant session host | story-a58a0974 (AC-1051..1061) | OK |
| 5. Assistant panel in the builder split | story-7f437d57 (AC-1062..1070) | OK |
| 6. The control surface, declared as a governed API | story-93905de4 (AC-1071..1082) | OK |
| 7. Authoring the element tree | story-189fc1ac (AC-1083..1094) | OK |
| 8. Authoring beyond the element tree | story-b3de4571 (AC-1095..1109) | OK |

## Gaps

### Gap 1 (blocking) — AC-1050 landed inert: `pending` status, zero UAT evidence

**Ticket**: `acceptance_criterion-170a171f` (AC-1050), story-3bf94bd4 — *"Clicking a painted panel opens the background picker over the same transport as a copy or image edit, and a rejected choice comes back field-scoped"*.

**Evidence of the defect**:
- `xgd ticket get acceptance_criterion-170a171f` → `Status: pending`. Every other criterion added or modified by this reconciliation (AC-1031 through AC-1049 and AC-1051 through AC-1109) is `active`. AC-1050 is the sole exception.
- `grep -rhoE "test_UAT_AC[0-9]+" tests/` yields an unbroken run 1031…1049, **1050 absent**, 1051…1109. No file anywhere in `tests/` defines `test_UAT_AC1050_*`.
- `tests/reconciliation-copy-edit-background-selection.test.ts` contains exactly five UATs — AC-1045 through AC-1049, all story-37a3921b's. The story-3bf94bd4 half of plan item 3 produced a ticket and no evidence.
- Plan item 3's `acceptance_criteria_changes.add` list, and the item-3 story-generation report (`report-b9dad49c`), both explicitly name this criterion as a deliverable against story-3bf94bd4.

**Why it is material, not a technicality**: the behaviour is real, shipped, and user-visible — REQ-128 built it and evidenced it free-coded with three origin UATs (`the_modal_reads_its_background_picker_from_the_same_copy_transport`, `saving_a_background_choice_rerenders_both_channels`, `a_rejected_background_comes_back_as_a_field_scoped_400`). story-3bf94bd4's body asserts it in prose in three places (the loop summary, "kind-agnosticism proved twice", and "a background handle is not dressed as copy"). A developer reading the matrix would reasonably conclude the gesture reaching a painted panel's background picker is proven behaviour under regression. It is not: a `pending` criterion with no UAT participates in nothing. The write-path half is fully covered by AC-1045..1049 on story-37a3921b, and the dead-end case by the sharpened AC-1001, so what is unevidenced is precisely the gesture claim item 3 said story-3bf94bd4 must gain — that a click resolving to a painted panel opens the same one form with that picker pre-filled, and that a refused choice returns field-scoped with the form still open and the page and draft unchanged.

**Remediation (either is acceptable)**:
1. Write `test_UAT_AC1050_*` in `tests/reconciliation-copy-edit-background-selection.test.ts` (its `startBuilder` origin harness is already in the file) or in the gesture suite, following the criterion's own Verification section — resolve a click onto a painted panel carrying a background, assert one required closed-option field pre-filled from the draft with the current handle among the options and no other control, save a different choice and assert the displayed page repaints and stays editable, submit a refused choice and assert a field-scoped refusal with the form still open and page + draft byte-unchanged — then set AC-1050 to `active`.
2. Or, if the reconciler judges the gesture claim already carried by AC-1028 (image picker opens) plus AC-999 (refused edit keeps the form open) plus AC-1001 (painted panel with no background is a dead end), then say so in story-3bf94bd4's Technical Context and **remove** AC-1050 rather than leaving an inert criterion in the matrix.

Option 1 is preferred: AC-1028 is scoped to image regions and AC-999 to copy refusals, so neither states the painted-panel case, and item 3's whole argument is that kind-agnosticism was proved a *second* time.

## Judgment Calls

- **Workflow quality reports were not treated as evidence.** All scoped-quality reports for this run read `0 tests, 0 failed` (`report-f5c914b2` and predecessors: `"suites": {}`). I ran the eight reconciliation suites directly rather than inferring pass state; 78/78 pass.
- **Evidence quality spot-checked against the source-inspection anti-pattern, and it holds.** The one place a shipped file is read as text — `reconciliation-assistant-control-surface.test.ts:178` reading `l1-surface.json` — is reading the *declaration under test*, which is data, and it is cross-checked against the runtime-imported constant so the two cannot drift. Everywhere else the file reads are of draft definitions, rendered HTML and audit logs, i.e. runtime observations. AC-1071 validates through the framework's own standalone validator rather than a local re-read of the format; AC-1032 compares actual bytes from both paths rather than asserting which function was called; AC-1073 enumerates the closed write set so a new write fails the test.
- **Mocking boundaries are acceptable.** Two doubles exist: the Anthropic client, injected at the library's own `client` seam (external API), and the chat transport in the jsdom pane suite (HTTP, which jsdom cannot serve — and the routes themselves are proven over real HTTP in `reconciliation-assistant-conversation.test.ts` against a real `startBuilder`). No repository-owned logic is mocked; `mountBuilder`, `webui-chat`, the Toolbox, `edit.ts` and the renderer are all real.
- **REQ-119's Worker deviation checked specifically and found correctly handled** — this was the highest-risk absorption candidate in the bundle, since silently claiming the edge Worker renders at request time would have put a false capability in the matrix. story-e674c60a names the deviation, the reason, and what remains.
- **Item 2 delivering 8 ACs against 7 planned is not a finding.** The extra criterion (AC-1041, the site's `@font-face` rules crossing into the parent document) is REQ-121 behaviour item 5 stated verbatim in the intent, and it has a passing UAT.
- **The `presetSlots` / L2 uncertainty the plan flagged is carried, not resolved** — story-b3de4571 records it as "flagged for a future reconciliation of CAP-70", which is the right disposition for this run.
- **Trivial omissions accepted**: `index.html` being an alias of the home page's bytes rather than a second render (internal, and AC-1032's byte equality covers the observable); the per-turn reminder never being written to the transcript (internal priming detail, with AC-1056's "each transcript holds only its own turns" covering the observable); REQ-121's CTA hover/focus/disabled states (a natural consequence of AC-1037's theming).

## Verdict

**FAIL** — on one specific, cheaply fixable gap.

The intent fidelity of this reconciliation is otherwise high: nine declared supersessions, self-amendments and shipped-vs-stated divergences are each recorded in a story rather than absorbed, no story invents behaviour, and 77 of the 78 behaviours in the inventory carry passing UAT evidence that a broken implementation could not satisfy.

The single blocker is that plan item 3's story-3bf94bd4 deliverable landed inert: **AC-1050 exists with `status: pending` and has no `test_UAT_AC1050_*` anywhere in `tests/`**, making it the only criterion in this reconciliation that documents a shipped, user-visible behaviour without evidence. Fix loop should either evidence and activate it, or remove it and state in story-3bf94bd4 which existing criteria carry the claim.
