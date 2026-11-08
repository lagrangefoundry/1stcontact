---
uid: acceptance_criterion-677e9510
id: AC-2374
type: acceptance_criterion
title: The session's priming entries and reminders are read from one configuration
  file and reach the model exactly as declared, and a malformed configuration stops
  start-up with an error naming the entry
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T05:10:52.989879+00:00'
updated_at: '2026-11-08T10:08:45.150950+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion

Every word a session is told by hand comes from **one configuration data file**. That covers the role text, the product text, the purpose, the static reminder lines and the wording of the two reminder lines that carry runtime values. **The model receives exactly the declared text**: each static priming entry of the selected order reaches the model verbatim and in declared order, and each static reminder line reaches it verbatim on every turn. (That the prose is not also held as a TypeScript constant is a structural decision recorded in STORY-103's Reconciliation Decisions, not part of this criterion.)

- **Prose authored as lines.** An entry's text may be written as a list of lines. It reaches the model joined with newlines, as the paragraphs it was written as.
- **Runtime values fill templates.** The site line and the change signal are declared in the same file as `{placeholder}` templates, filled at render time from the site slug and from the change count and cursor. A placeholder with no value is left exactly as written rather than blanked, so a mistyped one shows in the prompt as itself.
- **Two declared orders.** The file declares the priming for a session with a knowledge base and the priming for one without. A host with no knowledge base loads the second. That order names only providers registered on every session, whether or not a corpus exists.
- **Validated at start-up.** The file is loaded through the framework's role loader. Each malformed configuration below is refused with a priming configuration error **naming the offending entry**, and no session is built from it:
  - an entry declaring both `text` and `provider`, or neither;
  - a cache-boundary marker that also carries other keys;
  - a second cache-boundary marker in one priming list;
  - a cache-boundary marker in the reminders;
  - a `provider` naming something nobody registered.
- **An unregistered provider stops the session, not a turn.** A host that selects the order with a knowledge base but registers none of its providers opens no session: opening it reports the priming configuration error naming `km-landscape`, a turn on it is refused, and the model is sent no request at all.

## Verification

Open a consultant session over a planted knowledge base and take one turn. In the request the model received, every static priming entry of the knowledge-base order (role text, product text, purpose) appears verbatim and in declared order, and every static reminder line appears verbatim in the turn's reminder. The role text, authored as lines, arrives as its joined paragraphs. The reminder opens with the filled site line and carries no unfilled `{slug}`, `{changes}`, `{plural}` or `{at}`. Load a copy of the configuration whose site-line and change-signal templates each carry an extra slot with no value (`{slgu}`, `{cursor}`): the rendered site line, change signal and reminder carry the filled slots filled and the extra slot verbatim, braces included. Load the configuration through the framework's loader with each malformed shape listed above in turn: each throws a `PrimingConfigError` whose message names the entry (for example `"bad"` or `"ghost"`, or the marker's list position). Open a session through the host with a corpus seam that registers no provider: it is not ready, the loader raised one `PrimingConfigError` naming `"km-landscape"` and that is the error the session reports, a turn on it throws, and the model client saw zero requests. Load the corpus-free order with only the always-registered providers: it loads; the knowledge-base order with the same providers does not, naming `km-landscape`.