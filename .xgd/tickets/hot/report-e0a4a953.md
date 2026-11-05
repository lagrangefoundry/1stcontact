---
uid: report-e0a4a953
id: REPORT-11067
type: report
title: 'Report: blocked_by_handoff for story-179b8c06'
created_by: xgd
created_at: '2026-11-05T21:48:56.431835+00:00'
updated_at: '2026-11-05T21:57:39.680455+00:00'
completed_at: null
last_field_updated: ruling
fields:
  report_kind: blocked_by_handoff
  subject_uid: story-179b8c06
  rule: code_frozen
  evidence: |-
    I made no edits. Both failures trace to the production code, which is frozen in this mode (`code_frozen`), and both tests are correct as written.

    **1. AC2329: a misspelt capability key should fail site validation, but passes**

    `validateSite(buildSite({ capabilities: { acounts: true } })).ok` comes back `true`. The cause is `siteCapabilitiesSchema` in `packages/site-schema/src/schema.ts`: it is a plain `z.object({ accounts })` without `.strict()`, so zod silently drops the unknown key instead of rejecting it. The story already records this as a known code issue. The AC (a closed record, matching REQ-200's own wording) and the test are right. Rewriting the test or AC to accept the dropped key would weaken them.

    **2. AC1624: the shipped client bundle doesn't parse, so every page throws in the browser**

    The mobile half of the test passes. The desktop half, which expects a clean run at 768/1024/1280/1440, gets a `ConformanceError` with 4 violations. I couldn't launch Chromium in this sandbox, so I haven't seen those 4 violations directly; I traced the cause in code instead:
    - `capabilities.js` is built by plainly joining every module's `client.js` into one module script (`composeModuleAssets` in `tools/generate/src/cli/module-assets.ts`).
    - `contact-form`, `account-portal` and `account-chrome` each declare `const ERROR_SELECTOR` at the top level, and the committed `module-assets.ts` contains all three.
    - Extracting that bundle and running `node --check` on it gives `SyntaxError: Identifier 'ERROR_SELECTOR' has already been declared`.

    So every page that loads the bundle raises a page error at every width, which fits 4 violations for 4 widths. This is a real defect, not a test problem: no client behaviour runs on any published page, including contact-form enhancement, carousel autoplay and the account-chrome dialog. Adding `except: ['safety.page-error']` to the test would hide exactly the failure it exists to catch.

    Once `code_frozen` is lifted, the AC1624 fix also needs `1c assets` run to regenerate `module-assets.ts`. If the 4 violations turn out to be something else, a run on a machine with Chromium will show them.

    ```yaml
    ## Assessment
    blocked_by:
      - rule: code_frozen
        evidence: "AC2329: vitest run fails at tests/reconciliation-behavior-account-chrome.test.ts:176 (validateSite(...{acounts:true}).ok is true). packages/site-schema/src/schema.ts siteCapabilitiesSchema is z.object({accounts}) without .strict(), so zod strips unknown keys. The story records this as a code issue; the AC and REQ-200 both require a closed record."
        proposed_change: "packages/site-schema/src/schema.ts: add .strict() to siteCapabilitiesSchema so an unknown capability key fails validation."
      - rule: code_frozen
        evidence: "AC1624: the desktop arm (tests/req93-l1-slot-mounted-behaviors.test.ts:760) rejects with 4 violations. Extracting MODULE_CLIENT_JS from packages/framework/src/modules/module-assets.ts and running `node --check` gives `SyntaxError: Identifier 'ERROR_SELECTOR' has already been declared`: contact-form, account-portal and account-chrome client.js each declare a top-level const ERROR_SELECTOR, and composeModuleAssets joins them into one module script. Every page that loads capabilities.js raises a page error at every viewport. Chromium could not be launched in this sandbox, so this is inferred from code, not from the violation text."
        proposed_change: "Rename the clashing constants so they are unique (packages/framework/src/modules/{contact-form,account-portal,account-chrome}/client.js, e.g. CONTACT_ERROR_SELECTOR / PORTAL_ERROR_SELECTOR / CHROME_ERROR_SELECTOR), regenerate packages/framework/src/modules/module-assets.ts with `1c assets`, and optionally make composeModuleAssets (tools/generate/src/cli/module-assets.ts) refuse to emit a bundle that fails a syntax parse so a future clash fails at build time."
    ```
  proposed_change: '(none stated: the builder made no edits and gave no verdict; see
    evidence)'
  batch_index: 0
  parent_report_uid: report-dd671b22
  anchor_ticket: bundle-7988e925
  ruling: granted
  ruling_reason: the planner granted an override in its plan
---

# Builder blocked by `code_frozen`

**Evidence**: I made no edits. Both failures trace to the production code, which is frozen in this mode (`code_frozen`), and both tests are correct as written.

**1. AC2329: a misspelt capability key should fail site validation, but passes**

`validateSite(buildSite({ capabilities: { acounts: true } })).ok` comes back `true`. The cause is `siteCapabilitiesSchema` in `packages/site-schema/src/schema.ts`: it is a plain `z.object({ accounts })` without `.strict()`, so zod silently drops the unknown key instead of rejecting it. The story already records this as a known code issue. The AC (a closed record, matching REQ-200's own wording) and the test are right. Rewriting the test or AC to accept the dropped key would weaken them.

**2. AC1624: the shipped client bundle doesn't parse, so every page throws in the browser**

The mobile half of the test passes. The desktop half, which expects a clean run at 768/1024/1280/1440, gets a `ConformanceError` with 4 violations. I couldn't launch Chromium in this sandbox, so I haven't seen those 4 violations directly; I traced the cause in code instead:
- `capabilities.js` is built by plainly joining every module's `client.js` into one module script (`composeModuleAssets` in `tools/generate/src/cli/module-assets.ts`).
- `contact-form`, `account-portal` and `account-chrome` each declare `const ERROR_SELECTOR` at the top level, and the committed `module-assets.ts` contains all three.
- Extracting that bundle and running `node --check` on it gives `SyntaxError: Identifier 'ERROR_SELECTOR' has already been declared`.

So every page that loads the bundle raises a page error at every width, which fits 4 violations for 4 widths. This is a real defect, not a test problem: no client behaviour runs on any published page, including contact-form enhancement, carousel autoplay and the account-chrome dialog. Adding `except: ['safety.page-error']` to the test would hide exactly the failure it exists to catch.

Once `code_frozen` is lifted, the AC1624 fix also needs `1c assets` run to regenerate `module-assets.ts`. If the 4 violations turn out to be something else, a run on a machine with Chromium will show them.

```yaml
## Assessment
blocked_by:
  - rule: code_frozen
    evidence: "AC2329: vitest run fails at tests/reconciliation-behavior-account-chrome.test.ts:176 (validateSite(...{acounts:true}).ok is true). packages/site-schema/src/schema.ts siteCapabilitiesSchema is z.object({accounts}) without .strict(), so zod strips unknown keys. The story records this as a code issue; the AC and REQ-200 both require a closed record."
    proposed_change: "packages/site-schema/src/schema.ts: add .strict() to siteCapabilitiesSchema so an unknown capability key fails validation."
  - rule: code_frozen
    evidence: "AC1624: the desktop arm (tests/req93-l1-slot-mounted-behaviors.test.ts:760) rejects with 4 violations. Extracting MODULE_CLIENT_JS from packages/framework/src/modules/module-assets.ts and running `node --check` gives `SyntaxError: Identifier 'ERROR_SELECTOR' has already been declared`: contact-form, account-portal and account-chrome client.js each declare a top-level const ERROR_SELECTOR, and composeModuleAssets joins them into one module script. Every page that loads capabilities.js raises a page error at every viewport. Chromium could not be launched in this sandbox, so this is inferred from code, not from the violation text."
    proposed_change: "Rename the clashing constants so they are unique (packages/framework/src/modules/{contact-form,account-portal,account-chrome}/client.js, e.g. CONTACT_ERROR_SELECTOR / PORTAL_ERROR_SELECTOR / CHROME_ERROR_SELECTOR), regenerate packages/framework/src/modules/module-assets.ts with `1c assets`, and optionally make composeModuleAssets (tools/generate/src/cli/module-assets.ts) refuse to emit a bundle that fails a syntax parse so a future clash fails at build time."
```

**Proposed change**: (none stated: the builder made no edits and gave no verdict; see evidence)

## Ruling: granted

the planner granted an override in its plan
