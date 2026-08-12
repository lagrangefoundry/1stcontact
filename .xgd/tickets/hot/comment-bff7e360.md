---
uid: comment-bff7e360
id: COMMENT-917
type: comment
title: Comment on request REQ-132
created_by: xgd
created_at: '2026-08-12T00:39:19.612744+00:00'
updated_at: '2026-08-12T01:06:24.071192+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-5946d045
  kind: chat_transcript
---

<!-- xgd-turn id="21da9886-3a89-4001-b44c-986cbf762aaa-user" -->

<!-- xgd-chat role="user" ts="2026-08-12T00:39:15.622078+00:00" -->
#### You
I want to extend the image pick up or improve I should say the image picker. What I expect from this interface is for it to show thumbnails of the images and the file name underneath them. The path to the file is irrelevant because these images will not be stored in a file system.

<!-- xgd-turn id="21da9886-3a89-4001-b44c-986cbf762aaa-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-12T00:42:28.940386+00:00" -->
#### Claude
I'll start by reading the ticket and finding the image picker code.

I have the picture. Current picker: `copyFieldsOf` emits an `enum` of raw handles (`/assets/hero.png`), and `mountFields` renders that as a native `<select>` of path strings. Let me record the scope on REQ-132.

Scope recorded on REQ-132. Summary of what I'm proposing, with the two decisions worth your sign-off:

**The change** — the image modal (both the `image.src` picker from REQ-118 and the container-background picker from REQ-128) renders a grid of thumbnails with the file name underneath each, instead of a `<select>` of `/assets/…` paths.

**Decision 1 — the picker leaves `mountFields`.** `@lagrangefoundry/webui-fields` is installed from lagrange-framework, out of this repo, and its enum control is a native `<select>`. It *does* have a `enum + format:'color'` → swatch-grid pairing, which is exactly the shape we want, so the honest long-term home for a thumbnail grid is upstream. In the meantime the modal renders picker fields itself and still hands `alt` to `mountFields`; both halves merge into one change map so Save is still one diff. Descriptors get `format: 'image'` so the day upstream adds the control, the wire shape already matches.

**Decision 2 — the stored value is untouched.** Tiles still commit `/assets/hero.png`; only the label is the basename. Assets not being on a filesystem later changes what a handle *means*, not what L1 holds today, so nothing about the write path moves.

Two smaller calls I made rather than asked: a thumbnail that fails to load still renders as a named, selectable tile (the segment's current handle may be an off-site URL the fold never mirrored — a tile that vanished would strand it), and duplicate basenames across asset sub-directories are left as duplicates with the full handle on the tooltip rather than putting path fragments back on screen.

Say go and I'll cut the branch and build it — or tell me if you'd rather the tiles carried anything else (size, dimensions, an "unused" marker), since that's cheap to add now and awkward later.

<!-- xgd-turn id="721e0064-6b2e-4944-a03c-db63e9b2d6f5-user" -->

<!-- xgd-chat role="user" ts="2026-08-12T00:44:30.134810+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="721e0064-6b2e-4944-a03c-db63e9b2d6f5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-12T01:03:53.915602+00:00" -->
#### Claude
Now let me implement. Starting with the descriptor.

Now the asset URL helper in `api.js`:

Now the picker control itself:

Now wiring it into the modal:

Now the styles:

Now the UAT suite:

Now the test suite:

Three real bugs found. Fixing:

All 12 pass. Now the suites that encoded the old `<select>`:

Now the gesture-modal AC-1050 assertions:

Now the full suite and quality gate:

Pre-existing failures (they fail identically on a clean tree — those suites need a live model credential). Now the quality gate:

Green. Committing:

Now updating the ticket body to match what was actually built, then promoting to `free_coded`:

Done. REQ-132 is at `free_coded`, commit `7ca8280`, version 0.1.36.

**What shipped**

The image modal — for both an image segment's `src` and a painted panel's `backgroundImageUrl` — now renders a grid of thumbnails labelled with file names instead of a `<select>` of `/assets/…` paths. The handle is still what a tile commits; only the label is a projection.

Three implementation notes worth your attention:

**The picker left `mountFields`, as flagged.** The modal now splits its schema by descriptor — `format: 'image'` fields draw here, everything else goes to the component untouched. Both halves flush through one Save, so one modal is still one diff.

**Two bugs the tests caught, not review.** Handed the whole values map for a one-field schema, `mountFields` reports *every* key back from `getValues()` — including `src`, at the value the dialog opened with. Merged into the change map, that read as an explicit "put the old image back" and silently undid every pick. It's fixed twice over: the component is handed only the fields it renders, and the pickers are spread last where the change map is built. Separately, focusing the grid before the dialog was appended did nothing at all — focus doesn't move to a detached element, and it fails silently.

**Three existing assertions encoded the `<select>`** (AC-1043, AC-1044, AC-1050). I updated them to assert the same criteria against the new control rather than adding a compatibility path — the closed list, the pre-selected current value, no free-text route. AC-1044's "two fields open none" now counts across the dialog rather than across `.fields-row`, since an image's two fields are drawn by two different controls.

12 new UATs, all green; 85 tests across the 11 editor/image suites pass. The full run has 13 failures in the assistant suites (REQ-122/127, AC-105x) — I verified those fail identically on a clean tree, since they need a live model credential.

One thing I did **not** do, since you didn't ask: the tiles carry no size, dimensions, or "unused" marker. Say the word if you want any of those — the tile is a single element and it's cheap to extend now.

<!-- xgd-turn id="f2d8a154-d3c8-419d-b0f2-f79a68db4180-user" -->

<!-- xgd-chat role="user" ts="2026-08-12T01:06:23.932157+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-chat-end -->