/**
 * The builder's AI host as NODE gets it (REQ-146).
 *
 * `host-core.ts` is the host: the session model, the tool loop, the manager
 * cache, the per-turn change signal and the three entry points the origin calls.
 * None of it names a filesystem, so all of it loads in workerd. It takes its
 * runtime — library, store, archive, junction, audit sink, priming — as
 * {@link HostDeps}, and never goes looking for one.
 *
 * THIS FILE IS THE RUNTIME NODE SUPPLIES. It is the same set the operator's
 * machine always provided, now named in one place instead of assumed in six:
 *
 *   - the library, resolved out of the shared artifact store by file URL;
 *   - the filesystem {@link SiteStore};
 *   - `FileArchive` and the file junction, both under {@link sessionsDir};
 *   - the append-only file audit sink;
 *   - `add_asset` and `publish`, the two operations that need a disk;
 *   - the system KB and the priming document KM builds from it.
 *
 * WHY THE SPLIT IS NOT OPTIONAL. A Worker that imports this file imports
 * `../commands`, which imports the Astro module registry, and the bundle fails
 * with `No loader is configured for ".astro" files`. What a runtime can carry is
 * decided by the import graph, not by which branch executes — so the Worker
 * imports `./host-core` and supplies its own adapters, and the two hosts share
 * every line that matters instead of agreeing by inspection.
 *
 * THE PUBLIC NAMES ARE UNCHANGED: `openSession`, `streamPrompt`, `aiStatus`,
 * `resetAiHost`, `sessionsDir`, `setModelClient` and `UnknownSessionError` all
 * still come from `./host`, with the same signatures. `builder.ts` and the
 * existing tests did not move.
 */

import path from 'node:path'
import type { GlobalOptions } from '../commands'
import { ctxOf } from '../commands'
import { fsSiteStore } from '../../store'
import { sharedModuleUrl } from '../webui'
import { openKnowledgeRuntime, SYSTEM_KB } from '../kb'
import { nodeOperations, fileAuditSink } from './toolbox'
import type { EditOptions } from '../edit'
import {
  aiStatus as aiStatusCore,
  openSession as openSessionCore,
  resetAiHost as resetAiHostCore,
  streamPrompt as streamPromptCore,
  type ChatSession,
  type HostDeps,
} from './host-core'

export {
  setModelClient,
  siteBackendName,
  sessionIdFor,
  UnknownSessionError,
  type ChatSession,
  type ChatTurn,
  type HostDeps,
} from './host-core'

type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

/** The AI library, imported once. */
let library: Promise<Untyped> | null = null
function ai(): Promise<Untyped> {
  if (!library) library = import(/* @vite-ignore */ sharedModuleUrl('ai'))
  return library
}

/**
 * Where transcripts live: beside the store they are about, and gitignored.
 *
 * Not the library's default (`~/.xgd/sessions`): these belong to a workspace, not
 * to a machine, and two checkouts of two different projects must not share one
 * pile of conversations keyed only by slug.
 */
export function sessionsDir(opts: GlobalOptions): string {
  return path.join(ctxOf(opts).cwd, 'storage', 'chat')
}

/**
 * What the caretaker is here to do, for KM's priming (step 2 of the landscape).
 *
 * Deliberately the ROLE'S purpose and not a restatement of the system prompt: the
 * priming answers "what should I go looking for in this corpus", and an agent
 * told only "you are a caretaker" has no basis for choosing between a document
 * about storage and one about typography.
 */
const CARETAKER_PURPOSE =
  'You look after a website for someone who is not technical. You will need to ' +
  'know how this system builds and describes sites — its layout vocabulary, its ' +
  'components, how pages are stored and published, and the reasoning behind those ' +
  'designs — so you can act correctly and explain plainly.'

/**
 * The system knowledge runtime, or `null` when the KB has not been built.
 *
 * Built once per process rather than per site: the KB is a release artefact
 * shared by every site, so caching it per slug would load the same index many
 * times over. Any failure to open it degrades to `null`.
 */
let knowledgeRuntime: Promise<Untyped | null> | null = null
function openKnowledge(): Promise<Untyped | null> {
  if (!knowledgeRuntime) {
    knowledgeRuntime = openKnowledgeRuntime().catch((err: unknown) => {
      // A KB that was BUILT and then failed to open is not the same as one that
      // was never built, and it must not look the same. The usual cause is the
      // embedding credentials being absent, which would otherwise cost the
      // operator their whole knowledge surface with no symptom but an assistant
      // that has quietly stopped knowing anything. The session still opens —
      // this is a degradation, not a failure — but it says so.
      console.error(
        `The system knowledge base could not be opened, so the assistant will ` +
          `run without it: ${err instanceof Error ? err.message : String(err)}`,
      )
      return null
    })
  }
  return knowledgeRuntime
}

/**
 * Assemble Node's runtime for one call.
 *
 * Everything here was previously a lookup performed deep inside the host. It is
 * the same set of decisions, made once, where the runtime is known.
 *
 * The KNOWLEDGE SURFACE and the PRIMING come as a pair or not at all: both are
 * built from the same runtime, and a session primed with the landscape but not
 * granted the corpus would be told to go and read documents it cannot open.
 */
async function nodeDeps(opts: GlobalOptions): Promise<HostDeps> {
  const lib = await ai()
  const store = fsSiteStore(ctxOf(opts))
  const dir = sessionsDir(opts)
  const knowledge = await openKnowledge()

  let knowledgeSurface: HostDeps['knowledgeSurface'] = null
  let priming: HostDeps['priming'] = null
  if (knowledge !== null) {
    const bridge = await import(/* @vite-ignore */ sharedModuleUrl('ai-knowledge'))
    knowledgeSurface = {
      surface: new bridge.KnowledgeToolbox(knowledge),
      // `knowledgeInstanceConfig` at the package root; `instanceConfig` is the
      // name inside the module it comes from.
      granted: bridge.knowledgeInstanceConfig([SYSTEM_KB]),
    }
    // KM owns the internal order of the one document it assembles: the map of
    // what exists, then what this agent is for, then how to reach the rest. The
    // manual goes in as the `mechanism` — the last thing read is the thing done
    // first — so the corpus is reached through THIS session's actual grant
    // rather than through a sentence written by hand about what it might have.
    priming = async (box: Untyped) =>
      bridge.KnowledgeDocs.open(knowledge, {
        rolePurpose: CARETAKER_PURPOSE,
        mechanism: box.manual(),
      })
  }

  return {
    lib,
    store,
    archive: new lib.FileArchive(dir),
    logDir: path.join(dir, 'live'),
    audit: fileAuditSink(opts),
    knowledgeSurface,
    priming,
  }
}

/**
 * Open the site's conversation: its transcript, and whether it can take a turn.
 *
 * The signature `builder.ts` and the tests already use; the runtime is assembled
 * here rather than assumed inside the host.
 */
export async function openSession(
  slug: string,
  opts: GlobalOptions = {},
): Promise<ChatSession> {
  return openSessionCore(slug, opts, await siteDeps(slug, opts))
}

/** Stream one turn in an open session. */
export async function* streamPrompt(
  sessionId: string,
  text: string,
  opts: GlobalOptions = {},
): AsyncGenerator<{ kind: string; content: string; meta?: Record<string, unknown> }> {
  yield* streamPromptCore(sessionId, text, opts, await siteDeps(null, opts))
}

/** What the assistant is, and whether it can run — the panel's mount-time check. */
export async function aiStatus(
  opts: GlobalOptions = {},
): Promise<{ roles: string[]; backends: string[]; ready: boolean; error?: string }> {
  return aiStatusCore(opts, await siteDeps(null, opts))
}

/**
 * Node's runtime, cached per workspace.
 *
 * Cached because `HostDeps` carries the STORE, and the host keys its manager
 * cache by that store's object identity — a fresh store per call would mint a
 * fresh session manager per call, and the conversation would restart on every
 * turn. One store per workspace, for the life of the process.
 *
 * `add_asset` and `publish` are bound to a slug, so the operations are rebuilt
 * per call while everything expensive is not.
 */
const workspaces = new Map<string, Promise<HostDeps>>()

async function siteDeps(slug: string | null, opts: GlobalOptions): Promise<HostDeps> {
  const ctx = ctxOf(opts)
  const key = `${ctx.cwd}\0${ctx.root}`
  let deps = workspaces.get(key)
  if (!deps) {
    deps = nodeDeps(opts)
    workspaces.set(key, deps)
  }
  const base = await deps
  if (slug === null) return base
  return {
    ...base,
    extraOps: nodeOperations(slug, { ...opts, store: base.store } as EditOptions),
  }
}

/**
 * Drop every cached manager, issued id, workspace runtime and the knowledge
 * index. Exported for tests that rebuild a store per case.
 */
export function resetAiHost(): void {
  resetAiHostCore()
  workspaces.clear()
  knowledgeRuntime = null
  library = null
}
