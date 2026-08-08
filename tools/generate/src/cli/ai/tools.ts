/**
 * The builder's core tool surface (REQ-122).
 *
 * Every tool here is a thin declaration over a function in `edit.ts` — the SAME
 * functions `1c copy set` and the click-to-edit modal dispatch to, never a
 * parallel implementation. That is the whole design: the AI is a second
 * *producer* of structured edits, not a second write path. Validation, atomicity
 * and the re-render stay where they already live, and nothing here can bypass
 * them because nothing here does any of that work itself (DOC-8 §6).
 *
 * THE SURFACE IS BOUND TO ONE SITE. `slug` is not a parameter of any tool: it is
 * closed over at construction, because a session belongs to a site (REQ-122) and
 * a model that cannot name another site cannot edit one by mistake. This removes
 * the single most damaging class of tool error for free, and it costs a
 * parameter the model would otherwise have to get right on every call.
 *
 * WHAT IS ABSENT IS AS DESIGNED AS WHAT IS PRESENT. There is no tool that writes
 * markup, styles, or framework source, and there will not be one — DOC-8 §5.2
 * enforces the forbidden list by absence. {@link BUILDER_ABSENT} declares those
 * gaps so the model can answer for them instead of discovering them by failing.
 */

import {
  copyFieldsOf,
  formatL1Path,
  type L1Node,
} from '@1stcontact/site-schema'
import type { GlobalOptions } from '../commands'
import { cmdPublish } from '../commands'
import {
  editAssetList,
  editConfigGet,
  editConfigSet,
  editCopyGet,
  editCopySet,
  editPageAdd,
  editPageGet,
  editPageList,
  editPageRm,
  editPageUpdate,
  editStatus,
  type CopyTargetOptions,
} from '../edit'
import { CommandError } from '../errors'
import type { AbsentCapability, ToolDeclaration, ToolSurface } from './declare'

/**
 * Run one tool body, rendering a refusal as the model should read it.
 *
 * A {@link CommandError} is the EXPECTED answer to a bad call — the validator
 * refusing a value, an address that resolves to nothing — and it already carries
 * the code, path and hint the model needs to correct itself within the turn
 * (DOC-8 §5.3). `toHuman()` is exactly that rendering, so it is reused rather
 * than reformatted here.
 *
 * Anything else is a genuine fault. It is still returned rather than thrown,
 * because the tool loop treats a throw as a broken turn and one bad call must
 * not end the conversation — but it is labelled differently, so the model can
 * tell "you asked for something impossible" from "the builder broke".
 */
async function guarded(run: () => unknown | Promise<unknown>): Promise<string> {
  try {
    const out = await run()
    return typeof out === 'string' ? out : JSON.stringify(out, null, 2)
  } catch (err) {
    if (err instanceof CommandError) return err.toHuman()
    return `The builder failed to run this: ${err instanceof Error ? err.message : String(err)}`
  }
}

/** A string argument the model was required to supply. */
function str(input: Record<string, unknown>, name: string): string {
  const value = input[name]
  if (typeof value !== 'string' || value === '') {
    throw new CommandError({
      code: 'SCHEMA_INVALID',
      message: `'${name}' is required and must be a non-empty string.`,
      path: name,
    })
  }
  return value
}

/** An optional string argument — absent and empty are the same thing. */
function optStr(input: Record<string, unknown>, name: string): string | undefined {
  const value = input[name]
  return typeof value === 'string' && value !== '' ? value : undefined
}

/** The module/slot scope an address is resolved in, read off the model's input. */
function scopeOf(input: Record<string, unknown>, opts: GlobalOptions): CopyTargetOptions {
  return { ...opts, module: optStr(input, 'module'), slot: optStr(input, 'slot') }
}

// ── the page map ─────────────────────────────────────────────────────────────

/** One addressable place on a page, as the model needs to see it. */
interface Segment {
  /** The dotted address, in the form every write tool takes. */
  path: string
  kind: string
  /** The module instance this address is scoped to, when it is inside one. */
  module?: string
  slot?: string
  /** Current values of whatever this segment exposes. */
  values: Record<string, string>
}

/**
 * Walk an L1 root list, emitting every node that exposes editable fields.
 *
 * The addressing rule is `resolveL1Node`'s and is not re-derived here: index the
 * root list, then walk `children`. Emitting the address with `formatL1Path` — the
 * same function the renderer stamps `data-l1-path` with — is what guarantees the
 * addresses this map hands the model are the addresses the write path resolves.
 *
 * Containers with nothing of their own are walked through but not emitted:
 * `copyFieldsOf` returns null for them, and an address the model cannot do
 * anything with is noise in a listing whose whole value is being scannable.
 */
function walkSegments(
  roots: readonly L1Node[],
  scope: { module?: string; slot?: string },
  prefix: readonly number[] = [],
): Segment[] {
  const out: Segment[] = []
  roots.forEach((node, index) => {
    const path = [...prefix, index]
    const fields = copyFieldsOf(node)
    if (fields) {
      out.push({
        path: formatL1Path(path),
        kind: node.kind,
        ...(scope.module ? { module: scope.module, slot: scope.slot } : {}),
        values: fields.values,
      })
    }
    const children = (node as { children?: L1Node[] }).children
    if (children?.length) out.push(...walkSegments(children, scope, path))
  })
  return out
}

/**
 * Every addressable segment on a page — the page's own L1, then each behavior
 * module instance's slots.
 *
 * Both spaces are walked because both are addressable, and a model shown only
 * the first would conclude the words inside a contact form or a carousel slide
 * are not editable. They are; they just carry a `module` and `slot` scope, which
 * is why those travel with the address here rather than being something the
 * model has to infer.
 */
function pageSegments(page: Record<string, unknown>): Segment[] {
  const out: Segment[] = []
  const root = (page.l1 as { root?: L1Node } | undefined)?.root
  if (root) out.push(...walkSegments([root], {}))

  const modules = Array.isArray(page.modules) ? (page.modules as Record<string, unknown>[]) : []
  for (const instance of modules) {
    const id = typeof instance.id === 'string' ? instance.id : undefined
    if (!id) continue
    const slots = (instance.slots ?? {}) as Record<string, unknown>
    for (const [slot, raw] of Object.entries(slots)) {
      const roots = Array.isArray(raw) ? (raw as L1Node[]) : [raw as L1Node]
      out.push(...walkSegments(roots, { module: id, slot }))
    }
  }
  return out
}

// ── the declarations ─────────────────────────────────────────────────────────

/**
 * The tools, bound to one site.
 *
 * @param slug The site every tool here operates on. Never a model-supplied value.
 * @param opts Store context (`cwd`, `sandbox`), as every `edit.ts` call takes.
 */
export function builderTools(slug: string, opts: GlobalOptions = {}): ToolDeclaration[] {
  return [
    {
      name: 'describe_site',
      summary: "Get the site's settings, its pages, and whether it has unpublished changes.",
      category: 'Looking at the site',
      params: {},
      required: [],
      errors: ['NOT_FOUND', 'ENVIRONMENT'],
      examples: [{ input: {}, outcome: 'The settings object, the page list, and any pending changes.' }],
      handler: () =>
        guarded(() => ({
          config: (editConfigGet(slug, undefined, opts).data as { config: unknown }).config,
          pages: (editPageList(slug, opts).data as { pages: unknown }).pages,
          pending: editStatus(slug, opts).data,
        })),
    },
    {
      name: 'list_pages',
      summary: 'List every page: its id, its address in the site, and its title.',
      category: 'Looking at the site',
      params: {},
      required: [],
      errors: ['NOT_FOUND'],
      handler: () => guarded(() => editPageList(slug, opts).data),
    },
    {
      name: 'describe_page',
      summary:
        'Map one page: every place on it you can change, with its address and its current content.',
      category: 'Looking at the site',
      params: {
        page: { type: 'string', description: 'The page id.' },
      },
      required: ['page'],
      reads: ['list_pages'],
      errors: ['NOT_FOUND'],
      examples: [
        {
          input: { page: 'home' },
          outcome:
            'Every editable segment on the home page, each with the address `set_copy` takes.',
        },
      ],
      handler: (input) =>
        guarded(() => {
          const page = (editPageGet(slug, str(input, 'page'), opts).data as {
            page: Record<string, unknown>
          }).page
          return {
            page: { id: page.id, slug: page.slug, title: page.title },
            segments: pageSegments(page),
          }
        }),
    },
    {
      name: 'get_copy',
      summary: 'Read exactly what one place on a page holds, and what it will accept.',
      category: 'Looking at the site',
      params: {
        page: { type: 'string', description: 'The page id.' },
        path: { type: 'string', description: 'The address, e.g. 0.2.1.' },
        module: { type: 'string', description: 'The behavior module instance, if the address is inside one.' },
        slot: { type: 'string', description: 'The slot within that instance.' },
      },
      required: ['page', 'path'],
      reads: ['describe_page'],
      errors: ['NOT_FOUND', 'SCHEMA_INVALID'],
      handler: (input) =>
        guarded(
          () =>
            editCopyGet(slug, str(input, 'page'), str(input, 'path'), scopeOf(input, opts)).data,
        ),
    },
    {
      name: 'list_assets',
      summary: 'List the images and fonts this site can use.',
      category: 'Looking at the site',
      params: {},
      required: [],
      errors: ['NOT_FOUND'],
      handler: () => guarded(() => editAssetList(slug, opts).data),
    },
    {
      name: 'get_config',
      summary: "Read one of the site's settings.",
      category: 'Looking at the site',
      params: {
        key: { type: 'string', description: 'Dotted key, e.g. site.title.' },
      },
      required: ['key'],
      reads: ['describe_site'],
      errors: ['NOT_FOUND'],
      handler: (input) => guarded(() => editConfigGet(slug, str(input, 'key'), opts).data),
    },

    {
      name: 'set_copy',
      summary: 'Change the words, or swap the image, at one place on a page.',
      category: 'Changing the site',
      writes: true,
      params: {
        page: { type: 'string', description: 'The page id.' },
        path: { type: 'string', description: 'The address, e.g. 0.2.1.' },
        values: {
          type: 'object',
          description:
            'Field name to new value. The fields a place accepts come from get_copy — a text ' +
            'run takes `text`; an image takes `src` and `alt`.',
        },
        module: { type: 'string', description: 'The behavior module instance, if the address is inside one.' },
        slot: { type: 'string', description: 'The slot within that instance.' },
      },
      required: ['page', 'path', 'values'],
      reads: ['describe_page', 'get_copy'],
      errors: ['NOT_FOUND', 'SCHEMA_INVALID'],
      examples: [
        {
          input: { page: 'home', path: '0.1.0', values: { text: 'Welcome to the studio' } },
          outcome: 'That heading now reads "Welcome to the studio", and the page re-renders.',
        },
      ],
      handler: (input) =>
        guarded(() => {
          const values = input.values
          if (values === null || typeof values !== 'object' || Array.isArray(values)) {
            throw new CommandError({
              code: 'SCHEMA_INVALID',
              message: "'values' must be an object of field name to new value.",
              path: 'values',
              hint: 'Read the fields this place accepts with get_copy.',
            })
          }
          return editCopySet(
            slug,
            str(input, 'page'),
            str(input, 'path'),
            values as Record<string, unknown>,
            scopeOf(input, opts),
          ).human
        }),
    },
    {
      name: 'add_page',
      summary: 'Add a new, empty page to the site.',
      category: 'Changing the site',
      writes: true,
      params: {
        page: { type: 'string', description: 'The new page id — short, lowercase, no spaces.' },
        title: { type: 'string', description: "The page's title." },
        path: { type: 'string', description: 'Its address in the site. Defaults to the page id.' },
      },
      required: ['page'],
      reads: ['list_pages'],
      errors: ['CONFLICT', 'SCHEMA_INVALID'],
      examples: [
        {
          input: { page: 'contact', title: 'Contact us' },
          outcome: 'An empty page at /contact. It has no content yet — say so.',
        },
      ],
      handler: (input) =>
        guarded(
          () =>
            editPageAdd(slug, str(input, 'page'), {
              ...opts,
              title: optStr(input, 'title'),
              path: optStr(input, 'path'),
            }).human,
        ),
    },
    {
      name: 'update_page',
      summary: "Change a page's title or its address in the site.",
      category: 'Changing the site',
      writes: true,
      params: {
        page: { type: 'string', description: 'The page id.' },
        title: { type: 'string', description: 'The new title.' },
        path: { type: 'string', description: 'The new address in the site.' },
      },
      required: ['page'],
      reads: ['list_pages'],
      errors: ['NOT_FOUND', 'CONFLICT', 'SCHEMA_INVALID'],
      handler: (input) =>
        guarded(
          () =>
            editPageUpdate(slug, str(input, 'page'), {
              ...opts,
              title: optStr(input, 'title'),
              path: optStr(input, 'path'),
            }).human,
        ),
    },
    {
      name: 'remove_page',
      summary: 'Delete a page from the site.',
      category: 'Changing the site',
      writes: true,
      params: {
        page: { type: 'string', description: 'The page id.' },
      },
      required: ['page'],
      reads: ['list_pages'],
      errors: ['NOT_FOUND', 'REFERENTIAL_INTEGRITY'],
      handler: (input) => guarded(() => editPageRm(slug, str(input, 'page'), opts).human),
    },
    {
      name: 'set_config',
      summary: "Change one of the site's settings.",
      category: 'Changing the site',
      writes: true,
      params: {
        key: { type: 'string', description: 'Dotted key, e.g. site.title.' },
        value: { type: 'string', description: 'The new value.' },
      },
      required: ['key', 'value'],
      reads: ['describe_site', 'get_config'],
      errors: ['NOT_FOUND', 'SCHEMA_INVALID'],
      handler: (input) =>
        guarded(() => editConfigSet(slug, str(input, 'key'), str(input, 'value'), opts).human),
    },
    {
      name: 'publish',
      summary:
        'Publish the site: make everything changed so far visible to the public. Ask the user before you do this.',
      category: 'Changing the site',
      writes: true,
      params: {
        message: { type: 'string', description: 'A one-line note describing what changed.' },
      },
      required: [],
      reads: ['describe_site'],
      errors: ['NOT_FOUND', 'INTERNAL'],
      handler: (input) =>
        guarded(async () => {
          const result = await cmdPublish(slug, { ...opts, message: optStr(input, 'message') })
          const { added, modified, removed } = result.changes
          return (
            `Published revision ${result.id} — ` +
            `${added.length} added, ${modified.length} changed, ${removed.length} removed.`
          )
        }),
    },
  ]
}

/**
 * What this surface deliberately cannot do.
 *
 * Each entry is a request the operator is genuinely likely to make and that the
 * model would otherwise flail at. The `answer` is not an apology — it names what
 * would be needed, which is the only useful thing to say and is also the signal
 * that tells us which tool to build next.
 */
export const BUILDER_ABSENT: readonly AbsentCapability[] = [
  {
    ask: 'Writing HTML, CSS or JavaScript',
    answer:
      'Never possible, by design, and not a gap to be worked around. Everything you can change ' +
      'is a structured field on a tool above.',
  },
  {
    ask: 'Changing how something looks — colour, size, spacing, position',
    answer:
      'Not yet possible. You can change what a page SAYS and which image it shows, but not its ' +
      'appearance. Say so plainly, and describe what the user asked for so it can be built.',
  },
  {
    ask: 'Adding, removing, moving or reordering things on a page',
    answer:
      'Not yet possible. You can add and remove whole pages, but not rearrange what is on one.',
  },
  {
    ask: 'Uploading a new image',
    answer:
      "Not possible from here. You can only use images already in the site's asset list — offer " +
      'the user the ones that are there, and tell them uploading is done outside the chat.',
  },
  {
    ask: 'Undoing a change',
    answer:
      'There is no undo tool. A change can be reversed by setting the old value back, so tell ' +
      'the user what the previous value was when you change something.',
  },
]

/** The whole surface for one site: its tools, and its declared absences. */
export function builderToolSurface(slug: string, opts: GlobalOptions = {}): ToolSurface {
  return { tools: builderTools(slug, opts), absent: BUILDER_ABSENT }
}
