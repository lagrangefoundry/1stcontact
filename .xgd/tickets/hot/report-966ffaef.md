---
uid: report-966ffaef
id: REPORT-7612
type: report
title: 'Reconciliation Review: commits'
created_by: xgd
created_at: '2026-11-01T13:25:28.877098+00:00'
updated_at: '2026-11-01T13:25:28.877098+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-94dbe947
  anchor_uid: bundle-94dbe947
  overrides_audited: 1
  trust_boundary_overrides: 0
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: (none — commits mode)
**Anchor**: bundle-94dbe947 (BUNDLE-35)
**Stories Reviewed**: 10 (story-c4f329d3, story-5836022a, story-a58a0974, story-7b1025b8, story-7102ffe3, story-0cd18650, story-e674c60a, story-387c9dfe, story-1500b111, story-e15a19ef)

The stories describe the intent accurately. All 10 plan items produced output, and every active AC in the ten stories has a passing UAT in the latest scoped quality run (report-b1f667ac: 283 passed, 0 failed, 0 skipped). The review still FAILS. REQ-168 explicitly supersedes an AC that is still `active` (Step 4c). The UATs for that AC's sibling ACs are broken by the same REQ-168 signature change. Four restated Library ACs still carry their old ticket titles, which state the behaviour REQ-181 removed.

## Gaps (fix list)

### G1 — Step 4c: superseded AC still active (HARD)
- **AC**: AC-1481 (`acceptance_criterion-dab8d017`), "A deployment that names no account is refused when the store is built, with a named error saying where to declare it".
- **Owning story**: story-ab1ecd62 (REQ-162's product ticket store).
- **Authored by**: REQ-162's reconciliation. Its UAT is `tests/reconciliation-product-ticket-store.workers.test.ts:219`, which asserts `TenantNotConfiguredError` for an absent or blank `TENANT_ID`.
- **Superseding intent**: REQ-168 (bundle-94dbe947). Its section "What the implementation added, and why" says: *"This supersedes [[REQ-162]]'s assertion that an unscoped ticket store raises `TenantNotConfiguredError`: the refusal is unchanged and still happens at construction, only its name now matches what it means."* The code agrees: `TENANT_ID` is no longer on `TicketStoreEnv` (`apps/control-app/src/tickets.ts:397-405`), and `ticketStoreFor(env, scope)` throws `UnscopedError` for an empty scope (`tickets.ts:463-465`). The replacement is AC-2125 (story-7102ffe3).
- **Fix**: set AC-1481 to `status: superseded` and `superseded_by_uid: bundle-94dbe947`.

### G2 — Sibling ACs in the same story lost their evidence to the REQ-168 signature change
- `tests/reconciliation-product-ticket-store.workers.test.ts` still calls `ticketStoreFor(ticketEnv({ TENANT_ID: … }))` with one argument, at lines 120, 137, 155, 167, 181, 206, 223, 252, 292, 293 and 340. Its `ticketEnv` helper (lines 35-41) still sets `TENANT_ID`.
- The current signature is `ticketStoreFor(env: TicketStoreEnv, scope: Scope)`, and its first line reads `scope.businessId` (`apps/control-app/src/tickets.ts:463-464`). Every one of those calls therefore rejects with a `TypeError` before any assertion it was written for. That includes AC-1482's call, which expects `BlobsNotConfiguredError`.
- **Affected active ACs (story-ab1ecd62)**: AC-1478, AC-1479, AC-1480, AC-1482, AC-1483, AC-1484.
- REQ-168's merge updated about 15 existing UATs to pass a scope. This reconciliation-generated file was missed, and its plan observation ("Case 3 mechanical touches") does not list it. None of the scoped quality runs for this bundle selected AC-1476..1485, so nothing caught it.
- **How this was established**: by reading the code, not by running it. This review's sandbox refuses local port binding (`listen EPERM 127.0.0.1`), so workers suites cannot start here. The `TypeError` follows directly from `scope.businessId` being read off an `undefined` second argument.
- **Fix** (test-only, mechanical, same as the other REQ-168 touches): pass a `Scope` (`{ businessId: ACCOUNT_A }` and so on) as the second argument, remove `TENANT_ID` from `ticketEnv`, and point AC-1482's case at `ticketStoreFor(ticketEnv({ BLOBS: undefined, DB: untouchableDb() }), { businessId: ACCOUNT_A })`. Retire the AC-1481 case together with G1. Then run that file in workerd and confirm AC-1478/1479/1480/1482/1483/1484 pass.

### G3 — Four restated Library ACs still carry titles that state the behaviour REQ-181 removed
The bodies and `fields.title` were restated correctly. The ticket titles were not, and they are what `xgd ticket get`, the AC listings and the story's child list display:

| AC | Displayed title (stale, contradicts REQ-181) | `fields.title` (correct) |
|---|---|---|
| AC-1715 (`acceptance_criterion-946ff3b5`) | "…the open site is a badge on the rows whose recorded placement includes it…" | "…the whole of the open business's material, placed or not, with no placement badge, and a business switch leaves no row from the previous business" |
| AC-1716 (`acceptance_criterion-17ec5ed0`) | "…narrows the Library by role, by kind, by used-on-this-site and by typed text…" | "…by role, by kind and by typed text … with no used-on-this-site filter" |
| AC-2018 (`acceptance_criterion-dc45179f`) | "The On this site badge, the Used on row and the used-on-this-site filter read one placement list…" | "The not-on-the-site warning and the Placed on row of the record read one placement list and agree on every row" |
| AC-2020 | "…then pills that never wrap or shrink" | "…then the role pill (and, only in the exception, the warning)…" |

Someone reading the matrix sees three active criteria that require the pill and filter REQ-181 §1/§3 removed. The UATs (`tests/reconciliation-library-badges-the-exception.test.ts:208, 277, 400, 435`) and the story body already match the new wording. **Fix**: set each AC's ticket title to its `fields.title`. No body or test change is needed.

## Behavior Inventory

62 behaviours were identified across the 11 bundled intents and their landed code: BUG-48 S1–S6 and C1–C4; REQ-171 parts 1–5 and its ledger guarantees; REQ-168's acceptance list and its five implementation additions; REQ-179 plus its DOC-42 reopen; REQ-169's 14 test-plan behaviours; REQ-180 D1–D5 and A1–A3; BUG-50 "Done means" 1–6; REQ-181 §1–§6 and "What landed"; REQ-184's two halves; REQ-224/225's membership-admits change.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | `1c assets` refuses MISSING/STALE corpus–manifest skew and writes nothing | Covered | story-c4f329d3 | AC-2099, AC-2100 |
| 2 | Awareness map exempt by corpus predicate, exemptions named in the report | Covered | story-c4f329d3 | AC-2101 (S1 + C2) |
| 3 | `bin/kb-release` runs the steps in order and stops at the first failure | Covered | story-c4f329d3 | AC-2102 |
| 4 | Bundle and index stamp versions to the second | Covered | story-c4f329d3 | AC-2103 (C1) |
| 5 | REF-l1 projects the L1 document keys and the shapes they reach | Covered | story-5836022a | AC-2104 |
| 6 | Structural refusals projected from `L1_STRUCTURAL_RULES`, keeping callers' phrases | Covered | story-5836022a | AC-2105 (S5 + C4) |
| 7 | Derived, per-section coverage check that can be shown to fail | Covered | story-5836022a | AC-2106 (S6 + C3) |
| 8 | Instance rebuilt (REF-* indexed) | Not a matrix behaviour | — | Operational; needs Workers AI credentials (BUG-48 S2) |
| 9 | Session texts split into product, role and reminder; product level names no role | Covered | story-a58a0974 | AC-2107 |
| 10 | Summary manual projected per grant; DescribeTools reachable | Covered | story-a58a0974 | AC-2108 |
| 11 | Reminder points to the rules of interaction; per-turn signals marked as the exception | Covered | story-a58a0974 | AC-2109 |
| 12 | Ledger surface writes body and title to this conversation's own ticket only (CAS, numbering, refused before archive) | Covered | story-a58a0974 | AC-2110 |
| 13 | Ledger trigger: written at decision points; renamed once the business is known | Covered | story-a58a0974 | AC-2111 |
| 14 | Membership admits; all-lapsed person admitted with nothing selectable | Covered | story-7b1025b8 | AC-2112, AC-2076 modified, AC-1750 superseded |
| 15 | Lapse reasons expired(date)/revoked/not_yet/never_granted, derived from one answer | Covered | story-7b1025b8 | AC-2113 |
| 16 | Lapse reported only for live-membership businesses | Covered | story-7b1025b8 | AC-2114 |
| 17 | Entitlement object/subject split; migration preserves rows; capacity-only selectability | Covered | story-7b1025b8 | AC-2115, AC-2116 |
| 18 | Reaching the builder requires accepted terms | Covered | story-7b1025b8 | AC-1760 modified |
| 19 | `/b/<id>/` target; refused, never substituted; lapsed target refused separately | Covered | story-7102ffe3 | AC-2117–2119 |
| 20 | No target → first selectable business, never `TENANT_ID` | Covered | story-7102ffe3 | AC-2120 |
| 21 | platform_admin bypasses membership only | Covered | story-7102ffe3 | AC-2121 |
| 22 | Deactivated business absent from the admissible set | Covered | story-7102ffe3 | AC-2122 |
| 23 | Dev-open resolves to `TENANT_ID` and ignores the target | Covered | story-7102ffe3 | AC-2123 |
| 24 | Single `TENANT_ID` reader | Covered | story-7102ffe3 | AC-2124 |
| 25 | Openers refuse an empty scope with `UnscopedError` | Covered | story-7102ffe3 | AC-2125; supersession of REQ-162's AC-1481 **not applied** (G1) |
| 26 | Preview assets served from the referring page's business | Covered | story-7102ffe3 | AC-2126 |
| 27 | Per-scope chat hosts; a failed build is evicted | Covered | story-7102ffe3 | AC-2127 |
| 28 | Resume refused after membership expiry | Covered | story-7102ffe3 | AC-2128 |
| 29 | Nothing selectable: chrome and listing answer; scoped routes 403 `no_entitlement` | Covered | story-7102ffe3 | AC-2129, AC-2130 |
| 30 | 1stcontact migration, idempotent, seeds the grant | Covered | story-7102ffe3 | AC-2131 |
| 31 | Terms interstitial at the requested URL; 403 for non-navigations | Covered | story-0cd18650 | AC-2132, AC-2133 |
| 32 | Terms responses not cacheable or indexable | Covered | story-0cd18650 | AC-2134 |
| 33 | JSON-only accept stamps version and time; 415 otherwise | Covered | story-0cd18650 | AC-2135, AC-2136 |
| 34 | Same URLs answer after acceptance; a version bump re-prompts | Covered | story-0cd18650 | AC-2137, AC-2138 |
| 35 | Page renders the whole text and references nothing external; `/terms` stays readable; no decline state; dev-open skips | Covered | story-0cd18650 | AC-2139–2142 |
| 36 | Switcher in the header and avatar on the right; no toolbar site selector; one-business shows name only | Covered | story-e674c60a | AC-2143 |
| 37 | `GET /api/businesses` returns account and set, lapsed members marked | Covered | story-e674c60a | AC-2144 |
| 38 | Switch re-scopes requests, frame, assistant and Library; `getSite` read only by the panel | Covered | story-e674c60a | AC-2145 |
| 39 | Selection persisted; inadmissible stored id falls back and the stored value is rewritten | Covered | story-e674c60a | AC-974 (UAT `…_business_selection_is_remembered_…_and_falls_back`) |
| 40 | Nothing selectable: switcher disabled, tabs and panels inert, avatar live, banner, no site list fetched | Covered | story-e674c60a | AC-2146 |
| 41 | Account surface states lapse reasons; no plan/billing/invoice/add-a-business | Covered | story-e674c60a | AC-2147, AC-2143 body |
| 42 | No "tenant" on screen (D5) | Covered | story-e674c60a | AC-2148 |
| 43 | `POST /api/admin/businesses` gated by fulfilment privilege; 404 to everyone else, dev-open included | Covered | story-387c9dfe | AC-2149–2151 (404 vs 403 recorded as a decision) |
| 44 | Business arrives whole via `provisionBusiness`; invite path identical | Covered | story-387c9dfe | AC-2152–2154 |
| 45 | Unknown email 404 / missing fields 400 | Covered | story-387c9dfe | AC-2155, AC-2156 (recorded decisions) |
| 46 | No self-serve creation contract | Covered | story-387c9dfe | AC-2157 |
| 47 | platform_admin has two readers; no generic admin predicate; no platform-tenant concept | Covered | story-387c9dfe | AC-2158–2160 |
| 48 | Library: no placement pill; warning only on an unplaced site asset, perceivable without colour | Covered | story-1500b111 | AC-2161, AC-1715 body (title stale, G3) |
| 49 | No used-on-this-site filter; text/role/kind still filter | Covered | story-1500b111 | AC-1716 body (title stale, G3) |
| 50 | Detail row relabelled "Placed on" and agrees with the warning | Covered | story-1500b111 | AC-2018 body (title stale, G3) |
| 51 | Business switch clears then re-reads the Library, even when the re-read fails | Covered | story-1500b111 / story-e674c60a | AC-1715 body, AC-2145 |
| 52 | One env-file definition for `1c builder` and `dev:control` | Covered | story-e15a19ef | AC-2162 |
| 53 | Missing env files named with path and consequence; server still starts | Covered | story-e15a19ef | AC-2163 |
| 54 | Same argv from any cwd; `--port`/`--remote` preserved | Covered | story-e15a19ef | AC-2164 |
| 55 | D3: the tenant-only self-heal is unreachable for an admission-derived scope | Partial | story-387c9dfe | See judgment calls |
| 56 | `tenant_id` untouched in the schema | Partial | story-e674c60a (prose) | FC test exists; no AC (see judgment calls) |

## Ungrounded Stories

No story claims behaviour that neither the intent nor the code supports.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. System KB shipping gate (upgrade STORY-117) | story-c4f329d3 | ✓ AC-2099..2103 added |
| 2. Projected reference covers the page (upgrade STORY-137) | story-5836022a | ✓ AC-2104..2106 added |
| 3. Session texts + chat ledger (upgrade STORY-103) | story-a58a0974 | ✓ AC-2107..2111 added |
| 4. Admission after DOC-42 (upgrade STORY-146) | story-7b1025b8 | ✓ AC-2112..2116 added; AC-2076/AC-1760 modified; AC-1750 superseded (superseded_by bundle-94dbe947) |
| 5. Business scope (feature) | story-7102ffe3 (STORY-160) | ✓ new, 15 ACs |
| 6. Terms of service gate (feature) | story-0cd18650 | ✓ new, 11 ACs |
| 7. Business switcher in shell chrome (upgrade STORY-99) | story-e674c60a | ✓ AC-2143..2148 added; AC-967/970/974 restated |
| 8. Business fulfilment (feature) | story-387c9dfe (STORY-162) | ✓ new, 12 ACs |
| 9. Library badges the exception (upgrade STORY-144) | story-1500b111 | ✓ AC-2161 added; AC-1715/1716/2018/2020 restated (titles stale, G3) |
| 10. Dev server env layering (upgrade STORY-79) | story-e15a19ef | ✓ AC-2162..2164 added |

## Supersession Check (Step 4c)

- AC-1750 (story-7b1025b8): `superseded`, `superseded_by_uid: bundle-94dbe947`. ✓
- **AC-1481 (story-ab1ecd62): still `active` while REQ-168 explicitly supersedes it. ✗ (G1)**
- AC-1499 (story-e07c589b), "body left for a summary": checked and **not** superseded. Its body only claims the archive leaves the chat body free and transcript comments do not write it. That still holds under REQ-171, where the consultant's ledger operation is what writes the body.
- REQ-184 narrows REQ-180's "`business_id` appears in no migration" proxy. No active AC pins that proxy, so nothing is left to supersede.

## Evidence Sufficiency (Step 5b)

- All 243 active ACs across the ten stories have at least one passing UAT in report-b1f667ac (283/0/0). AC-1750 is correctly excluded as superseded.
- AC-2124, AC-2148 and AC-2158..2160 are checked by reading source. They are accepted because the intent asks for exactly that: REQ-168 says the single-reader rule is "asserted over the source"; REQ-180 D5/A1/A3 call for "a guard rather than an audit" and say "a third read fails the build". In each case the claim is about the source text, and each guard has a paired test showing it detects a planted violation (`…_the_guard_can_actually_see_a_violation`, `…_the_concept_guard_…`, `…_the_gate_guard_…`).
- Outside the reviewed stories, G2 records broken evidence for story-ab1ecd62.

## Mode Override Audit

**1 override audited, 0 touched a trust boundary.**

report-012b2e49: `code_frozen` on story-e674c60a, batch 0, rung 2. All five checklist items and the rung check pass.
1. **Named files only.** `unnamed_files_touched` is empty. The only production file changed since `granted_head` 6a289093 is `tools/generate/src/cli/ai/ledger-core.ts`, which the override names: a 2+/2− JSDoc reword, checked with `git diff 6a28909362..HEAD -- apps tools packages bin`. The other `files_touched` are test files and test support, outside `code_frozen`'s scope.
2. **Earlier stories' tests pass.** report-b1f667ac is green and includes AC-960, AC-964, AC-967, AC-975 and AC-1400.
3. **Consistent with intent.** The JSDoc no longer writes the component scope literal, which is what AC-960 forbids outside its one declaration. The reasoning REQ-171 gives for the purpose-built surface is unchanged.
4. **Within the stated scope.** Only the comment was changed; no code token moved. The `app.js` change the builder asked for was not granted and was not made.
5. **Trust boundary.** `trust_boundary_touched` is false and `trust_boundary_mismatch` is false.
6. **Rung check.** Rung 2: `tip_evidence` points at `ledger-core.ts:17-18`. The diff is limited to `files` and adds no behaviour. `conformance_verdict` is pass.

Two points about the fix_plan's narrowing, both acceptable:
- AC-967's failing-listing clause was withdrawn and left unasserted. No intent requires the pane to keep its contents on a generic listing failure; REQ-181's "list cleared before re-read" concerns the Library and is still asserted by AC-1715 and AC-2145. The correction is recorded in story-e674c60a's 2026-11-01 Reconciliation Decisions.
- AC-1400's empty-`TENANT_ID` probe was moved to a configured tenant with no account row. This tracks the D1-backed admission that REQ-167 and REQ-168 introduced and keeps the "unadmitted refused, no artifact replaces a route" assertions. AC-975 now fails loudly when no browser can be launched, which is stricter than before.

## Judgment Calls

- **REQ-180 D1** (no plan/billing/invoice builder route): covered. AC-2143's body says the account surface "offers no plan, billing, invoice or add-a-business capability", and `test_UAT_FC_REQ-180_no_plan_or_billing_or_invoice_route_exists_in_the_builder` guards the routes. Not a gap.
- **REQ-180 D3** (the `storeFor` self-heal is reachable only for the dev-open `TENANT_ID` business): stated in intent as "asserted", but no AC and no FC test isolates it. AC-2153 (one operation) and AC-2122 (admissible set joins `tenants`) cover it in effect. A developer would not be surprised, so this is acceptable and is noted for a follow-up AC.
- **`tenant_id` untouched in the schema** (REQ-180 D5, narrowed by REQ-184): stated in story-e674c60a's prose and guarded by `test_UAT_FC_REQ-180_tenant_id_is_untouched_in_the_schema`, but no AC. Acceptable as a schema invariant, not a behaviour.
- **BUG-48 S2** (rebuild the shipped KB) and **BUG-50 / REQ-184 / REQ-179 doc updates** (DOC-41 §2, DOC-40 §5, DOC-42 §10.2) are operational or documentation work, not matrix behaviour.
- **REQ-171 open question** (group descriptions, conformance warning upstream): out of scope by the intent's own wording.
- **story-387c9dfe's 404-not-403 decision** is properly recorded. Amendment A1 ("stays exactly as it is") ratifies the landed shape, so this is a recorded decision, not an absorbed divergence.
- **STORY-160's resume-after-expiry AC** (AC-2128) was added where REQ-168 named a UAT the FC evidence lacked. It now has a passing UAT, so the gap is closed.

## Verdict

FAIL. The stories cover the bundle's intent faithfully and every active AC in them has a passing UAT, but three gaps remain:
1. **G1 (Step 4c)**: AC-1481 (story-ab1ecd62, REQ-162) is still `active` while REQ-168 (bundle-94dbe947) explicitly supersedes it. Set `status: superseded` and `superseded_by_uid: bundle-94dbe947`.
2. **G2**: `tests/reconciliation-product-ticket-store.workers.test.ts` calls `ticketStoreFor` without the `Scope` that REQ-168 made required (`apps/control-app/src/tickets.ts:463`). The UATs for AC-1478/1479/1480/1482/1483/1484 therefore fail with a `TypeError`. Pass a scope (test-only change) and re-run that file in workerd.
3. **G3**: AC-1715, AC-1716, AC-2018 and AC-2020 (story-1500b111) still carry ticket titles stating the behaviour REQ-181 removed. Set each title to its already-correct `fields.title`.
