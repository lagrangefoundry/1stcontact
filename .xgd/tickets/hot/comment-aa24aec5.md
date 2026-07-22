---
uid: comment-aa24aec5
id: COMMENT-257
type: comment
title: Comment on request REQ-87
created_by: xgd
created_at: '2026-07-21T23:41:27.620203+00:00'
updated_at: '2026-07-22T00:03:15.123213+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-84af044b
  kind: chat_transcript
---

<!-- xgd-turn id="3825ab95-b41b-4cce-a5fa-24f54a2a760e-user" -->

<!-- xgd-chat role="user" ts="2026-07-21T23:41:25.636814+00:00" -->
#### You
Please free code this rename

<!-- xgd-turn id="3825ab95-b41b-4cce-a5fa-24f54a2a760e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-22T00:03:15.094505+00:00" -->
#### Claude
I'll start by reading the current ticket to understand its state, then explore the codebase to scope the rename precisely.

The ticket is well-scoped. Let me map all the occurrences that need renaming. This is a mechanical rename, so I need a precise inventory first.

This is a substantial but mechanical rename. Let me read the core file and get a full inventory of identifiers.

Now let me see how these identifiers are consumed across the codebase. Let me look at the key consumer files and get occurrence counts.

Let me inspect the schema files and a couple of ambiguous spots to confirm every "capability" means the module type (not something unrelated).

Found two English-word "capability" usages that must NOT be renamed (`capture/types.ts:103` driver capability negotiation; `schema.ts:672` "schema-only capability"). Also found an L1 `slot.capability` field + `data-l1-capability` attribute. Let me check the blast radius of those before deciding.

The `slot.capability` L1 field references a behavior-module id — renaming it to `slot.behavior` (and `data-l1-capability` → `data-l1-behavior`) is the consistent choice and this is all pre-launch with no live site data. I'll include it. Let me confirm a few final things before executing: whether `dist/` is tracked, the README content, and the discriminant usages.

`dist/` is gitignored (regenerated) — good. Let me examine how the `capabilities.js` asset name and `getModuleClientJs` flow works, to decide whether that output filename is in scope.

Decision on the two borderline artifacts:
- **`slot.capability` field + `data-l1-capability` attr** → rename to `behavior` (names the module type; keeps L1 schema consistent; pre-launch, no live data).
- **`capabilities.js` asset filename** → **keep** the filename (plural bundle asset, functional output, not a type/discriminant), but rename the `/* capability: <id> */` label comment + prose for consistency.
- **Preserve** the 3 English-word uses: `capture/types.ts:103`, `schema.ts:672`, `req36-heading-treatment.test.ts:9`.

Let me execute. First the `git mv` and the collision-free global transforms (capital `Capability`, `capabilityMeta`, the `kind` discriminant).

The loop had a word-splitting issue on the filename blob. Let me verify what actually got transformed and re-run cleanly.

The transforms didn't apply (only the `git mv` took). Clean slate — good, no partial corruption. Let me re-run with a robust loop.

All capital `Capability` identifiers converted. Now the lowercase/discriminant cleanup. Let me get the exact remaining set of lowercase `capabilit` occurrences to handle each precisely.

Discriminant fully converted (none remain). Now the functional lowercase fixes: import paths (`'../capability'` → `'../behavior'`), the L1 `slot.behavior` field, the `data-l1-behavior` attr, and the `/* behavior: */` label. Let me apply these precisely.

All functional fixes in. Now the prose/JSDoc sweep across source files, protecting `capabilities.js` and excluding the two English-word files (`capture/types.ts`, and `schema.ts` which I'll edit by hand for its mixed usage).

The sweep loop hit the same word-splitting problem — `render.ts:166` still shows lowercase "capability's", so the sweep didn't apply. Let me redo it via a temp file with `while read` (which worked earlier).

Sweep applied cleanly — only the protected `capabilities.js` filename remains lowercase. Now the manual file: `schema.ts` (mixed — module-type on 499/500 to change, English on 672 to keep).

Line 672 English case and `capture/types.ts:103` should remain untouched. Let me run comprehensive verification of the whole rename.

Item 5 returned nothing — let me check what the meta files actually export.

Code rename is clean and complete (the value exports are `carouselMeta`/`contactFormMeta`; the JSDoc generic reference is now `behaviorMeta`). Now the critical Verify step — typecheck + tests. Let me find the commands.

pnpm workspaces. I changed no dependencies, so the lockfile is unchanged. Let me use local binaries directly (avoiding any `pnpm install`/reconcile) — first confirm `node_modules` exists, then run a clean typecheck per package.

Typecheck scripts exist. Since I renamed the `slot.behavior` field in `site-schema/src`, the stale `dist/` would mask cross-package drift — so I'll rebuild `site-schema` first, then typecheck all three packages (using the local `tsc`, no install).

All three packages typecheck clean with a fresh `site-schema` dist. Now run the test suite (focus on the affected areas — framework, conformance, generate, req85).

All 528 tests pass — REQ-85 behaviour is preserved under the new names. Now I'll add the required `test_UAT_FC_REQ-87_*` UATs. Let me check existing test patterns for registry access and the L1 slot schema export.

Let me check the site-schema L1 exports so the discriminant test can validate a slot node.

Now I have everything to write the REQ-87 UATs. Let me create the test file.

`contact-form` is v3, not v2. Let me fix that specific call.

All 3 REQ-87 UATs pass. Let me run the full suite once more to confirm nothing regressed with the added file.

Different result than the earlier clean run (528 passed) — 7 errors appeared. Let me see what failed.

Flaky run — the clean re-run confirms **all 73 files / 531 tests pass**. Code rename verified (typecheck clean + tests green). Now the docs. Let me read the CLAUDE.md section to edit precisely.

CLAUDE.md updated. Now let me bump the version and prepare the code commit. First the version bump.

All changes are coherent (`dist/` is gitignored so not shown). Let me spot-check the key functional diffs before committing.

The functional diffs are clean. Let me commit the code (with CLAUDE.md doc update and version bump) as a single `[FREE-CODED]` commit.

Committed. But I claimed the two audit comment nits in the message — let me verify I actually addressed them (the `capability→behavior` sweep wouldn't have touched `.hero`/`.header__inner` or `enhance.ts`).

Both nits still present — my sweep didn't touch them, and the commit message overclaimed. Let me fix them and amend (commit not pushed, ticket not yet updated — safe). First let me see the full comment contexts and real current selectors.

Now I'll fix both nits: real current selectors in `styles.ts`, and `enhance.ts` → `client.js` in the two contact-form comments.

Both nits fixed (comment-only). Let me amend the commit to include them.

Full SHA `dd936736d5c1b5631315111f6a6c2ddd6862efe0`, tree clean, both nits fixed. Now the free-coding lifecycle for the code: update the ticket body (append an implementation record, preserving the existing spec), then gate to `free_coded`.

REQ-87 code is safely at `free_coded` (commit `dd936736`, v0.0.169, 3 pts). Now the in-scope doc-ticket renames (DOC-25/26 + DOC-8/20/21 + REQ-79/85 references). Let me fetch the doc tickets to get their exact current bodies and UIDs.

I have the UIDs. Let me fetch DOC-25's raw body to transform it (I'll need the exact current text to write back).

`--json` gives the body. Let me fetch all these bodies and scan for the protected terms (`capability matrix`, `capabilities.js`) so I transform safely — blanket-rename the pure type docs (DOC-25/26), targeted-rename the mixed ones.

Clear split: **DOC-25/26** are pure type docs (0 matrix refs) → full rename (protecting `capabilities.js`); **DOC-8/20/21, REQ-79/85** are mixed (contain `capability matrix`/product-sense uses the ticket says to leave) → targeted type-phrase rename only. Let me write a transform script.

Let me verify `xgd ticket update` supports `--title` before running.

`--title` and `--body-file` both exist. Let me run the doc-rename transform.

Applied. Let me verify no protection sentinels leaked and the protected terms (`capability matrix`, `capabilities.js`) survived intact.

No sentinel leaks; `capability matrix` and `capabilities.js` correctly preserved; DOC-21's product-sense "capability" (archetypes, stories, gaps, matrix) correctly left untouched per the ticket's guidance. One stale code-term to fix in DOC-25: `capabilityMeta` → `behaviorMeta`. Let me check DOC-25/26 residuals and fix.

DOC-26 has a stale `validateCapability*` code term (the `*` blocked the PascalCase rule). Let me fix it.

Two doc bodies still have code-identifier residue. Let me see exactly what they are.

The only true residue: DOC-20's `capabilityMeta` code-term (real, fix it) plus a few "a module means a *capability*" phrases that mirror the exact CLAUDE.md example the ticket flagged (and now point at the renamed "Behavior Modules" doc). Let me fix those surgically.

All ticket bodies are clean of code-term residue. Let me confirm the DOC-21 multi-line ladder edit applied (exact-whitespace replacements can silently miss).

The multiline replace missed (leading indentation). Let me fix that one line precisely.

All doc/ticket renames complete. Let me do a final verification of the overall state.

Done. The rename is complete, verified, and the ticket is safely at `free_coded`.

## Summary — REQ-87: `capability` module-type → `behavior` module

**Code** (commit `dd936736`, v0.0.169, `[FREE-CODED]`):
- `modules/capability.ts` → `behavior.ts` (git mv, history preserved)
- `Capability*` type family → `Behavior*` (~12 types), `validateCapability*` → `validateBehavior*` (3 fns)
- Discriminant `kind: 'capability'` → `kind: 'behavior'` atomically across `modules/`, `site-schema`, the conformance harness, and all REQ-39/40/41/85 UAT fixtures — **no `'capability'` discriminant remains**
- L1 slot seam: `slot.capability` field → `slot.behavior`; render attr `data-l1-capability` → `data-l1-behavior`
- Folded in the two REQ-84/85 audit nits: stale `.hero`/`.header__inner` selector note in `styles.ts`, and dead `enhance.ts` refs in `contact-form/` → `client.js`

**Deliberately preserved** (decisions recorded in the ticket body): the XGD **capability matrix** vocabulary; the `capabilities.js` emitted asset filename (plural bundle output, not a type/discriminant); and English-word uses (driver *capability* negotiation, "schema-only *capability*", "module-independent *capability*").

**Verification**: all 3 packages typecheck clean (`tsc --noEmit`, fresh `site-schema` dist) and **531 tests pass**, including 3 new `test_UAT_FC_REQ-87_*` UATs (`behavior_meta_rename` — renamed contract + validators drive config/slots; `discriminant_atomic` — every registry meta `kind==='behavior'`, L1 slot accepts `behavior` and strict-rejects the legacy `capability` key). No back-compat alias.

**Docs** (same session): `CLAUDE.md` updated (in the commit); DOC-25 → "Behavior Modules — Contract & Catalog" and DOC-26 → "Behavior-Module Authoring & Vetting Process" fully renamed (title + body); DOC-8 / DOC-20 / DOC-21 and REQ-79 / REQ-85 type-references updated — with `capability matrix`, `capabilities.js`, and product-sense "capability gap/stories/archetypes" left untouched per the ticket's guidance.

The ticket sits at `free_coded` (stable resting state). Promotion to `ready_to_reconcile` is your call when you're ready.

<!-- xgd-chat-end -->