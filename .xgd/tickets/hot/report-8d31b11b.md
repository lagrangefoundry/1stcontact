---
uid: report-8d31b11b
id: REPORT-4248
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-09-14T06:57:59.804239+00:00'
updated_at: '2026-09-14T06:57:59.804239+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-8e1807f6
  plan_item_index: '7'
---

Both target stories and all three named ACs are updated, and the two new ACs landed on STORY-140. No runtime code was touched — the only working-tree changes are the ticket-store change log, and the ticket writes auto-committed.

```
Upgrade mutations applied for plan item 7 of 10

Target Stories: story-6ccaedd5, story-4cabde9a
Primary Story UID: story-6ccaedd5
Stories Modified: 2
ACs Modified: 3
ACs Added: 2
ACs Removed: 0

tickets_modified:
  stories:
    - "story-6ccaedd5"   # STORY-140 Ingestion — content-type resolution named as the head step
    - "story-4cabde9a"   # STORY-141 Description — branches on the resolved type
  acceptance_criteria:
    modified:
      - "acceptance_criterion-7ffeab5a"   # AC-1682
      - "acceptance_criterion-7f1a7eaa"   # AC-1689
      - "acceptance_criterion-5266b0d9"   # AC-1694
    added:
      - "acceptance_criterion-236187a6"   # AC-1809
      - "acceptance_criterion-30d16cc3"   # AC-1810
    removed: []

Progress: 7 of 10 plan items complete
```

What changed and why:

- **AC-1682** — the filename fallback now repairs the *content type itself*, not only `kind`, so the repaired value is what the describer and the stored-bytes record read.
- **AC-1689** — the front-matter rule: a leading closed block is skipped rather than titled by its fence, a `title:` declared inside it wins, an unclosed fence is an ordinary rule, and a rule-only line is never a title.
- **AC-1694** — the unreadable branch is restated as reached *after* the type is settled, so a browser-typeless Markdown file no longer lands there.
- **AC-1809 / AC-1810** (new, on STORY-140) — the one-resolution-three-consumers rule observable at the upload entry point, and the bounds of the repair (a stated type is never second-guessed; an unmapped extension still degrades honestly).

Two judgment calls worth flagging:

1. **Both new ACs went on STORY-140, not STORY-141.** The bug was *visible* through the describer but the claim that distinguishes it — "settled once, at the head, for all three consumers" — is only observable at the ingestion boundary. STORY-141 keeps the claims about what each describer branch then does, with a Technical Context note recording the split.
2. **The `content_type` field on the material row is deliberately not claimed here.** That belongs to plan item 8 (REQ-172); STORY-140's Technical Context names the ownership boundary rather than asserting the field.

I also recorded one Reconciliation Decision on STORY-141: the rule-line skip (`---`, `***`, `===` anywhere, not just the fence) and the unclosed-fence case are landed behaviour the intent didn't enumerate. I formalized them into AC-1689 rather than leaving them unstated, since both are the same reported symptom — a file titled `---` — reached by a route BUG-41 didn't name.
