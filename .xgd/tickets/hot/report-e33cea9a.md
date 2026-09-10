---
uid: report-e33cea9a
id: REPORT-3640
type: report
title: 'UAT Coverage: Palette Management: The Site''s Named Colours, Read, Edited
  & Guarded'
created_by: xgd
created_at: '2026-09-10T02:56:09.055402+00:00'
updated_at: '2026-09-10T02:56:09.055402+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-a0bba4ec
  violations: 0
  warnings: 5
  needs_review_count: 0
---

# UAT Coverage Assessment: Palette Management: The Site's Named Colours, Read, Edited & Guarded

**Result**: PASS
**AC verdicts**: 24 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 2 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

Both suites were executed this round rather than read alone:

- `tests/reconciliation-palette-popup-surface.test.ts` — **12 passed** (1.58 s).
- `tests/reconciliation-palette-management.test.ts` — **8 passed, 4 skipped**,
  file reported failed: the `describe('through the builder origin')` `beforeAll`
  calls `startBuilder` (`:492`) and the sandbox refuses the socket
  (`listen EPERM: operation not permitted 0.0.0.0`,
  `tools/generate/src/cli/builder.ts:363`) after a 120 s hook timeout. The four
  skipped tests are AC-1233, AC-1235, AC-1237, AC-1238 (finding 1).

## Cumulative Intent Considered

Both stories carry one `intent_uid` and neither the stories nor any AC records an
`updated_by` chain, so the ledger is short.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-19 (`bundle-77b28def`) | free_and_reconciled (merged at `b18b859`) | 2026-08-18 | Bundles REQ-133 + BUG-35 + REQ-131 + REQ-140 + REQ-139 + 4 more | YES |
| ↳ REQ-133 (`request-8467b1a3`, absorbed into BUNDLE-19) | free_and_reconciled | 2026-08-18 | The whole palette subject: `1c palette` as its own command group with `/api/palette` beside it; the census on one structural walk; the four writes with server-side guards; the popup that displays, picks and edits; free hex bounded to that surface; `get_palette` + a `ManagePalette` group on the AI surface. §8 decisions: rename in V1, continuous slider, **AC-12's re-render withdrawn**, slider shown in manage mode as a preview that writes nothing, the AI gets the whole surface | YES |
| ↳ REQ-137 / REQ-114 (dependencies, landed earlier) | landed | before REQ-133 | The colour model itself — entry = one colour, `shade` on the reference. Explicitly **out of scope** for CAP-98 (owned by the framework substrate capability) | YES (adjacent) |
| ↳ REQ-140 (absorbed into BUNDLE-19) | free_and_reconciled | 2026-08-18 | Page-editor colour; consumes REQ-133's pick mode. The segment-side colour field is out of scope here (CAP-98 body defers it to the copy-editing / in-page-editing capabilities) | YES (adjacent) |
| BUG-1306 (lagrangefoundry/xgd) | policy | 2026-08-31 | The impact-screen default rule cited by AC-1458's recorded reconciliation decision | YES (policy) |

No intent in the ledger retires behaviour this capability describes. The single
withdrawal *inside* REQ-133 — its original AC-12 re-render-on-write — is
correctly reflected in the matrix: no AC asserts a rebuild, AC-1238 asserts the
replacement (both draft-side channels render at request time) and AC-1249 asserts
the displayed frame being refreshed instead.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-113 (palette management) | REQ-133 §5, §6, §8, §9.5–9.14; BUG-1306 (policy) | aligned | Body matches intent, including the withdrawal of AC-12. Two implementation divergences are recorded *in the story's own Technical Context* as "flagged rather than absorbed" (findings 6a/6b) — recorded at reconciliation, not drift discovered here. `## Reconciliation Decisions` records the self-rename no-op, formalised as AC-1458 |
| STORY-114 (the palette popup) | REQ-133 §1, §3, §4, §5a, §7, §8, §9.1–9.4, §9.13 | aligned | Body matches intent and states the three implementation-time revisions as decisions. One note in Technical Context ("Evidence gap worth flagging") has since been answered by the UAT and now reads as an open gap it is not (finding 3) |

### AC → UAT map

STORY-113 — `tests/reconciliation-palette-management.test.ts`:

| AC | UAT | Verdict |
|---|---|---|
| AC-1229 read + census | `:207` | pass — counts 3/1/0, three positions in one family, two pages, palette-less site succeeds |
| AC-1230 change repaints every position | `:249` | pass — real render before/after, pages byte-unchanged, count reported, NOT_FOUND branch |
| AC-1231 add + three refusals | `:304` | pass — duplicate/malformed/alpha-carrying, each with draft bytes compared |
| AC-1232 remove at zero | `:349` | pass |
| AC-1233 remove in use refused | `:501` | pass in content — **no evidence in this sandbox** (finding 1) |
| AC-1234 rename is total | `:377` | pass — key order in place, zero old refs, shade+alpha preserved, render byte-identical |
| AC-1235 rename refusals | `:541` | pass in content — **no evidence in this sandbox** (finding 1) |
| AC-1236 one walk, one number | `:426` | pass — shown == reported == refs-in-files |
| AC-1237 origin parity, closed vocabulary, census on write | `:576` | pass in content — **no evidence in this sandbox** (finding 1) |
| AC-1238 no rebuild | `:651` | pass in content — **no evidence in this sandbox** (finding 1) |
| AC-1239 the assistant surface | `:675` | pass — real `createL1Toolbox` writes and refusals, exactly-one-group, ungranted session |
| AC-1458 self-rename no-op | `:451` | pass — succeeds, reports the real count, draft byte-unchanged |

STORY-114 — `tests/reconciliation-palette-popup-surface.test.ts` (all 12 executed and passing here; the origin is driven in process through the real `handleBuilderRequest` routing table, no socket):

| AC | UAT | Verdict |
|---|---|---|
| AC-1241 toolbar control, both channels | `:1226` | pass — real panel/toolbar/action spec; shipped-workspace half gated (finding 4) |
| AC-1242 swatch = name + colour + count | `:473` | pass — ordering wording in the AC is stale (finding 2) |
| AC-1243 empty palette invites | `:514` | pass — real palette-less site, no error region, first add produces a swatch |
| AC-1244 continuous position control | `:565` | pass — 2000 positions, readout == `resolveL1Color` **and** == bytes in the rendered page, focus retained |
| AC-1245 manage-mode slider writes nothing | `:631` | pass — whole draft compared byte-for-byte |
| AC-1246 a pick is a reference | `:664` | pass — `{ref, shade}` off-centre, `{ref}` with no key at centre, no hex/alpha under any key |
| AC-1247 every exit answers once | `:720` | pass — three routes, re-taken routes inert, re-entrant Escape, deadline on the opener |
| AC-1248 opened over a held reference | `:811` | pass — including the stale-entry case |
| AC-1249 typing a colour, the page follows | `:864` | pass — mirror both ways, `#rgb` the native control cannot hold, 3 uses repainted, served bytes repainted; workspace-refresh half gated (finding 4) |
| AC-1250 redraw from the returned census | `:1005` | pass — add/remove/rename each checked against a fresh CLI read |
| AC-1251 the store's own words | `:1087` | pass — refusal text taken *from the store*, plus a direct stale-client post |
| AC-1252 the surface states the cost | `:1159` | pass — swatch count == rename note == completed-rename report; the disabled control proven not to be the rule |

**Evidence aesthetic.** No AC is covered only by a structural/AST check and none
is over-mocked. The single mock in either suite is `chatTransport.openSession`
(an external boundary, and not what any of these criteria is about) and one
`contentWindow` spy forced by jsdom not navigating iframes. The colour arithmetic
is *imported* from the module the renderer resolves through rather than
re-implemented; every "changes no state" claim compares `site.json` and every
page byte for byte.

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | uat | AC-1233, AC-1235, AC-1237, AC-1238 | uat-edit | All four sit in `describe('through the builder origin')` (`tests/reconciliation-palette-management.test.ts:480`), whose `beforeAll` binds a socket (`:492`). Confirmed this run: `listen EPERM` → 8 passed, **4 skipped**, file failed after 120 s. In the project's own sandbox these four produce no evidence — and they are the four whose subject is the guards being enforced *where the write happens, against a client with no check at all*. The sibling suite already solves this: `tests/reconciliation-palette-popup-surface.test.ts:219-269` drives the same routing table in process via `handleBuilderRequest`, and its origin assertions all pass here | Re-point the four at an `originFetchFor`-style in-process helper over `handleBuilderRequest`, keeping every assertion as written. Only the socket goes; guards, envelopes and request-time rendering are the same code |
| 2 | warning | ac | AC-1242 | ac-edit | The **Verification** says swatches are observed "in the palette's own order". They are not: a read sorts by name (`primary, spare, surface, text`) while the stored order is `primary, text, surface, spare`. The UAT correctly asserts the surface shows what the store handed it in the order handed (`:489`), so test and code agree and only the AC's wording is wrong. The criterion body is silent on order, so nothing load-bearing rests on it | Replace "in the palette's own order" with "in the order the census returns them (sorted by name)", or drop the clause. Stored-order preservation is AC-1234's claim and is asserted there |
| 3 | warning | story | STORY-114 | story-body-edit | Technical Context still carries "**Evidence gap worth flagging** — the current free-coded evidence drives the popup with its own callback and does not assert the refresh end-to-end". The UAT now does exactly that (`:929-1000`: real `mountBuilder`, the reload observed at the frame's `contentWindow` seam, the refetched page asserted repainted). It reads as an open gap that is closed | Restate in the past tense — the advice was followed — and note that the workspace half runs only where the `webui-*` components are installed (finding 4) |
| 4 | warning | uat | AC-1241, AC-1249 | — | The shipped-workspace halves (`:1297`, `:924`) are gated on `WEBUI_INSTALLED`, confirmed **false** in this checkout (no `@lagrangefoundry/webui-*` resolvable from here or any parent; the shared artifact store is populated out-of-band by `lagrange-framework`'s `bin/install`). Both call `unverified(...)` so the gap is reported rather than passing quietly, and each AC's non-gated half is asserted unconditionally against the real modules. This is the repo's documented discipline (`tests/support/webui-installed.ts`), not matrix drift | None required. If the store is ever reachable in CI, these halves become the end-to-end evidence for both ACs |
| 5 | warning | uat | AC-1229 | uat-edit | The criterion says a palette-less site "answers with an empty set of entries **and a message saying so**". The UAT asserts `ok`, `exitCode 0` and `entries == []` (`:240-244`) but not the message. The load-bearing half (empty is a success, not an error) is covered; the wording half is not | Add one assertion on the read's own message for the palette-less site, or drop "and a message saying so" from the criterion |
| 6a | info | story | STORY-113 | — | Recorded divergence, already flagged in Technical Context: REQ-133 §6 says *every* write answers with the whole re-taken census; as implemented only the origin route does, while the CLI and the assistant return the operation's result and the affected entry's count. AC-1237 asserts the full census where it is observable (the origin) and the operation's own result at the other two callers, and the story names the mismatch explicitly rather than absorbing it | None here. If the strict reading is wanted, it is a code change (CLI + toolbox write responses), not a matrix edit — raise as intent work, not as coverage |
| 6b | info | story | STORY-113 | — | Recorded divergence, already flagged: the assistant meets the same guard, the same `CONFLICT` code and the same byte-unchanged draft, but not the store's *sentence* — the toolbox renders refusals from the per-code text in the surface declaration. The count still reaches the model through `get_palette`, and the removal operation's declared description sends it there; AC-1239 asserts exactly this, at both routes. Closing the wording gap needs a change upstream of this repository | None here |
| 7 | info | story | STORY-113, STORY-114 | — | Both bodies claim free colour entry lives on this surface "and nowhere else". The positive half is evidenced (AC-1249). The negative half — that no segment field can express a hex (REQ-133 §9.13) — belongs to the in-page-editing capability, which CAP-98's own Out of scope defers to; STORY-100 (`capability-f753cecd`) carries the rule in its body. Not a gap for this capability to fill | None here. Worth confirming it is evidenced when CAP-f753cecd is assessed (its `uat_coverage` is currently `fail`) |

## Notes for the Editor

- **Nothing here blocks.** Zero violations, zero `needs_review`. Every active AC
  has exactly one substantive UAT that exercises its behaviour through real
  entry points, and both story bodies match cumulative intent.

- **Finding 1 is the one worth acting on**, and it is not an environment excuse:
  the same repository, in the same sandbox, already reaches the same routing
  table without a socket, and the file that does so documents why — "the
  difference between 'the guards hold' and 'we could not ask'". As it stands the
  capability's load-bearing claim (the guards are the store's, enforced against a
  client with no check at all) is the part that reports nothing on a developer
  machine, and the suite spends 121 s saying so. Two of the four are corroborated
  in process by the popup suite (AC-1233's refusal naming the count, `:1213`;
  AC-1238's channel served repainted with no rebuild, `:916`); **AC-1235 and
  AC-1237 are corroborated nowhere.**

- **Findings 2, 3 and 5 are one cheap pass** — a stale verification clause, a
  note to put in the past tense, and one missing assertion. None changes a
  verdict.

- **Preserve three patterns if these files are edited**: the colour arithmetic is
  imported from the renderer's own module rather than re-implemented; AC-1251
  takes the expected refusal text from the store instead of hard-coding a copy;
  and every "changes no state" claim compares the whole draft byte for byte.

- **Housekeeping**: AC-1458 still carries `status: pending` while the other 23
  ACs are `active`. It is a real, decided, evidenced criterion (its
  `## Reconciliation Decisions` entry records the auto-default of 2026-08-31), so
  the status looks like a creation artifact rather than intent. Worth normalising
  to `active` so status-filtered passes do not skip it.
