---
uid: request-202e5585
id: REQ-442
type: request
title: 'Input board: a clean first look — empty sections collapsed as ''(none yet)'',
  quiet empty lines, comparison instructions only with sites; a drafted site opens
  on View'
created_by: EPIC-19
created_at: '2026-10-24T00:29:00.127956+00:00'
updated_at: '2026-10-24T14:55:55.931379+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  parent_uid: epic-95bc3b15
  story_points: 2
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-b89e6fdc
  commits:
  - working_sha: a31301d6e70cf1ac786a40055112ca3467f1d7fe
    reconcile_sha: null
    main_sha: null
  - working_sha: 1d816d874bca28fccdad2898bae37edc5194bcea
    reconcile_sha: null
    main_sha: null
  version: 0.2.607
---

## Why

On the Input board (REQ-433), the **Comparison sites** section with no sites
shows:

> Open each site and have a look around — how it moves and how it feels on your
> phone matters as much as how it looks. Then tell the consultant what you think:
> send a note, or skip the site.
>
> No comparison sites yet. Add one you know below, or ask in the chat for some to
> look at.
>
> [Add a site you like] [Add] · [Skip]

The operator: "There's a lot of content here for a situation where there are no
sites." The instructions (`COMPS_INTRO`) are about sites that are not there yet,
and the empty line (`COMPS_EMPTY`) reads like more instructions instead of a
quiet empty state.

## What changes

- **The instructions show only when there is something to follow them on.**
  `COMPS_INTRO` ("Open each site and have a look around…") is hidden while the
  comparison board has no sites, and appears as soon as the first site is on it.
- **The empty line is a quiet placeholder:** centred and grey (the builder's muted
  text colour), with no other emphasis. It disappears as soon as there is a site.
  Its wording stays `COMPS_EMPTY`.
- **The same empty-state treatment in all three Input sections,** so the board
  reads consistently:
  - Questions: "No questions yet" (`PLAN_NO_QUESTIONS_YET`);
  - Stories: `STORY_EMPTY`;
  - Comparison sites: `COMPS_EMPTY`.
  Each empty line uses one shared style, centred and grey, and is gone once the
  section has content. Any section intro that only makes sense with content is
  hidden while the section is empty.
- **Unchanged:** the "Add a site you like" box and its Add button stay, so the
  client can add the first site. The board-level Skip stays, because skipping the
  board settles "Looking at other sites" (REQ-432).

## Test plan

`tests/test_UAT_FC_REQ-442_quiet_empty_sections.*`, using jsdom on the Input board,
plus one Playwright style check:

- With no sites: no `COMPS_INTRO` text is rendered, and the `COMPS_EMPTY` line is
  shown with the shared empty-state class. The add box and Skip are present.
- After a site is added: `COMPS_INTRO` is shown and the empty line is gone.
- Questions and Stories, empty: their empty lines use the same shared class. With
  content, the empty lines are gone.
- Playwright: an empty line computes to `text-align: center` and the muted text
  colour.
- Re-run the REQ-433 Input board UATs.

## Part two (added 2026-10-23): a clean first look, and the right opening mode

The operator: "I'd like the opening look to be a bit cleaner — there's a lot of
'stuff' that just says 'nothing here yet'."

### 4. Empty sections start collapsed and say so in their header

- On opening, **a section with no content starts collapsed**, as a complete one
  does (REQ-433). An empty board therefore opens as three header lines:
  - **Questions (none yet)**
  - **Stories (none yet)**
  - **Comparison sites (none yet)**
- "(none yet)" is the header's state for an empty section, in place of the counts
  and "Complete" that REQ-433 shows. It is replaced by the count as soon as the
  section has content ("Questions (2 unanswered)"), live, with no reload.
- Expanding an empty section by hand shows its quiet empty line (section 1 above)
  and, for Comparison sites, the add box and Skip.
- When a section gains content while Input is open, it does not jump open or
  closed under the client. Its header updates, and the expand rule applies on the
  next opening. A link to the section still expands it (REQ-433).
- The "Your input" summary lines follow the same states.

### 5. A site with a first draft opens on View

- **Before the first draft**, opening a site shows **Input**, as today
  (`storyFirst()`, REQ-408).
- **Once the site has a first draft** (`view.drafted`), opening it shows **View**.
  This holds even if the client last left the preview on Input or Looks. On
  1stcontact (which has a draft) the builder currently reopens on Input, because
  the remembered mode (`panel.restore()`) wins once `drafted` is true.
- A link that names a target (`#show=…`) still opens where it points.
- Switching modes during a visit works as now. The opening rule decides only what
  a fresh opening shows.

### Test plan (part two)

- An empty board on opening: three collapsed sections whose headers read "(none
  yet)", with no empty lines visible until a section is expanded.
- Adding a question while Input is open changes that header to its count without
  expanding the section. Reopening Input then expands it.
- Opening a drafted site whose stored mode is Input (or Looks) shows View.
  Opening an undrafted site shows Input. Opening with `#show=comps` shows Input at
  the comparison sites.
- Re-run the REQ-408 opening UATs and the REQ-433 expand/collapse UATs.


## As implemented (2026-10-23)

- **Empty is per section** (`input-board.js`, `empty(view)`): Questions — no
  open/answered/skipped asks; Stories — no notes, no headline offered or chosen,
  and no position card; Comparison sites — no sites. An empty section's header
  reads "Title (none yet)" (`INPUT_SECTIONS[*].empty`), is muted like a Complete
  one, and starts collapsed when Input is opened.
- **"Your input" summary on an empty board:** hidden while all three sections
  are empty, so an empty board is exactly three header lines. Shown again as soon
  as any section has content. (The chat column's "How you can help" is unchanged.)
- **One shared empty-line class, `input-empty`**, on "No questions yet",
  `STORY_EMPTY` and `COMPS_EMPTY`: `.input-view .input-empty` centres the line in
  `--shell-fg-muted`, normal style and weight, overriding each component's own
  empty colour. It is placed beside the Input view rules in `builder.css`, outside
  the story-board section that REQ-408's palette test reads.
- `COMPS_INTRO` is hidden while the board has no sites.
- **Opening mode** (`storyFirst` in `app.js`): decided once per site opened, from
  the first plan view read. Drafted → View, whatever mode was stored (Input,
  Edit, or Looks); undrafted → Input, as before. Any link into Input
  (`openInput`) or any `#show=…` target followed before that first view counts
  as the decision, so it is left where it points.
- **REQ-433/REQ-431 UATs updated where this ticket supersedes them:** the empty
  board test now expects "(none yet)" and collapsed sections; the two "remembered
  mode restores as Input" tests check the restored mode before the plan is read,
  because a drafted site now goes to View once it is. REQ-408's
  `a_drafted_site_opens_where_the_client_left_it` still passes, but its name
  describes the behaviour this ticket replaces (it now opens in View).

### Tests

`tests/test_UAT_FC_REQ-442_quiet_empty_sections.test.ts` (jsdom on the real
builder, plus a Chromium style check): the empty board opens as three collapsed
"(none yet)" headers with no visible empty lines and no summary; the empty lines
share `input-empty` and go once there is content; `COMPS_INTRO` appears only with
a site, while the add box and Skip stay; content arriving while in Input changes
the header without expanding, and reopening expands; a drafted site opens in View
from stored Input or Edit, an undrafted one in Input; a `#show=comps` link
followed before the first view stays on Input; in Chromium every empty line is
`text-align: center`, in the muted colour, normal style and weight.