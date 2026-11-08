---
uid: acceptance_criterion-677e9510
id: AC-2374
type: acceptance_criterion
title: The session's priming entries and reminders are read from one configuration
  file, and a malformed configuration stops start-up with an error naming the entry
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T05:10:52.989879+00:00'
updated_at: '2026-11-08T05:10:52.989879+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion

Every word a session is told by hand comes from **one configuration data file**. That covers the role text, the product text, the purpose, the static reminder lines and the wording of the two reminder lines that carry runtime values. No priming or reminder prose is held as a source-code string constant. A prose change is an edit to that file and needs no change to any source module.

- **Prose authored as lines.** An entry's text may be written as a list of lines. It reaches the model joined with newlines, as the paragraphs it was written as.
- **Runtime values fill templates.** The site line and the change signal are declared in the same file as `{placeholder}` templates, filled at render time from the site slug and from the change count and cursor. A placeholder with no value is left exactly as written rather than blanked, so a mistyped one shows in the prompt as itself.
- **Two declared orders.** The file declares the priming for a session with a knowledge base and the priming for one without. A host with no knowledge base loads the second. That order names only providers registered on every session, whether or not a corpus exists.
- **Validated at start-up.** The file is loaded through the framework's role loader. Each malformed configuration below stops the host at start-up with a priming configuration error **naming the offending entry**, and no session is built from it:
  - an entry declaring both `text` and `provider`, or neither;
  - a cache-boundary marker that also carries other keys;
  - a second cache-boundary marker in one priming list;
  - a cache-boundary marker in the reminders;
  - a `provider` naming something nobody registered.

## Verification

Grep the host's source modules: no priming or reminder sentence appears as a string literal. The words are in the configuration file. Assemble a session's priming and check that an entry authored as lines arrives as its joined paragraphs. Load the configuration with each malformed shape listed above in turn. Each throws a priming configuration error whose message names the entry (for example `"bad"` or `"ghost"`). Load the corpus-free order with only the always-registered providers: it loads.
