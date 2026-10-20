---
uid: request-3083c779
id: REQ-415
type: request
title: 'Visual checks: the host looks after every build, and the final stages need
  every changed page looked at on desktop and phone'
created_by: EPIC-19
created_at: '2026-10-20T13:28:28.517314+00:00'
updated_at: '2026-10-20T14:09:28.168263+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  story_points: 8
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-9d553ad7
  commits:
  - working_sha: fbb8de3600af2215123607d6ca02c9e2ef07ee13
    reconcile_sha: null
    main_sha: null
  - working_sha: 75b3bc2f1008c602ef371837aa3f0c91a3c9eea9
    reconcile_sha: null
    main_sha: null
  version: 0.2.551
---

## Symptom (Bob's salon 2, 2026-10-20)

The operator opened the Prices page just before publishing: the colour price
table was misaligned (every treatment name had slid up a row beside the wrong
prices) and the sections had ragged, inconsistent edges. The consultant had
signed the page off. Asked why, it gave five causes (transcript, 03:45 UTC):

1. It checked the page's **words** against the menu and called that checking the
   page. The table was right in the data and wrong on screen: it was built as
   columns, and an empty first cell in the name column took no height.
2. Its tools price screenshots as "the most expensive thing I can do", so it
   treated that as permission not to look.
3. It looked only where the client was looking (home); the prices page got no look.
4. It reused a word check from several turns earlier as a sign-off.
5. It took the page map's zero warnings as a visual review.

## The cost model this ticket rests on (operator, 2026-10-19)

> processing is cheap, networking (downloads) are cheap, TOKENS ARE COSTLY.
> So screenshots are super cheap - having the principal look at them is costly
> but clearly necessary … the principal MUST check the work - PARTICULARLY in
> the final stages.

So: spend host processing freely to make the consultant's looking targeted, and
never discourage the consultant from looking at delegated work.

## What changes

1. **Correct the screenshot pricing prose.** REQ-284's wording in
   `fidelity-surface.json` ("Looking is the most expensive thing you do, and you
   pay for it again on every turn…") is untrue since REQ-168 (images age out
   after two turns) and steers the consultant away from checking builds. Replace
   it with: looking costs context and ages out after two turns; looking at what a
   builder made is part of the build, not a luxury. Keep "use `list_changes` for
   *what landed?*" — that ranking is still right. Update the REQ-284 UATs that pin
   the old wording, and the comps section's "take screenshots sparingly" where it
   reads as general advice.
2. **After every builder session that writes a page, the host looks first.** It
   renders each changed page at the client's viewing width (REQ-388; desktop if
   unknown) and attaches the screenshot to the `Delegate` result, plus a short
   text **layout report** (item 3). The consultant receives the picture without
   having to decide to ask for it. Low-detail JPEG per BUG-229.
3. **A mechanical layout check**, run in the same render, at desktop and phone
   widths, reported as plain lines naming the section:
   - content wider than the viewport / the page scrolls sideways;
   - overlapping boxes, or text clipped by its container;
   - an empty or collapsed section;
   - sibling sections on one page with different left/right edges;
   - a table built from columns where an empty cell breaks row alignment (cells in
     the same row index not vertically aligned);
   - row content split across separate columns.
   The same findings appear in the page map's warnings (`describe_page`).
   A builder's result with layout findings on a page it wrote is **not done**:
   the consultant fixes it in the same turn (REQ-409's continuation applies).
4. **The host records what the consultant has looked at.** For each page, the
   draft revision and widths at which the consultant last took a screenshot of
   it. A look is stale once the page changes.
5. **"Finishing touches" and "Ready to publish" can't be marked done** while any
   page has changed since it was last looked at on both desktop and phone. The
   refusal names the pages and widths. The per-turn plan notice lists pages
   "not looked at since they changed" once the build is in those stages.
6. **Price tables are built as rows.** Builder guidance: a list of items with
   prices is one row per item (name and its prices in the same row), never
   parallel columns. Preferably the page format gains a typed row-based table
   element; if that's a larger change, record it on EPIC-24/L1 and do the
   guidance now.

The consultant's priming already carries the matching rule ("Does it look
right?", committed `b174ff6e8e` without a ticket as a prompt change); this ticket
makes it enforced rather than remembered.

## Test plan

- A scripted builder that writes a page: the `Delegate` result carries a
  screenshot of that page and a layout report.
- Layout check fixtures: a page that scrolls sideways at phone width, a
  column-built price table with an empty first cell, and siblings with different
  edges each produce the named finding; a clean page produces none.
- After a screenshot of `prices` at desktop and phone, then a write to `prices`,
  `set_stage` to Ready to publish is refused naming `prices`; after a fresh look
  at both widths it succeeds.
- The fidelity surface prose no longer says looking is the most expensive thing;
  the REQ-284 UATs are updated to the new wording.

## As implemented (free-coded, 2026-10-20)

1. **Prose.** `fidelity-surface.json` (overview, `screenshot` summary and description,
   the group line), `l1-surface.json` (`list_changes`) and `priming.json`
   (`interrupted-turn`, both comps sections) no longer call looking the most
   expensive thing. They now say a picture costs context for the next two turns and
   then ages out; that looking at what a builder made is part of the build; and that
   a page is looked at on desktop and phone before it is called ready.
   `list_changes` / `compare` stay the instruments for *what landed?* and
   *do these match?*. The comps line now reads "look at a comp's picture when what
   you are discussing is how it looks". The REQ-284, REQ-218 and REQ-378 UATs pin
   the new wording.
2. **The host looks after every build.** Wrapped around the consultant's `Delegate`
   tool (host-core `hostLook`). For each page in `account.changed.differences`
   (email pages excluded), the host does two things:
   - It runs the layout check.
   - It takes the consultant's own `screenshot` at `viewport: client` (desktop if
     no width was reported), with `tiles: all` and `detail: low` (the JPEG
     encoder, BUG-229). At most 3 pages are pictured; the rest are named.

   The tool result becomes content blocks, in this order:
   - the builder's result, unchanged, fence included;
   - the host's report;
   - the pictures.

   `delegationResult` reads the first block, so cadence and turn-clock consumers are
   unchanged.
3. **Layout check** (`tools/generate/src/cli/ai/layout-check.ts`, `LAYOUT_SCRIPT`).
   It runs in Chromium at desktop (1280px) and phone (375px) over the draft preview.
   Sections are found the way `SECTIONS_SCRIPT` finds them, and are named by stored
   section id when the page is stored as sections, otherwise by address. Findings:
   - `sideways`: content wider than the screen.
   - `overlap`: text drawn on text.
   - `clipped`: text cut off by an overflow box.
   - `collapsed` / `empty`: a section with no height, or nothing in it to see.
   - `edges`: a section whose content box differs from the most common one among
     its non-full-bleed siblings.
   - `misaligned_rows`: a list built as side-by-side columns whose entry counts
     differ or whose row tops differ by more than 4px. An empty cell taking no
     height is called out.
   - `split_rows`: the same column-built list, even when it lines up.

   A column list counts only if it has at least 2 columns of at least 3 single-line
   entries, and at least one column is mostly numbers. That keeps footer link
   columns from being flagged. Every finding is one plain line, e.g.
   `prices, phone (375px): section colour-prices has a list built as 2 side-by-side columns, and its rows do not line up from row 1 …`.

   The same lines appear as `warnings` on `describe_page` (scoped to the section when
   the map is). They are absent where there is no browser. A page with findings is
   **not done**:
   - the host's report says "THIS BUILD IS NOT DONE";
   - if the consultant's reply ends while findings from this request's builds are
     outstanding, the host continues the request with `layout-continuation-cue`,
     listing them, on REQ-409's terms (`MAX_CONTINUATIONS`, spend ceiling);
   - a later host look that finds the page clean clears it;
   - every new client message starts clean.
4. **Looks are recorded on the plan.** `looked_at[pageId][desktop|phone] = change counter`.
   Every `screenshot` of a draft page by the consultant's camera is recorded. That
   includes the host's own look after a build, because the consultant receives it.
   A builder's camera is not recorded. A width of 480px or less counts as phone and
   1024px or more as desktop; tablet widths count as neither. A look is stale when
   the change log since it has a record for that page, or a site-wide paint change
   (`palette.*`, `config.set`). It is also stale if the log is truncated.
5. **The publishing stages wait.** `set_stage` refuses with `NOT_LOOKED` if the
   call would tick Finishing touches done, or start or tick Ready to publish, while
   any served page (excluding email pages and unchosen looks) has changed since it
   was last looked at on desktop and phone. A stage moving forward also ticks the
   stage before it (BUG-221), so that path is caught too. The refusal names the
   pages and widths. Starting Finishing touches is allowed. Once the plan is near
   publishing, the per-turn plan entry says
   `Not looked at since they changed: home (desktop, phone); prices (phone). …`.
   Plan surface `surface_version` is now 2, l1 is 20 and fidelity is 9.
6. **Price tables.** The builder's priming now says a list of items with values is
   built as one row per item, never as parallel columns, and that a page it wrote is
   not finished while `describe_page` has warnings. **Not done here:** a typed
   row-based table element in L1. This store has no L1 epic, and EPIC-24 is about
   builder concurrency, so the deferral is recorded here, not filed there.

## Test plan (as run)

- `tests/test_UAT_FC_REQ-415_layout_check.test.ts`: real Chromium over real
  L1-rendered pages. A clean page has no findings. A 600px banner is `sideways` at
  phone only and named by section. A column-built price table with an empty first
  cell is `misaligned_rows`. An aligned column table is `split_rows`. A 700px
  section among 900px siblings is `edges`.
- `tests/test_UAT_FC_REQ-415_the_host_looks.workers.test.ts`: the real route in
  workerd, with a fake browser and a scripted model.
  - A builder writes `prices`. The `Delegate` result carries an image, the fenced
    builder result first, and a report naming `prices, phone (375px): section 0.0 …`
    with "THIS BUILD IS NOT DONE". The host continues the request with the finding.
  - Looks at both pages and widths, then a builder write to prices. `set_stage`
    ready_to_publish is refused naming `prices (phone)` and not home; the host's
    desktop look counts. After a phone look it succeeds.
  - Near publishing, the next message's plan entry lists the unlooked pages.
  - `describe_page` carries `warnings`.
- Updated pins: REQ-284, REQ-218, REQ-378 (wording) and REQ-356 (plan schema gains
  `looked_at`).
- Regression: the delegation, plan, stage, fidelity, priming, surface and
  `describe_page` suites. Failing pre-existing on clean xgd-working:
  - REQ-295 delegation (workers);
  - REQ-180, REQ-341, REQ-349, REQ-391, AC1249;
  - the Node-host `logDir` suites (REQ-122, REQ-174, reconciliation-assistant-conversation*).