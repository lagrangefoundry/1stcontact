/**
 * REQ-216 — driving the page before the shutter opens.
 *
 * WHY THIS EXISTS. Everything a page reaches by an interaction was invisible to
 * the assistant: a modal, a carousel past its first slide, a disclosure, a
 * form's success state. It could render the page and photograph it, and the
 * photograph only ever showed the state a visitor sees before they touch
 * anything — so when it was asked whether the sign-in dialog looked like a
 * dialog, it reasoned from a picture of the closed page and then invented a
 * mechanism to explain what it could not see.
 *
 * THE UNIT IS A SHORT PHRASE, NOT A SELECTOR. The assistant names what an
 * operator would name — *the Sign in control* — and the matching is done here,
 * against the page's own accessible names. Selectors are substrate detail the
 * document layer deliberately does not expose ([[REQ-100]], [[REQ-108]],
 * [[REQ-212]] all turn on the assistant never naming one), and a tool parameter
 * is not the place to hand that back.
 *
 * THE PICTURE MUST REMAIN EVIDENCE, which is the whole of why this file is more
 * than an `el.click()`. Whatever was asked for has to have actually happened: a
 * name that matches nothing, a name that matches several things, a control that
 * is on the page but not visible, a click that moved nothing, a field that did
 * not take the value, a page that never settled — every one of them is a
 * refusal that names what failed, never a picture of the page in the wrong
 * state. A tool whose output is believed must not return a plausible wrong
 * answer; that is the same reasoning [[REQ-154]] used to keep the browser off
 * the network.
 *
 * THE SCRIPT IS A STRING for the reason `page-scripts.ts` gives: the two drivers
 * evaluate through different libraries whose `evaluate` overloads do not agree
 * on a function type, and it runs in whatever browser is on the other end rather
 * than in this bundle. Its only instance data is the step, injected as JSON.
 */
import type { BrowserDriver } from './types'

/** The two verbs, and there is no third. */
export type PageVerb = 'click' | 'fill'

/** One interaction, parsed from the phrase the assistant wrote. */
export interface PageStep {
  verb: PageVerb
  /** What the control is called, as a person would say it. */
  name: string
  /** `fill` only: the text to put in it. */
  value?: string
  /** The phrase this was parsed from, so a refusal can quote it back. */
  source: string
}

/**
 * Raised when a step cannot be carried out — including when it *could* be read
 * but the page did not do what it said.
 *
 * `code` is the surface's declared error code, read by the Toolbox's failure
 * renderer off the thrown instance. It is declared on this class rather than
 * composed at the throw site so that every path out of here refuses under the
 * same name.
 */
export class PageInteractionError extends Error {
  readonly code = 'INTERACTION_FAILED'
  constructor(message: string) {
    super(message)
    this.name = 'PageInteractionError'
  }
}

/** Raised when a phrase is not one of the two forms. */
export class PageStepSyntaxError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PageStepSyntaxError'
  }
}

/** Strip one matching pair of surrounding quotes, and nothing else. */
function unquote(raw: string): string {
  const text = raw.trim()
  const first = text[0]
  if ((first === '"' || first === "'") && text.length > 1 && text[text.length - 1] === first) {
    return text.slice(1, -1)
  }
  return text
}

/**
 * Read one phrase.
 *
 * TWO FORMS AND NO OTHERS, which is REQ-212's argument about its own two
 * disclosure verbs applied here: every general "do X to Y" vocabulary ends as a
 * scripting language with a parser in front of it, at which point what a caller
 * can make a page do is no longer bounded. Two forms bound it absolutely.
 *
 * Quotes around a name are optional and are what to reach for when the name
 * itself contains the word `with`.
 */
export function parsePageStep(phrase: string): PageStep {
  const source = phrase.trim()
  const click = /^click\s+(.+)$/is.exec(source)
  if (click) {
    const name = unquote(click[1])
    if (!name) throw new PageStepSyntaxError(`'${source}' names nothing to click.`)
    return { verb: 'click', name, source }
  }
  const fill = /^fill\s+(.+)$/is.exec(source)
  if (fill) {
    const rest = fill[1].trim()
    const quoted = /^(["'])([\s\S]*?)\1\s+with\s+([\s\S]+)$/.exec(rest)
    const split = quoted ? null : /^([\s\S]+?)\s+with\s+([\s\S]+)$/.exec(rest)
    if (!quoted && !split) {
      throw new PageStepSyntaxError(
        `'${source}' does not say what to fill it with. Write it as ` +
          `\`fill "Email" with "someone@example.com"\`.`,
      )
    }
    const name = quoted ? quoted[2].trim() : unquote(split![1])
    const value = unquote(quoted ? quoted[3] : split![2])
    if (!name) throw new PageStepSyntaxError(`'${source}' names nothing to fill.`)
    return { verb: 'fill', name, value, source }
  }
  throw new PageStepSyntaxError(
    `'${source}' is not something I can do to a page. There are two forms: ` +
      `\`click "Sign in"\` and \`fill "Email" with "someone@example.com"\`.`,
  )
}

/** Read every phrase, in the order they were written. */
export function parsePageSteps(phrases: readonly string[]): PageStep[] {
  return phrases.map(parsePageStep)
}

/** How long the page is given to stop changing after a step, in ms. */
export const SETTLE_BUDGET_MS = 2000
/** How often the page is sampled while waiting for it to stop changing, in ms. */
export const SETTLE_POLL_MS = 50

/** What a step's script hands back. */
export interface StepOutcome {
  ok: boolean
  /** The name the control actually carried, when one was found. */
  matched?: string
  /** Why it could not be done: `no-match`, `ambiguous`, `not-visible`, `inert`, `unsettled`, `refused`. */
  reason?: string
  /** The sentence the refusal is rendered from. */
  detail?: string
}

/**
 * The page-scope half, as an expression.
 *
 * Written in ES5-ish page JS on purpose — see `page-scripts.ts`. It reads the
 * page's *accessible* names (label, `aria-label`, visible text, placeholder)
 * because that is what the assistant was asked to name, and it takes a
 * fingerprint before and after so "nothing happened" is a finding rather than a
 * silence.
 *
 * VISIBILITY IS AN ANCESTOR WALK OVER COMPUTED STYLE, not a rectangle. A closed
 * modal's own Close control is `display: none` through its shell, which is
 * exactly the case that has to be excluded so that "Sign in" in the header does
 * not read as ambiguous against "Sign in" inside the panel that is not open
 * yet.
 */
export function pageStepScript(step: PageStep): string {
  return (
    '(async function(){var S=' +
    JSON.stringify({ ...step, budgetMs: SETTLE_BUDGET_MS, pollMs: SETTLE_POLL_MS }) +
    ';' +
    STEP_BODY +
    '})()'
  )
}

const STEP_BODY = `
function norm(t){return String(t==null?'':t).replace(/\\s+/g,' ').trim().toLowerCase()}
function refuse(reason,detail){return {ok:false,reason:reason,detail:detail}}
function quoteList(names){
  var seen={},out=[];
  for(var i=0;i<names.length&&out.length<8;i++){
    var n=names[i];if(!n||seen[n])continue;seen[n]=1;out.push("'"+n+"'")}
  return out.length?out.join(', '):'nothing with a name'}
function hidden(el){
  for(var n=el;n&&n.nodeType===1;n=n.parentElement){
    if(n.hasAttribute&&n.hasAttribute('hidden'))return true;
    if(n.getAttribute&&n.getAttribute('aria-hidden')==='true')return true;
    var cs=null;try{cs=getComputedStyle(n)}catch(e){}
    if(cs&&(cs.display==='none'||cs.visibility==='hidden'))return true}
  return false}
function textOf(el){return norm(el.textContent)}
function clickNames(el){
  var out=[],v;
  v=el.getAttribute('aria-label');if(v)out.push(v);
  v=textOf(el);if(v)out.push(v);
  if(el.tagName==='INPUT'&&el.value)out.push(el.value);
  v=el.getAttribute('title');if(v)out.push(v);
  var img=el.querySelector?el.querySelector('img[alt]'):null;
  if(img)out.push(img.getAttribute('alt'));
  return out}
function fillNames(el){
  var out=[],v;
  try{if(el.labels)for(var i=0;i<el.labels.length;i++){var lt=textOf(el.labels[i]);if(lt)out.push(lt)}}catch(e){}
  v=el.getAttribute('aria-label');if(v)out.push(v);
  v=el.getAttribute('aria-labelledby');
  if(v){var r=document.getElementById(v);if(r)out.push(textOf(r))}
  v=el.getAttribute('placeholder');if(v)out.push(v);
  v=el.getAttribute('name');if(v)out.push(v);
  if(el.id)out.push(el.id);
  return out}
function fingerprint(){
  var s='';try{s=document.documentElement.outerHTML}catch(e){}
  var h=5381;for(var i=0;i<s.length;i++)h=((h*33)^s.charCodeAt(i))>>>0;
  var a=document.activeElement,tag='';
  if(a)tag=(a.tagName||'')+'#'+(a.id||'')+'.'+String(a.className||'');
  var x=0,y=0;try{x=Math.round(window.scrollX||0);y=Math.round(window.scrollY||0)}catch(e){}
  return h+'|'+x+','+y+'|'+tag}
function wait(ms){return new Promise(function(r){setTimeout(r,ms)})}
async function settle(){
  var last=fingerprint(),stable=0,spent=0;
  while(spent<S.budgetMs){
    await wait(S.pollMs);spent+=S.pollMs;
    var now=fingerprint();
    if(now===last){stable++;if(stable>=2)return {settled:true,fingerprint:now}}
    else{stable=0;last=now}}
  return {settled:false,fingerprint:last}}

var CLICKABLE='a[href],button,summary,[role="button"],[role="link"],input[type="submit"],input[type="button"],input[type="reset"],input[type="image"]';
var FILLABLE='input,textarea,select';
var NOT_FILLABLE={hidden:1,submit:1,button:1,reset:1,image:1,checkbox:1,radio:1,file:1};

var wanted=norm(S.name);
var found=[];
try{found=[].slice.call(document.querySelectorAll(S.verb==='click'?CLICKABLE:FILLABLE))}catch(e){}
if(S.verb==='fill')found=found.filter(function(el){
  return el.tagName!=='INPUT'||!NOT_FILLABLE[String(el.getAttribute('type')||'text').toLowerCase()]});
var rows=[];
for(var i=0;i<found.length;i++){
  var el=found[i];
  var names=(S.verb==='click'?clickNames(el):fillNames(el)).map(norm).filter(Boolean);
  if(names.length)rows.push({el:el,names:names,hidden:hidden(el)})}
function pick(from){
  var exact=from.filter(function(r){return r.names.indexOf(wanted)>=0});
  if(exact.length)return exact;
  return from.filter(function(r){return r.names.some(function(n){return n.indexOf(wanted)>=0})})}
function namesOf(from){var out=[];for(var i=0;i<from.length;i++)out.push(from[i].names[0]);return out}

var onstage=rows.filter(function(r){return !r.hidden});
var match=pick(onstage);
if(!match.length){
  var offstage=pick(rows.filter(function(r){return r.hidden}));
  if(offstage.length)return refuse('not-visible',
    "there is something called '"+S.name+"' on the page, but it is not visible right now — "+
    "whatever holds it has to be opened first.");
  return refuse('no-match',
    "nothing on the page is called '"+S.name+"'. What is there: "+quoteList(namesOf(onstage))+".");}
if(match.length>1)return refuse('ambiguous',
  match.length+" things match '"+S.name+"': "+quoteList(namesOf(match))+". Say which one exactly.");

var target=match[0].el,matched=match[0].names[0];
if(S.verb==='click'){
  // Focused FIRST and fingerprinted after, because focusing is how a click
  // arrives rather than a thing the click did — counting it as an effect would
  // make every inert control look like it worked.
  try{if(target.focus)target.focus()}catch(e){}
  var before=fingerprint();
  try{target.click()}catch(e){return refuse('refused',"'"+matched+"' would not accept a click: "+(e&&e.message?e.message:e))}
  var after=await settle();
  if(!after.settled)return refuse('unsettled',
    "the page was still changing "+S.budgetMs+"ms after clicking '"+matched+"', so nothing it shows now can be trusted.");
  if(after.fingerprint===before)return refuse('inert',
    "clicking '"+matched+"' changed nothing on the page.");
  return {ok:true,matched:matched}}

var proto=null;
try{
  if(target.tagName==='TEXTAREA')proto=HTMLTextAreaElement.prototype;
  else if(target.tagName==='SELECT')proto=HTMLSelectElement.prototype;
  else proto=HTMLInputElement.prototype}catch(e){}
var setter=null;
try{setter=Object.getOwnPropertyDescriptor(proto,'value').set}catch(e){}
// A menu is chosen by the words a person reads on it, and only falls back to
// the value the markup carries — which is a developer's word, not a reader's.
if(target.tagName==='SELECT'){
  var want=norm(S.value),chosen=-1;
  for(var oi=0;oi<target.options.length;oi++){
    var opt=target.options[oi];
    if(norm(opt.textContent)===want||norm(opt.value)===want){chosen=oi;break}}
  if(chosen<0)return refuse('no-match',
    "'"+matched+"' has no choice called '"+S.value+"'.");
  try{target.selectedIndex=chosen}catch(e){}}
else{
  try{if(setter)setter.call(target,S.value);else target.value=S.value}
  catch(e){return refuse('refused',"'"+matched+"' would not take a value: "+(e&&e.message?e.message:e))}}
try{target.dispatchEvent(new Event('input',{bubbles:true}));
target.dispatchEvent(new Event('change',{bubbles:true}))}catch(e){}
var landed=target.tagName==='SELECT'
  ?(norm(target.options[target.selectedIndex]&&target.options[target.selectedIndex].textContent)===norm(S.value)
    ||norm(target.value)===norm(S.value))
  :String(target.value)===String(S.value);
if(!landed)return refuse('inert',
  "'"+matched+"' did not take that value — it still reads '"+String(target.value)+"'.");
var settled=await settle();
if(!settled.settled)return refuse('unsettled',
  "the page was still changing "+S.budgetMs+"ms after filling '"+matched+"', so nothing it shows now can be trusted.");
return {ok:true,matched:matched};
`

/**
 * Carry out every step, in order, against a page the driver has already loaded.
 *
 * ONE STEP AT A TIME AND STOP AT THE FIRST FAILURE, because the steps are
 * ordered for a reason: a panel's Close control cannot be found until the panel
 * is open, so carrying on past a failure would produce a second, misleading
 * refusal about the state the first failure prevented.
 */
export async function drivePage(
  driver: BrowserDriver,
  steps: readonly PageStep[],
): Promise<string[]> {
  const done: string[] = []
  for (const step of steps) {
    let outcome: StepOutcome
    try {
      outcome = await driver.query<StepOutcome>(pageStepScript(step))
    } catch (error) {
      // A step that navigates the browser away destroys the context the script
      // is running in, and that is the ordinary cause of this. Naming it is the
      // difference between a refusal the caller can act on and a stack trace.
      const why = error instanceof Error ? error.message : String(error)
      throw new PageInteractionError(
        `'${step.source}' could not be carried out: the page stopped answering (${why}). ` +
          `These drive a page's own state; to look at a different page, name that page instead.`,
      )
    }
    if (!outcome || !outcome.ok) {
      throw new PageInteractionError(
        `'${step.source}' could not be carried out: ${outcome?.detail ?? 'nothing came back from the page.'}`,
      )
    }
    done.push(step.source)
  }
  return done
}
