---
uid: report-59d5fb62
id: REPORT-1804
type: report
title: 'Reconciliation Plan: BUG-33 builder control re-derivation (free-coded, test-only)'
created_by: xgd
created_at: '2026-08-10T11:14:17.481428+00:00'
updated_at: '2026-08-10T11:21:21.126999+00:00'
completed_at: null
last_field_updated: items
fields:
  report_kind: reconciliation_plan
  subject_uid: bug-ede1fb8c
  anchor_uid: bug-ede1fb8c
  items:
  - index: 1
    component: Builder workspace toolbar — control re-derivation and control lifetime
    item_type: upgrade
    story_points: 1
    dependencies: []
    story_uid: story-e674c60a
    target_story_ids:
    - story-e674c60a
    description: 'STORY-99 already states that the toolbar renders exactly the controls
      the active mode declares and re-derives them when the mode changes (AC-970).
      The code re-derives on a wider trigger and carries a second, load-bearing property
      that no criterion states: `createToolbar` subscribes `render` to BOTH `mode`
      and `site` (apps/control-app/src/builder/toolbar.js:101), and `render()` calls
      `disposeActions()` — which releases every panel subscription the outgoing controls
      took out and `replaceChildren()`s the strip — before rebuilding it. So (a) a
      site change rebuilds the whole strip, not just the one control whose target
      depends on the site, and every rebuilt control is constructed against the newly
      displayed site (the site selector re-reads `panel.getSite()` on create, so a
      site change from any source — selector, restore-from-storage, programmatic —
      is reflected in the toolbar itself); and (b) a control the strip replaced is
      inert by construction: its subscriptions die with it, so it stops updating and
      no stale callback accumulates for as long as the workspace stays open.'
    justification: 'No new capability bucket: this is the same toolbar surface STORY-99
      already owns, under CAP-85, extended in place — no new story, no parallel workspace
      behaviour. Existing coverage is partial, not absent, so this is an upgrade rather
      than a feature. AC-970 is the criterion that says WHEN the strip is re-derived
      and it names only the mode; AC-971 proves the open-in-new-tab target survives
      a site change but is scoped to that one control''s target, so nothing in the
      matrix says the strip as a whole is rebuilt on a site change, and nothing says
      a replaced control is released. Both facts are user-visible (every toolbar control
      belongs to the site on screen, including the selector''s own shown value; holding
      the workspace open does not accumulate detached updaters) and both are exactly
      what BUG-33''s free-coded commit had to establish to explain why a captured
      handle went stale. The code''s own docstring at toolbar.js:36-47 treats the
      disposal property as load-bearing — ''the pile grows for as long as the builder
      is open, every entry writing to an element no longer in the document'' — while
      the matrix is silent on it.'
    intent_delta_summary: 'Widen AC-970 from ''re-derives when the mode changes''
      to ''rebuilds whenever what is displayed changes — mode or site — with every
      control constructed against the current mode AND site'', and add one criterion
      for control lifetime: the controls a rebuild replaces are released with their
      panel subscriptions, so a replaced control stops updating and subscriptions
      do not accumulate while the workspace is open. No criterion is removed and no
      existing criterion is weakened: AC-970''s mode clause and AC-971''s target-identity
      guarantee both stand as written.'
    acceptance_criteria_changes:
      add:
      - 'The controls a toolbar rebuild replaces are released with it: a replaced
        control''s panel subscriptions are disposed, so it stops updating, and mounting/re-rendering
        the strip repeatedly does not accumulate live subscriptions against controls
        no longer in the document.'
      modify:
      - 'AC-970 (''The toolbar renders exactly the controls the active mode declares,
        and re-derives them when the mode changes'') — extend the criterion so the
        re-derivation trigger is every change to what is displayed, mode OR site,
        and each rebuilt control is constructed against the current mode and the current
        site. Verification extends the existing mode-switch assertions with a site
        change: after switching site, assert the strip''s controls are fresh instances
        and that a control whose content depends on the site (the site selector''s
        shown value) reflects the site now displayed, whatever changed it.'
      remove: []
---

# Reconciliation Plan — BUG-33 (bug-ede1fb8c)

**Mode**: commits
**Source**: free-coded commit `af78081b` — *fix(tests): re-read builder controls that the product rebuilds [FREE-CODED]*
**Anchor type**: `bug` — the anchor IS the intent, so `subject_uid = bug-ede1fb8c`.

## Step 0 — Intent

BUG-33's body and the commit message agree exactly, and both are emphatic about
the same boundary: **no product code changed.** The operator's stated intent was
to clear four red assertions in the builder suites that were all one defect
class — *the test holds a handle the product has since replaced, and asserts
against the detached survivor rather than what an operator touches.* The ticket
records that the originally-named five `reconciliation-copy-edit-gesture-modal`
failures had already gone green through intervening work, and that four other
red assertions in the same feature area turned out to be the same class and were
fixed instead.

Declared scope boundary, stated twice: *"Test-side only — no product code
changed"*, *"in every case the live control was already correct"*, and *"No
assertion was weakened"*. The diff confirms it — `package.json` (version
0.1.34 → 0.1.35) plus three test files, 18 insertions / 12 deletions, of which a
substantial share is explanatory comment.

The two product mechanisms the commit *diagnosed* (it did not introduce either):

1. **Rebuilt anchor.** `toolbar.js` subscribes `render` to both `mode` and
   `site`; `render()` → `disposeActions()` → `replaceChildren()` and a new
   anchor. A handle captured before the rebuild is a detached survivor whose
   subscription was already disposed.
2. **Auto-opened control.** `openLoneControl` (`editor.js:350`, landed in
   `86dce8ffe` / REQ-121, one day *after* the affected UATs were generated)
   opens a one-field form straight into its control, so the `.fields-value`
   VIEW those tests clicked no longer exists, and the value now lives in an
   input's `value` rather than the modal's `textContent`.

## Step 1 — Behavior inventory

```yaml
behavior_inventory:
  source: "free-coded commit af78081b (test-only) + the product code it asserts against"
  entry_files:
    - "apps/control-app/src/builder/toolbar.js"
    - "apps/control-app/src/builder/panel.js"
    - "apps/control-app/src/builder/editor.js"
    - "tests/req115-builder-composition.test.ts"
    - "tests/reconciliation-copy-edit-gesture.test.ts"
    - "tests/req117-edit-loop-browser.test.ts"
  features:
    - name: "Toolbar strip re-derivation"
      description: >-
        createToolbar creates the root element once and re-populates it. render()
        reads the active mode's declared action ids, calls disposeActions()
        (release every subscription the outgoing controls took out via the
        injected `subscribe`, clear the mounted map, replaceChildren()), then
        constructs each declared action fresh. It is wired to fire on BOTH panel
        events: `[panel.on('mode', render), panel.on('site', render)]`.
      behaviors:
        - "A mode change replaces the strip's contents with the new mode's declared control set."
        - "A SITE change also replaces the whole strip — every control, not only the site-dependent one."
        - "Each rebuilt control is constructed against current state: siteSelectorAction reads panel.getSite() in create(), so the selector's shown value follows a site change from any source (selector, restore(), programmatic setSite)."
        - "A control the rebuild replaced has its panel subscriptions disposed with it — it stops updating, and subscriptions do not pile up for as long as the workspace stays open."
        - "A mode naming an unregistered action throws rather than rendering a partial strip."
      entry_point: "createToolbar / render / disposeActions (toolbar.js:23-105)"
    - name: "Panel emission ordering"
      description: >-
        setMode and setSite both call refresh() — which updates currentSrc and
        emits `src` — BEFORE emitting `mode` / `site`. The replacement control is
        therefore constructed with the correct URL already in hand, so there is
        no ordering in which the link and the frame disagree.
      behaviors:
        - "src is emitted before mode/site, so no rebuild observes a stale URL."
        - "setSite/setMode are no-ops when the value is unchanged."
      entry_point: "panel.js setMode/setSite (104-119)"
    - name: "One-field form opens in its control"
      description: >-
        openLoneControl fires the shared component's own click-to-edit
        affordance when the derived schema has exactly one field, so the box is
        typable on open. With two or more fields (an image's handle + alt) it
        opens none, because there is no \"the\" field.
      behaviors:
        - "A one-field form opens with the control present, holding the region's current words, with no second click."
        - "Opening (and closing unchanged) writes nothing and re-renders nothing."
        - "A two-field form opens neither field into its control."
        - "Consequence for any observer: the value is the control's value, not the modal's text."
      entry_point: "openLoneControl (editor.js:350)"
```

## Step 2/3 — Coverage map

```yaml
coverage_map:
  - feature: "Toolbar strip re-derivation"
    status: partial
    existing_stories: ["story-e674c60a"]   # STORY-99, CAP-85
    existing_acs: ["AC-970", "AC-971"]
    gaps:
      - "AC-970 names only the mode as the re-derivation trigger; the code also re-derives on every site change."
      - "No criterion states that a replaced control is released with its subscriptions — the property toolbar.js:36-47 calls out as load-bearing, and the exact reason a captured handle goes inert."
    notes:
      - "AC-971 covers the open-in-new-tab TARGET across a site change ('It stays identical after a mode change and after a site change'), but is scoped to that one control's target — it does not say the strip is rebuilt, nor that other controls follow the site."
  - feature: "Panel emission ordering"
    status: covered
    existing_stories: ["story-e674c60a"]
    existing_acs: ["AC-971"]
    gaps: []
    notes:
      - "AC-971 states it directly: 'with no ordering in which the two can disagree'. Nothing to add."
  - feature: "One-field form opens in its control"
    status: covered
    existing_stories: ["story-3bf94bd4"]   # STORY-101, CAP-87
    existing_acs: ["AC-1044", "AC-1004", "AC-997", "AC-998", "AC-999", "AC-1000"]
    gaps: []
    notes:
      - "AC-1044 already documents openLoneControl exactly, including the two-field carve-out and the 'opening is not an edit' clause: REQ-121 was reconciled before BUG-33 was raised."
      - "AC-1004 ('Copy that overflows ... still legible in full in the form field') covers what req117-edit-loop-browser now reads off the control via inputValue(). Reading it off the CONTROL rather than the modal's textContent is the correct reading of AC-1044 + AC-1004 together, not a new behaviour."
```

## Step 3b — Intent scope vs implementation footprint

**Case 1 — implementation matches intent scope.** The declared scope is
test-side only, and the diff touches exactly that plus the version bump. No
product file is modified, so there is no unintentional-regression surface and no
explicit supersession of a prior intent.

The one thing worth recording: the free-coded commit is a *test-side correction
toward the matrix*, not away from it. Both mechanisms it accommodates were
already the documented intent — AC-971 for the link's target across a site
change, AC-1044 for the lone control — and the tests had simply been written
against the pre-REQ-121 shape and against a captured handle. The one place the
code's own narrative and the matrix diverge is AC-970's trigger, which is what
plan item 1 closes.

## Plan items

| # | Component | Type | Points | Deps | Description |
|---|-----------|------|--------|------|-------------|
| 1 | Builder workspace toolbar — control re-derivation and control lifetime | upgrade (STORY-99 / `story-e674c60a`) | 1 | — | Widen AC-970's re-derivation trigger to mode **or** site, and add a criterion for control lifetime: a replaced control is released with its panel subscriptions |

**One item, deliberately.** The commit changes no product behaviour, so there is
nothing to *add* to the matrix beyond the single trigger/lifetime gap that its
diagnosis surfaced. A second item covering `openLoneControl` or the
open-in-new-tab target would duplicate AC-1044 and AC-971 respectively, and an
item covering "the tests now re-read their handles" would be a test-only story,
which is prohibited. Coverage of the fixed assertions is not a capability.

## Observations

- **The defect class is a matrix signal, not just a test smell.** Four
  independent assertions failed the same way because two product properties —
  *the strip is rebuilt on more than a mode change* and *a replaced control is
  released* — are true of the code and absent from the criteria the tests were
  generated from. Stating them is the reconciliation; it is also what stops the
  class recurring the next time UATs are generated for this surface.
- **Stale comment, not a defect, and out of scope.** `toolbar.js:100` reads
  `// Re-render on every mode change` immediately above a line that subscribes
  to both `mode` and `site`. The docstring 60 lines above it is correct ("on
  every mode and site change"). No code change is proposed here — recorded so the
  divergence is on the record.
- **REQ-121 landed one day after the UATs it invalidated** (`86dce8ffe`,
  2026-08-07; UATs generated `3516bca3e`, 2026-08-06). The matrix absorbed the
  change (AC-1044) but the already-written UATs did not, and nothing re-checked
  them. That timing, not the code, is the whole cause of the copy-edit half of
  BUG-33.
- **FC naming is ambient in this repo, not orphan debt.** The injected
  `fc_tests` list is empty, but two of the fixed assertions are FC-named
  (`test_UAT_FC_REQ-115_*`, `test_UAT_FC_REQ-117_*`); ~1028 distinct
  `test_UAT_FC_*` names exist across `tests/`. This is the TypeScript suites'
  standing convention, well outside BUG-33's scope, and no plan item touches it.
- **Uncertainty, stated.** Whether the toolbar's control-release property
  deserves its own criterion or a clause on AC-970 is a judgment call. It is
  proposed as its own criterion because its verification is different in kind
  (count live subscriptions across repeated rebuilds, rather than compare
  rendered ids), and because it is the property whose absence from the matrix
  cost four assertions.
- **`req115-builder-shell.test.ts` flake** is recorded in BUG-33 as load-induced
  (timed out once in a 13-file parallel run, passed in isolation and in the
  8-file run). Not addressed by the commit and not a matrix gap; noted so it is
  not mistaken for coverage introduced here.