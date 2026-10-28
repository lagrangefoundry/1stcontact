---
uid: comment-989911e3
id: COMMENT-5803
type: comment
title: Comment on request REQ-157
created_by: xgd
created_at: '2026-10-28T03:54:04.870867+00:00'
updated_at: '2026-10-28T03:54:04.870867+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-3f8737f2
  kind: note
---

Erratum (aligned_to_tip, REQ-904): the sentence "`capture_site` is refused for private address space, over-large responses and redirect loops;" conflicted with acceptance_criterion-2b82c3cf, acceptance_criterion-d553d8fb, acceptance_criterion-7db0225c, acceptance_criterion-b4af8127, acceptance_criterion-e4c4d77e, acceptance_criterion-26d0ac51. The running code (xgd-working tip) does otherwise: `tools/generate/src/cli/capture/bundle.ts:95-99`, `tools/generate/src/cli/ai/fidelity-core.ts:245-253`, `tools/generate/src/cli/ai/fidelity-core.ts:309-357`, `tools/generate/src/cli/capture/egress-guard.ts:228-275`, `tools/generate/src/cli/capture/playwright-driver.ts:101-110`, `tools/generate/src/cli/capture/cf-driver.ts:231-232`, `tools/generate/src/cli/capture/cf-driver.ts:280-280`. The matrix now follows the tip. REQ-157 owns these ACs and is the only in-window intent on this surface, so no later in-window intent orders the conflict in the ACs' favour; xgd-working's tip decides. Neither the window code nor the tip implements the builder's proposed fixes (tolerant readCapture, Node redirect-hop guard, applied 60 s cap, refusal of a cap-tripped capture), and out-of-window BUG-172/BUG-127 move further from the ACs, so a code_frozen grant would invent behaviour rather than port it. The ACs are rewritten to the code as landed; clauses where the tip later diverges are retired rather than asserted either way.