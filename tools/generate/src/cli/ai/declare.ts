/**
 * The tool-surface declaration format (REQ-122).
 *
 * A tool is declared ONCE, as data, and rendered twice: into the wire spec the
 * model receives, and into the markdown manual that primes it. Neither rendering
 * is hand-maintained, which is the point.
 *
 * WHY THIS EXISTS AT ALL. DOC-8 §5.3 requires finite enums to be "spelled
 * literally in descriptions" so the model's first call is valid. Done by hand
 * that means writing every enum twice — once in the schema, once in English —
 * and the second copy is where drift lives: the schema gets a new value, the
 * prose does not, and the model is now being told something false by the very
 * text meant to make it accurate. Here the enum is written once, in
 * {@link ToolParam.enum}, and both renderings are derived from it. Drift is not
 * discouraged; it is unrepresentable.
 *
 * NOTHING HERE IS A FRAMEWORK CONCERN. `@lagrangefoundry/ai` supplies the seams
 * and none of the content: `Tool.description` is an opaque string, `extraTools`
 * is the registration seam, and `ContextSource` is duck-typed. The knowledge and
 * the prompts are this project's, so they are declared in this project. A
 * {@link ToolSpec} is deliberately plain data rather than a constructed `Tool` —
 * this module has no dependency on the AI component, and the one-line adapter
 * that turns specs into `Tool` instances lives at the host boundary.
 */

import type { ErrorCode } from '../errors'

/** A JSON-schema scalar this surface is willing to accept from a model. */
export type ToolParamType = 'string' | 'number' | 'boolean' | 'object'

/**
 * One declared parameter.
 *
 * `enum` is the closed option list, and it is written here and NOWHERE else. It
 * reaches the model twice — as a schema constraint and as a sentence in the
 * parameter's description — from this one field.
 */
export interface ToolParam {
  type: ToolParamType
  description: string
  enum?: readonly string[]
}

/** A worked call. Structured rather than prose so a test can execute it. */
export interface ToolExample {
  /** Exactly what the model would send. */
  input: Record<string, unknown>
  /** What it achieves, in one line. */
  outcome: string
}

/**
 * One tool: what it does, what it takes, how it fails, and what runs it.
 *
 * `reads` and `errors` are not decoration. A model that does not know an address
 * has to come from `describe_page` will invent one; a model that has never seen
 * `SCHEMA_INVALID` will treat a validator refusal as a dead end rather than
 * something to correct within the turn (DOC-8 §5.3).
 */
export interface ToolDeclaration {
  name: string
  /** One sentence, in the imperative. Becomes the first line of the description. */
  summary: string
  /** Groups the tool in the manual. Free-form; the manual orders by first use. */
  category: string
  params: Record<string, ToolParam>
  required: readonly string[]
  /** Tools whose output supplies this one's arguments. */
  reads?: readonly string[]
  /**
   * The `CommandError` codes this tool can answer with. Typed as {@link ErrorCode}
   * so a declaration cannot promise the model a code the validator never raises.
   */
  errors?: readonly ErrorCode[]
  examples?: readonly ToolExample[]
  /** True when the tool changes the draft. Rendered as such in both places. */
  writes?: boolean
  handler: (input: Record<string, unknown>) => string | Promise<string>
}

/**
 * A capability that deliberately has no tool.
 *
 * DOC-8 §5.2 enforces the forbidden list by ABSENCE, which is exactly right for
 * enforcement and useless as guidance: absence teaches a model nothing, so it
 * spends a turn proposing CSS and another apologising for it. Declaring the
 * absence turns a security property into an answer the model can give directly.
 *
 * It lives beside the tools rather than in the role prompt because it changes
 * when the surface changes — and a hand-written system prompt is precisely the
 * thing that does not get updated when a tool is added.
 */
export interface AbsentCapability {
  /** What the operator is likely to ask for. */
  ask: string
  /** What the model should do instead. */
  answer: string
}

/** Every tool the builder offers, plus what it deliberately does not. */
export interface ToolSurface {
  tools: readonly ToolDeclaration[]
  absent: readonly AbsentCapability[]
}

/**
 * The shape `@lagrangefoundry/ai`'s `Tool` is constructed from: name,
 * description, `{properties, required}`, handler. Plain data — see the module
 * header for why this is not a `Tool` instance.
 */
export interface ToolSpec {
  name: string
  description: string
  inputSchema: {
    properties: Record<string, { type: string; description: string; enum?: readonly string[] }>
    required: readonly string[]
  }
  handler: (input: Record<string, unknown>) => string | Promise<string>
}

/** `a, b or c` — an option list a sentence can end with. */
function sentenceList(items: readonly string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} or ${items[items.length - 1]}`
}

/**
 * A parameter's model-facing description: the declared text, plus the enum
 * spelled out literally when there is one (DOC-8 §5.3).
 */
export function composeParamDescription(param: ToolParam): string {
  if (!param.enum || param.enum.length === 0) return param.description
  return `${param.description} One of: ${sentenceList([...param.enum])}.`
}

/**
 * A tool's model-facing description, composed from the declaration.
 *
 * Deliberately terse and mechanical. This is not where a tool is explained — the
 * manual is, and it has room. This is the line the model reads while choosing
 * between twelve tools, so it carries only what changes that choice: what the
 * tool does, what it needs first, whether it writes, and how it can fail.
 */
export function composeDescription(decl: ToolDeclaration): string {
  const parts = [decl.summary]
  if (decl.writes) parts.push('Changes the site.')
  if (decl.reads?.length) {
    parts.push(`Call ${sentenceList([...decl.reads])} first to get its arguments.`)
  }
  if (decl.errors?.length) parts.push(`May fail with: ${decl.errors.join(', ')}.`)
  return parts.join(' ')
}

/**
 * Render one declaration into its wire spec.
 *
 * Throws on a `required` entry with no matching parameter. A declaration that
 * names a parameter it does not declare produces a schema the model cannot
 * satisfy, and it fails at the worst possible moment — mid-turn, as a tool error
 * the model tries to correct and cannot. Catching it here makes it a startup
 * failure with a name attached.
 */
export function toolSpec(decl: ToolDeclaration): ToolSpec {
  for (const name of decl.required) {
    if (!(name in decl.params)) {
      throw new Error(
        `Tool '${decl.name}' requires parameter '${name}', which it does not declare.`,
      )
    }
  }
  const properties: ToolSpec['inputSchema']['properties'] = {}
  for (const [name, param] of Object.entries(decl.params)) {
    properties[name] = {
      type: param.type,
      description: composeParamDescription(param),
      ...(param.enum ? { enum: param.enum } : {}),
    }
  }
  return {
    name: decl.name,
    description: composeDescription(decl),
    inputSchema: { properties, required: decl.required },
    handler: decl.handler,
  }
}

/** Every tool on a surface, as wire specs. Duplicate names are a declaration bug. */
export function toolSpecs(surface: ToolSurface): ToolSpec[] {
  const seen = new Set<string>()
  for (const decl of surface.tools) {
    if (seen.has(decl.name)) throw new Error(`Duplicate tool declaration '${decl.name}'.`)
    seen.add(decl.name)
  }
  return surface.tools.map(toolSpec)
}

/** `slug`, `page` → `slug, page` with required ones marked. */
function signature(decl: ToolDeclaration): string {
  const names = Object.keys(decl.params).map((n) =>
    decl.required.includes(n) ? n : `${n}?`,
  )
  return `${decl.name}(${names.join(', ')})`
}

/**
 * The tool manual: the surface described AS A SURFACE.
 *
 * The wire schemas already tell the model what each tool takes. What they cannot
 * carry is the shape of the whole — which tool to reach for first, that an
 * address is render-scoped and must be re-read rather than remembered, what a
 * refusal means, and what simply is not here. That is what this document is for,
 * and it is generated so it cannot fall behind the tools it describes.
 *
 * It is returned as a string rather than written to disk because it is consumed
 * as a priming document through the `ContextSource` seam, which is an interface,
 * not a directory.
 */
export function renderManual(surface: ToolSurface): string {
  const out: string[] = []

  out.push('# Your tools')
  out.push('')
  out.push(
    'These are the only ways you can see or change the site. There is no other ' +
      'path — you cannot write HTML, CSS, JavaScript or framework source, and no ' +
      'tool will accept them. That is what makes every change you make safe, ' +
      'reversible and reproducible.',
  )
  out.push('')

  const categories = [...new Set(surface.tools.map((t) => t.category))]
  for (const category of categories) {
    out.push(`## ${category}`)
    out.push('')
    for (const decl of surface.tools.filter((t) => t.category === category)) {
      out.push(`### \`${signature(decl)}\``)
      out.push('')
      out.push(decl.summary)
      out.push('')
      if (decl.writes) out.push('**Changes the site.**')
      if (decl.reads?.length) {
        out.push(`Get its arguments from ${sentenceList(decl.reads.map((r) => `\`${r}\``))}.`)
      }
      if (decl.writes || decl.reads?.length) out.push('')

      const params = Object.entries(decl.params)
      if (params.length > 0) {
        for (const [name, param] of params) {
          const req = decl.required.includes(name) ? '' : ' *(optional)*'
          out.push(`- \`${name}\`${req} — ${composeParamDescription(param)}`)
        }
        out.push('')
      }

      for (const example of decl.examples ?? []) {
        out.push('```json')
        out.push(JSON.stringify(example.input, null, 2))
        out.push('```')
        out.push(`→ ${example.outcome}`)
        out.push('')
      }
    }
  }

  const codes = [...new Set(surface.tools.flatMap((t) => t.errors ?? []))].sort()
  if (codes.length > 0) {
    out.push('## When a tool refuses')
    out.push('')
    out.push(
      'A refusal is information, not a dead end. It carries a code, the path it ' +
        'objected to, and a hint. Read it, fix the call, and try again in the same ' +
        'turn — you do not need to ask the user about a refusal you can correct ' +
        'yourself.',
    )
    out.push('')
    for (const code of codes) out.push(`- \`${code}\` — ${ERROR_MEANINGS[code]}`)
    out.push('')
  }

  if (surface.absent.length > 0) {
    out.push('## What there is no tool for')
    out.push('')
    out.push(
      'These are deliberate. If the user asks for one, say plainly that you ' +
        'cannot do it and what you would need — do not approximate it with a tool ' +
        'that was meant for something else.',
    )
    out.push('')
    for (const entry of surface.absent) out.push(`- **${entry.ask}** — ${entry.answer}`)
    out.push('')
  }

  return out.join('\n')
}

/**
 * What each `CommandError` code means to the model.
 *
 * The codes are the validator's, defined in `cli/errors.ts` and raised across
 * `edit.ts`. This maps them to what the model should DO, which is the part the
 * code alone does not carry.
 */
const ERROR_MEANINGS: Record<ErrorCode, string> = {
  NOT_FOUND: 'what you addressed does not exist. Re-read the listing; do not guess again.',
  CONFLICT: 'the name or path is already taken. Choose a different one.',
  SCHEMA_INVALID: 'the value you offered is not one this field accepts. The hint names what is.',
  REFERENTIAL_INTEGRITY: 'something else still points at what you tried to remove.',
  ENVIRONMENT: 'the workspace itself is not set up correctly. Nothing you send can fix this — tell the user.',
  INTERNAL: 'the builder failed for a reason that is not your call. Tell the user; do not retry blindly.',
}
