/**
 * What the builder's assistant is told about itself (REQ-122, REQ-126, REQ-182).
 *
 * The priming a session gets has three layers, and only ONE of them is written
 * by hand:
 *
 *   1. the preamble — who the assistant is and how it works;
 *   2. the tool manual — PROJECTED from the surface declaration
 *      (`l1-surface.json`) and this session's grant (`instances.json`), so what
 *      primes the model cannot fall behind the operations it describes, and a
 *      session is never told about a capability it was not granted;
 *   3. the reminder — re-applied on every turn through the backend's system
 *      channel, never written to the transcript, carrying only the handful of
 *      rules that must not decay over a long conversation.
 *
 * The split matters. Anything that changes when the surface changes belongs in
 * layer 2 and must not be restated in layer 1 — a hand-written inventory of
 * tools is precisely the text that is still describing last month's surface six
 * weeks later, and it is worse than no inventory because the model believes it.
 *
 * LAYER 1 AND LAYER 3 ARE NO LONGER CODE (REQ-182). Every word of them is in
 * {@link primingConfig}'s file, as DOC-22's ordered list of named entries; this
 * module contributes the shape of that list and the seam KM registers through,
 * and contributes no prose at all. The rule the framework states as "structure
 * is not prose" (DOC-22 §5) is the same rule this file's header has always
 * argued for layer 2, applied one layer up.
 *
 * REQ-126 moved two things OUT of the preamble for that reason. The addressing
 * rule ("re-read rather than remember") is the declaration's `overview`, which is
 * where a cross-cutting rule can be stated once for every operation that takes an
 * address. And the publishing rule went with the grant: the consultant is not
 * granted `Publish`, so its manual never mentions publishing and telling it not
 * to would be describing a tool it does not have.
 *
 * THE ROLE IS A CONSULTANT AND NOT A CARETAKER (REQ-174), and the word is not
 * decoration — it is the first thing the model reads about itself, and it sets
 * the register for everything after it. A caretaker maintains something that
 * already exists and is not expected to have a view; this role takes a client
 * from nothing to a live site, forms judgements about their brand, argues for a
 * layout, and says when a request would make the site worse. The observed
 * failure the rename answers is a session that centred every block of text on a
 * page and, challenged, said it had not stopped to think about it — a passive
 * register producing passive work.
 */

import primingDocument from './priming.json'
import type { SiteDigest, DigestPage } from './digest-core'
import { planReminder, type Plan } from './plan-core'
import { builderVocabulary } from './l1-vocabulary-core'

/** The AI library and the bridge are untyped JavaScript; the boundary is here. */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

/** The site assistant's role. Named, so nothing addresses it as a literal. */
export const CONSULTANT_ROLE = 'consultant'

/**
 * The settings assistant's role — this project's SECOND ([[REQ-239]]).
 *
 * THE HEADER ABOVE ANTICIPATED IT AND THE SPLIT IT DESCRIBES IS WHAT MADE IT
 * CHEAP: the product facts were pulled out of the consultant's own text
 * precisely so that standing a second role up would not mean copying them. In
 * the event this role takes NEITHER of the consultant's two static entries, and
 * that is the stronger version of the same rule rather than a departure from it.
 * `product-system` is about how a SITE is built, how a page is changed and what
 * publishing means; this session is granted none of that, and a session told
 * about a capability it was not granted will offer it, apologise for it, or probe
 * for it.
 *
 * WHAT IT SHARES IS THE SHAPE AND NOT THE WORDS. Same ordered list, same cache
 * boundary at the end, same manual projected from the grant — so the two roles
 * cannot drift in HOW they are assembled, only in what they say.
 */
export const SETTINGS_ROLE = 'settings'

/**
 * The worker's role — this project's THIRD, and the first that is not a
 * conversation ([[REQ-295]]).
 *
 * NOBODY OPENS ONE. A `builder` session is opened by the framework's delegation
 * surface when the consultant hands a piece of construction over, runs for
 * exactly one turn, reports, and is gone. That is why it is absent from what
 * `aiStatus` reports: the panel lists conversations a person can start, and this
 * is not one.
 *
 * ITS GRANT IS `instances.json`'s `builder` ENTRY and nothing else, which is the
 * whole invariant the delegation surface rests on: the brief is open prose and
 * **no phrasing of it can widen what the worker may do**, because authority comes
 * from the role's `tools` rather than from the goal.
 *
 * IT IS THE CONSULTANT'S WHOLE SITE-EDITING GRANT ([[REQ-341]]). It began as the
 * construction half alone — ReadSite, AuthorPages, ManageComponents,
 * MeasureDrawings, DrawImages, SeeSite — withholding ManagePages, WriteConfig and
 * ManagePalette on the argument that pages, configuration and palette are the
 * consultant's judgement rather than the builder's hands. That line did not
 * survive contact with the briefs: one told a worker to *"add four palette
 * colours and use the named colours everywhere"*, to a role that cannot create a
 * palette colour, and the delegation surface is explicit that a brief outside the
 * grant yields *"a worker that is refused, not a worker that obeys"*. So the
 * three groups are granted, and the line moves to where it can be held and
 * explained: the primary stops writing L1 altogether (DOC-60 §4), rather than
 * being read-only except for pages, palette and config.
 *
 * WHAT IT STILL DOES NOT HOLD is what a WORKER has no business in rather than
 * what construction does not need: `Publish`, whose reach is the public internet;
 * `ManageAssets`, which registers a file from the operator's machine; and the
 * engagement's own surfaces — the ledger, the catalogue, the corpus, the session
 * context — which are the consultant's conversation with their client and not a
 * one-turn worker's. It cannot hand the work on either: the delegation surface it
 * is composed with is scoped to no roles, so the one-level floor is a property of
 * the grant rather than a check somewhere that could be forgotten.
 *
 * AND IT IS NOW THE ONLY ROLE THAT WRITES A SITE'S L1 ([[REQ-343]]). It began beside a
 * consultant that could still build a page itself — deliberately, and it was the
 * cheap order: a grant gap found while the caller can do the work itself is a
 * brief to widen, and the same gap found after the caller's write groups are gone
 * is a stuck engagement. That order has been run, which is what the grant above
 * records. With `primary_writes: false` the consultant keeps every read and holds no
 * write group of the L1 surface, so construction arrives here or not at all — and
 * `true` puts its hands back in one configuration key, which is why the narrowing
 * is a setting rather than a deletion. What it keeps is what is not L1: the
 * client's catalogue and a picture's recipe, which are nearer curation than
 * construction and are not this role's business either way.
 */
export const BUILDER_ROLE = 'builder'

/**
 * The group chat's second member ([[REQ-357]]). It reads everything the
 * consultant can see and writes nothing to the site; its working place is the
 * room. A ROLE KEY, never a display name — those live in `group-chat.json`.
 */
export const COORDINATOR_ROLE = 'coordinator'

/**
 * Role names this project used to write, and still reads (REQ-174).
 *
 * THE RENAME IS ACCEPTED ON READ RATHER THAN MIGRATED, and only one of the two
 * is live. A session's role name is durable in two places — the `xgd-session`
 * header of the archived transcript, and the `session_start` record of the live
 * junction — and the manager resolves it by looking the name up in the role map
 * it was constructed with, throwing on a miss. So a session archived before this
 * rename would refuse to reopen.
 *
 * Migrating instead would mean rewriting an append-only record stream and the
 * archives of every deployment to change a word. Registering the old name as a
 * second key onto the SAME role object costs one entry, is identical for the file
 * archive, the junction and the store-backed archive, and needs nothing to be run
 * anywhere. Nothing is ever WRITTEN under a legacy name — {@link CONSULTANT_ROLE}
 * is what `createSession` records and what the host reports it is — so the alias
 * is a read path that ages out on its own as old sessions fall away.
 */
export const LEGACY_ROLE_NAMES = ['caretaker'] as const

/**
 * The entries this host names from code, and why each one exists.
 *
 * THE NAME IS CODE, THE WORDS ARE CONFIGURATION. An entry's text is prose and
 * lives in the file; the reasoning for the entry existing at all is a property of
 * the design and belongs where a reader of the code will meet it. A JSON file has
 * nowhere to put an argument, and burying these in its `about` array would make
 * them unreachable from the call sites that depend on them.
 */

/**
 * What the consultant is here to do, for KM's priming (step 2 of the landscape).
 *
 * Deliberately the ROLE'S purpose and not a restatement of the system prompt: the
 * priming answers "what should I go looking for in this corpus", and an agent
 * told only "you are a consultant" has no basis for choosing between a document
 * about storage and one about typography.
 *
 * IT NAMES SUBJECTS AND NEVER A DOCUMENT (BUG-65). The trigger KM renders
 * immediately after this section says "pick the territories above that bear on
 * your purpose", and a purpose naming no subject gives that instruction nothing
 * to bite on — so it names what to go looking FOR. What it must not name is
 * WHICH DOCUMENTS EXIST: that is decided at build time by each document's own
 * kind, and reaches the session through the awareness map the `km.landscape`
 * provider renders. REQ-171 enumerated three ids here, which was a second and
 * unsynchronised answer to the same question, and it drifted exactly the way an
 * id list drifts — one of the three was demoted out of the corpus and the
 * priming went on telling every session to read it. Subjects are also what
 * retrieval actually matches on; an id is not a word.
 *
 * IT NAMES BOTH CORPORA. This framed only the system's own documents while there
 * was only one KB; REQ-159 gave the session the client's, and a purpose that
 * describes half the landscape sends the agent looking in half of it.
 *
 * IT IS DECLARED ONCE (REQ-158). Both hosts prime from the same file, so there is
 * no per-runtime copy to drift — the Worker's assistant cannot end up looking for
 * different things from the CLI's.
 */
export const PURPOSE_ENTRY = 'purpose'

/**
 * Who the assistant is, and what is true of the product whatever role reads it.
 *
 * TWO ENTRIES RATHER THAN ONE (REQ-171, REQ-182). How a page is built, what a
 * tool will and will not accept, and what publishing means are facts about the
 * system, equally true for the caretaker the ongoing tier will need (DOC-33 §10);
 * stated inside the consultant's own text, standing that role up means copying
 * them and maintaining two divergent copies. Separately named, the product half
 * moves into a product tier the day there is a second role, and until then it
 * simply sits after the role text.
 *
 * THE ROLE TEXT IS FIRST and the order is not cosmetic: the first thing a model
 * reads about itself sets the register for everything after it, and the product
 * facts are read through it.
 */
export const ROLE_ENTRY = 'consultant-role'
export const PRODUCT_ENTRY = 'product-system'

/**
 * What the SETTINGS assistant is ([[REQ-239]]).
 *
 * ONE STATIC ENTRY AND NOT TWO, and the asymmetry with the pair above is the
 * decision rather than an omission. The consultant's second entry states product
 * facts about building a site; this role has no site and no tool that touches
 * one, so there is nothing of it that is true here and everything of it that
 * would be an invitation.
 *
 * THE REGISTER IS NOT THE CONSULTANT'S. A consultant forms a view and argues for
 * it — that is what taste is engaged for. What a business is called is not a
 * matter of taste, and a role that argued about it would be arguing with the only
 * person who knows the answer. This role's job is to make a consequence legible
 * BEFORE it is committed to, because some of these decisions are one-time and the
 * form cannot show which.
 */
export const SETTINGS_ROLE_ENTRY = 'settings-role'

/**
 * What the BUILDER is ([[REQ-295]]).
 *
 * ONE STATIC ENTRY, like the settings role's and for the same reason: neither of
 * the consultant's two entries is true of a session that never speaks to the
 * client. `consultant-role` is a register — form a view, argue for it, lead —
 * and a worker that argued with its brief would be duplicating the judgement it
 * was handed the work to avoid paying for. `product-system` is closer, but half
 * of it (never expose the vocabulary to the client, what the client can see) is
 * about a conversation this session does not have.
 *
 * THE PROSE IS NOT OPTIONAL, and that is the point of it existing at all. Tool
 * schemas tell a worker what it may call. They do not tell it what this product
 * considers finished, that the site is the fact and the brief only an intention,
 * that a refusal is a useful answer where a plausible substitute is not, or —
 * load-bearing — that a check it did not make must never come back passed. That
 * last one is what the caller's whole saving rests on: a consultant that cannot
 * trust a verdict re-inspects everything, and the tokens have then been moved to
 * the expensive side rather than saved.
 */
export const BUILDER_ROLE_ENTRY = 'builder-role'

/**
 * One entry as the configuration file writes it, before normalisation.
 *
 * `text` may be a list of lines, which is the only liberty this host takes with
 * the framework's format and it is taken at the door: {@link primingConfig}
 * joins it before anything else sees the mapping, so what reaches
 * `rolesFromMapping` is the format the conformance corpus pins, key for key.
 */
interface RawEntry {
  name?: string
  text?: string | string[]
  provider?: string
  cache_boundary?: boolean
}

/** Join a `text` authored as lines; leave every other key exactly as written. */
function normalise(entry: RawEntry): RawEntry {
  if (!Array.isArray(entry.text)) return entry
  return { ...entry, text: entry.text.join('\n') }
}

/**
 * The consultant's role configuration, for the corpus this session actually has.
 *
 * TWO DECLARED ORDERS, NOT A CONSTRUCTED ONE. A host with no knowledge base
 * cannot prime with a landscape or reach the corpus through a mechanism, and
 * naming a provider nobody registered is a load-time error by design — so the
 * two shapes are two lists in the file, side by side where they can be read
 * against each other, and this picks one. What used to be a ternary building
 * `Entry` objects is a choice between two pieces of data.
 *
 * The purpose entry goes with the corpus and not with the role, which is not an
 * oversight: it tells the session what to go looking for, and there is nothing to
 * look in without a knowledge base.
 *
 * The reminder tier is shared. Nothing in it depends on the corpus — the delta
 * entry drops itself when there is none.
 */
export function primingConfig(withCorpus: boolean): Record<string, unknown> {
  const priming = withCorpus ? primingDocument.priming : primingDocument.priming_without_corpus
  return {
    priming: (priming as RawEntry[]).map(normalise),
    reminders: (primingDocument.reminders as RawEntry[]).map(normalise),
  }
}

/**
 * The settings role's configuration ([[REQ-239]]).
 *
 * NO CORPUS ARGUMENT, because there is no shape of this role that has one. The
 * consultant's two declared orders exist because its METHOD is written down in a
 * knowledge base and a session that cannot search has to be told something else
 * instead. This role's whole subject is two operations and their consequences,
 * both of which the projected manual already carries; a landscape here would be a
 * map of documents about building sites, handed to a session that cannot build
 * one.
 *
 * The same shape otherwise: an ordered list, the manual last before the marker,
 * and the cache boundary at the end so nothing is volatile.
 */
export function settingsPrimingConfig(): Record<string, unknown> {
  return {
    priming: (primingDocument.settings_priming as RawEntry[]).map(normalise),
    reminders: (primingDocument.settings_reminders as RawEntry[]).map(normalise),
  }
}

/**
 * The builder's configuration, plus the grant its workers are held to
 * ([[REQ-295]]).
 *
 * `tools` IS HERE AND NOWHERE ELSE, and it is the one thing this project has
 * never put on a role before. The delegation surface builds each worker's
 * Toolbox from its ROLE'S `tools` — that is what makes "the brief cannot widen
 * the worker" true rather than aspirational — so the grant has to travel on the
 * role object rather than, as every other grant in this host does, on the
 * Toolbox the host constructs.
 *
 * IT IS PASSED IN RATHER THAN READ FROM `instances.json` HERE. The grant that
 * reaches a worker is the one NARROWED to the surfaces this deployment actually
 * composed — a deployment with no browser composes no fidelity surface, and a
 * grant naming one the Toolbox never registered refuses to construct. That
 * narrowing is `l1SurfaceSet`'s, so the host does it once and hands the answer
 * here; deriving it a second time from the document is exactly how the two would
 * come to disagree.
 *
 * WHAT IS IN EACH TIER. The stable prefix is the role's prose and its own
 * projected manual, so every worker this deployment opens sends an IDENTICAL
 * cacheable prefix. Which site it is on and what is currently on that site are
 * volatile and ride the reminder tier — a worker lives one turn, so nothing is
 * lost by delivering them there, and putting them in the prefix would give every
 * delegation a prefix of its own.
 */
/** The coordinator's priming and reminders, as the role mapping takes them ([[REQ-357]]). */
export function coordinatorPrimingConfig(): Record<string, unknown> {
  return {
    priming: (primingDocument.coordinator_priming as RawEntry[]).map(normalise),
    reminders: (primingDocument.coordinator_reminders as RawEntry[]).map(normalise),
  }
}

export function builderPrimingConfig(
  tools: Record<string, unknown>,
  withCorpus = false,
): Record<string, unknown> {
  // TWO DECLARED ORDERS, FOR {@link primingConfig}'s REASON ([[REQ-355]]). With
  // the platform reference the manual rides inside the mechanism, as it does for
  // the consultant; without it the order is exactly the one this role shipped
  // with, so a deployment that has never built a KB composes today's worker.
  const priming = withCorpus
    ? primingDocument.builder_priming_with_corpus
    : primingDocument.builder_priming
  return {
    priming: (priming as RawEntry[]).map(normalise),
    reminders: (primingDocument.builder_reminders as RawEntry[]).map(normalise),
    tools,
  }
}

/**
 * The text of one static entry, by name (REQ-182).
 *
 * The read path for anything that needs to know what a session is actually told
 * without assembling a whole priming — chiefly the UATs, which assert against the
 * words that ship rather than against a constant that happens to hold a copy of
 * them. Both declared orders and the reminder tier are searched, because a name
 * is unique across the file.
 *
 * Throws on a name that is absent or names a provider: there is no static text to
 * return, and answering with an empty string would let a renamed entry pass
 * silently as prose that no longer says anything.
 */
export function primingText(name: string): string {
  const lists = [
    primingDocument.priming,
    primingDocument.priming_without_corpus,
    primingDocument.reminders,
    // THE SECOND ROLE'S TIERS ARE SEARCHED HERE TOO ([[REQ-239]]). A name is
    // unique across the file, and a reader asking what a session is actually told
    // should not have to know which role's list holds the answer.
    primingDocument.settings_priming,
    primingDocument.settings_reminders,
    // AND THE THIRD ROLE'S ([[REQ-295]]), on the same terms.
    primingDocument.builder_priming,
    primingDocument.builder_priming_with_corpus,
    primingDocument.builder_reminders,
  ] as RawEntry[][]
  for (const entry of lists.flat()) {
    if (entry.name !== name) continue
    const { text } = normalise(entry)
    if (typeof text === 'string') return text
    break
  }
  throw new Error(`priming.json declares no static entry named ${JSON.stringify(name)}`)
}

/**
 * Fill a template's `{placeholder}` slots (REQ-182).
 *
 * A slot with no value is left as it was written rather than blanked, so a
 * mistyped placeholder shows up in the prompt as itself instead of vanishing —
 * the same reason the framework's loader names an entry rather than skipping it.
 */
function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key) =>
    key in values ? String(values[key]) : whole,
  )
}

/** The template registered under `name`, or a throw naming it. */
function template(name: string): string {
  const found = (primingDocument.templates as Record<string, string>)[name]
  if (found === undefined) {
    throw new Error(`priming.json declares no template named ${JSON.stringify(name)}`)
  }
  return found
}

/**
 * Which site this session is about (REQ-182).
 *
 * ALWAYS PRESENT, unlike the two signals below. It is the framing the rest of the
 * reminder hangs off, and the failure it prevents — a session acting on the wrong
 * site — has no signal to wait for.
 *
 * The slug comes from the host rather than from `ctx.scope`, which is where DOC-22
 * says a provider should read it. Neither language's `SessionManager` populates
 * that field today, so this reads what the host already holds; that is the whole
 * of what keeps one manager per site rather than one role for all of them.
 */
export function siteLine(slug: string): string {
  return fill(template('site-line'), { slug })
}

/**
 * Which business this session is about ([[REQ-239]]).
 *
 * THE COUNTERPART OF {@link siteLine} AND NOT A COPY OF IT. Everything in the
 * host assumed a session was about a site; a settings session is about a
 * business, and telling it which site it was in would be telling it about a thing
 * it cannot touch.
 *
 * IT RENDERS THE NAME AND NOT THE ID. The id is opaque and is never shown to the
 * customer, so a session framed by one could not say which business it was in
 * without first calling a tool to find out. The name is also the thing most
 * likely to CHANGE during the conversation, which is why the provider that fills
 * this reads the record per turn rather than capturing it at build.
 */
export function businessLine(name: string): string {
  return fill(template('business-line'), { name })
}

/**
 * That the site moved under the assistant, or `null` (REQ-131, REQ-182).
 *
 * IT ANSWERS A QUESTION THE MODEL HAS NO REASON TO ASK, which is why it is pushed
 * rather than left to a tool call: the failure it prevents is the assistant
 * confidently overwriting an edit it never knew happened. Costing nothing in the
 * common case is what makes that affordable — nothing changed, the entry drops,
 * no tokens are spent — and it is the whole reason the journal does not have to be
 * read defensively at the top of every turn.
 */
export function changeSignal(signal?: TurnSignal): string | null {
  const since = signal?.since
  if (!since || since.changes <= 0) return null
  return fill(template('change-signal'), {
    changes: since.changes,
    plural: since.changes === 1 ? '' : 's',
    at: since.at,
  })
}

/** The interrupted-turn advice a session with a site and a camera needs ([[REQ-284]]). */
export const INTERRUPTED_TEMPLATE = 'interrupted-turn'

/** The same situation for a session with neither ([[REQ-284]]). */
export const INTERRUPTED_TEMPLATE_SETTINGS = 'interrupted-turn-settings'

/**
 * That the previous turn did not finish, or `null` ([[BUG-121]]).
 *
 * WHY THE ASSISTANT IS TOLD AT ALL, rather than this being only the client's
 * business. An interrupted turn leaves the assistant's own memory wrong in a
 * particular way: it may have written pages, drawn pictures or recorded a
 * decision, and none of that is described in the transcript it reads back — so
 * without this it re-does work, re-asks a settled question, or contradicts the
 * site it is looking at. One line is enough, because every tool it needs to
 * check for itself is already in its hand.
 *
 * ONE LINE FOR BOTH OUTCOMES. `aborted` and `error` differ in whose fault the
 * turn's end was and not at all in what the assistant should now do, so a second
 * sentence would be a distinction the reader cannot act on.
 *
 * BUT NOT ONE LINE FOR BOTH ROLES ([[REQ-284]]), which is what `name` is for. The
 * advice used to be "look at the site", which is role-independent in the way that
 * matters least: the consultant could act on it, the settings assistant could not,
 * and for the consultant it was the single most expensive instrument in the box —
 * spending context to recover from a turn that may well have ended because context
 * ran out. The rewrite names the CHEAP instrument instead, and naming an instrument
 * means naming a tool. A session is never told about a capability it was not
 * granted, so the consultant is pointed at `list_changes` and the settings
 * assistant at the reads it actually has. What does not vary — that the previous
 * turn did not finish, and that what it did is not in the transcript — is written
 * the same way in both.
 *
 * ABSENT ON EVERY ORDINARY TURN, and free when absent: the previous turn
 * completed, the record was forgotten, this answers `null`, and the framework
 * drops the entry and its separator.
 *
 * @param name which template to render, defaulting to the consultant's.
 */
export function interruptedSignal(
  signal?: TurnSignal,
  name: string = INTERRUPTED_TEMPLATE,
): string | null {
  return signal?.interrupted === true ? template(name) : null
}

/**
 * What a site's next turn has to be told (REQ-131, REQ-160).
 *
 * The facts, never the sentences. Which words carry them is the configuration's
 * business, and rendering them is {@link changeSignal}'s and the delta entry's.
 */
export interface TurnSignal {
  /** The draft counter at the end of the previous turn, and what has landed since. */
  since?: { at: number; changes: number }
  /** What entered the corpus since this session was last told, rendered and capped. */
  delta?: string | null
  /** What the client answered on the plan panel since this session was last told ([[REQ-364]]). */
  answers?: string | null
  /** Whether the PREVIOUS turn of this conversation failed to finish ([[BUG-121]]). */
  interrupted?: boolean
}

/**
 * The name the tool manual is reached under (DOC-22 §4).
 *
 * A NAME, NEVER AN IMPORT PATH. A dotted path in a data file is a code-execution
 * primitive and does not survive a Worker, so configuration names a provider and
 * the host decides what that name reaches.
 *
 * Registered on every session, whether or not a knowledge base was built: with a
 * corpus the manual travels in as KM's mechanism, without one it is the whole of
 * what the session is told about how to act. One registration serves both, and the
 * declared order decides which shape this session gets.
 */
export const MANUAL_PROVIDER = 'site.manual'

/** The name the site line is reached under (REQ-182). */
export const SITE_LINE_PROVIDER = 'site.line'

/** The name the REQ-131 draft change signal is reached under (REQ-182). */
export const SITE_CHANGES_PROVIDER = 'site.changes'

/** The name the REQ-160 corpus delta is reached under (REQ-182). */
export const CORPUS_DELTA_PROVIDER = 'corpus.delta'

/**
 * The name the [[REQ-285]] page digest is reached under.
 *
 * A SITE NAME AND NOT A SESSION ONE, which is why it sits with `site.line` and
 * `site.changes` rather than with the session-memory pair below. Those are about
 * the CONVERSATION — what was decided — and this is about the SITE — what was
 * built. They are complements and not alternatives: a standing note that tried to
 * track the page would be stale the moment an edit landed, and a page digest
 * cannot record why a choice was made.
 */
export const PAGE_DIGEST_PROVIDER = 'site.digest'

/** The site's plan, projected for the turn ([[REQ-356]]). */
export const SITE_PLAN_PROVIDER = 'site.plan'

/**
 * The names the plan panel's answers are reached under ([[REQ-364]]): one per role,
 * because each member hears them on its own cursor and the registry is shared.
 */
export const PLAN_ANSWERS_PROVIDER = 'plan.answers'
export const COORDINATOR_PLAN_ANSWERS_PROVIDER = 'coordinator.plan_answers'

/**
 * The name the [[BUG-121]] interrupted-turn signal is reached under.
 *
 * ONE NAME FOR BOTH ROLES, unlike the manual and the framing line beside it. Those
 * are split because a settings session has no site and the configuration would
 * otherwise read `site.manual` in a tier that has no site; this signal is about
 * the CONVERSATION, which both roles have in exactly the same shape, so one name
 * naming one fact is the honest declaration.
 */
export const TURN_INTERRUPTED_PROVIDER = 'turn.interrupted'

/**
 * The settings session's two provider names ([[REQ-239]]).
 *
 * DISTINCT NAMES FOR THE MANUAL, even though both roles project one and both
 * project it the same way. A `PrimingProviders` is built per manager, so the two
 * could have shared the string with no collision — and then `priming.json` would
 * read `provider: "site.manual"` in the tier of a role that has no site, which is
 * the one place a reader of the configuration would have to already know the
 * implementation to know that was harmless.
 */
export const BUSINESS_MANUAL_PROVIDER = 'business.manual'
export const BUSINESS_LINE_PROVIDER = 'business.line'

/**
 * The worker's own manual ([[REQ-295]]).
 *
 * A THIRD NAME FOR THE SAME PROJECTION, for {@link BUSINESS_MANUAL_PROVIDER}'s
 * reason and with a sharper consequence here: the consultant and the builder run
 * in the SAME manager, off the same registry, and their grants are deliberately
 * different. One name would mean one of them reading the other's tool list —
 * which for this pair is the precise failure the split grant exists to prevent.
 */
export const BUILDER_MANUAL_PROVIDER = 'builder.manual'

/**
 * The page vocabulary the builder writes in, generated from the L1 schemas
 * ([[BUG-182]]).
 *
 * A PROVIDER RATHER THAN A `text:` ENTRY because it is projected, never authored
 * — the same rule as the manual. The words around it are this file's template;
 * the list is {@link builderVocabulary}'s, from the schemas the validator
 * enforces. It sits before the cache boundary in both of the builder's orders, so
 * every worker of a deployment shares it in the cached prefix.
 */
export const BUILDER_VOCABULARY_PROVIDER = 'builder.vocabulary'

/** The coordinator's manual, projected from its own read-only box ([[REQ-357]]). */
export const COORDINATOR_MANUAL_PROVIDER = 'coordinator.manual'

/** The consultant's room framing, null unless this business runs a group chat ([[REQ-357]]). */
export const GROUP_ROOM_PROVIDER = 'group.room'

/**
 * The worker's map and mechanism over the platform reference ([[REQ-355]]).
 *
 * THE SAME TWO KM PROVIDERS UNDER THE BUILDER'S OWN NAMES, for
 * {@link BUILDER_MANUAL_PROVIDER}'s reason. The consultant's `km.landscape` is
 * bound to the whole of its corpus — the client's own knowledge base as well as
 * ours — so a worker reading it would be handed a map of the client's material,
 * which is precisely the view of what the client wants that a worker must not
 * form. These are bound to the system KB alone, and the mechanism projects the
 * WORKER'S manual rather than the consultant's.
 */
export const BUILDER_LANDSCAPE_PROVIDER = 'builder.km.landscape'
export const BUILDER_MECHANISM_PROVIDER = 'builder.km.mechanism'

/**
 * How the consultant hands work over, or nothing at all ([[REQ-295]]).
 *
 * A PROVIDER RATHER THAN A `text:` ENTRY, and that is what makes the switch a
 * true rollback. With delegation off the surface is never composed, so the
 * consultant has no `delegate` tool — and prose telling it how to use one is
 * then an instruction to reach for a capability it has not got, which a model
 * will offer, apologise for, or probe for. `null` drops the entry and its
 * separator, so the prompt a deployment with the switch off sends is byte-for-byte
 * what this repository sent before delegation existed.
 *
 * REGISTERED EITHER WAY. Both of the consultant's declared orders name this entry
 * unconditionally, so a registry that omitted it could not load the role at all —
 * the same reason the memory and digest providers are registered without a source.
 */
export const DELEGATION_METHOD_PROVIDER = 'delegation.method'

/**
 * The standing instruction to commission, said again on every turn ([[REQ-342]]).
 *
 * A SECOND NAME OVER A SECOND TEMPLATE, and the split is the whole point. The
 * method above is stated once, in a tier that sits before the cache boundary and
 * is therefore roughly 186k of prefix behind the model by the end of a sitting.
 * Commissioning construction is STANDING behaviour, and standing behaviour needs
 * repeating — which is why `act-rather-than-narrate`, one corrective line, has
 * ridden the reminder tier all along while the longer method did not.
 *
 * SO THE TAIL GETS THE INSTRUCTION AND NOT THE METHOD. The reminder tier is
 * re-assembled and delivered on every turn for the life of an engagement, so
 * every word in it is paid for on every turn; binding the tail to
 * {@link DELEGATION_METHOD_PROVIDER} would have been one line of configuration
 * and would have put the whole method there instead.
 *
 * NULL ON THE SAME CONDITION, for {@link delegationMethod}'s reason and with
 * nothing added to it: a deployment that composes no delegation surface has no
 * `delegate` tool, and a line in the tail telling it to commission would be that
 * instruction repeated on every turn rather than merely stated once.
 *
 * AND IT HAS THE METHOD'S TWO FRAMINGS ([[REQ-343]]), because it is the method in
 * one line and a standing instruction that contradicts the grant is worse here
 * than anywhere else: the tail is re-sent on every turn, so "construction is
 * commissioned, not performed" read by a consultant whose write groups have been
 * handed back is that contradiction repeated for the life of the engagement. The
 * flip-back has to reach the tail as well as the preamble, or it is not a
 * flip-back.
 */
export const DELEGATION_REMINDER_PROVIDER = 'delegation.reminder'

/**
 * The seed entry in the framework's product tier, rebound to this host's record
 * ([[REQ-283]]).
 *
 * UPSTREAM'S NAME, NOT ONE OF OURS, and that is deliberate. The shipped product
 * mapping (`defaults/product.json`) names this entry, and the entry's PLACE —
 * after the cache boundary, so rewriting it every turn cannot invalidate the
 * cached prefix in front of it — is the part of that mapping worth adopting. What
 * it is bound to is the host's decision, and here neither zone is where the
 * framework puts it: the standing note is a field on the chat ticket and the log
 * is that ticket's body, [[REQ-171]]'s ledger. The default binding reads a
 * `SummaryStore` this host does not have, so it would render nothing at all.
 *
 * Registering over it is the ordinary use of `register`, which is documented as
 * "replacing any previous binding"; the alternative — a second entry under a
 * second name — would put two seeds in the tier, only one of which is after the
 * boundary.
 */
export const SESSION_MEMORY_PROVIDER = 'session.summary'

/**
 * The name the per-turn nudge to keep the record current is reached under
 * ([[REQ-283]]).
 *
 * THIS HOST'S NAME AND NOT UPSTREAM'S `session.summary_trigger`, because the
 * words differ and the difference is the whole design: the framework's trigger
 * says to rewrite the frame and APPEND TO THE LOG, and both verbs here belong to
 * the ledger surface — `set_standing_note` and `record_decision` — rather than to
 * a summary store this host does not use. A session told to append to a log it
 * has no operation for is told about a capability it was not granted, which is
 * the one rule this file exists to keep.
 *
 * It renders `null` where there is no record to keep — the `1c` CLI — and a
 * `null` drops the entry and its separator.
 */
export const MEMORY_TRIGGER_PROVIDER = 'memory.trigger'

/**
 * The product tier's pointer at the rest of the conversation, rebound to a
 * host-level condition ([[REQ-283]]).
 *
 * UPSTREAM'S NAME AGAIN, for {@link SESSION_MEMORY_PROVIDER}'s reason. What is
 * rebound is the CONDITION and not the words. The framework's binding renders
 * only when `ctx.chatTicketUid` is set, which is conservative and right for a host
 * that cannot know — but that field is stamped by the archive on the first DRAIN,
 * and the priming is assembled once, before it. This entry sits BEFORE the cache
 * boundary, so it is assembled once and re-delivered: a session would therefore
 * never be told where its transcript is until it was resumed in a fresh isolate,
 * which is the one case that does not need telling.
 *
 * The question it is really asking is whether this host homes sessions on tickets
 * at all, and that is answered once, here, by whether there is a record to keep.
 */
export const TRANSCRIPT_POINTER_PROVIDER = 'session.transcript_pointer'

/**
 * The product tier's occupancy gauge ([[REQ-296]]; [[REQ-169]] upstream).
 *
 * UPSTREAM'S NAME, SPELLED HERE, for {@link SESSION_MEMORY_PROVIDER}'s reason —
 * and spelled as a literal because the framework does not export it. Every
 * provider name this project names lives in this file, whoever coined it.
 */
export const SESSION_BUDGET_PROVIDER = 'session.budget'

/**
 * Bind every provider name this project's configuration may use (REQ-182).
 *
 * ONE PLACE FOR BOTH HALVES. The file that names a provider and the function that
 * says what the name reaches are the two halves of one decision, and separating
 * them is how a configuration acquires a name nobody registered — which the
 * framework catches at load, loudly, but only after someone has shipped it.
 *
 * THE MANUAL IS A PROJECTION, which is a REQUIRED property rather than a nicety: a
 * session's manual never mentions a capability it was not granted, so the model
 * cannot propose one, apologise for one, or probe for one. A provider rather than
 * static text because it is a projection of the box.
 *
 * THE SUMMARY, NOT THE REFERENCE (REQ-171). The full manual is 43k characters of
 * one site's surface and was 98% of the priming document; the summary is 11k. What
 * it drops — every parameter, return shape and error code — is what `DescribeTools`
 * fetches for one tool at the moment it is about to be called, which is the only
 * moment it is needed.
 *
 * THE TWO SIGNALS ANSWER `null` AND VANISH. `if (since.changes > 0)` and
 * `if (delta)` used to decide whether to append a clause to a string the host was
 * assembling; they are the same conditions returning `null` instead, and the
 * framework drops the entry AND its separator. A turn on which neither fired
 * carries neither line and no residue of either.
 *
 * @param signal read late rather than captured, because a provider must see the
 *   state as it stands when the manager assembles the turn.
 */
export function registerSiteProviders(
  providers: Untyped,
  binding: {
    slug: string
    box: Untyped
    signal: () => TurnSignal | undefined
    /**
     * The site as it now stands, read late like the signal beside it
     * ([[REQ-285]]).
     *
     * A CALLBACK AND NOT A VALUE, for the reason every binding in this file takes
     * one: a provider must see the state as it stands when the manager assembles
     * THIS turn, and a digest captured at build would be the site as it was when
     * the manager was first constructed — which, on a long conversation in one
     * isolate, is the empty one. That is precisely the staleness this entry
     * exists to remove, so capturing it would invert the whole point.
     *
     * Optional, and absent is silence: a host with no digest to give renders no
     * entry rather than a heading over nothing.
     */
    digest?: (() => Promise<SiteDigest | null>) | null
    /**
     * The site's plan, read late ([[REQ-356]]). Absent is silence, like the
     * digest's.
     */
    plan?: (() => Promise<Plan | null>) | null
    /**
     * Whether this deployment composes the delegation surface ([[REQ-295]]).
     *
     * BOUND HERE RATHER THAN IN A SEAM OF ITS OWN, because the entries it fills
     * are consultant-tier and are exactly the kind of fact this function already
     * binds: `site.manual` says what this session can do, and this says what it
     * should do with one of those tools. Both of the consultant's declared
     * orders name the method entry unconditionally and the reminder tier names
     * the tail entry, so both names are registered either way; what they RENDER
     * is the switch.
     *
     * A VALUE AND NOT A CALLBACK, unlike the two signals beside it. Which
     * surfaces a deployment composes is settled when the manager is built and
     * cannot change under a running conversation — and the method entry sits in
     * the CACHED prefix, so a provider that could answer differently per turn
     * would be a volatile entry in a stable tier. The tail entry is volatile by
     * construction and still reads the same value, because the question it asks
     * is the same one and has the same answer for the life of the manager.
     *
     * DEFAULTS TO OFF, which is the safe direction: a host that forgot it sends
     * the prompt this repository sent before delegation existed.
     */
    delegating?: boolean
    /**
     * Whether the consultant still writes L1 itself ([[REQ-343]]).
     *
     * BESIDE {@link delegating} AND NOT DERIVED FROM IT, because they are two
     * facts and only the host knows the second: delegation can be composed with
     * the consultant still holding its own write groups, which is what every
     * deployment looked like before this key existed and what `primary_writes:
     * true` restores. What it selects is the method's framing — see
     * {@link delegationMethod}.
     *
     * A VALUE AND NOT A CALLBACK, for {@link delegating}'s reason exactly: the
     * grant is settled when the Toolbox is built and cannot change under a
     * running conversation, and the entry it fills sits in the cached prefix.
     *
     * DEFAULTS TO FALSE, as `delegation.json` reads an absent `primary_writes`: a
     * host that forgot it sends the framing the shipped document sends. The
     * direction that matters is that it never describes a choice to a session that
     * has not got one, which is the way a model reaches for a tool it lacks —
     * and the host passes the value it narrowed the grant with, so the framing and
     * the grant come from one decision.
     */
    writing?: boolean
    /** The framework's group-member framing, where this business runs a room ([[REQ-357]]). */
    room?: string | null
  },
): void {
  providers.register(MANUAL_PROVIDER, async () => binding.box.manual({ level: 'summary' }))
  providers.register(GROUP_ROOM_PROVIDER, async () => groupRoomFraming(binding.room ?? null))
  providers.register(DELEGATION_METHOD_PROVIDER, async () =>
    delegationMethod(binding.delegating === true, binding.writing === true),
  )
  // [[REQ-342]] — THE SAME FACT, BOUND TWICE, because the method is stated in the
  // cached prefix and repeated in the per-turn tail. One binding site and one
  // flag, so the two entries cannot come to disagree about whether this
  // deployment commissions anything.
  providers.register(DELEGATION_REMINDER_PROVIDER, async () =>
    delegationReminder(binding.delegating === true, binding.writing === true),
  )
  providers.register(SITE_LINE_PROVIDER, async () => siteLine(binding.slug))
  providers.register(SITE_CHANGES_PROVIDER, async () => changeSignal(binding.signal()))
  providers.register(CORPUS_DELTA_PROVIDER, async () => binding.signal()?.delta ?? null)
  providers.register(PLAN_ANSWERS_PROVIDER, async () => binding.signal()?.answers ?? null)
  providers.register(TURN_INTERRUPTED_PROVIDER, async () => interruptedSignal(binding.signal()))
  // [[REQ-285]] — REGISTERED EITHER WAY, and rendering `null` without a source,
  // for the reason the memory providers below are: the configuration names this
  // entry unconditionally, so a registry that omitted it could not load the
  // mapping at all. A host with no digest to give renders nothing and the
  // framework drops the entry and its separator.
  providers.register(PAGE_DIGEST_PROVIDER, async () =>
    binding.digest ? pageDigest(await binding.digest()) : null,
  )
  // [[REQ-356]] — REGISTERED EITHER WAY for the digest's reason. A plan that
  // cannot be read is silence rather than a failed turn: the plan makes a turn
  // better, it is not what makes one possible.
  providers.register(SITE_PLAN_PROVIDER, async () => {
    if (!binding.plan) return null
    try {
      return planReminder(await binding.plan())
    } catch {
      return null
    }
  })
}

/**
 * The ceiling the digest is written against ([[REQ-285]]).
 *
 * THE BOUND IS THE DESIGN CONSTRAINT AND NOT A SAFEGUARD ON IT. This entry is
 * volatile: it is re-assembled and re-sent on every turn for the life of an
 * engagement, so a digest that grew with the site would become the very problem
 * the epic is about. Measured against what it replaces — one page map plus two
 * element reads is already several thousand tokens — a few hundred a turn pays
 * for itself within a handful of turns and removes a whole class of
 * confabulation. If it could not be made small enough to win that trade it
 * should not ship, and this number is where that judgement is recorded.
 *
 * CHARACTERS AND NOT TOKENS, for {@link MAX_PRIMING_CHARS}'s reason: this module
 * has no tokeniser and acquiring one to bound a reminder would be a dependency
 * bought for an estimate. Two thousand is on the order of five hundred tokens.
 */
export const MAX_DIGEST_CHARS = 2_000

/**
 * What the digest sheds as a site outgrows the ceiling, in the order it sheds it
 * ([[REQ-285]]).
 *
 * DETAIL PER PAGE, NEVER A PAGE. A ten-page site lists ten pages with less about
 * each rather than five pages in full — because a page the session is not told
 * about is a page it will build a second time, which is a worse failure than a
 * page it has to call `describe_page` on. The page it is working on keeps its
 * detail longest, because that is the one the next turn is most likely about.
 *
 * THE FOUR RUNGS, in the order what they shed is worth least: everything; then
 * the PICTURES on the pages nobody is working on; then the BANDS on those pages;
 * then every page as one line.
 *
 * THE LAST RUNG STILL BOUNDS. A site with more pages than fit as bare lines has
 * its list cut with a sentence saying so and naming `list_pages`, which is the
 * cheap instrument ([[REQ-284]]) — a silent truncation would read exactly like a
 * complete listing, and this entry's whole value is that it can be trusted.
 */
const DIGEST_RUNGS = ['full', 'focus-assets', 'focus-bands', 'bare'] as const
type DigestRung = (typeof DIGEST_RUNGS)[number]

/**
 * The state line: where the counter stands, and what the public can see.
 *
 * THE COUNTER IS THE POINT OF THE WHOLE ENTRY. `list_changes` takes a `since`
 * and the session had no source for one, so on the turn it needed one it
 * produced one — `since: 120` against a true count of 76. A number it was given
 * is a number it cannot invent.
 */
function digestState(digest: SiteDigest): string {
  const publication =
    digest.live === null
      ? template('page-digest-never-published')
      : digest.pending === 0
        ? fill(template('page-digest-clean'), { live: digest.live })
        : fill(template('page-digest-pending'), {
            live: digest.live,
            pending: digest.pending,
            plural: digest.pending === 1 ? '' : 's',
            verb: digest.pending === 1 ? 'is' : 'are',
          })
  return fill(template('page-digest-state'), { at: digest.counter, publication })
}

/** One page's heading — what it is called, where it is, and whether it is the live one. */
function digestHeading(page: DigestPage, focused: boolean): string {
  const where = page.kind === 'email' ? template('page-digest-message') : page.address
  const marked = focused ? `, ${template('page-digest-focus')}` : ''
  return `### ${page.id} — "${page.title}" (${where})${marked}`
}

/**
 * One page at a given rung: its heading, then as much of it as that rung keeps.
 *
 * THE HEADING IS NEVER SHED — that is what "detail per page, never a page"
 * means. Below it the two kinds of detail go in the order they are worth least:
 * the pictures on the pages nobody is working on, then the bands on those pages,
 * then the working page's own detail.
 */
function digestPage(page: DigestPage, focused: boolean, rung: DigestRung): string {
  const bands =
    rung === 'full' || rung === 'focus-assets' || (focused && rung === 'focus-bands')
  const assets =
    rung === 'full' || (focused && (rung === 'focus-assets' || rung === 'focus-bands'))
  const lines = [digestHeading(page, focused)]
  if (bands) for (const band of page.bands) lines.push(`- ${band.path}  ${band.label}`)
  if (assets && page.assets.length > 0) {
    lines.push(fill(template('page-digest-assets'), { assets: page.assets.join(', ') }))
  }
  return lines.join('\n')
}

/** The whole digest at one rung, with the page list cut to `keep`. */
function digestAt(digest: SiteDigest, rung: DigestRung, keep: number): string {
  const shown = digest.pages.slice(0, keep)
  const parts = [template('page-digest'), digestState(digest)]
  if (digest.pages.length === 0) {
    parts.push(template('page-digest-no-pages'))
  } else {
    for (const page of shown) parts.push(digestPage(page, page.id === digest.focus, rung))
  }
  const more = digest.pages.length - shown.length
  if (more > 0) {
    parts.push(fill(template('page-digest-more'), { more, plural: more === 1 ? '' : 's' }))
  }
  return parts.join('\n\n')
}

/**
 * The site as it now stands, or `null` ([[REQ-285]]).
 *
 * WHAT IT REPLACES IS THE MEASURE OF IT. Most of the consultant's re-reading
 * exists because it does not trust its memory of the page across a failure — and
 * it is right not to. This is the page arriving WITH the turn instead: the pages
 * that exist and which one was last worked on, each page's bands in order, what
 * each references by the name the client reads, where the counter stands, and
 * whether anything is unpublished. None of it needs a tool call to establish, so
 * there is nothing left for the recovery ritual to do.
 *
 * IT SHEDS DETAIL RATHER THAN PAGES — see {@link DIGEST_RUNGS} — and it does so
 * by MEASURING rather than by estimating: each rung is rendered and its length
 * taken, which is exact and costs a few string joins on a document this size.
 * The alternative, budgeting characters per page ahead of rendering, is an
 * arithmetic that has to be kept in step with the prose and silently is not.
 *
 * `null` WHEN THERE IS NOTHING TRUE TO SAY, which drops the entry and its
 * separator. A host with no digest source is the `1c` CLI, and a `null` digest is
 * a store that could not be read; neither is a reason to put a heading over
 * nothing, and neither is a reason to fail the turn.
 */
export function pageDigest(digest: SiteDigest | null): string | null {
  if (digest === null) return null
  for (const rung of DIGEST_RUNGS) {
    const rendered = digestAt(digest, rung, digest.pages.length)
    if (rendered.length <= MAX_DIGEST_CHARS) return rendered
  }
  // THE LAST RUNG, CUT. Every page as one line is the floor; a site with more
  // pages than fit even so is cut with a sentence that SAYS it was cut and names
  // the call that completes it, because a silent truncation reads exactly like a
  // complete listing. One page is the minimum — a digest listing none would be a
  // heading over nothing, which is what `null` is for.
  let keep = digest.pages.length
  let rendered = digestAt(digest, 'bare', keep)
  while (rendered.length > MAX_DIGEST_CHARS && keep > 1) {
    keep -= 1
    rendered = digestAt(digest, 'bare', keep)
  }
  return rendered
}

/**
 * How many recorded decisions the seed carries ([[REQ-283]]).
 *
 * A TAIL, because the ledger is append-only and unbounded while the seed is not,
 * and the seed is re-assembled on EVERY turn — so this number is a per-turn cost
 * for the life of an engagement. Whole entries rather than a byte budget: a byte
 * tail cuts an entry after its decision and before its reasoning, which keeps the
 * half a reader can guess and drops the half they cannot.
 *
 * Eight rather than the framework's twelve because an entry here is a decision
 * with its reasoning and what it rejected — several hundred characters — where a
 * summary-log entry is a line. What falls off the end is not lost: the ledger is
 * this engagement's own ticket body, which is indexed, searchable, and readable.
 */
export const DECISION_TAIL = 8

/**
 * What this session has kept about its own engagement, or `null` ([[REQ-283]]).
 *
 * TWO ZONES WITH OPPOSITE POLARITY, which is why they render as two blocks and
 * not one. The STANDING NOTE is bounded and rewritten in place, so it is
 * delivered whole — for a note the earliest content is usually the most
 * load-bearing, which is the reverse of a transcript. The DECISIONS are
 * append-only and unbounded, so they are delivered as a tail.
 *
 * NEITHER ZONE IS A TRANSCRIPT and the prose says so: a session that reads this
 * as "the conversation, abridged" will distrust it, and a session that trusts it
 * as the record it is will stop re-deriving what it already settled — which is
 * the behaviour this whole entry exists to buy.
 *
 * `null` WHEN THERE IS NOTHING TRUE TO SAY — no note written and no decision
 * recorded — which drops the entry and its separator rather than delivering a
 * heading over nothing. A brand-new conversation is exactly that case.
 */
export function sessionMemory(
  standingNote: string,
  decisions: string[],
  tail: number = DECISION_TAIL,
): string | null {
  const note = (standingNote ?? '').trim()
  if (note === '' && decisions.length === 0) return null
  const parts = [template('session-memory')]
  if (note !== '') parts.push(template('session-memory-note'), note)
  if (decisions.length > 0) {
    const shown = decisions.slice(-tail)
    parts.push(
      fill(template('session-memory-decisions'), {
        entries: decisions.length,
        shown: shown.length,
        plural: decisions.length === 1 ? '' : 's',
      }),
      ...shown,
    )
  }
  return parts.join('\n\n')
}

/**
 * Where this session's own record lives, as the seed needs to read it
 * ([[REQ-283]]).
 *
 * ONE CALLBACK AND ONE READ. Both zones are on one object — the standing note in
 * the chat ticket's frontmatter, the decisions in its body — so asking for them
 * separately would be two fetches of the same ticket on every turn. It is a
 * callback rather than a value for the reason every other binding in this file is
 * one: the provider must see the record as it stands when the manager assembles
 * THIS turn, and a value captured at build is the record as it was when the
 * site's manager was first constructed, which on a long conversation in one
 * isolate is the empty one.
 *
 * `decisions` ANSWERS WHOLE ENTRIES rather than a body, so this module never
 * learns the ledger's format. `ledger-core.ts` owns that, says so, and exports
 * the split.
 */
export interface SessionMemorySource {
  record(): Promise<{
    /** The standing note as stored, or `''` when nothing has written one. */
    note: string
    /** Every recorded decision, whole and oldest first. Empty is ordinary. */
    decisions: string[]
  }>
}

/**
 * Bind the two names this host's session memory is reached under ([[REQ-283]]).
 *
 * THE SAME BARGAIN {@link registerSiteProviders} KEEPS — the file that names a
 * provider and the function that says what the name reaches sit together — and
 * separate from it because the question they answer is different: those are about
 * the SITE, these are about the CONVERSATION, and a host can have one without the
 * other. The `1c` CLI is exactly that host, and passes `null`.
 *
 * REGISTERED EITHER WAY, and rendering `null` without a source. The shipped
 * product tier names {@link SESSION_MEMORY_PROVIDER} unconditionally, so a
 * registry that omitted it could not load the mapping at all — the same reason
 * upstream gives for registering its own summary provider with no store. The
 * trigger is this host's own name and could have been omitted, but is bound on
 * the same terms so that one call answers the whole question.
 *
 * A FAILED READ IS SILENCE, NOT A FAILED TURN. The record is what makes a turn
 * good, not what makes one possible, and a store that cannot be read is a reason
 * not to claim a record rather than a reason to refuse the client an answer.
 */
/**
 * The occupancy gauge in the framework's product tier, rebound to a figure that
 * survives this host's turn boundary ([[REQ-296]]).
 *
 * UPSTREAM'S NAME AND UPSTREAM'S PROVIDER, for {@link SESSION_MEMORY_PROVIDER}'s
 * reason and one further one. The shipped product mapping names this entry and
 * puts it AFTER the cache boundary, which is the part worth adopting: entries past
 * the marker are re-assembled every turn and ride the per-turn tail, past the
 * message history, so a figure that changes on every turn cannot invalidate the
 * cached prefix in front of it ([[REQ-144]]). Writing our own gauge into the
 * reminder would have put the same number in the same place and forked the prose;
 * writing it into `system` would have cost more than the overflow does.
 *
 * WHAT IS REBOUND IS THE INPUT, NOT THE WORDS. The provider itself — its three
 * outcomes, its rounding, every sentence it renders — is the framework's, taken
 * out of the registry and called with one field replaced. The framework's
 * `ctx.occupancyTokens` is a field on the manager's in-memory session, and on a
 * Worker the manager is rebuilt per request and the session resumed from the
 * archive, so it is zero on every turn and the gauge renders nothing at all. The
 * host keeps the figure durably instead (`session-occupancy.ts`).
 *
 * `ctx` FIRST, THE DURABLE FIGURE SECOND, and that order is deliberate: where the
 * manager DOES live across turns — the `1c` CLI, one process — the framework's own
 * measurement is the most recent thing there is, and the stored figure is at best
 * equal to it.
 *
 * `registerDefaults` MUST HAVE RUN. This reads the shipped binding out of the
 * registry rather than reimplementing it, so a caller that has not loaded the
 * framework's defaults gets `PrimingConfigError` naming the provider — which is
 * the right failure and is raised at start-up.
 *
 * @param measured the durable figure for a session, or `0` where this host keeps
 *   none. A failed read is silence: the gauge renders nothing rather than failing
 *   the turn it was assembled for.
 */
export function registerBudgetProvider(
  providers: Untyped,
  measured: (sessionId: string) => Promise<number>,
): void {
  const shipped = providers.get(SESSION_BUDGET_PROVIDER) as (ctx: Untyped) => Promise<string | null>
  providers.register(SESSION_BUDGET_PROVIDER, async (ctx: Untyped) => {
    let occupancy = Math.trunc(Number(ctx?.occupancyTokens) || 0)
    if (occupancy <= 0) {
      try {
        occupancy = Math.trunc(Number(await measured(String(ctx?.sessionId ?? ''))) || 0)
      } catch {
        occupancy = 0
      }
    }
    return shipped({ ...ctx, occupancyTokens: occupancy })
  })
}

/**
 * The roles this host's session record BELONGS TO ([[REQ-339]]).
 *
 * THE RECORD IS THE CONVERSATION'S, NOT THE SITE'S, and that distinction was not
 * drawn until there was a second kind of session on the same site. The ledger is
 * resolved per site (`deps.ledger(slug)`) and the registry below is the one every
 * role on that site is assembled from, so a worker opened by a delegation was
 * handed the consultant's standing note and its decisions — and read them as its
 * own, on its first turn, as a resumption: *"I'm picking up mid-engagement. My
 * standing note shows…"*, restated at the head of every turn afterwards. The
 * comment beside the worker's toolbox already said a worker composes *"no
 * ledger… no session context"*; that was true of its TOOLS and false of its
 * priming.
 *
 * AN ALLOW-LIST RATHER THAN A DENY-LIST FOR THE WORKER. What the entry states —
 * *"your record of this engagement"* — is only true of a session that can keep
 * one, and the verbs that keep it (`set_standing_note`, `record_decision`) are on
 * the ledger surface, which `instances.json` grants to the consultant alone. So
 * the honest condition is which role owns the record, and a role added later gets
 * silence until somebody says otherwise — rather than the consultant's memory by
 * default, which is the failure this exists to close.
 *
 * THE LEGACY NAMES ARE IN IT, because they are extra keys onto the SAME role
 * object (see {@link LEGACY_ROLE_NAMES}): a conversation started before the
 * rename resumes under its stored name, and dropping its record on resume would
 * be this bug again with the sides swapped.
 */
const RECORD_KEEPING_ROLES: ReadonlySet<string> = new Set<string>([
  CONSULTANT_ROLE,
  ...LEGACY_ROLE_NAMES,
])

export function registerMemoryProviders(
  providers: Untyped,
  source: SessionMemorySource | null,
  transcriptPointer: string | null = null,
): void {
  // THE WORDS ARE THE FRAMEWORK'S AND THE CONDITION IS OURS — see
  // {@link TRANSCRIPT_POINTER_PROVIDER}. Passed in rather than read here because
  // this module knows no AI library; it is the same shape every other template in
  // this file has, with the data file one rung further out.
  providers.register(TRANSCRIPT_POINTER_PROVIDER, async () =>
    source !== null && transcriptPointer ? transcriptPointer : null,
  )
  providers.register(SESSION_MEMORY_PROVIDER, async (ctx: Untyped) => {
    if (source === null) return null
    // A WORKER IS TOLD NONE OF IT ([[REQ-339]]), by the same mechanism a host
    // with no ledger is: the entry renders `null`, the framework drops it and its
    // separator, and nothing else about the tier moves. `ctx.role` is the role
    // this priming is being assembled FOR and is populated on every assembly path
    // the manager has — the cold start, the resume, and the per-turn rebuild of
    // the volatile half — which is what lets one registry serve both roles.
    if (!RECORD_KEEPING_ROLES.has(String(ctx?.role ?? ''))) return null
    try {
      const { note, decisions } = await source.record()
      return sessionMemory(note, decisions)
    } catch {
      return null
    }
  })
  providers.register(MEMORY_TRIGGER_PROVIDER, async () =>
    source === null ? null : template('memory-trigger'),
  )
}

/**
 * Bind the names the settings configuration uses ([[REQ-239]]).
 *
 * THE SAME BARGAIN {@link registerSiteProviders} KEEPS: the file that names a
 * provider and the function that says what the name reaches are two halves of one
 * decision, so they sit in one module and a name can only be added to the
 * configuration by adding it here too.
 *
 * `name` IS A CALLBACK AND IS READ PER TURN, not a value captured at build. The
 * business's name is the thing this session most often CHANGES, so a reminder
 * rendered once would go on framing the conversation with the name the customer
 * has just corrected — which is the one stale string a session about names must
 * not carry.
 *
 * AND THE FRAMING SURVIVES A RECORD THAT CANNOT BE READ. A business that has gone
 * — deleted, or a grant withdrawn mid-conversation — renders no line rather than a
 * line naming nothing, and the operations answer the declaration's own `NO_BUSINESS`
 * refusal when they are called. A `null` drops the entry and its separator.
 */
export function registerSettingsProviders(
  providers: Untyped,
  binding: {
    box: Untyped
    name: () => Promise<string | null>
    /** Read late, like the site half's, for the same reason ([[BUG-121]]). */
    signal: () => TurnSignal | undefined
  },
): void {
  providers.register(BUSINESS_MANUAL_PROVIDER, async () => binding.box.manual({ level: 'summary' }))
  providers.register(BUSINESS_LINE_PROVIDER, async () => {
    const name = await binding.name()
    return name ? businessLine(name) : null
  })
  // THE SAME NAME THE CONSULTANT REACHES IT UNDER ([[BUG-121]]), AND NOT THE SAME
  // WORDS ([[REQ-284]]). A settings turn can be interrupted exactly as a site turn
  // can — the customer closes the tab mid-rename — and the SITUATION does not depend
  // on which conversation it was. What to do about it does: the consultant's line
  // names `list_changes`, which this session has never been granted and has no site
  // to call it on, so this one names the reads it does have.
  providers.register(TURN_INTERRUPTED_PROVIDER, async () =>
    interruptedSignal(binding.signal(), INTERRUPTED_TEMPLATE_SETTINGS),
  )
}

/**
 * Bind the names the builder's configuration adds: its manual ([[REQ-295]]) and
 * its page vocabulary ([[BUG-182]]).
 *
 * ONLY THOSE, because everything else a worker is told it shares with the consultant
 * and reads under the consultant's own names: `site.line` says which site, and
 * `site.digest` says what is currently on it. Those are facts about the SITE, and
 * both roles are on the same one in the same manager — a second binding would be
 * a second answer to a question that has one.
 *
 * REGISTERED ONLY WHERE THERE IS A WORKER TO REGISTER IT FOR. The builder role is
 * loaded only when this deployment composes the delegation surface, and
 * `rolesFromMapping` validates a role's providers when that role is loaded — so
 * with the switch off there is no role naming this name and nothing to bind.
 *
 * @param box the worker's Toolbox — the one its own tools are projected from,
 *   which is NOT the consultant's. See {@link BUILDER_MANUAL_PROVIDER}.
 */
/**
 * What the consultant is told about the room, or `null` with group chat off
 * ([[REQ-357]]). The framework's own group-member framing followed by this
 * product's one paragraph; null renders nothing, so with the switch off the
 * prompt is byte-for-byte what it was.
 */
export function groupRoomFraming(memberFraming: string | null): string | null {
  if (memberFraming === null) return null
  return `${memberFraming}\n\n${template('group-room')}`
}

/** The coordinator's manual provider, bound to its own box ([[REQ-357]]). */
export function registerCoordinatorProviders(
  providers: Untyped,
  binding: { box: Untyped; signal?: () => TurnSignal | undefined },
): void {
  providers.register(COORDINATOR_MANUAL_PROVIDER, async () => binding.box.manual({ level: 'summary' }))
  // [[REQ-364]] — the client's panel answers, on the coordinator's own cursor.
  providers.register(COORDINATOR_PLAN_ANSWERS_PROVIDER, async () => binding.signal?.()?.answers ?? null)
}

/** The coordinator's role, loaded through the framework's mapping ([[REQ-357]]). */
export function coordinatorRole(lib: Untyped, providers: Untyped): Untyped {
  const roles = lib.rolesFromMapping(
    { roles: { [COORDINATOR_ROLE]: coordinatorPrimingConfig() } },
    { providers },
  )
  return roles[COORDINATOR_ROLE]
}

export function registerBuilderProviders(providers: Untyped, binding: { box: Untyped }): void {
  providers.register(BUILDER_MANUAL_PROVIDER, async () => binding.box.manual({ level: 'summary' }))
  providers.register(BUILDER_VOCABULARY_PROVIDER, async () =>
    fill(template('builder-vocabulary'), { vocabulary: builderVocabulary() }),
  )
}

/**
 * How this host's session reaches its own tool records ([[REQ-296]]).
 *
 * THE FRAMEWORK'S ENTRY, THIS HOST'S WORDS. `registerDefaults` takes an override
 * for the shipped prose precisely for a host whose artifact is reachable
 * differently, and this one is: upstream's sentence says to *"search or read it"*
 * without naming an instrument, because upstream cannot know there is one. Here
 * there is — `read_work_log` on the ledger surface — and the one rule this file
 * keeps is that a session is never told about a capability it was not granted, in
 * either direction: pointing it at a log with no way in was why this entry was
 * declined until now.
 *
 * IT IS A TEMPLATE AND NOT A STRING HERE, like every other word a session is told
 * by hand: the prose lives in `priming.json` and this is the accessor.
 */
export function toolTranscriptNote(): string {
  return template('tool-transcript-note')
}

/**
 * How the consultant hands work over, or `null` ([[REQ-295]], [[REQ-343]]).
 *
 * THE WORDS ARE THE CONFIGURATION'S AND THE CONDITION IS THE CODE'S, which is the
 * split this file keeps everywhere — see {@link interruptedSignal}, whose prose
 * lives in the same `templates` block for the same reason.
 *
 * `null` DROPS THE ENTRY AND ITS SEPARATOR, which is the whole of what makes the
 * switch a rollback: a deployment that does not compose the delegation surface
 * sends byte-for-byte the prompt this host sent before delegation existed. Prose
 * telling a session how to use a tool it has not got is an instruction to reach
 * for one, and a model will offer it, apologise for it, or probe for it.
 *
 * TWO FRAMINGS AND ONE BODY ([[REQ-343]]), and `writing` picks the framing. The
 * sentence above is the reason for the second one, read the other way round:
 * [[REQ-342]]'s opening says construction is commissioned here and not performed,
 * which is true of the deployment that ships and false of the one that flips
 * `primary_writes` back — and prose telling a session that building is not its
 * work, read by a session holding every write group, suppresses tools it has just
 * as surely as the other direction invents ones it has not. So the flip-back
 * reaches the prose and not only the grant. The method behind the framing — how to
 * write a brief, what to ask to have checked, what comes back and what the record
 * cannot settle — is true either way and is not duplicated.
 *
 * `writing` DEFAULTS TO FALSE, which is the one rule this ticket keeps in all three
 * places: `delegation.json` reads an absent `primary_writes` as `false`, the
 * document ships it `false`, and a caller here that never answered the question
 * gets the same. The host passes the value it composed the grant from, so the prose
 * cannot describe a session the grant does not match — and where the answer is
 * missing altogether, the framing that arrives is the shipped one rather than a
 * fourth state nobody deployed.
 */
export function delegationMethod(delegating: boolean, writing = false): string | null {
  if (!delegating) return null
  return fill(template('delegation-method'), {
    framing: template(writing ? 'delegation-method-choosing' : 'delegation-method-commissioning'),
  })
}

/**
 * The same instruction in one line, for the per-turn tail ([[REQ-342]]).
 *
 * THE SAME CONDITIONS AND DIFFERENT TEMPLATES — see
 * {@link DELEGATION_REMINDER_PROVIDER} for why the pair is two names rather than
 * one. Both halves render on the same two booleans because they are the same two
 * facts about the deployment: a host that commissions says both, a host that does
 * not says neither, and a host whose consultant still writes says both in the
 * framing that leaves it its hands ([[REQ-343]]). There is no state in which one
 * without the other, or one framing against the other's grant, would be true.
 */
export function delegationReminder(delegating: boolean, writing = false): string | null {
  if (!delegating) return null
  return template(writing ? 'delegation-reminder-choosing' : 'delegation-reminder')
}

/**
 * The consultant's role, built by the framework's own loader (REQ-182).
 *
 * LOADED, NOT CONSTRUCTED, and that is the point of the change. Building `Entry`
 * and `Role` by hand — which is what BUG-63 did to get the host building again —
 * skips every check the format has: an entry declaring both `text` and
 * `provider` or neither, a `cache_boundary` marker carrying keys, a second
 * marker in one tier, a marker in `reminders` where there is no prefix for one to
 * end, and above all a `provider:` naming something nobody registered. Going
 * through `rolesFromMapping` makes all of those this host's behaviour, raised at
 * start-up naming the offending entry, rather than upstream properties it
 * happens not to exercise.
 *
 * Every provider must therefore be registered BEFORE this is called.
 */
export function consultantRole(lib: Untyped, providers: Untyped, withCorpus: boolean): Untyped {
  const roles = lib.rolesFromMapping(
    { roles: { [CONSULTANT_ROLE]: primingConfig(withCorpus) } },
    { providers },
  )
  return roles[CONSULTANT_ROLE]
}

/**
 * The settings role, built by the same loader ([[REQ-239]]).
 *
 * THROUGH `rolesFromMapping` FOR THE REASON THE CONSULTANT IS: hand-building a
 * `Role` skips every check the format has, and the one this role is most exposed
 * to is the last of them — a `provider:` naming something nobody registered. It
 * names two providers that did not exist until this ticket, so the loader's
 * complaint at start-up, naming the entry, is exactly the failure worth buying.
 */
export function settingsRole(lib: Untyped, providers: Untyped): Untyped {
  const roles = lib.rolesFromMapping(
    { roles: { [SETTINGS_ROLE]: settingsPrimingConfig() } },
    { providers },
  )
  return roles[SETTINGS_ROLE]
}

/**
 * The builder's role, built by the same loader ([[REQ-295]]).
 *
 * THROUGH `rolesFromMapping` FOR THE REASON BOTH OF THE OTHERS ARE, plus one this
 * role has on its own: it is the first whose `tools` field is READ. That field
 * has been carried by every role since roles existed and consumed by nothing at
 * all; the delegation surface builds each worker's Toolbox from it, so a grant
 * that does not match the surfaces the worker was configured with is a start-up
 * failure here rather than a worker that opens with the wrong authority.
 *
 * @param tools the grant, already narrowed to the surfaces this deployment
 *   composed — see {@link builderPrimingConfig}.
 * @param withCorpus whether the worker was composed with the platform reference
 *   ([[REQ-355]]) — see {@link builderKnowledge}.
 */
export function builderRole(
  lib: Untyped,
  providers: Untyped,
  tools: Record<string, unknown>,
  withCorpus = false,
): Untyped {
  const roles = lib.rolesFromMapping(
    { roles: { [BUILDER_ROLE]: builderPrimingConfig(tools, withCorpus) } },
    { providers },
  )
  return roles[BUILDER_ROLE]
}

/** What {@link registerCorpusProviders} needs out of the `ai-knowledge` bridge. */
export interface KnowledgeBridge {
  LANDSCAPE_PROVIDER: string
  MECHANISM_PROVIDER: string
  registerKmProviders: (providers: Untyped, runtime: () => Untyped, opts: Untyped) => Untyped
}

/**
 * Register the two providers the corpus half of the priming names.
 *
 * IT REGISTERS AND RETURNS NOTHING (REQ-182). Until now this seam also built the
 * entry list, which meant the order of a session's priming was decided in two
 * places at once — here for the corpus, in the host for everything around it.
 * The order is in the configuration file now, so this is left with the one job it
 * was always really doing: binding `km.landscape` and `km.mechanism` to this
 * session's runtime.
 *
 * It no longer sees the role's purpose either (REQ-182 §7). KM has no business
 * knowing what the agent reading its map is for; the purpose is an ordinary
 * `text:` entry sitting between the map and the mechanism, which is where it was
 * being inserted anyway.
 *
 * BOTH PROVIDERS OR NEITHER, decided by one seam. `mechanismFor` returning `null`
 * says the backend reaches KM not at all, and a map a session has no way to
 * search is not priming — it is an instruction to use tools it was never granted.
 *
 * @param bridge the `ai-knowledge` component. A value rather than an import
 *   because this file is read by a Worker as well as by the CLI, and each
 *   resolves the library its own way.
 * @param runtime a callable, not a runtime: seeding a knowledge base is expensive
 *   and hosts defer it to first use, so registration must not force that work.
 * @param names the provider names to register under — the KM defaults unless a
 *   second, narrowed pair is being bound beside them ([[REQ-355]]).
 */
export function registerCorpusProviders(
  bridge: KnowledgeBridge,
  runtime: () => Untyped,
  names: { landscapeName: string; mechanismName: string } | null = null,
): (box: Untyped, providers: Untyped) => Promise<void> {
  return async (box: Untyped, providers: Untyped) => {
    bridge.registerKmProviders(providers, runtime, {
      ...(names ?? {}),
      // THE SUMMARY, NOT THE REFERENCE (REQ-171). The full manual is 43k
      // characters of one site's surface and was 98% of the priming document;
      // the summary is 11k. What it drops — every parameter, return shape and
      // error code — is what `DescribeTools` fetches for one tool at the moment
      // it is about to be called, which is the only moment it is needed.
      //
      // Every backend either host runs is granted the surface, so the answer is
      // never `null` here. The seam stays because it is where a host that
      // reaches KM differently per substrate would say so.
      mechanismFor: () => box.manual({ level: 'summary' }),
    })
  }
}

/** What {@link builderKnowledge} needs out of the `ai-knowledge` bridge. */
export interface WorkerKnowledgeBridge extends KnowledgeBridge {
  KnowledgeToolbox: new (runtime: Untyped) => Untyped
  knowledgeInstanceConfig: (kbs: string[]) => Untyped
}

/**
 * The platform reference, as a worker receives it ([[REQ-355]]).
 *
 * A SURFACE FACTORY AND A PRIMING BINDING, and they travel together for
 * `system-knowledge.ts`'s rule: search without priming is the same failure as no
 * search. A worker handed the tools and no map has no reason to believe there is
 * anything to find, so it guesses instead — which is how a worker came to report
 * that containers have no per-width layout when the L1 reference says they do.
 */
export interface WorkerKnowledge {
  /**
   * A FRESH surface per call, never the consultant's instance: a Toolbox binds
   * each surface to the grant it is constructed with (see `l1SurfaceSet`).
   */
  surface: () => { surface: Untyped; granted: Record<string, unknown> }
  /** Binds {@link BUILDER_LANDSCAPE_PROVIDER} and {@link BUILDER_MECHANISM_PROVIDER}. */
  priming: (box: Untyped, providers: Untyped) => Promise<void>
}

/**
 * The worker's knowledge, over ONE knowledge base ([[REQ-355]]).
 *
 * THE ONE KB IS THE CALLER'S TO NAME AND THE HOSTS NAME THE SYSTEM KB. The grant
 * is `knowledgeInstanceConfig([kb])` over a runtime that holds that KB alone, so
 * both the scope axis and what a search can physically rank agree that nothing
 * wider is reachable: not the client's own corpus, and not anything in the
 * engagement's ledger or catalogue, which are different surfaces the worker is
 * never composed with. Both hosts build it here so the two cannot come to
 * disagree about which knowledge bases a worker may reach.
 *
 * @param runtime a callable, as {@link registerCorpusProviders} takes one.
 */
export function builderKnowledge(
  bridge: WorkerKnowledgeBridge,
  runtime: () => Untyped,
  kb: string,
): WorkerKnowledge {
  return {
    surface: () => ({
      surface: new bridge.KnowledgeToolbox(runtime()),
      granted: bridge.knowledgeInstanceConfig([kb]) as Record<string, unknown>,
    }),
    priming: registerCorpusProviders(bridge, runtime, {
      landscapeName: BUILDER_LANDSCAPE_PROVIDER,
      mechanismName: BUILDER_MECHANISM_PROVIDER,
    }),
  }
}
