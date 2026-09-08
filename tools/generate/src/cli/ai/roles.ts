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

/** The AI library and the bridge are untyped JavaScript; the boundary is here. */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

/** The one role this project defines. Named, so nothing addresses it as a literal. */
export const CONSULTANT_ROLE = 'consultant'

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
  binding: { slug: string; box: Untyped; signal: () => TurnSignal | undefined },
): void {
  providers.register(MANUAL_PROVIDER, async () => binding.box.manual({ level: 'summary' }))
  providers.register(SITE_LINE_PROVIDER, async () => siteLine(binding.slug))
  providers.register(SITE_CHANGES_PROVIDER, async () => changeSignal(binding.signal()))
  providers.register(CORPUS_DELTA_PROVIDER, async () => binding.signal()?.delta ?? null)
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
 */
export function registerCorpusProviders(
  bridge: KnowledgeBridge,
  runtime: () => Untyped,
): (box: Untyped, providers: Untyped) => Promise<void> {
  return async (box: Untyped, providers: Untyped) => {
    bridge.registerKmProviders(providers, runtime, {
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
