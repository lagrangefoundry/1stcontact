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
 *   - the system KB, and the two priming providers KM renders from it.
 *
 * WHY THE SPLIT IS NOT OPTIONAL. A Worker that imports this file imports
 * `../commands`, and `../commands` reaches the filesystem store — `fsSiteStore`,
 * `ensureDir`, `pathExists` — and through it `node:fs`, which the Worker has no
 * business carrying whatever `nodejs_compat` will polyfill. (The split was
 * originally forced by something louder: `../commands` used to pull the Astro
 * module registry and the bundle failed outright on `No loader is configured for
 * ".astro" files`. REQ-148/150 removed Astro from the render path, so that
 * particular bundle error is gone — the reason for the split is not.)
 *
 * What a runtime can carry is decided by the import graph, not by which branch
 * executes — so the Worker imports `./host-core` and supplies its own adapters,
 * and the two hosts share every line that matters instead of agreeing by
 * inspection.
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
 * Where this process looks for the system KB, when it is not the repository's.
 *
 * A TEST SEAM, and declared as one — the second this module has, beside
 * {@link setModelClient}. {@link kbRoot} is deliberately repo-anchored: the KB is
 * a release artefact, one serves every site, and a linked worktree must read the
 * identical one. That is right, and it leaves a case about what a host does with
 * a corpus — built, unbuilt, or built and unopenable — no honest way to arrange
 * one except by disturbing the checkout's own, which a killed run then leaves
 * disturbed. Pointing this process at a throwaway root costs nothing in
 * production, where nothing calls it and the repository's KB is what is read.
 *
 * Cleared by {@link resetAiHost} along with the runtime it selects, so a case
 * cannot leak its corpus into the next one.
 */
let knowledgeRoot: string | null = null

/** Point this process's KB lookup at `root`, or back at the repository's (`null`). */
export function setKnowledgeRoot(root: string | null): void {
  knowledgeRoot = root
  knowledgeRuntime = null
  workspaces.clear()
}

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
    knowledgeRuntime = (
      knowledgeRoot === null ? openKnowledgeRuntime() : openKnowledgeRuntime(knowledgeRoot)
    ).catch((err: unknown) => {
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
 * What a built system KB contributes to the host: the surface, and the priming.
 *
 * ONE FUNCTION BECAUSE THEY ARE ONE DECISION. The surface and the priming come as
 * a pair or not at all — both are built from the same runtime, and a session
 * primed with the map but not granted the corpus would be told to go and read
 * documents it cannot open. Naming the pair rather than inlining it is also what
 * lets a test observe the wiring the host actually uses instead of restating it:
 * the seam that broke silently when KM's priming API moved was exactly this one.
 *
 * @param knowledge An open `KnowledgeRuntime` — never null; a host with no corpus
 *   does not call this.
 */
export async function knowledgeDeps(
  knowledge: Untyped,
): Promise<Pick<HostDeps, 'knowledgeSurface' | 'priming'>> {
  const bridge = await import(/* @vite-ignore */ sharedModuleUrl('ai-knowledge'))
  return {
    knowledgeSurface: {
      surface: new bridge.KnowledgeToolbox(knowledge),
      // `knowledgeInstanceConfig` at the package root; `instanceConfig` is the
      // name inside the module it comes from.
      granted: bridge.knowledgeInstanceConfig([SYSTEM_KB]),
    },
    // KM's priming is a PAIR OF NAMED PROVIDERS — `km.landscape` (the map of
    // what territories exist) and `km.mechanism` (how to reach the rest) — and
    // it no longer owns where they sit relative to the role's purpose: that
    // sequence is declared in `host-core.ts`, in the entry list. What is decided
    // HERE is what the mechanism says, and it is not a sentence written by hand
    // about what the session might reach: it is this session's own projected
    // manual, so the corpus is described through the grant it actually has.
    //
    // The runtime is passed as a CALLABLE because that is what the pair takes —
    // both providers re-read on every assembly, which is what makes a recycled
    // segment reflect a document published after the conversation opened.
    priming: {
      landscape: bridge.LANDSCAPE_PROVIDER,
      mechanism: bridge.MECHANISM_PROVIDER,
      register: (providers: Untyped, box: Untyped) =>
        bridge.registerKmProviders(providers, () => knowledge, {
          mechanismFor: () => box.manual(),
        }),
    },
  }
}

/**
 * Assemble Node's runtime for one call.
 *
 * Everything here was previously a lookup performed deep inside the host. It is
 * the same set of decisions, made once, where the runtime is known.
 *
 * Exported for the same reason the Worker's `workerHost` is: a runtime assembly
 * is a thing a caller may want to build and inspect without going through a
 * transport. The three entry points below still assemble it themselves, so
 * nothing about the operator's path changes.
 */
export async function nodeDeps(opts: GlobalOptions): Promise<HostDeps> {
  const lib = await ai()
  const store = fsSiteStore(ctxOf(opts))
  const dir = sessionsDir(opts)
  const knowledge = await openKnowledge()

  return {
    lib,
    store,
    archive: new lib.FileArchive(dir),
    logDir: path.join(dir, 'live'),
    audit: fileAuditSink(opts),
    knowledgeSurface: null,
    priming: null,
    ...(knowledge !== null ? await knowledgeDeps(knowledge) : {}),
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
  knowledgeRoot = null
  library = null
}
