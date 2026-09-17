/**
 * The session knowledge base ([[REQ-262]] behaviour 2).
 *
 * WHAT PROBLEM THIS SOLVES. A loop-1 round starts knowing nothing beyond a
 * method brief and re-derives its bearings every time. The first live round
 * spent ten `Read` calls rediscovering that `backgroundImageUrl` is
 * deliberately distinct from `src` — a distinction stated plainly in the
 * engine's own comments and in [[DOC-53]] §1.6. This loop runs MANY times, so
 * knowledge a round has to rediscover is a cost paid on every round forever.
 *
 * THE SELECTION RULE IS: EVERY `doc` TICKET ([[REQ-262]] D2). Not an opt-in
 * field, not a hand-maintained list. A list in this file drifts from what
 * exists the first time a document is renamed or retired, and an opt-in field
 * is a mechanism somebody has to remember to set for a benefit {@link
 * INDEX_FILE} already delivers. One rule, no membership to maintain, and a
 * document written tomorrow is in the KB the moment it is saved.
 *
 * A PRODUCTION-KB DOCUMENT IS IN TOO ([[REQ-262]] D3). `doc_kind: system_kb`
 * marks a document as the builder AI's; it does not mark it as uninteresting
 * to a diagnosing round, and the rule above admits it without a special case.
 * THE REVERSE IS NOT TRUE AND IS THE ASYMMETRY THAT MATTERS: nothing here
 * writes to the production corpus, and `exportCorpus` admits only
 * `doc_kind: system_kb` (`tools/generate/src/cli/kb.ts`), so [[DOC-53]] —
 * `doc_kind: architecture` — is excluded from it by construction. A round
 * reading an extra document wastes tokens; a client-facing agent reading an
 * extra document misinforms a customer.
 *
 * THE INDEX IS LOAD-BEARING, NOT A CONVENIENCE. The corpus is 52 documents and
 * close to 900 KB — around 222k tokens if read whole, which no round may do.
 * The round reads {@link INDEX_FILE} and then the two or three documents it
 * points at. A KB built without an index is not built, which is why
 * {@link buildSessionKb} writes it in the same pass and reports it as part of
 * the same result.
 *
 * READ THROUGH THE `xgd` CLI, NEVER FROM `.xgd/` BY PATH. The on-disk ticket
 * format is xgd's own business, and a console that parsed it would be coupled
 * to an internal it does not own. This mirrors `kb.ts`'s `readDocTickets` for
 * exactly the same reason, and it is what makes [[REQ-262]] requirement 7 true
 * of the console as well as of the round.
 *
 * WRITTEN AS ORDINARY FILES so the round reaches every document with `Read`,
 * `Glob` and `Grep` (requirement 6) — a property of the directory rather than a
 * route the round has to be told about.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { parseJsonOutput, type CommandRunner } from './run'

/** The directory, inside the console's workspace, that the prompt names. */
export const SESSION_KB_DIR = 'kb'

/** The map the round reads first. See the header: this is not optional. */
export const INDEX_FILE = 'INDEX.md'

/** The ticket type that is swept. The whole of the selection rule. */
export const KB_TICKET_TYPE = 'doc'

/** One document, as the index lists it and the round reads it. */
export interface SessionKbDoc {
  id: string
  uid: string
  title: string
  /** The file inside {@link SESSION_KB_DIR}, e.g. `DOC-53.md`. */
  file: string
  /** One line saying what question this document answers. */
  summary: string
  /** `architecture`, `system_kb`, … — recorded, never filtered on. */
  kind: string
}

export interface SessionKbResult {
  /** Absolute path to the directory, for the prompt to name. */
  dir: string
  docs: SessionKbDoc[]
  /** Why the KB is empty or short, when it is. Never thrown at the caller. */
  error?: string
}

/** What `xgd ticket list --type doc --view --json` hands back per item. */
interface DocTicket {
  uid?: string
  id?: string
  title?: string
  body?: string | null
  fields?: Record<string, unknown> | null
}

/**
 * Every `doc` ticket, through the CLI.
 *
 * `--no-limit` because a truncated page would produce a KB that is silently
 * SHORT — a round would search it, find nothing, and conclude the project has
 * not documented the thing rather than that the console stopped reading. So a
 * page that still reports more to come is an error and not a partial success,
 * exactly as `kb.ts` decided for the production corpus.
 */
export async function readDocTickets(cwd: string, run: CommandRunner): Promise<DocTicket[]> {
  const result = await run('xgd', ['ticket', 'list', '--type', KB_TICKET_TYPE, '--view', '--json', '--no-limit'], cwd)
  if (result.code !== 0) throw new Error(`xgd refused to list documents: ${lastWords(result.stderr || result.stdout)}`)
  // `xgd` BRACKETS its output with a banner at each end, so the document is
  // looked for inside the stdout rather than parsed from the whole of it. This
  // is `parseJsonOutput`'s job and not a second copy of it here.
  const parsed = parseJsonOutput<{
    items?: DocTicket[]
    next_cursor?: string | null
    truncated?: boolean
  }>(result.stdout, 'xgd ticket list')
  if (parsed.truncated === true || (parsed.next_cursor ?? null) !== null) {
    throw new Error(
      `xgd ticket list returned a truncated page despite --no-limit ` +
        `(${(parsed.items ?? []).length} item(s), more to come). The KB would be silently short.`,
    )
  }
  return parsed.items ?? []
}

/**
 * One line saying what a document answers, for the index.
 *
 * The title, plus the document's opening sentence when it adds something. A
 * title alone is often a noun phrase — "Design Lessons Log" — that does not
 * tell a round whether to open it, and the opening sentence of these documents
 * is reliably a statement of what the document is for.
 *
 * Markdown decoration is stripped rather than rendered: the index is read by
 * something that will decide from the words, and `**` around them is noise it
 * would pay for by the token.
 */
export function summarise(title: string, body: string | null | undefined, limit = 200): string {
  const prose = (body ?? '')
    .split('\n')
    .map((line) => line.trim())
    // Headings, quotes, list bullets, frontmatter fences and link-only lines are
    // structure rather than statement; the first PARAGRAPH is what we want.
    .filter((line) => line && !line.startsWith('#') && !line.startsWith('---') && !line.startsWith('>'))
    .join(' ')
  const plain = prose
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*`_]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  const sentence = /^(.{40,}?[.!?])(\s|$)/.exec(plain)?.[1] ?? plain
  const text = sentence.length > limit ? `${sentence.slice(0, limit).trimEnd()}…` : sentence
  return text ? `${title} — ${text}` : title
}

/**
 * The document as the round reads it.
 *
 * FRONTMATTER IS STRIPPED. It is ticket bookkeeping — uids, timestamps, a
 * status — and every line of it is context the round pays for and cannot use.
 * What survives is the one fact the round might reason about, the document's
 * kind, restated as a readable line under the title.
 */
export function kbDocument(doc: SessionKbDoc, body: string | null | undefined): string {
  return `# ${doc.id} — ${doc.title}\n\n*${doc.kind}*\n\n${(body ?? '').trim()}\n`
}

/** The index: what each document answers, and the file it is in. */
export function kbIndex(docs: SessionKbDoc[]): string {
  const lines = docs.map((doc) => `- \`${doc.file}\` — **${doc.id}** · ${doc.summary}`)
  return [
    '# The session knowledge base',
    '',
    `${docs.length} document(s). **Read this index, not the corpus** — read whole it is`,
    'far larger than a round should spend, and every line below says what its',
    'document answers so you can open only the two or three you need.',
    '',
    'Every `doc` ticket in the project is here; the list is swept, not curated,',
    'so a document written since the last round is already present.',
    '',
    ...lines,
    '',
  ].join('\n')
}

export interface BuildSessionKbOptions {
  /** Repo root — where `xgd` is run. */
  cwd: string
  run: CommandRunner
  /** The console workspace; the KB is `<workspace>/kb`. */
  workspace: string
}

/**
 * Build the KB for one round.
 *
 * REBUILT EVERY ROUND, so it cannot go stale. The alternative — build once and
 * refresh on demand — makes "is this document current?" a question a round
 * would have to think about, and the whole point of the KB is to remove
 * questions a round would otherwise have to answer for itself.
 *
 * A FAILURE HERE IS NEVER A FAILED ROUND. If `xgd` will not list, the round
 * runs with whatever KB is on disk (possibly none) and the reason travels in
 * {@link SessionKbResult.error} so the prompt can say so plainly. A round
 * without a KB is the round we had before this ticket, which was a working
 * round; refusing to diagnose because its reading material is missing would
 * turn an improvement into a new way to fail.
 */
export async function buildSessionKb(opts: BuildSessionKbOptions): Promise<SessionKbResult> {
  const dir = path.join(opts.workspace, SESSION_KB_DIR)
  mkdirSync(dir, { recursive: true })

  let tickets: DocTicket[]
  try {
    tickets = await readDocTickets(opts.cwd, opts.run)
  } catch (err) {
    return { dir, docs: readExistingDocs(dir), error: err instanceof Error ? err.message : String(err) }
  }

  const docs: SessionKbDoc[] = []
  const written = new Set<string>([INDEX_FILE])
  for (const ticket of tickets) {
    // A document with no id has no filename, and inventing one would put a file
    // in the KB that no `[[DOC-n]]` reference can ever reach.
    if (!ticket.id || !ticket.uid) continue
    const doc: SessionKbDoc = {
      id: ticket.id,
      uid: ticket.uid,
      title: (ticket.title ?? '').trim() || ticket.id,
      file: `${ticket.id}.md`,
      summary: summarise((ticket.title ?? '').trim() || ticket.id, ticket.body),
      kind: String((ticket.fields ?? {})['doc_kind'] ?? 'unspecified'),
    }
    const next = kbDocument(doc, ticket.body)
    const target = path.join(dir, doc.file)
    // Written only when changed, so a round's `Glob` sees stable mtimes and an
    // operator watching the directory sees what actually moved.
    if (!existsSync(target) || readFileSync(target, 'utf8') !== next) writeFileSync(target, next, 'utf8')
    written.add(doc.file)
    docs.push(doc)
  }

  docs.sort((a, b) => docNumber(a.id) - docNumber(b.id))
  writeFileSync(path.join(dir, INDEX_FILE), kbIndex(docs), 'utf8')

  // A document that was deleted or retyped must stop being searchable, not
  // merely stop being refreshed — a stale file in a swept directory is worse
  // than a missing one, because a round would quote it as current.
  for (const name of readdirSync(dir)) {
    if (name.endsWith('.md') && !written.has(name)) rmSync(path.join(dir, name), { force: true })
  }

  return { dir, docs }
}

/** What is already on disk, for the case where `xgd` would not answer. */
function readExistingDocs(dir: string): SessionKbDoc[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md') && name !== INDEX_FILE)
    .map((file) => ({ id: file.replace(/\.md$/, ''), uid: '', title: '', file, summary: '', kind: '' }))
}

/** `DOC-7` before `DOC-30` — the order a reader expects, not lexicographic. */
function docNumber(id: string): number {
  const digits = /(\d+)\s*$/.exec(id)?.[1]
  return digits ? Number(digits) : Number.MAX_SAFE_INTEGER
}

/** The last few informative lines a refusal left behind. */
function lastWords(output: string, lines = 3): string {
  const informative = output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /\w/.test(line))
  return informative.length ? informative.slice(-lines).join(' · ') : 'no output'
}
