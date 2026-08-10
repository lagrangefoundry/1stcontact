---
uid: report-6869af7f
id: REPORT-1792
type: report
title: 'Code Review: bundle-e59210c5'
created_by: xgd
created_at: '2026-08-10T10:32:31.336278+00:00'
updated_at: '2026-08-10T10:32:31.336278+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: code_review
  subject_uid: bundle-e59210c5
  anchor_uid: bundle-e59210c5
---

# Code Review

**Result**: FAIL

## Summary

Nine free-coded commits (REQ-119/121/122/126/127/128/129/130 + a webui scope fix) land request-time draft/edit rendering, an AI control surface over the structured-edit commands, a live chat pane, background-image selection, and a generated-SVG asset channel. The engineering is of a high standard — `renderSiteFiles` is a genuine single render with `renderSite` reduced to a writer over it, the AI surface is declared as data and correctly withholds `Publish` and `ManageAssets`, and every new entry point is wired and works when invoked. Two defects block: the new SVG content validator does not enforce the invariant it documents in a model-reachable sink, and two production source files contain raw NUL bytes that make them binary to `git diff` and unmergeable textually.

## Quality Gates

Verified by execution in this worktree, **not** taken from the scoped quality report — that report (`report-93aad770`) records `"suites": {}` / `0 tests`, so it is not evidence of anything.

| Gate | Command | Result |
|---|---|---|
| Tests | `npx vitest run` | **1418 passed, 67 skipped, 0 failed** (204 files) |
| Build | `pnpm -r build` | **pass** (control-app + public-site `tsc --noEmit`) |
| Typecheck | `pnpm -r typecheck` | **pass** (site-schema, framework, generate) |
| Lint | report `report-93aad770` | 0 errors, 0 warnings |

The 67 skips are the pre-existing `WEBUI_INSTALLED` / Astro gating, not new. I checked specifically that the gated new suites are **not** inert here: `test_UAT_FC_REQ-122_chat_panel`, `test_UAT_FC_REQ-127_session_panel`, `reconciliation-builder-assistant-pane` and `req121-copy-modal-elegance` ran live — 28 passed, 0 skipped.

Note: `npx tsc -p tsconfig.base.json --noEmit` over the whole tree reports errors, but that is not a configured project gate (the base config has no `include`, and pulls in `.js`-importing test files and browser-context `page.evaluate` bodies). The configured gates all pass. Not counted against this bundle.

## External Interface Accessibility

All new surfaces are wired **and were invoked**:

| Surface | Wiring | Evidence |
|---|---|---|
| `1c asset write` | `cli/index.ts:1234` dispatch + help | smoke-tested, wrote `wordmark.svg`, refused a `<script>` payload |
| `1c module add\|set\|rm` | `cli/index.ts:1148-1176` + `case 'module'` at :1098 | smoke-tested; returns a proper `SCHEMA_INVALID` on a missing slot, not a trace |
| `1c behavior list` | `cli/index.ts:1146` + `case 'behavior'` at :1099 | smoke-tested, returns the contact-form/carousel catalog |
| `/api/ai/roles\|session\|prompt` | `cli/builder.ts:302-330` | routed in `handleBuilderRequest` |
| `PreviewRenderer`, `fsDraftStore` | `cli/index.ts:91-92` | re-exported from the package entry |
| `chat.js`, `config.js`, `page-style.js` | `app.js:3-4`, `editor.js:3` | imported, not dead |
| control-app worker / wrangler | `apps/control-app/src/index.ts`, `wrangler.toml` | updated in step |

No gaps.

## Code Quality

| File | Finding | Severity |
|---|---|---|
| `packages/site-schema/src/svg.ts:332-337` | The attribute-value entity guard inspects only the substring beginning at the **first** `&`, with an **unanchored** regex. Any single allowed entity anywhere in the value satisfies it, so arbitrary numeric character entities pass — defeating both stated invariants ("any character entity but the five XML names" refused; "no external reference"). See Issues Found. | **Critical** |
| `tools/generate/src/cli/ai/host.ts:145`, `tools/generate/src/cli/preview.ts:170` | Raw U+0000 bytes embedded in template literals. `git diff main..HEAD --numstat` reports `- -` for both files and the diffstat shows `Bin 0 -> 18310 bytes` / `Bin 0 -> 7389 bytes`. They cannot be diffed or three-way merged. | **Critical** |
| `packages/site-schema/src/svg.ts:318` | `const where = at + (attribute.index ?? 0)` — `attribute.index` is an offset into the extracted `attrs` string, not into `source`, so the reported byte offset points at the wrong place. Cosmetic (error messages only). | Warning |
| `tools/generate/src/render/render.ts:290-297` | `index.html` changed from a second `renderPage` call to a copy of `${home.slug}.html`. Correct — `homePage()` (`:199-201`) always returns a member of `site.pages`, so the map entry always exists and the non-null assertion is safe — and the comment justifies it. Noted, not a defect. | Info |

Otherwise clean: no debug code, no commented-out blocks, no TODO stubs, no magic values that belong in config, and one justified `eslint-disable` (`host.ts:62`, for the untyped runtime-loaded AI library, with the boundary narrowed by declared interfaces). Path handling is guarded in both new file-touching paths — `fsDraftStore.asset` (`preview.ts:100-107`) confines to the assets root, and `editAssetWrite` (`edit.ts:1423-1431`) allowlists the filename stem with no folders.

## Checklist Compliance

No architecture, security or design checklist reports exist for this anchor (`xgd ticket list --type report --filter fields.report_kind=<kind>` returns 0 items for all three). Sections omitted.

## Smoke Test

Entry points invoked live against a scratch site:

- `1c --help` — new command groups documented and rendered.
- `1c behavior list --json` — returns the contact-form (v4) and carousel (v3) catalog.
- `1c new studio` → `1c asset write studio wordmark --content <svg> --alt mark --json` → `{"ok":true,...,"src":"/assets/wordmark.svg"}`.
- `1c asset write studio evil --content '<svg ...><script>alert(1)</script></svg>'` → refused, `SCHEMA_INVALID`, with the operator-readable hint.
- `1c module add studio home hero-form contact-form --config {...}` → structured `SCHEMA_INVALID` naming the missing slot. Correct refusal, no stack trace.

No entry point crashed. The scratch site was removed; the worktree is clean (`git status --porcelain` empty).

## Issues Found

**Critical (must fix)**:

1. **`validateSvg` does not enforce its documented entity/reference invariant** — `packages/site-schema/src/svg.ts:332-337`.

   The check is:
   ```ts
   value.includes('&') && !ALLOWED_ENTITY_AT.test(value.slice(value.indexOf('&')))
   ```
   `ALLOWED_ENTITY_AT` is unanchored, and only the slice from the *first* `&` is tested. One leading allowed entity therefore vouches for every entity after it. Verified by executing the shipped validator:

   | Input | Expected | Actual |
   |---|---|---|
   | `<text x="&#x3c;">` | reject | reject ✓ |
   | `<text x="&amp;&#x3c;script&#x3e;">` | reject | **ACCEPT** |
   | `<rect fill="&amp;url&#x28;http://evil/x&#x29;"/>` | reject | **ACCEPT** |

   The third case is the substantive one: `&#x28;`/`&#x29;` are `(`/`)`, so the literal `(` is absent at validation time and the `REFERENCE_ATTRIBUTES` guard at `:328` never fires — the external reference materialises only after the browser decodes entities. That defeats the guard on all four reference attributes (`fill`, `stroke`, `clip-path`, `mask`).

   Scope, stated honestly: I could **not** construct stored XSS from this. The attribute allowlist at `:112-180` holds, `on*` is refused at `:320`, and entity decoding cannot break out of an attribute value. The realistic impact is external-reference smuggling in paint/mask/clip-path (largely blocked by modern browsers) plus the loss of the property the file is built on. That property is not decoration: this module exists because a model now authors the bytes, `write_image` is granted to the caretaker role (`ai/instances.json` → `DrawImages`), and the file's own docstring at `:18-31` claims closure by construction and explicit refusal of "any character entity but the five XML names". The claim is currently false, and DOC-2 makes closure-by-construction the load-bearing boundary rather than a nicety.

   The text-content path at `:256-265` already does this correctly — sticky `ALLOWED_ENTITY`, consuming one entity at a time, refusing anything else. The attribute path should apply the same rule to *every* `&` in the value.

2. **Two production source files are binary to git** — `tools/generate/src/cli/ai/host.ts:145`, `tools/generate/src/cli/preview.ts:170`.

   Both embed a literal U+0000 inside a template literal as a key separator:
   - `host.ts:145` — `` return `${ctx.cwd}<NUL>${ctx.root}<NUL>${slug}` ``
   - `preview.ts:170` — `` const key = `${slug}<NUL>${channel}` ``

   `git diff main..HEAD --numstat` returns `-	-` for both; the diffstat renders them as `Bin 0 -> 18310 bytes` and `Bin 0 -> 7389 bytes`. In a repository whose workflow is cherry-pick, diff review and textual merge, a source file git cannot diff or three-way merge is an operational hazard, and it silently removed two of this bundle's largest new files from reviewable diff output.

   This is already-decided policy in the code itself, applied inconsistently: `host.ts:158-162` says the escape was chosen "`\0` rather than a literal NUL byte — the same string at runtime, without making this file binary to `grep` and `diff`", and `mintedKey` at `:167` correctly writes `\0`. `managerKey` twelve lines above it does not. Runtime behaviour is identical either way, so the fix is textual only.

**Warnings (should fix)**:

- `packages/site-schema/src/svg.ts:318` — `where` mixes an `attrs`-relative offset into a `source`-relative byte position; error messages point at the wrong byte. Use the start tag's offset plus the attribute list's offset within the match.

## Fix-It Prompt

Two textual fixes. Do not restructure anything else in this bundle; nothing else is blocking.

**Fix 1 — close the attribute-value entity hole (`packages/site-schema/src/svg.ts`).**

Replace the single-shot check at `:332-337` with a scan of every `&` in the value, mirroring the text-content rule already at `:256-265`. Suggested shape — add beside `ALLOWED_ENTITY`:

```ts
/** Every `&` in an attribute value must open one of the five XML entities. */
function entitiesAreAllowed(value: string): boolean {
  for (let i = value.indexOf('&'); i !== -1; i = value.indexOf('&', i + 1)) {
    ALLOWED_ENTITY.lastIndex = i
    const entity = ALLOWED_ENTITY.exec(value)
    if (!entity) return false
    i = entity.index + entity[0].length - 1
  }
  return true
}
```
and use it at `:332-337`:
```ts
if (/[<>]/.test(value) || !entitiesAreAllowed(value)) {
  fail(where, `'${name}' carries markup or an entity in its value.`)
}
```
(`ALLOWED_ENTITY` is sticky, so set `lastIndex` before each `exec`; reset it or use a local copy if reuse across the two call sites proves awkward.)

Then add UATs to the REQ-130 suite (`tests/test_UAT_FC_REQ-130_beyond_l1.test.ts`) asserting refusal of, at minimum:
- `<svg xmlns="http://www.w3.org/2000/svg"><text x="&amp;&#x3c;script&#x3e;">hi</text></svg>`
- `<svg xmlns="http://www.w3.org/2000/svg"><rect fill="&amp;url&#x28;http://evil/x&#x29;"/></svg>`

and confirming a legitimate document with a genuine allowed entity still passes, e.g. `<svg xmlns="http://www.w3.org/2000/svg"><title>Bea &amp; Co</title></svg>`.

**Fix 2 — remove the raw NUL bytes.**

In `tools/generate/src/cli/ai/host.ts:145` and `tools/generate/src/cli/preview.ts:170`, replace each literal U+0000 byte with the two-character escape `\0`, exactly as `mintedKey` (`host.ts:167`) already does. Runtime strings are unchanged, so no test should move. Verify with:

```bash
python3 -c "import sys; [sys.exit('NUL in '+p) for p in ['tools/generate/src/cli/ai/host.ts','tools/generate/src/cli/preview.ts'] if b'\x00' in open(p,'rb').read()]"
git diff main..HEAD --numstat -- tools/generate/src/cli/ai/host.ts tools/generate/src/cli/preview.ts
```
The second command must report line counts, not `-	-`.

**Fix 3 (warning, optional in this pass).** `packages/site-schema/src/svg.ts:318` — compute `where` from the attribute's position within `source` rather than within `attrs`, so the reported byte offset points at the offending attribute.

**Re-verification after fixing:** `pnpm -r build`, `pnpm -r typecheck`, and `npx vitest run` must all pass (baseline: 1418 passed / 67 skipped / 0 failed, plus the new REQ-130 cases).
