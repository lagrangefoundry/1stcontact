---
uid: report-b31905da
id: REPORT-11603
type: report
title: 'Report: mode_override for story-58b2cec4'
created_by: xgd
created_at: '2026-11-08T22:47:09.680135+00:00'
updated_at: '2026-11-08T22:53:14.342084+00:00'
completed_at: null
last_field_updated: files_touched
fields:
  report_kind: mode_override
  subject_uid: story-58b2cec4
  anchor_ticket: bundle-7ba3af93
  rule: code_frozen
  batch_index: 1
  parent_report_uid: report-7367338f
  quality_mode: reconcile
  justification: REQ-216 (in scope) states There is no way to name a selector, an
    id or an attribute, and requires a menu to match option words first and value
    only as a fallback; the settled AC-2479 test asserts exactly this, and interact.ts
    at the reference contradicts it in fillNames (197-206) and the option loop (278-286)
    while its own comments at 12-17 and 278-279 state the REQ-216 intent. This is
    batch 1, not batch 0 denied by report-07babd4a, and the grant covers a different
    file with no trust-boundary component.
  files:
  - tools/generate/src/cli/capture/interact.ts
  rung: 1
  tip_evidence:
  - file: tools/generate/src/cli/capture/interact.ts
    lines: 197-206
  - file: tools/generate/src/cli/capture/interact.ts
    lines: 278-286
  external_cause: null
  planner_trust_boundary: false
  granted_head: 32a4153d34bbba0faac730dbb2fe290c4d0ef23d
  files_touched:
  - tools/generate/src/cli/capture/interact.ts
  unnamed_files_touched: []
  trust_boundary_touched: false
  trust_boundary_matches: []
  trust_boundary_notes: []
  trust_boundary_mismatch: false
---

# Mode override granted: code_frozen

REQ-216 (in scope) states There is no way to name a selector, an id or an attribute, and requires a menu to match option words first and value only as a fallback; the settled AC-2479 test asserts exactly this, and interact.ts at the reference contradicts it in fillNames (197-206) and the option loop (278-286) while its own comments at 12-17 and 278-279 state the REQ-216 intent. This is batch 1, not batch 0 denied by report-07babd4a, and the grant covers a different file with no trust-boundary component.

Planner instructions for the batch:

code_frozen is lifted for tools/generate/src/cli/capture/interact.ts only, in this batch. Make exactly the change the previous builder diagnosed (REPORT-11596 / handoff REPORT-11597). (1) In the STEP_BODY fillNames, stop offering the name attribute and the element id as names a field can be matched by, so that fill email_input is refused as no-match with INTERACTION_FAILED and no picture. Labels, aria-label, aria-labelledby and placeholder stay. (2) In the SELECT branch, choose the option in two passes: first the option whose normalised words equal the wanted value; only if none matches, the option whose value does. Then fill Region with United Kingdom selects the option reading United Kingdom (value GB), not an earlier option whose value is United Kingdom. Keep the post-fill landed check consistent with the chosen option. Do NOT edit test_UAT_AC2479, AC-2479 or any other test or AC, and edit no production file other than interact.ts. Keep AC2477/2478/2480/2481/2482, every test_UAT_FC_REQ-216_ test and AC2025/2027/2028 green.

## Diff

```diff
diff --git a/tools/generate/src/cli/capture/interact.ts b/tools/generate/src/cli/capture/interact.ts
index be00bfe238..315a5ee850 100644
--- a/tools/generate/src/cli/capture/interact.ts
+++ b/tools/generate/src/cli/capture/interact.ts
@@ -201,8 +201,6 @@ function fillNames(el){
   v=el.getAttribute('aria-labelledby');
   if(v){var r=document.getElementById(v);if(r)out.push(textOf(r))}
   v=el.getAttribute('placeholder');if(v)out.push(v);
-  v=el.getAttribute('name');if(v)out.push(v);
-  if(el.id)out.push(el.id);
   return out}
 function fingerprint(){
   var s='';try{s=document.documentElement.outerHTML}catch(e){}
@@ -278,10 +276,11 @@ try{setter=Object.getOwnPropertyDescriptor(proto,'value').set}catch(e){}
 // A menu is chosen by the words a person reads on it, and only falls back to
 // the value the markup carries — which is a developer's word, not a reader's.
 if(target.tagName==='SELECT'){
-  var want=norm(S.value),chosen=-1;
-  for(var oi=0;oi<target.options.length;oi++){
-    var opt=target.options[oi];
-    if(norm(opt.textContent)===want||norm(opt.value)===want){chosen=oi;break}}
+  var want=norm(S.value),chosen=-1,oi;
+  for(oi=0;oi<target.options.length;oi++){
+    if(norm(target.options[oi].textContent)===want){chosen=oi;break}}
+  if(chosen<0)for(oi=0;oi<target.options.length;oi++){
+    if(norm(target.options[oi].value)===want){chosen=oi;break}}
   if(chosen<0)return refuse('no-match',
     "'"+matched+"' has no choice called '"+S.value+"'.");
   try{target.selectedIndex=chosen}catch(e){}}
@@ -291,8 +290,7 @@ else{
 try{target.dispatchEvent(new Event('input',{bubbles:true}));
 target.dispatchEvent(new Event('change',{bubbles:true}))}catch(e){}
 var landed=target.tagName==='SELECT'
-  ?(norm(target.options[target.selectedIndex]&&target.options[target.selectedIndex].textContent)===norm(S.value)
-    ||norm(target.value)===norm(S.value))
+  ?target.selectedIndex===chosen
   :String(target.value)===String(S.value);
 if(!landed)return refuse('inert',
   "'"+matched+"' did not take that value — it still reads '"+String(target.value)+"'.");

```
