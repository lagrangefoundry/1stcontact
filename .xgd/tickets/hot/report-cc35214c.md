---
uid: report-cc35214c
id: REPORT-4269
type: report
title: 'Code Review: bundle-8e1807f6'
created_by: xgd
created_at: '2026-09-14T10:15:22.124630+00:00'
updated_at: '2026-09-14T10:15:22.124630+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: code_review
  subject_uid: bundle-8e1807f6
  anchor_uid: bundle-8e1807f6
---

# Code Review

**Result**: PASS

## Summary

The bundle ports capture-bundle I/O behind a new `ReferenceStore` port (REQ-155), replaces `sharp` with an in-repo PNG codec so the fidelity path can run in workerd (REQ-156), moves the chat transcript from R2 to the ticket store and adds a per-turn knowledge delta (REQ-160), repairs markdown ingest/rendering (BUG-41, BUG-42), adds an inline document reader to the Library (REQ-172), reloads the preview frame on assistant writes (BUG-43), and clears the suite/install breakage (BUG-40). The code is unusually well structured and documented, every new seam is wired into a real caller, and the CLI runs clean against the new codec. No critical issues found.

## Quality Gates

| Gate | Report | Assessor verification |
|---|---|---|
| Lint | success, 0 errors / 0 warnings (report-dddaaf20) | — |
| Build | success — but the body reads `No tsconfig.json - type-check skipped (JS-only project)` | The repo is TypeScript (`tsconfig.base.json` + per-package configs); the detector looked for a root `tsconfig.json` only, so no type-check actually ran |
| Tests | `Scoped quality: pass (0 tests, 0 failed)`, `suites: {}` | Vacuous - no suite executed |
| Coverage | not reported | — |

No gate FAILS, but the report is empty of test evidence, so I ran the suites directly:

- **Bundle UATs, node project**: `test_UAT_FC_REQ-155_reference_store`, `REQ-156_png_codec`, `REQ-160_delta_channel`, `BUG-41_markdown_material`, `BUG-43_preview_follows_the_assistant`, `REQ-172_library_document_preview` -> **6 files / 76 tests, all pass**.
- **New reconciliation suites**: 5 of 7 fully pass (`1c-crop-offline-verb`, `in-repo-png-codec`, `library-reader`, `builder-markdown-readiness`, `assistant-turn-change-signal`, `assistant-arrival-notice-budget`). `reconciliation-reference-bundle-storage` is 14/15 - its one failure is `test_UAT_AC1775_..._still_really_navigates`, which starts a local server and dies on `listen EPERM: 127.0.0.1`.
- **All changed node test files (61)**: 47 files / 366 tests pass. Every one of the 13 failing files traces to the same two sandbox denials - `Error: listen EPERM 127.0.0.1` (`serve.ts:42`) or `no launchable browser`. None of the failures reference code this bundle touched.
- **Workers project**: cannot run in this sandbox at all - miniflare binds a port and is denied. `REQ-155/156/172/BUG-41/BUG-43` workers UATs are therefore **unverified here** (they are present and well-formed; see Issues).

## External Interface Accessibility

New entry points wired in: **yes**, no gaps.

| New surface | Wired at |
|---|---|
| `ReferenceStore` port + fs/memory/R2 adapters | re-exported from `tools/generate/src/store/index.ts:110-138`; fs adapter constructed by the CLI at `tools/generate/src/cli/index.ts:857` |
| async `cmdRepro` / `cmdRefold` / `cmdL1Gate` / `cmdResponsiveDiff` | awaited in the dispatcher, `cli/index.ts:877,915,935,1200` |
| PNG codec | exported from the CLI barrel `cli/index.ts:185`; consumed by `perceptual.ts:66-96`, `aligned-crops.ts:150-178` |
| `perceptual-core` | re-exported through `perceptual.ts` so existing importers are unchanged |
| `sessionKnowledgeFor` | composed in `router.ts:145`, passed to `workerHost` |
| `TicketSessionArchive` + `delta` seam | `ai.ts:185,203` -> `host-core.ts` `HostDeps.delta` -> `reminderFor` -> `caretakerReminder` |
| `SITE_CHANGED` stream event | emitted `host-core.ts` `streamPrompt`; consumed `chat.js` `watchForWrites`; acted on `app.js` `onSiteChanged` |
| `mountReader` / `readerKind` | mounted by `library.js` `preview()`; modal host supplied by `app.js` `getModalHost` |
| `content_type` / `kb_cursor` ticket fields | declared in `tickets.ts` MATERIAL_FIELDS and the merged `chat` schema; written in `material.ts` `ingest`, read in `rowOf` |

`r2ReferenceStore` has no production caller yet - only the contract suites. That is the cloud half REQ-155 delivers ahead of the capture-in-workerd wiring it exists for, not a dead module; noted as a warning rather than a gap.

## Code Quality

| File | Finding | Severity |
|------|---------|----------|
| `tools/generate/src/cli/index.ts:476` | Help text still lists `crop` among the commands that "check the installed tree ... and refuse with exit 6". REQ-156 removed `crop` from `COMMAND_DEPS` (`preflight.ts:70-76`), so the user-facing help now states something false. | Warning |
| `tools/generate/src/cli/png.ts:192-215` | `through()` starts `pump` as a detached promise and only awaits it after the reader reaches `done`. If the readable side errors - a well-formed container with a garbled DEFLATE payload - `through` rejects via `reader.read()` and `pump` is left unhandled, which Node treats as a fatal unhandled rejection. The error also surfaces as a raw `TypeError` rather than `PngCorruptError`. Truncation is caught earlier by the IEND check, so this is a narrow window. | Warning |
| `tools/generate/src/cli/png.ts:68-74` | `PngCorruptError`'s doc says it covers "mis-CRC'd" input, but `decodePng` skips every chunk CRC (`off = start + len + 4`) and never verifies one. Doc overstates the guarantee. | Minor |
| `apps/control-app/src/builder/library.js:129-148` | `getModalHost` JSDoc says it "Defaults to `document.body`"; the code defaults to `() => null` and `modal.js:51` is what maps null to `document.body`. Behaviour is right, the doc points at the wrong line. | Minor |
| `tools/generate/src/cli/perceptual.ts:182` | Comment says the image layer "still takes a path until [[REQ-156]]" - REQ-156 landed in this same bundle. | Minor |
| `tools/generate/src/cli/index.ts:856` | `global.cwd ?? process.cwd()` - `global` is only ever `{ sandbox }` (line 502), so the `.cwd` arm is unreachable. Pre-existing shape, carried forward. | Minor |
| `tools/generate/src/cli/repro.ts:222` | `copiedAssets` changed from "the assets directory exists" to "at least one asset key was listed". More accurate; flagged only because it is a silent semantic change in a returned field. | Minor |

Positives worth recording: no `node:` import survives in `capture/bundle.ts` or `perceptual-core.ts`/`png.ts`, which is the load-bearing claim of both REQ-155 and REQ-156; the three store adapters are held to one shared contract (`tests/support/reference-store-contract.ts`, `reference-bundle-contract.ts`) rather than three hand-agreed suites; no `vi.mock` appears anywhere in the 97 changed test files, so the thin-mock rule holds; and no TODO, debug or commented-out code was introduced in any production file.

Security-relevant reads, checked against the structured-only policy: `reader.js` writes HTML in exactly one place and only what `renderSafe` returns (`reader.js:187`), plain text goes through `textContent`/`<pre>`, and the `<iframe>` path is gated to `application/pdf` alone - `readerKind` routes `text/html` to the text renderer, so no client-supplied HTML reaches a same-origin frame. `library.js` `paintDescription` routes LLM-written descriptions through the same `renderSafe` seam. `r2-reference-store.ts` binds the tenant prefix into the handle and reuses the existing `UnknownTenantError` registry check rather than inventing a second barrier.

## Checklist Compliance

No architecture, security or design checklist reports exist for this anchor (all three queries returned empty). Sections omitted.

## Smoke Test

Entry points tested:

- `./bin/1c help` - loads and prints the full command list. This is the meaningful check that removing `sharp` and adding the store/codec imports did not break the CLI module graph.
- `./bin/1c crop tests/fixtures/png/rgba-all-filters.png --box 2,2,8,8 --out <tmp>` - `Cropped ... @ 2,2 8x8`, 130-byte PNG written. The REQ-156 codec end-to-end through the verb whose only dependency it replaced.

Worker HTTP endpoints were not smoke-tested: the sandbox denies the port bind miniflare/wrangler needs.

## Issues Found

**Critical (must fix)**:
- None.

**Warnings (should fix)**:
- `cli/index.ts:476` - help text still names `crop` as a preflight-gated command after REQ-156 ungated it.
- `png.ts` `through()` - detached `pump` promise can become an unhandled rejection when the decompression stream errors; a corrupt IDAT also escapes as a raw `TypeError` instead of `PngCorruptError`.
- `png.ts` `PngCorruptError` doc claims CRC validation that `decodePng` does not perform.
- The workers-project UATs for REQ-155/156/172 and BUG-41/43 could not be executed in this environment (miniflare cannot bind a port). They are present, well-formed and import the real modules, but this review carries no execution evidence for them.
- The quality report backing this anchor is vacuous - 0 tests, empty `suites`, and a build step that skipped type-checking on a false "JS-only project" detection. That is an XGD tooling matter rather than a defect in this diff, but it means the gate recorded `pass` without exercising anything.
