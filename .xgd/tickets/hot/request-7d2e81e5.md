---
uid: request-7d2e81e5
id: REQ-460
type: request
title: 'Site structure: the principal plans the pages before the first build (home
  answers where/when/how much, the story and full menu get their own pages), and the
  home page has a checked length budget'
created_by: EPIC-19
created_at: '2026-10-25T18:32:43.718010+00:00'
updated_at: '2026-10-25T20:11:46.305073+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  parent_uid: epic-95bc3b15
  story_points: 5
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-a5fa5ba0
  commits:
  - working_sha: 815512712f6c1302361acd90ae176339c3be785f
    reconcile_sha: null
    main_sha: null
  - working_sha: b7146a2e750cc2edd7cc8b14e0ff9d5223c83847
    reconcile_sha: null
    main_sha: null
  version: 0.2.644
---

## Why

First-Draft-Test Dina's Diner 2 (25 minutes, $5.48) is the first draft the
operator called "not terrible". But:
- **The home page is one long page**: nine sections, **12.4 phone screens** at
  375px (8,280px) and 12.8 screens at desktop. Hero, story, coffee, menu, Dino
  burgers, who stops, reviews, catering, find us.
- **Dina's story is still the second section**, ahead of the menu, prices and how
  to find the place. REQ-457's visitor-first priming was deployed for this run and
  didn't change it. The consultant follows the plan decision "steak and eggs opens
  the page; next comes the room itself" and attaches the story to the room photo.
- The operator: "I'm not sure that Dina's story should be what we lead with, and
  the page is long… would it make sense to split it?"

Priming alone hasn't moved this twice, so this ticket makes the site's structure a
decision the principal makes on purpose, and gives the home page a budget that is
checked.

## What changes

### 1. The principal plans the site's pages before the first build

- Before the first `Delegate`, the consultant records a **site structure**
  decision: the pages, what each is for, and the order of the home page's
  sections. It is written from the content it has (story, menu, catering, reviews,
  directions) and the visitor's decision from the positioning card. It is shown to
  the client in one line ("Home, Menu, Our story and Catering. Home answers what,
  where, when and how much"), and the client can change it.
- **Home answers the visitor first:** what it is, where (town, how far), when
  it's open, how to get there or call, and what it costs (menu highlights with
  prices). Then proof (reviews), with **teasers that link to the deeper pages**
  (the story, the full menu, catering).
- **Content that serves the curious, not the hurried, gets its own page:**
  - the owner's story and history ("Our story");
  - the full menu;
  - a business-within-the-business, such as catering, as already decided for
    Dina.
- REQ-448's `design_first` gains a sibling, **`structure_first`**: the first
  build is refused until a structure decision exists.

### 2. The home page has a length budget

- A configured budget for the home page's height (for example **at most about 6
  phone screens** at 375px, in `layout-check.json`). The layout check reports a
  home page over budget, and it holds like the other faults. The consultant's fix
  is to move content to a deeper page, not to cram it.
- Other pages have no budget. Long is fine where the visitor chose to read.

### 3. The critic checks the order

- The cold read (BUG-271) already reports the visitor's order. The informed
  review treats "the visitor's answers (where, when, how much) come after the story
  or below the third screen" as a **high** messaging finding.

## Test plan

`tests/test_UAT_FC_REQ-460_the_site_is_structured_for_the_visitor.*`:

- A first `Delegate` on a site with a design but no structure decision is refused
  `structure_first`. After the decision, it is accepted.
- The structure decision is visible to the client, and changeable as a plan
  decision.
- A home page fixture taller than the budget at 375 is reported and holds. One
  within it is not reported.
- The critic rubric names the visitor-order rule as high-severity messaging.
- Re-run the REQ-448, REQ-457, BUG-271 and REQ-429 UATs.


## What landed (free-coded)

### 1. Site structure before the first build
- The structure decision is the plan's existing `pages_navigation` decision, retitled **"Site structure"** (kept short: every open decision's title rides the per-turn plan entry, which has a character cap). Its `value` is the pages, what each is for, and the home page's section order.
- `Delegate` is refused **`structure_first`** while no first pass has landed and that decision has no value — checked after `design_first`. The refusal says how to plan it (`set_decision` as `pages_navigation`; home answers what, where, when, how to get there or call, and what it costs first, then proof with teasers; the owner's story, the full menu and a business-within-the-business each get their own page) and to tell the client in one line. A site already built is not held to it.
- `set_decision` on `pages_navigation` with a value returns a `say`: tell the client the structure in one line, in their words, and that they can change it; when they do, record their version with `set_decision`. The same guidance is in the `set_decision` op description (not the priming, which is at its budget).
- Replayed builder cases (REQ-452/454) recorded before this rule have their plan's copy stamped with a structure, as pre-design cases are stamped with a design, so replays are not refused for a rule that did not exist.

### 2. Home page length budget
- New layout check `home_length` (finding kind `long_home`), configured in `layout-check.json` as `{ maxWidthPx: 480, maxScreens: 6 }`: on screens up to 480px wide, the home page taller than 6 screen heights is reported for the page as a whole, saying how many screens it is and to move what serves the curious to its own page with a teaser rather than cram it. It holds the hand-back like every other layout fault. Desktop, tablet and other pages have no budget.
- The host tells the in-page check which page is home (`homePageOf`, the renderer's rule) through the existing "given" script, so `LAYOUT_SCRIPT` stays one constant.

### 3. Critic
- The informed review's Messaging lens: a home page whose visitor's answers (what it is, where, when it is open, how to get there or call, what it costs) come after the owner's story or below the third phone screen is **high**. The home length check is also listed among the faults "checked elsewhere".

## UATs
- `tests/test_UAT_FC_REQ-460_the_site_is_structured_for_the_visitor.workers.test.ts` — a first Delegate with a design but no structure is refused `structure_first`, then commissioned once the structure is recorded; the structure write tells the consultant to say it in one line and the client's change replaces it; the home page is handed `home: true` and a `long_home` finding holds the hand-back.
- `tests/test_UAT_FC_REQ-460_the_site_is_structured_for_the_visitor.test.ts` — real Chromium (skipped where none can launch): a tall home page is reported at phone only, a short one is not, the same tall page not home is not; the critic rubric carries the visitor-order rule as high-severity messaging.
- Fixtures meaning "ready to build" now also plan the structure: `designWritten()` in `tests/support/d1-site-factory.ts`, the REQ-452/454 plan fixtures, and REQ-448's scripted first build.