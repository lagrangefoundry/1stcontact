---
uid: acceptance_criterion-6c2e9899
id: AC-2566
type: acceptance_criterion
title: A stored picture over the 64 MiB sanity ceiling is refused by size before a
  browser is leased; an unsafe stored media type is sanitised before it reaches the
  img src
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T21:56:34.077647+00:00'
updated_at: '2026-11-09T21:56:34.077647+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
A stored non-PNG picture larger than the sanity ceiling (64 MiB of stored bytes — far above any real photograph) is refused as a picture-not-renderable error naming the picture and its size in MB, before any browser is leased: no browser session is taken and the Worker's browser budget is not spent. A stored media type that is not a plain `type/subtype` token (for example one carrying quotes, angle brackets or script) is never written into the page as given; it is replaced by a neutral binary type, so it cannot escape the image source it goes into, and the picture is then refused by the existing "the browser would not decode it" refusal rather than rendered.

## Verification
With a fake browser factory that counts calls (BUG-80): screenshot a stored picture just over 64 MiB and assert the refusal names the picture and a size, and the factory was never called. Store a picture whose media type is `image/jpeg";alert(1);"` (or similar quote/script characters) and assert the script that sets the image source contains none of the injected characters and uses a plain media type, and the result is the named decode refusal. An undecodable picture with a valid media type still produces the existing decode refusal wording (no regression).
