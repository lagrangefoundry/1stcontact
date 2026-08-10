---
uid: report-a6267f8b
id: REPORT-1799
type: report
title: 'Sync-main review: reconcile-BUNDLE-17'
created_by: xgd
created_at: '2026-08-10T11:00:21.302963+00:00'
updated_at: '2026-08-10T11:00:21.302963+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: sync_main_review
  subject_uid: reconcile-BUNDLE-17
---

```json
{
  "findings": [
    {
      "risk": "MEDIUM",
      "file": "tools/generate/src/cli/builder.ts",
      "description": "The file contains a literal NUL byte (offset 22242, line 523) used raw as a Map-key separator: `const key = `${ctx.cwd}\\0${ctx.root}`` written as an actual U+0000 character rather than the `\\0` escape. Consequence: `file(1)` reports the source as `data`, and git/grep/ripgrep classify it as binary — `git diff` emits `Binary files differ` instead of a hunk-level patch for this file. That degrades every line-oriented safety net that runs over it, including the strict_advance_gate's check that main-added lines survive a rebase, and hides future conflicts in this file from human review. Introduced by branch commit e75dbc53b (`feat(builder): render draft and edit channels at request time`), not by the rebase, and functionally correct today — hence MEDIUM, not a regression. Remediation: replace the raw byte with the `\\0` escape sequence."
    },
    {
      "risk": "LOW",
      "file": "tests/reconciliation-l1-navigation.test.ts",
      "description": "test_UAT_AC845_declared_identifier_is_an_in_page_navigation_target failed once during the first full-suite run (`expected '' to be '#how'` at line 475 — `win.location.hash` on line 474 asserted correctly, only the async `hashchange` listener had not fired after `await settle()`). It passed in isolation and passed on a full-suite re-run (1419 passed / 0 failed). The file is byte-identical to main (`git diff main..HEAD` empty) and its only production import is `packages/framework/src/index`, whose branch diff is purely additive (two REQ-130 re-exports). This is a pre-existing load-dependent jsdom event-timing flake, not a rebase-induced regression."
    },
    {
      "risk": "OK",
      "file": "tools/generate/src/cli/webui.ts",
      "description": "Checked for revert of main's fix 9b88f0317 (resolve shared component store from the repo's main checkout). `mainCheckout()`/`walkOrigin()` and `createRequire(path.join(mainCheckout(walkOrigin()), 'package.json'))` are intact; the branch builds on top of them (adds `sharedModuleUrl`, extends WEBUI_PACKAGES). No revert."
    },
    {
      "risk": "OK",
      "file": "apps/control-app/src/builder/editor.js",
      "description": "Checked for revert of main's fixes 9fcba993c (fieldless modal close) and 69f06debd (refuse unresolvable address). Both survive verbatim: `let fields = null` with its TDZ rationale comment at line 232 and `fields?.destroy()` at 235; the `if (!target.page)` page-stamp guard at line 93. Their main-side UATs (req117-modal-dismiss, req117-stale-edit-render) still exist and pass."
    },
    {
      "risk": "OK",
      "file": "tools/generate/src/cli/builder.ts",
      "description": "The branch removes main's static-render save path (`cmdRender(slug, {edit:true})` + `{edit:false}`) added by main fix 9fe83e746. This is not a revert: main's own commit message states 'DOC-28 §12 T5 deletes this static-serving path entirely', and the branch's REQ-119 request-time render (e75dbc53b) is that replacement. The behaviour main protected is preserved and re-proven — main's unmodified UAT test_UAT_FC_REQ-117_one_save_rerenders_the_view_channel_too passes against the new path, as does the no-store assertion (the bare directive was generalised into the shared `NO_STORE` constant in serve.ts:113)."
    },
    {
      "risk": "OK",
      "file": "tools/generate/src/cli/edit.ts",
      "description": "Diff-level line removals for `editConfigSet`, `imageHandles`, and `1c page update --title/--path` are signature evolutions, not deletions: `editConfigSet` remains (edit.ts:1162, now taking a structured value), `imageHandles` remains (edit.ts:1297, now gated on PICKER_KINDS rather than kind==='image'), and `page update` retains `--title`/`--path` with `--seo` added. All call sites (index.ts, ai/toolbox.ts) and tests resolve."
    },
    {
      "risk": "OK",
      "file": ".",
      "description": "Briefing '(deleted)' entries are not main-side deletions. merge-base(HEAD, main) == main HEAD (243b31ea7), so main is a strict ancestor and nothing on it was rewritten. Every path marked (deleted) — chat.js, page-style.js, l2/presets.ts, svg.ts, cli/ai/*, cli/preview.ts, the REQ-119/121/122/126-130 test files, the woff2 fonts — was verified absent from main's entire history (`git log main -- <path>` empty, `git cat-file -e main:<path>` fails), i.e. they are branch additions that the briefing rendered from the main->branch direction. No resurrection of main-deleted code. No conflict markers in any tracked source file."
    },
    {
      "risk": "OK",
      "file": ".",
      "description": "Integration consistency verified by execution, not inspection: full suite green on re-run (200 files passed, 4 skipped; 1419 tests passed, 0 failed, 67 skipped), `pnpm -r build` clean, and `tsc --noEmit` clean for packages/framework, packages/site-schema and tools/generate (the three workspaces without a build script)."
    }
  ]
}
```
