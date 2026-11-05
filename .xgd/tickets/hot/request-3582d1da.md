---
uid: request-3582d1da
id: REQ-484
type: request
title: 'Component upgrades: saved with the next edit, checked for visible change,
  fixed or reverted and reported'
created_by: EPIC-19
created_at: '2026-10-28T22:28:49.237961+00:00'
updated_at: '2026-10-29T20:54:37.864308+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-4689d93b
  commits:
  - working_sha: 6762ac699230a7a16c7ad280185c15b66a16b92d
    reconcile_sha: null
    main_sha: null
  - working_sha: 00b08a2b04c3497a467673010852c0156e107505
    reconcile_sha: null
    main_sha: null
  - working_sha: cc2879702216dbca6869603d4596d4ea96ea69ea
    reconcile_sha: null
    main_sha: null
  - working_sha: afce69279bb58763fde0bf28cd1bbc198385db75
    reconcile_sha: null
    main_sha: null
  version: 0.2.703
  story_points: 13
---

## Why

On production, 2026-10-28, the 1st Contact site's sign-in control (`account-chrome`) is stored at v2. BUG-299 made it v3 and added an upgrade step (`accountChromeV2ToV3`). That step runs on every render (draft preview and publish) but is never saved, so the stored draft stays v2, and the builder won't edit a component in an older format.

To change two labels, the Site consultant asked the operator to approve "the upgrade", because it might change the signed-in look.

The operator's position (2026-10-28):
- a component upgrade is plumbing and needs no approval; Publish stays the only approval step;
- but upgrades must be done with care. If an upgrade breaks the look of a client's site, the consultant must know, fix it and be able to explain what it's doing and why. If it can't fix it, it reverts and files a bug.
- Filing a bug isn't possible from production today: ReportBug is only granted where a filing address exists (BUG-301).

## What

1. **Upgrades are saved with the next edit, without asking.** When a page is written (by a builder, the consultant or the editor), every component instance on it stored below its current version is written in its upgraded form in the same write.
   - The consultant's instructions say a component upgrade is not a decision to put to the client.
   - The editor and builder no longer refuse to edit an outdated instance; they edit the upgraded form.
2. **The host checks every upgrade for a visible change.**
   - Before saving an upgraded instance, the host renders the affected page with the stored (pre-upgrade) settings and with the upgraded settings, at computer and phone widths, and in each of the component's states (for `account-chrome`: signed-out, signed-in, operates-a-business).
   - It compares what a visitor sees: the rendered layout, text, colours, sizes, and link targets that aren't meant to change.
   - The upgrade's own declared intent counts as expected, not as breakage: each upgrade step lists the visible changes it means to make (for example, "the `portal` link becomes the avatar").
3. **If it changed the look unexpectedly, the consultant is told and fixes it.**
   - The upgrade result reaches the consultant as an unexpected-visual-change finding: what changed, where and in which state.
   - The consultant restores the look within the new version's settings, and tells the client in plain words what was upgraded, what it did to keep the look and why. In `bc` mode it gives the operator the details.
4. **If it can't fix it, it reverts and reports.**
   - The page goes back to its pre-upgrade stored form. A revert path exists, and the edit that needed the upgrade is held, with that explained.
   - A defect report is filed: the component, the versions, the site, the before/after comparison and what was tried.
   - **Production must be able to receive it.** Give production a destination for consultant-filed defects: either a filing address for production (REQ-273/BUG-124's `development` surface), or a platform issue recorded in production's store and surfaced to the operator, for example in the platform console. Settle which here. Until it exists, the consultant tells the operator in `bc` and records the issue on the plan.

## Test plan

- `test_UAT_FC_REQ-484_edit_saves_the_upgraded_instance`: a page holding an `account-chrome` v2 instance, edited (a label change), is stored with that instance at v3 and the new label. No client question is raised.
- `test_UAT_FC_REQ-484_declared_upgrade_change_is_not_breakage`: v2 → v3's declared changes (derived link targets, avatar) don't raise an unexpected-change finding.
- `test_UAT_FC_REQ-484_unexpected_visual_change_reaches_the_consultant`: an upgrade step that alters an undeclared visible property (a test fixture) produces a finding naming the property, the state and the width.
- `test_UAT_FC_REQ-484_unfixable_upgrade_reverts_and_reports`: when the consultant reports it can't fix it, the page is restored to its pre-upgrade form and a defect report is recorded at the production destination chosen here.


## Decisions on the three implementation questions (2026-10-29, answered via EPIC-19 at the operator's request)

**1. The baseline for the visual check: (a), the browser comparison against the published page, plus each step's declared intent.**
- The moment a client's look can change is the deploy of the new component code, not the save. Since BUG-299 every draft preview already renders v3, so a settings-only comparison (b) checks the wrong thing: it can't see changes made in the component's code, and those are exactly the ones that break a look.
- What the client approved and visitors see is the **published** page. Compare it with the current draft render, **for the affected component's region only**, at computer and phone widths, in each of its states (signed-out, signed-in, operates-a-business). Reuse production's browser and the existing values-diff comparison from the fidelity and layout checks. Build no new comparison engine.
- **Each upgrade step declares its intended visible changes** (for v2→v3: the derived link targets, the `portal` control as the avatar, the builder link in the signed-in row). Differences it declares are expected; anything else is a finding.
- **No published revision means no check:** there's no approved, visible look to protect, and the client has been seeing the new code in the draft preview all along.
- The draft's own unpublished edits inside the component's region will show up as differences. Report them as such ("this differs from what's published; part of it is your unpublished edit"), and let the consultant judge. Don't try to separate them mechanically.
- When it runs: the first time the consultant (or a builder) writes a page holding an instance below its current version, which is the same write that saves the upgrade. The finding rides on that tool call's own result (`set_l1` / `configure_component` message line), as you proposed.

**2. Revert: yes, block Publish while an upgrade is held.**
- Old component code doesn't ship, so the only way to keep a broken look off the live site is not to publish it. The consultant marks the upgrade held: the pre-upgrade stored instance is restored and the hold is recorded on it.
- While it's held, edits leave that instance alone, and **Publish is refused for that site** with a plain message: which component, what's wrong, and that it has been reported. The edit that needed the upgrade is held and explained.
- The hold is lifted by a fixed component version or by the operator clearing it. Holds should be rare; a blocked publish is acceptable, and safer than shipping a broken look.

**3. The defect destination: a platform-issue ticket in production's store.** Agreed.
- It holds the component, the versions, the site, the comparison and what was tried, and is listed for the operator in the platform console. Don't expose a developer-machine filing service to production, and don't use the contact history.
- **Make ReportBug use it wherever there's no development filing address.** That gives the consultant a production filing path, and resolves BUG-301's caveat that "this will not currently work in production" through the same store.

**Prompt budget:** fold "a component upgrade is not a decision to put to the client" into an existing rule (rule 11, or the change-the-site paragraph) rather than adding a line. Don't raise the budget.

## What landed (2026-10-29, free-coded)

**1. Saved with the next edit.** Every edit reads its pages with stale instances upgraded (`upgradePageForEdit`, `tools/generate/src/store/upgrade-site.ts`, called from `edit.ts` `readPageFiles`), so the write that follows saves the upgrade; held instances are left as stored. The edit's answer (and the change journal's summary) adds one line per upgrade: "The <type> component '<id>' on page '<page>' was upgraded from version N to M and saved with this change." `EditOutput.upgrades` lists them. Consultant rule 11 now opens "a component upgrade is ours, never theirs to approve" (folded, not a new line).

**2. The check.** `tools/generate/src/cli/ai/upgrade-check.ts` (`upgradeChecker`), handed to the edit layer as `EditOptions.upgradeCheck` by the host wherever it has a browser (`fidelity`) and a `publishedUrl` (control-app: `publicSiteUrl(siteKey, '/<page>.html')`). After the write it captures the component only (`[data-fc-module="<id>"]`; everything that neither holds nor sits inside it is made `visibility:hidden`, so nothing moves) on the **live published page** and on the draft preview, at 1280px and 390px, in each state the module declares (`BehaviorMeta.states`; account-chrome: signed-out, signed-in, operates-a-business), and values-diffs them (`diffManifests`, no new engine). Differences a step declares (`BehaviorMeta.upgradeIntents[v]`, each `{change, expects(difference, storedInstance)}`; account-chrome v3: the account link becomes the badge, the businesses link joins it in one row, both targets derived) are dropped; the rest is appended to the edit's answer as "UNEXPECTED VISUAL CHANGE: … [state, width] '<text>': <property> was X, now Y", with what the upgrade meant, a note that some may be the draft's own unpublished edits, and the instruction: restore within the new version's settings and tell the client plainly (operator details in bc), or file with ReportBug and call `hold_upgrade`. No live revision, or the component absent from it → no check. A check that cannot run says so.

**3. Hold (`hold_upgrade` tool, ManageComponents, consultant grant).** `editModuleHoldUpgrade` puts the instance back exactly as the live published revision holds it, with `upgradeHeld: {to, problem, issue?}` (new strict schema field). While a hold stands: edits leave the instance alone, an edit to it is refused ("held at version N … can't be edited until a fixed version ships or the hold is lifted"), and `publishSite` refuses with a definition error naming the component, the problem and the issue. A hold is for one version: once the catalog ships a version past `to`, the next edit upgrades the instance and drops the hold, and publish no longer refuses. The operator lifts a hold with `1c module upgrade <site> --write`.

**4. Production defect destination: `platform_issue` tickets in the platform tenant's store** (`apps/control-app/src/platform-issues.ts`). `developmentFor` takes a fallback project; the router passes `platformIssueProject` (stamped with the filing business) wherever there is no `DEVELOPMENT_TICKETS_URL`, so ReportBug / RequestCapability / AddTicketDetail work in production, unchanged in declaration and grant. Listed newest-first in the platform console ("Issues filed" section, `GET /api/admin/issues?business=…`, platform-owner only).

### Design decisions made during the build

- **The preview's `rev-<id>` channel is not a baseline.** It re-renders the frozen definition with today's code, upgrade included, so it would compare the upgrade with itself. The baseline is the bytes `public-site` serves.
- **Supersedes BUG-301's "no ReportBug in production"** (`test_UAT_FC_BUG-301_reportbug_clause_only_with_the_grant`'s production leg): production now has ReportBug, so the rule-11 filing clause is in its priming too.
- `hold_upgrade` is added to the closed write set pinned by `test_UAT_FC_REQ_126_offers_no_operation_that_could_write_markup_or_source` and `test_UAT_AC1073_everything_callable_is_declared_and_the_write_set_is_closed`.
- **A real finding on 1st Contact:** against the pre-BUG-299 published bytes, v3 moves the signed-out "Sign in" control from x=1087 to x=997 at 1280px — undeclared, so the check reports it. Not fixed here (it may be BUG-299's or a later layout change); it is what the consultant would be told on the next edit to that page.

### Test plan (as built)

- `tests/test_UAT_FC_REQ-484_component_upgrades.test.ts`
  - `test_UAT_FC_REQ-484_edit_saves_the_upgraded_instance` — v2 instance + label edit → stored at v3 with the label; answer and journal say so; no question.
  - `test_UAT_FC_REQ-484_declared_upgrade_change_is_not_breakage` (real Chromium; fixture `tests/fixtures/req484/` = 1st Contact's v2 draft and its home page as published by the pre-BUG-299 code) — the raw signed-in captures do differ on "Your account", and none of the declared changes is reported.
  - `test_UAT_FC_REQ-484_unexpected_visual_change_reaches_the_consultant` — a fixture v3 step that also repaints the signed-out control → finding names `[signed-out, 1280px] 'Sign in': color`, the 390px width, and `hold_upgrade`.
- `tests/test_UAT_FC_REQ-484_unfixable_upgrade.workers.test.ts` — `test_UAT_FC_REQ-484_unfixable_upgrade_reverts_and_reports`: upgrade saved, ReportBug through the platform-issue project, `hold_upgrade` → instance back to the published v2 with the hold, edit to it refused, publish refused, issue listed for the business.
- Known, pre-existing: REQ-473's authored-size budget is red on clean xgd-working (209,624 > 205,000); this change adds ~54 chars (rule 11). BUG-124's port test fails where a filing service is already listening on 8790.