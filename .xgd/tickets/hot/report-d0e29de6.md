---
uid: report-d0e29de6
id: REPORT-1667
type: report
title: Claude coding_green report
created_by: xgd
created_at: '2026-08-08T00:04:40.909720+00:00'
updated_at: '2026-08-08T00:04:40.909720+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: coding_green
  subject_uid: story-e674c60a
---

GREEN complete. All three upgraded ACs pass, no regressions, quality gate SUCCESS.

## What changed

The scope had **three** definition sites; it now has one. `WEBUI_SCOPE` in `webui.ts` is the sole declaration, `builder.ts` composes both import-map keys from it, and the two browser sources — which are served verbatim and can read no build-time value — are renamed in place as the declared, bounded exception, held in step by the AC-960 coupling UAT rather than trusted.

Per CLAUDE.md's no-legacy-modes rule, the old scope is deleted outright: no fallback resolution, no dual-scope detection, no `LEGACY_SCOPE` export. Verified — the declaration contains exactly one quoted scope literal.

**`index.html` was deleted rather than renamed.** This is the one place I diverged from the technical design, and I flagged it in RED. The design says to update its import-map keys; AC-960 and the story body say the scope in use appears as a literal *"nowhere else in the repository — not in a generated artifact checked in beside the generator."* Story body takes precedence. I confirmed nothing reads it: `/` is served by `chromeHtml()` (`builder.ts:162-163`), there is no `[assets]` binding in `wrangler.toml`, and no root astro config. A committed copy of the generator's output is itself a second definition site, so renaming it would have left the defect in place under a new name.

## Tests modified

One assertion, in `tests/bug32-webui-scope-rebrand.test.ts`. My RED enumeration self-check asserted the tracked-tree scan reaches `index.html` — the concrete proof that a hardcoded three-source-root scan was wrong. Deleting that file invalidated the anchor, so the check now asserts the property directly: the enumeration must reach files outside `tools/`, `apps/`, `packages/`. No behavioural assertion was weakened; the pre-upgrade tree still fails check (a) on the legacy literal.

## Verification

Smoke test through the real `1c builder` CLI, not just pytest: the served document's import map, the `app.js` bytes the browser actually receives, and the three component responses all agree under the new scope — which is the runtime-only coupling that no build or type check observes. Components return 200 with `no-store, must-revalidate`; a traversal escape returns 404.

Quality gate: **SUCCESS**, 1226 passed / 6 failed / 67 skipped. The 6 are the pre-existing set I confirmed by stash-and-rerun in RED (`reconciliation-copy-edit-gesture-modal` ×5, `req115-builder-composition::open_in_new_tab_matches_the_iframe_exactly` ×1) and match `quality.yaml` expectations.

No governance checklists exist in this project (only the technical design and TAS reports), confirming the design's finding; I applied DOC-2 and CLAUDE.md instead. DOC-2 is not engaged — this is build-time module resolution, with no instance data, render path, or new typed sink.

```
✓ GREEN Phase Complete
Story Type: upgrade
Code modified: yes
Tests modified: yes (one scaffolding assertion re-anchored; no assertion weakened)
Key files changed:
  tools/generate/src/cli/webui.ts      — WEBUI_SCOPE is the single definition; docstring names neither scope
  tools/generate/src/cli/builder.ts    — both chromeHtml() keys composed from WEBUI_SCOPE
  apps/control-app/src/builder/app.js  — bare specifiers renamed (declared exception)
  apps/control-app/src/builder/editor.js — bare specifier renamed (declared exception)
  index.html                           — deleted (stale generated artifact = second definition site)
  tests/bug32-webui-scope-rebrand.test.ts — enumeration self-check re-anchored
```
