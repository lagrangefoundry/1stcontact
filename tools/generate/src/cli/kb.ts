/**
 * The system knowledge base (REQ-123, DOC-7, DOC-10 §6).
 *
 * The builder AI's domain knowledge: our design documents, indexed, with a
 * generated map of what exists. It is what turns "the assistant knows the tools"
 * (REQ-126's manual) into "the assistant knows the system".
 *
 * THREE STEPS, AND THE FIRST IS THE ONLY ONE THAT IS OURS.
 *
 *   export   every `doc` ticket -> a directory of markdown (this file)
 *   build    corpus -> vector index, chunk index, awareness map (the library)
 *   wire     index + map -> the chat session's priming and tools (`ai/host.ts`)
 *
 * The middle step is the shared `knowledge` component composed directly rather
 * than its `build-shipped-kb` CLI, which is not reachable: the package declares
 * `files: ["src"]` and no `bin`, so the packed artifact the shared store holds
 * has no executable. The functions the CLI calls ARE exported, so this composes
 * the same pipeline in the same order — it does not reimplement any of it, and
 * every judgement the CLI encodes (territory count, derived-for-the-build, the
 * access-point search being the reader's own search) is carried across
 * deliberately rather than reinvented. When upstream packs its `bin`, this file
 * shrinks to a call.
 *
 * WHY THE CORPUS IS A DIRECTORY AND NOT THE TICKET STORE. A shipped KB is a
 * RELEASE ARTEFACT (framework REQ-71): read-only, byte-identical everywhere,
 * changed by upgrading the software rather than by a per-tenant migration. The
 * corpus therefore ships as files that `DocDirStore` reads, and the index ships
 * beside it. Nothing here creates a ticket, and nothing at runtime can write to
 * it — `DocDirStore` has no `create`/`update`, structurally.
 *
 * WHY IT IS EXPORTED RATHER THAN AUTHORED IN PLACE. The documents' home is the
 * ticket store, which is where they are written, reviewed and versioned. A second
 * hand-maintained copy would drift, and the drift would be silent — the KB would
 * confidently answer from a document nobody had updated in months. So the corpus
 * is DERIVED, repeatably, and the export is part of the build.
 *
 * THE FILENAME IS THE IDENTITY. `DocDirStore` makes a document's uid its path, so
 * the filename is what a search hit cites and what the index's incremental
 * manifest keys on. It is the human id (`DOC-10.md`) and never the title: a
 * retitled document must stay the same document, or every retitle silently
 * re-embeds and every stored citation dangles.
 */

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { repoRoot, sharedModuleUrl } from './webui'
import { isProjected, projections, type ProjectedDoc } from './kb-projection'

/**
 * The library is untyped JavaScript loaded from the shared store, so it enters
 * as `any` — the same boundary `ai/host.ts` and `ai/toolbox.ts` draw, and for the
 * same reason. Every value that LEAVES this module is one of the interfaces
 * declared below.
 */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

/** The knowledge base's name — its key in the config, and its scope axis value. */
export const SYSTEM_KB = 'system'

/**
 * The store name the KB's corpus resolves against.
 *
 * A KB names a SOURCE rather than carrying a store, so "a shipped read-only
 * directory" and "a tenant's D1 store" are the same code path with different
 * sources (DOC-7 §4.2). This is the former; the latter is what a per-tenant KB
 * will name without the library changing.
 */
export const SHIPPED_SOURCE = 'shipped'

/**
 * The other knowledge base declared in the same file — the client's own
 * (REQ-159, [[DOC-38]] §8).
 *
 * NAMED HERE ONLY SO THE SCAFFOLD CAN WRITE IT. This command never serves it:
 * its corpus is the tenant's D1 ticket store, which a release build does not
 * have and `apps/control-app/src/knowledge.ts` does. What lives here is the
 * starting-point declaration, for the same reason the system KB's does — so a
 * fresh checkout has a complete file rather than half of one.
 */
export const PROJECT_KB = 'project'

/** Its corpus: everything a site is made from ([[DOC-38]] §9). */
export const PROJECT_CORPUS_TYPES = ['chat', 'material', 'reference', 'brief'] as const

/** The ticket type the corpus selects. Everything we write as a document. */
export const CORPUS_TYPE = 'doc'

/**
 * The layout inside the KB tree — the Python peer's, so a corpus built by either
 * language is the same tree and a reader cannot tell which built it.
 */
const INDEX_DIR = 'index'
const CHUNKS_DIR = 'chunks'
const AWARENESS_FILE = 'awareness.md'

/**
 * How many territories a corpus of a given size gets — upstream's rule, carried
 * across verbatim.
 *
 * A count rather than a distance threshold, because "how finely should this
 * corpus be divided" is a decision about the map a reader wants, not one the
 * geometry can be trusted to make: with an unfamiliar embedding model a threshold
 * silently yields either one territory or one per document.
 */
const TERRITORY_DIVISOR = 2
const MIN_TERRITORIES = 2
const MAX_TERRITORIES = 15

/**
 * Where the KB lives: under the REPOSITORY, not the working directory.
 *
 * A release artefact belongs to the repo — one KB serves every site, and a linked
 * worktree must read the identical one. That is the opposite of `ctxOf().cwd`,
 * which is deliberately the caller's directory because site data IS per-directory.
 */
export function kbRoot(): string {
  return path.join(repoRoot(), 'kb')
}

/** The corpus directory: the markdown documents themselves. */
export function corpusDir(root: string = kbRoot()): string {
  return path.join(root, SYSTEM_KB)
}

/** The KB declaration. JSON, so the library needs no YAML parser injected. */
export function configPath(root: string = kbRoot()): string {
  return path.join(root, 'knowledge_bases.json')
}

// ── step 1: the corpus ───────────────────────────────────────────────────────

/** One exported document, as the export reports it. */
export interface ExportedDoc {
  /** The human id — the filename stem, and therefore the uid. */
  id: string
  /** The originating ticket's uid, kept as provenance. */
  uid: string
  title: string
}

/** What an export did. `removed` is documents whose ticket no longer exists. */
export interface ExportResult {
  docs: ExportedDoc[]
  removed: string[]
  /** Human ids of `doc` tickets that did not opt in — reported, never silent. */
  skipped: string[]
  dir: string
}

/** A `doc` ticket as the ticketing CLI returns it under `--view`. */
interface DocTicket {
  uid: string
  id: string
  title: string
  body: string | null
  created_at: string | null
  updated_at: string | null
  fields: Record<string, unknown> | null
}

/**
 * Read every `doc` ticket THROUGH THE TICKETING API.
 *
 * The `xgd ticket` CLI, never the `.md` files under `.xgd/` — the file format is
 * an internal implementation detail, and reading it directly would bypass the
 * index and break the moment storage changes. `--view` returns bodies in one
 * call, so this is one process rather than one per document.
 *
 * Banner chatter goes to stderr, so stdout is the JSON document alone.
 *
 * `--no-limit` IS LOAD-BEARING, not tidiness. `xgd ticket list` pages at 50 by
 * default and reports the rest through `next_cursor`; a consumer that reads
 * `items` and stops takes page one and calls it the corpus. There is no error
 * and no warning — the export simply stops carrying documents past the page
 * boundary, and the symptom surfaces much later as an assistant that does not
 * know a thing it should. The corpus is a batch read of everything, so it asks
 * for everything, and the loop lives upstream where the pagination does.
 *
 * The envelope is CHECKED AS WELL AS ASKED. `--no-limit` is upstream's promise
 * and this is the assertion that it was kept: if a truncated page arrives
 * anyway — an older `xgd` on `PATH`, a flag that stops meaning what it means —
 * that has to be a loud failure rather than a quietly shorter corpus, because a
 * quietly shorter corpus is the exact failure this line exists to prevent.
 */
export function readDocTickets(): DocTicket[] {
  const raw = execFileSync(
    'xgd',
    ['ticket', 'list', '--type', CORPUS_TYPE, '--view', '--json', '--no-limit'],
    {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 256 * 1024 * 1024,
    },
  )
  const parsed = JSON.parse(raw) as {
    items?: DocTicket[]
    next_cursor?: string | null
    truncated?: boolean
  }
  if (parsed.truncated === true || (parsed.next_cursor ?? null) !== null) {
    throw new Error(
      `xgd ticket list returned a truncated page despite --no-limit ` +
        `(${(parsed.items ?? []).length} item(s), more to come). The corpus would be ` +
        `silently short, so this fails instead. Check the xgd on PATH supports --no-limit.`,
    )
  }
  return parsed.items ?? []
}

/**
 * The frontmatter field carrying a document's kind, and the kind that means
 * "this document is the assistant's, not ours".
 *
 * MEMBERSHIP IS A KIND, NOT A FLAG (DOC-39 §3.3). A boolean invites the sentence
 * *"this architecture document is **also** a system document"*, and that
 * sentence is the category error DOC-39 §3.1 exists to prevent: an architecture
 * document is written for someone deciding how to build the product, a system-KB
 * document for an AI advising a client. They are different documents with
 * different readers, not one document wearing two labels. `doc_kind` is
 * single-valued, so the exclusivity is enforced by the shape rather than by
 * discipline.
 *
 * `doc_kind` rather than a field of our own: the sub-classification on `doc`
 * tickets already exists and already carries `architecture`, `security_policy`
 * and the rest, so "what kind of document is this" is answered where it is
 * already asked. It also stays clear of `fields.kind`, which the knowledge
 * component owns for its own awareness reports.
 *
 * MEMBERSHIP STILL FAILS SAFE. A document written tomorrow carries some other
 * kind — or none — until somebody says otherwise, so nothing reaches a
 * client-facing agent by default. The opposite default would put every document
 * in front of that agent the moment it was saved, which is the wrong way round
 * for a decision about what a product tells its users.
 *
 * The kind lives on the TICKET rather than in a list in the KB declaration
 * because it is a fact about the document and has to move with it — an id list
 * drifts silently when a document is renamed or retired.
 */
export const DOC_KIND_FIELD = 'doc_kind'
export const MEMBER_KIND = 'system_kb'

/**
 * Whether a ticket belongs to the system KB.
 *
 * Strictly the exact string. `doc_kind` is a closed enum defined in xgd, so a
 * value arrives already validated; anything else here — a different kind, an
 * absent field, a near-miss spelling that predates the enum — is out, which is
 * what makes the default safe.
 */
export function inSystemKb(ticket: { fields?: Record<string, unknown> | null }): boolean {
  return (ticket.fields ?? {})[DOC_KIND_FIELD] === MEMBER_KIND
}

/**
 * A frontmatter scalar, quoted only when it has to be.
 *
 * `DocDirStore`'s parser is a small hand-written one — scalars, one `fields`
 * level, one `links` level — and it takes everything after the first colon as the
 * value, so a title containing a colon is safe unquoted. What is NOT safe is a
 * value that would parse as something other than a string, so anything with a
 * leading/trailing space or a leading quote is quoted.
 */
function scalar(value: string): string {
  const text = value.replace(/[\r\n]+/g, ' ')
  return text !== text.trim() || /^["']/.test(text) ? JSON.stringify(text) : text
}

/**
 * Render one ticket as a corpus document.
 *
 * The frontmatter carries what the file cannot say about itself. Two entries earn
 * their place beyond the obvious:
 *
 * `created_at` / `updated_at` are PROVENANCE ONLY, and it is worth being exact
 * about that because it is not what the format's own documentation implies.
 * `DocDirStore` takes both stamps from the file entry and ignores whatever the
 * frontmatter declares — only `type`, `title`, `status`, `fields` and `links` are
 * honoured. So these two record when the *ticket* last changed, for a human
 * reading the file; what the index and the ranker actually see is the file's
 * mtime, which is why {@link exportCorpus} takes care not to touch it needlessly.
 *
 * `fields.origin_uid` — the way back to the ticket this was derived from. The
 * uid cannot survive as `uid` (the directory, not the document, gets to say what
 * a document's address is), so it survives as provenance instead.
 */
export function corpusDocument(ticket: DocTicket): string {
  const fields: Record<string, unknown> = { ...(ticket.fields ?? {}), origin_uid: ticket.uid }
  const front = [
    '---',
    `id: ${scalar(ticket.id)}`,
    `type: ${CORPUS_TYPE}`,
    `title: ${scalar(ticket.title)}`,
    ...(ticket.created_at ? [`created_at: ${ticket.created_at}`] : []),
    ...(ticket.updated_at ? [`updated_at: ${ticket.updated_at}`] : []),
    'fields:',
    ...Object.entries(fields)
      .filter(([, value]) => isScalar(value))
      .map(([key, value]) => `  ${key}: ${scalar(String(value))}`),
    '---',
    '',
  ].join('\n')
  return front + (ticket.body ?? '').trim() + '\n'
}

/**
 * Whether a field value can survive the round trip.
 *
 * `DocDirStore`'s frontmatter parser reads ONE level of `fields`, so a value that
 * is itself a mapping or a list has no representation there. Such a field is
 * DROPPED rather than coerced: `String({})` yields `"[object Object]"`, which is
 * not the value, does not fail, and would sit in the corpus looking like data.
 * Nothing in retrieval reads these fields — they are provenance — so dropping the
 * few that are structured costs nothing and keeps the corpus honest.
 */
function isScalar(value: unknown): boolean {
  return value !== null && value !== undefined && typeof value !== 'object'
}

/**
 * Export the `doc` tickets whose kind says they belong, into the corpus directory.
 *
 * **Membership is `doc_kind: system_kb`, per document** — see
 * {@link DOC_KIND_FIELD} for why a kind rather than a flag, and why it lives on
 * the ticket.
 *
 * Skips are RETURNED, not swallowed, and the command prints them. A document
 * silently missing from the corpus is indistinguishable from one that was never
 * written, and the symptom — an assistant that does not know a thing it should —
 * appears far from the cause.
 *
 * DOCUMENTS WHOSE TICKET IS GONE ARE DELETED, not left behind. A shipped corpus
 * has no supersession — `DocDirStore` returns no backlinks precisely because a
 * superseded document is *removed* at build time rather than left pointing at its
 * replacement. A stale file would otherwise stay searchable forever.
 *
 * The generated map is never touched: it is not a `doc`, it is written by step 2,
 * and deleting it here would mean every export invalidated the map.
 *
 * AN UNCHANGED DOCUMENT IS NOT REWRITTEN, and that is load-bearing rather than
 * tidy. `DocDirStore` derives a document's `updated_at` from its FILE STAMP, and
 * the index's incremental manifest keys on `updated_at` — so rewriting all 32
 * files on every export would bump every stamp and re-embed the entire corpus
 * each build, at cost, while telling the ranker every document had just changed.
 * Comparing bytes first makes the stamp mean what the index and the ranker both
 * read it as meaning: when this document last actually changed.
 */
export function exportCorpus(root: string = kbRoot()): ExportResult {
  const dir = corpusDir(root)
  mkdirSync(dir, { recursive: true })

  const tickets = readDocTickets()
  const docs: ExportedDoc[] = []
  const skipped: string[] = []
  const written = new Set<string>()

  for (const ticket of tickets) {
    if (!ticket.id) continue
    if (!inSystemKb(ticket)) {
      skipped.push(ticket.id)
      continue
    }
    const file = `${ticket.id}.md`
    const target = path.join(dir, file)
    const next = corpusDocument(ticket)
    const current = existsSync(target) ? readFileSync(target, 'utf8') : null
    if (current !== next) writeFileSync(target, next, 'utf8')
    written.add(file)
    docs.push({ id: ticket.id, uid: ticket.uid, title: ticket.title })
  }

  // A document that opts OUT after having been in is an ordinary removal: it is
  // no longer written, so the sweep below deletes the file it left behind. That
  // is the same path a deleted ticket takes, and it has to be — a document
  // withdrawn from the KB must stop being searchable, not merely stop being
  // refreshed.
  const removed = readdirSync(dir)
    .filter(
      (name) =>
        name.endsWith('.md') &&
        name !== AWARENESS_FILE &&
        // The projected namespace belongs to {@link writeProjections}, which
        // sweeps it itself (REQ-165). TWO PRODUCERS, TWO NAMESPACES, ONE SWEEP
        // EACH: neither can delete the other's output, so a build cannot lose a
        // projection by ordering and a fixture that stubs the ticket store gets
        // exactly the corpus it supplied.
        !isProjected(name) &&
        !written.has(name),
    )
    .map((name) => {
      rmSync(path.join(dir, name))
      return name
    })

  docs.sort((a, b) => a.id.localeCompare(b.id))
  skipped.sort()
  return { docs, removed, skipped, dir }
}

/**
 * Write the PROJECTED REFERENCE into the corpus, and sweep its own namespace.
 *
 * The second corpus producer (REQ-165). {@link exportCorpus} derives documents
 * from the ticket store; this derives them from the code — the behavior
 * catalogue, the L1 schemas, the declared control surface — so that the facts
 * about what the product does are generated rather than authored and cannot go
 * stale (DOC-39 §3.2).
 *
 * A SEPARATE STEP RATHER THAN PART OF THE EXPORT, and the reason is what each
 * one is a function OF. The export is a function of the ticket store, and a
 * caller that supplies its own store — every fixture in the KB suites — is
 * entitled to get back exactly the corpus it supplied. Folding the projections
 * into it would mean a stubbed store still produced three documents nobody
 * asked for, which is both surprising and, for a suite that tunes a corpus to
 * make a clustering assertion, destructive.
 *
 * Its sweep is its own, over `REF-` only, and the export's sweep spares that
 * namespace. So a projection that stops being produced is deleted, a document
 * whose ticket is gone is deleted, and neither producer can delete the other's
 * output whatever order they run in.
 *
 * AN UNCHANGED PROJECTION IS NOT REWRITTEN, for the reason {@link exportCorpus}
 * gives: the index keys its incremental manifest on the file stamp, and a
 * rewrite that changed nothing would re-embed the whole reference every build.
 */
export function writeProjections(root: string = kbRoot()): { projected: string[]; removed: string[] } {
  const dir = corpusDir(root)
  mkdirSync(dir, { recursive: true })

  const membership = corpusMembership(root)
  const written = new Set<string>()
  const projected: string[] = []
  for (const doc of projections()) {
    const file = `${doc.id}.md`
    const target = path.join(dir, file)
    const next = projectedDocument(doc, membership)
    const current = existsSync(target) ? readFileSync(target, 'utf8') : null
    if (current !== next) writeFileSync(target, next, 'utf8')
    written.add(file)
    projected.push(doc.id)
  }

  const removed = readdirSync(dir)
    .filter((name) => isProjected(name) && !written.has(name))
    .map((name) => {
      rmSync(path.join(dir, name))
      return name
    })

  projected.sort()
  removed.sort()
  return { projected, removed }
}

/**
 * What a corpus document must SAY about itself to belong to this KB.
 *
 * Read from the declaration rather than restated, because the declaration is
 * where membership is decided and an exported ticket satisfies the predicate by
 * carrying the ticket's own fields. A projection has no ticket, so it has to
 * assert membership itself — and hardcoding whatever the predicate happens to be
 * today would make the projections silently fall out of the KB the day it
 * changed, which is the one failure a generated document is supposed to be
 * incapable of. That day has already come once: the predicate was
 * `fields.system_kb: true` until REQ-164 made it a `doc_kind`, and the shipped
 * corpus is now unrestricted (`corpus: {}`) because the distribution IS the
 * boundary. Deriving means a projection is a member under any of those,
 * including none at all.
 *
 * Only `fields.x` predicates are read: `type` is the document's kind and is
 * handled separately, and a predicate on anything else is not something a
 * frontmatter field can satisfy.
 */
export function corpusMembership(root: string = kbRoot()): {
  type: string
  fields: Record<string, unknown>
} {
  const fields: Record<string, unknown> = {}
  let type = CORPUS_TYPE
  try {
    const config = JSON.parse(readFileSync(configPath(root), 'utf8')) as {
      knowledge_bases?: Record<string, { corpus?: Record<string, unknown> }>
    }
    const corpus = config.knowledge_bases?.[SYSTEM_KB]?.corpus ?? {}
    for (const [key, value] of Object.entries(corpus)) {
      if (key === 'type') {
        const declared = Array.isArray(value) ? value[0] : value
        if (typeof declared === 'string') type = declared
      } else if (key.startsWith('fields.')) {
        fields[key.slice('fields.'.length)] = value
      }
    }
  } catch {
    // No declaration yet, or an unreadable one. The defaults are the scaffolded
    // declaration's own values, so a projection written before `ensureConfig`
    // has run is still a member of the KB that run is about to declare.
  }
  return { type, fields }
}

/**
 * Render a projection as a corpus file.
 *
 * The frontmatter is the same shape {@link corpusDocument} writes, and for the
 * same reason: `DocDirStore` reads it, so a projection that formatted its own
 * would be a second frontmatter dialect in one directory. What differs is what it
 * carries — `doc_kind: system_kb` (DOC-39 §3.3: a document authored for the AI,
 * never an architecture record), `projected: true`, and the source it came from,
 * so a reader who wants to change one of these facts is told where to go.
 *
 * The source is named IN THE BODY as well as in the frontmatter. Retrieval
 * returns passages, and a passage carries no frontmatter — an assistant reading
 * a chunk of this document mid-conversation should still be able to say where
 * the fact came from.
 */
export function projectedDocument(
  doc: ProjectedDoc,
  membership: { type: string; fields: Record<string, unknown> } = corpusMembership(),
): string {
  const fields: Record<string, unknown> = {
    ...membership.fields,
    [DOC_KIND_FIELD]: MEMBER_KIND,
    projected: true,
    source: doc.source,
  }
  const front = [
    '---',
    `id: ${scalar(doc.id)}`,
    `type: ${membership.type}`,
    `title: ${scalar(doc.title)}`,
    'fields:',
    ...Object.entries(fields).map(([key, value]) => `  ${key}: ${scalar(String(value))}`),
    '---',
    '',
  ].join('\n')
  const provenance = `> Generated from ${doc.source}. Do not edit: this document is rebuilt from its\n> source on every build, and an edit here is lost without warning.\n`
  return `${front}# ${doc.title}\n\n${provenance}\n${doc.body.trimStart()}`
}

// ── the declaration ──────────────────────────────────────────────────────────

/**
 * Scaffold the KB declaration if it is absent, and never touch it if it is not.
 *
 * A KB is DECLARED AT DEVELOPMENT TIME — a deliberate act, not something derived
 * (DOC-7 §4). So the declaration is authored data that lives in the repository
 * and is edited by hand; this only writes the starting point, so that a fresh
 * checkout can build without first hand-writing a file. A build that overwrote it
 * would silently discard a tuned description or an adjusted weight on the next run.
 *
 * `landscape: authored` is the RUNTIME contract and is not a claim that a human
 * wrote the map. It says the map is a fixed artefact that ships — read, never
 * refreshed on a cadence — which is exactly true of one built by `1c kb build`
 * and shipped in the corpus tree. Declaring `derived` at runtime would invite a
 * rebuild against a store that is structurally read-only. The build flips the KB
 * to `derived` for its own duration, which is upstream's own manoeuvre: derived
 * for the build, authored on disk.
 *
 * THE CORPUS IS UNRESTRICTED, and that is the honest declaration rather than a
 * loosened one (DOC-39 §3.3). At runtime the distribution *is* the corpus: a
 * directory of markdown served through the ticket interface by a read-only
 * store, whose every member matched by construction when the export wrote it.
 * Re-applying the export's own selection as a query-time predicate is a
 * build-time filter re-run as if it were a membership rule — it can only ever
 * subtract, and the only thing it can subtract is a file whose frontmatter does
 * not look the way the predicate expects. That file then disappears from the KB
 * with no error, which is the failure mode this whole ticket is about. The
 * directory is already the boundary; `corpus: {}` says so.
 */
export function ensureConfig(root: string = kbRoot()): string {
  const file = configPath(root)
  if (existsSync(file)) return file
  mkdirSync(path.dirname(file), { recursive: true })
  const config = {
    knowledge_bases: {
      [SYSTEM_KB]: {
        description:
          '1stcontact system knowledge: how the product is designed and why — its ' +
          'architecture, storage model, the L1 layout substrate, the behavior-module ' +
          'contract, the builder application, and the development method behind them.',
        corpus: {},
        landscape: 'authored',
        source: SHIPPED_SOURCE,
        weight: 1.0,
      },
      // The other half (REQ-159). Scaffolded here even though this command never
      // serves it: the file is the ONE declaration of what a knowledge base is,
      // and a fresh checkout that wrote only the half this command uses would
      // leave the Worker with no project KB and no error saying why. Which of the
      // two a host serves is that host's decision (see `bindKb`); what each one
      // IS belongs in one file.
      //
      // NO `source` KEY, which is what makes it read the tenant's own ticket
      // store, and no site term, because the tenant is a hard barrier while the
      // site is only a predicate — two sites belonging to one client share what
      // has been learned about that client.
      [PROJECT_KB]: {
        description:
          "This client's own knowledge: the conversations held with them, the material " +
          'they uploaded, the reference sites captured on their behalf, and the brief ' +
          'recording what was decided. Everything a site is made FROM, as against how ' +
          'the system that builds it works.',
        corpus: { type: [...PROJECT_CORPUS_TYPES] },
        landscape: 'derived',
        weight: 1.0,
      },
    },
  }
  writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`, 'utf8')
  return file
}

// ── the library, and the KB as the runtime sees it ───────────────────────────

let knowledge: Promise<Untyped> | null = null
/** The shared `knowledge` component, Worker-safe root. */
function km(): Promise<Untyped> {
  if (!knowledge) knowledge = import(/* @vite-ignore */ sharedModuleUrl('knowledge'))
  return knowledge
}

let knowledgeNode: Promise<Untyped> | null = null
/** Its Node-only half — the filesystem seams, which the Worker never loads. */
function kmNode(): Promise<Untyped> {
  if (!knowledgeNode) knowledgeNode = import(/* @vite-ignore */ sharedModuleUrl('knowledge', './node'))
  return knowledgeNode
}

let ticketingNode: Promise<Untyped> | null = null
/** `nodeDocReader` — the build-time reader behind `DocDirStore`'s seam. */
function ticketing(): Promise<Untyped> {
  if (!ticketingNode) {
    ticketingNode = import(/* @vite-ignore */ sharedModuleUrl('ticketing', './node'))
  }
  return ticketingNode
}

/** The corpus store, the KB, and the source map — what every step below needs. */
export interface KbBinding {
  store: Untyped
  kb: Untyped
  kbs: Map<string, Untyped>
  sources: Record<string, Untyped>
}

/**
 * Bind the KB to its corpus directory.
 *
 * Shared by the build and the runtime so the two cannot disagree about what the
 * KB is — a build that indexed one corpus while the session searched another
 * would produce hits that resolve to nothing, with no error anywhere.
 *
 * THE DECLARATION IS PARSED, NOT PARAPHRASED. Every field — the description, the
 * corpus predicate, the landscape mode, the weight — comes from
 * `knowledge_bases.json` through the library's own `parseKbConfig`. An earlier
 * version read the description from the file and hand-constructed the rest, which
 * meant editing the declared corpus predicate changed nothing: the file said one
 * thing and the code built another, with no error to notice. A declaration that
 * is not the thing actually used is worse than no declaration.
 */
export async function bindKb(root: string = kbRoot()): Promise<KbBinding> {
  const lib = await km()
  const { nodeDocReader } = await ticketing()
  const dir = corpusDir(root)
  if (!existsSync(dir)) {
    throw new Error(`No corpus at ${dir} — run \`1c kb build\` to create it.`)
  }
  const { DocDirStore } = await import(/* @vite-ignore */ sharedModuleUrl('ticketing'))
  const store = new DocDirStore(nodeDocReader(dir), { type: CORPUS_TYPE })

  ensureConfig(root)
  const kbs = lib.parseKbConfig(readFileSync(configPath(root), 'utf8'))
  const kb = kbs.get(SYSTEM_KB)
  if (kb === undefined) {
    throw new Error(
      `${configPath(root)} declares no knowledge base '${SYSTEM_KB}' ` +
        `(declared: ${[...kbs.keys()].sort().join(', ') || 'none'}).`,
    )
  }
  // ONE KB, NOT THE WHOLE DECLARATION FILE. `kb/knowledge_bases.json` now declares
  // two knowledge bases and each host serves the ones it can actually resolve:
  // this build has the shipped corpus and serves `system`, while the Worker has
  // the tenant's D1 store and serves `project` (REQ-159, `apps/control-app/src/
  // knowledge.ts`). Handing the whole map to `buildIndex` and `primeSession`
  // would resolve `project` against the DocDirStore — a read-only directory of
  // design documents that holds no `chat`, `material`, `reference` or `brief`
  // — and the result would not be an error. It would be a knowledge base
  // reported as searchable and empty, and a priming section apologising for a
  // map nobody will ever build here.
  return { store, kb, kbs: new Map([[SYSTEM_KB, kb]]), sources: { [SHIPPED_SOURCE]: store } }
}

/**
 * The embedder — Workers AI, over REST.
 *
 * ONE MODEL ON BOTH SIDES, which is a correctness property and not a
 * convenience. Search takes the dot product of a query vector and an index
 * vector as their cosine similarity; vectors from two different models are not
 * comparable, and the failure mode is not an error but plausible-looking
 * nonsense. Workers AI serves `@cf/baai/bge-small-en-v1.5` both through a
 * Worker's `AI` binding and over REST, so build-time and query-time vectors come
 * from the same place by construction — and the host keeps that property when it
 * moves into the Worker at DOC-12 §7 phase 2 by swapping the transport, not the
 * model.
 *
 * The credentials are the two this repo already deploys with. There is
 * deliberately no local stand-in: it would make laptop vectors incompatible with
 * production ones, which is exactly the failure this seam exists to prevent.
 */
export async function resolveEmbedder(env = process.env): Promise<Untyped> {
  const lib = await km()
  if (env.LAGRANGE_KM_EMBEDDER) {
    return (await namedFactory(env.LAGRANGE_KM_EMBEDDER, 'createEmbedder'))()
  }
  const accountId = env.CLOUDFLARE_ACCOUNT_ID
  const apiToken = env.CLOUDFLARE_API_TOKEN
  if (!accountId || !apiToken) {
    throw new Error(
      'The knowledge index needs Workers AI: set CLOUDFLARE_ACCOUNT_ID and ' +
        'CLOUDFLARE_API_TOKEN (the same credentials `pnpm deploy:*` uses). The ' +
        'embedding model is the one the Worker serves, so the index and the ' +
        'search agree by construction.',
    )
  }
  return new lib.WorkersAiEmbedder({ accountId, apiToken })
}

/**
 * The describe seam: who writes the map's paragraphs.
 *
 * Defaults to the AI bridge, which is a default this repo is ALLOWED to have and
 * the knowledge component is not: reaching a model means importing the shared
 * `ai-knowledge` component, and the knowledge component cannot depend on
 * the bridge that binds it — the dependency runs the other way. We are the host,
 * so we are the layer that gets to name one.
 *
 * The bridge resolves `['claude', 'claude_code']` in order, so with no
 * `ANTHROPIC_API_KEY` set it falls through to the authenticated Claude Code CLI
 * and the map costs no credential.
 */
export async function resolveDescriber(env = process.env): Promise<Untyped> {
  const specifier = env.LAGRANGE_KM_DESCRIBER ?? sharedModuleUrl('ai-knowledge', './describe')
  const describer = await (await namedFactory(specifier, 'createDescriber'))()
  if (typeof describer?.describe !== 'function') {
    throw new Error(`${specifier}: createDescriber() did not return a {describe, name}`)
  }
  return describer
}

/**
 * Import `specifier` and return the factory it must export.
 *
 * Shared by both model seams, and a FACTORY rather than an instance in both
 * cases: an embedder may open a client and a describer resolves a backend, so
 * doing either at module-import time would make merely *naming* the seam a side
 * effect. A relative or absolute path resolves against the working directory; a
 * `file:` URL is taken as is; anything else is left to node.
 */
async function namedFactory(specifier: string, exportName: string): Promise<Untyped> {
  const url =
    specifier.startsWith('.') || specifier.startsWith('/')
      ? pathToFileURL(path.resolve(specifier)).href
      : specifier
  const module = await import(/* @vite-ignore */ url)
  if (typeof module[exportName] !== 'function') {
    throw new Error(`${specifier} does not export ${exportName}()`)
  }
  return module[exportName]
}

// ── step 2: the index and the map ────────────────────────────────────────────

/** What a build produced, for the operator to read. */
export interface BuildResult {
  documents: number
  embedded: number
  chunks: number
  territories: number
  accessPoints: number
  doorless: string[]
  describer: string
}

/**
 * Cluster, describe and validate — the awareness map.
 *
 * THE MAP IS ALWAYS GENERATED. That is the point of it: a hand-maintained map
 * over a corpus this size, spanning product, framework and process, is precisely
 * the artefact that goes stale without anybody noticing, and a stale map is worse
 * than none — it routes the agent confidently to the wrong place.
 *
 * The vectors are read back out of the index rather than re-embedded. The map
 * must be clustered in the same vector space the reader searches, and embedding
 * twice is the one reliable way to end up with two.
 *
 * The access-point check runs THE READER'S OWN SEARCH — same index, same ranking,
 * same KB scope. A map whose doors were validated by a different query path would
 * promise routes that do not exist for the agent that follows them.
 */
async function buildMap(
  root: string,
  binding: KbBinding,
  indexSource: Untyped,
  embedder: Untyped,
): Promise<Omit<BuildResult, 'documents' | 'embedded' | 'chunks'>> {
  const lib = await km()
  // Resolved EAGERLY, before a single territory is described: a rebuild that
  // discovered an unreachable backend halfway through would leave a map written
  // half by one describer and half by another, which is worse than either.
  const describer = await resolveDescriber()

  const { embeddings, metadata } = await lib.loadIndex(indexSource)
  const vectors = new Map(metadata.map((row: Untyped, i: number) => [row.uid, embeddings[i]]))
  const docs = lib.documentsFromTickets(
    await lib.resolveCorpus(binding.store, binding.kb),
    vectors,
  )

  const find = async (query: string): Promise<string[]> => {
    const hits = await lib.search(query, {
      source: indexSource,
      store: binding.store,
      kbs: binding.kbs,
      kb: SYSTEM_KB,
      topK: 5,
      embedder,
      sources: binding.sources,
    })
    return hits.map((hit: Untyped) => hit.uid)
  }

  const wanted = Math.max(
    MIN_TERRITORIES,
    Math.min(MAX_TERRITORIES, Math.floor(docs.length / TERRITORY_DIVISOR)),
  )

  const report = await lib.buildAwareness(
    docs,
    // Derived for the build, authored on disk. What makes the result authored is
    // WHERE IT IS WRITTEN — into the corpus tree, as a release artefact — not a
    // pretence that a human wrote it.
    new lib.KnowledgeBase({ ...binding.kb, landscape: lib.DERIVED }),
    {
      describe: describer.describe,
      search: find,
      clusterer: lib.agglomerativeClusterer({
        nClusters: Math.min(wanted, docs.length),
        // A count was asked for, so the distance guard must not veto it.
        maxDistance: Infinity,
      }),
      describer: describer.name || 'unnamed describer',
    },
  )

  writeFileSync(
    path.join(corpusDir(root), AWARENESS_FILE),
    awarenessDocument(report.body, SYSTEM_KB),
    'utf8',
  )

  return {
    territories: report.territories.length,
    accessPoints: report.territories.reduce(
      (n: number, t: Untyped) => n + t.accessPoints.length,
      0,
    ),
    doorless: report.doorless,
    describer: report.describer,
  }
}

/**
 * The map as a document in the corpus tree.
 *
 * The frontmatter is what makes the file a ticket rather than prose: it carries
 * the exact `(type, kind, kb)` triple the report lookup queries on, and the same
 * triple the corpus recursion guard excludes — so the map is found by priming and
 * kept out of the corpus it describes, with no special case for either.
 */
export function awarenessDocument(body: string, kbName: string): string {
  const front = [
    '---',
    'type: system',
    `title: Awareness map: ${kbName}`,
    'status: active',
    'fields:',
    '  kind: awareness_report',
    `  kb: ${kbName}`,
    '---',
    '',
  ].join('\n')
  return front + body.trim() + '\n'
}

/**
 * Export, index, chunk, and map — the whole release build, in order.
 *
 * The order is not arbitrary and none of it is optional. The chunk index is what
 * makes a large corpus answerable (a whole design document is far too coarse a
 * unit to return as a hit), and the map is what a cold agent is primed with. A
 * build that produced only the document index would leave the KB technically
 * present and practically useless.
 */
export async function buildKb(root: string = kbRoot()): Promise<BuildResult> {
  ensureConfig(root)
  const exported = exportCorpus(root)
  if (!exported.docs.length) {
    // The likely cause is the membership kind, not an empty ticket store, so the
    // message says so — "no documents" would send an operator looking in the
    // wrong place entirely.
    throw new Error(
      `No ${CORPUS_TYPE} ticket carries ${DOC_KIND_FIELD}: ${MEMBER_KIND}, so the ` +
        `corpus would be empty. Membership is a kind, not a flag: set ` +
        `fields.${DOC_KIND_FIELD}=${MEMBER_KIND} on the documents the assistant ` +
        `should know` +
        (exported.skipped.length ? ` (${exported.skipped.length} carry another kind).` : '.'),
    )
  }

  const binding = await bindKb(root)
  const embedder = await resolveEmbedder()
  const { nodeIndexSource } = await kmNode()
  const lib = await km()

  const indexSource = nodeIndexSource(path.join(corpusDir(root), INDEX_DIR))
  const stats = await lib.buildIndex(binding.store, binding.kbs, indexSource, {
    embedder,
    sources: binding.sources,
  })

  const chunkSource = nodeIndexSource(path.join(corpusDir(root), CHUNKS_DIR))
  const chunkStats = await lib.buildChunkIndex(binding.store, binding.kbs, chunkSource, {
    embedder,
    sources: binding.sources,
  })

  const map = await buildMap(root, binding, indexSource, embedder)

  return {
    documents: stats.total,
    embedded: stats.added,
    chunks: chunkStats.chunks,
    ...map,
  }
}

// ── step 3: the KB as a running session sees it ──────────────────────────────

/**
 * Open the knowledge runtime the chat session searches through.
 *
 * Returns `null` when the KB has not been built. That is a DEGRADATION, not a
 * failure: an operator who has never run `1c kb build` still gets a working
 * assistant, one that knows its tools and not the design documents. Throwing here
 * would make an unbuilt KB break the chat panel entirely, which trades a missing
 * capability for a missing product.
 */
export async function openKnowledgeRuntime(root: string = kbRoot()): Promise<Untyped | null> {
  if (!existsSync(path.join(corpusDir(root), INDEX_DIR))) return null
  const { KnowledgeRuntime } = await import(/* @vite-ignore */ sharedModuleUrl('ai-knowledge'))
  const { nodeIndexSource } = await kmNode()
  const binding = await bindKb(root)
  return KnowledgeRuntime.open({
    store: binding.store,
    kbs: binding.kbs,
    source: nodeIndexSource(path.join(corpusDir(root), INDEX_DIR)),
    chunkSource: nodeIndexSource(path.join(corpusDir(root), CHUNKS_DIR)),
    embedder: await resolveEmbedder(),
    sources: binding.sources,
  })
}

// ── the command ──────────────────────────────────────────────────────────────

export const KB_USAGE = `usage: 1c kb <build|export|status>

  build     write the corpus, build both indexes, and generate the map
  export    write the corpus only (no embedding, no credentials needed)
  status    what is built, and how current it is

The corpus has two producers: the doc tickets that opted in, and the projected
reference (REF-*) generated from the behavior catalogue, the L1 schemas and the
declared control surface. Both run on every build; neither is edited by hand.

The index is built with Workers AI and needs CLOUDFLARE_ACCOUNT_ID and
CLOUDFLARE_API_TOKEN. The map's paragraphs are written by the Claude Code CLI
when no ANTHROPIC_API_KEY is set, so it needs no credentials of its own.`

/** What `1c kb status` reports. */
export interface KbStatus {
  /** Documents on disk in the corpus directory. */
  corpus: number
  /**
   * How many of `corpus` are projected rather than exported (REQ-165).
   *
   * Reported beside the total rather than instead of it, and load-bearing for
   * the check below: with two producers writing into one directory, `corpus` is
   * no longer comparable to `tickets` on its own — the healthy state is
   * `corpus === tickets + projected`, and without this split a build with a
   * perfectly current corpus would report itself stale by exactly the number of
   * projections.
   */
  projected: number
  /**
   * `doc` tickets carrying the membership kind — what the corpus SHOULD hold.
   *
   * `null` when the ticket store could not be read at all (no `xgd` on `PATH`,
   * a store that will not answer). That is reported as unknown rather than as
   * zero: zero is a real and alarming answer, and a status command that
   * manufactures it from an unrelated failure is worse than one that admits it
   * does not know.
   */
  tickets: number | null
  index: boolean
  chunks: boolean
  map: boolean
}

/**
 * Whether the corpus on disk holds what the ticket store says it should.
 *
 * TRUNCATION IS VISIBLE, NOT INFERRED. Every failure this ticket closes has the
 * same shape — the corpus quietly ends up smaller than intended, and the symptom
 * appears much later and several artefacts downstream, as an assistant that does
 * not know a thing it should. A count of files on disk cannot show that on its
 * own: 37 documents looks exactly as healthy as 38 unless something says what
 * the number was supposed to be. So status asks BOTH SIDES and puts them next to
 * each other, which turns "the assistant seems to have forgotten something" into
 * one line an operator reads before it ever becomes a question.
 *
 * `null` propagates rather than collapsing to `false`: an unreadable store means
 * the check did not run, which is not the same as the check passing.
 */
export function kbStatus(root: string = kbRoot()): KbStatus {
  const dir = corpusDir(root)
  const files = existsSync(dir) ? readdirSync(dir) : []
  return {
    corpus: files.filter((f) => f.endsWith('.md') && f !== AWARENESS_FILE).length,
    projected: files.filter((f) => isProjected(f)).length,
    tickets: countMemberTickets(),
    index: existsSync(path.join(dir, INDEX_DIR)),
    chunks: existsSync(path.join(dir, CHUNKS_DIR)),
    map: files.includes(AWARENESS_FILE),
  }
}

/**
 * How many `doc` tickets carry the membership kind, or `null` if unknowable.
 *
 * The only swallowed error in this file, and it is swallowed deliberately:
 * `status` is the command an operator runs to find out what state things are in,
 * so it must survive a store it cannot reach and still report the half it can
 * see. Every other caller of {@link readDocTickets} — export, build — wants the
 * failure, and gets it.
 */
function countMemberTickets(): number | null {
  try {
    return readDocTickets().filter(inSystemKb).length
  } catch {
    return null
  }
}
