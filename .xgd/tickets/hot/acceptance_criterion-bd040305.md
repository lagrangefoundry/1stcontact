---
uid: acceptance_criterion-bd040305
id: AC-810
type: acceptance_criterion
title: The generated site stylesheet carries module chrome and no component source
created_by: xgd
created_at: '2026-08-06T01:33:29.133822+00:00'
updated_at: '2026-08-08T00:42:40.331724+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The stylesheet generated for a site contains each behavior module's own chrome
rules and nothing else from the module's source. Two `<style>`-shaped things in a
module are not style elements and must not be treated as one:

- prose that merely **mentions** `<style>` in the component's leading script
  section — the section is code, not markup, so nothing in it is ever a style
  element; and
- the **self-closing** per-instance style tag a module emits for its mounted L1
  fragment, which has no closing partner and must be excluded rather than read as
  an opening tag.

Reading either as an opening tag runs the match on to the next real closing tag
and folds the component's imports, interfaces, script body and markup into the
generated stylesheet as if it were CSS. The generated stylesheet therefore
contains no `import` statement, no `interface`/props declaration and no HTML
element markup, and the module chrome that follows such a construct in the source
is still present rather than swallowed with it.

## Verification
Generate a site's stylesheet with both survivor modules in the catalog and assert
it contains each module's chrome rules, contains no `import ` / `interface ` /
`<section` / `<ul` text, and that a module whose source both mentions the tag in a
comment and emits a self-closing per-instance tag still contributes its full chrome
block.