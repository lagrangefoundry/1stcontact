/**
 * The two string sinks a behavior module's own markup goes through (REQ-148).
 *
 * WHY THIS EXISTS. Behavior components used to be `.astro` files, and Astro's
 * compiler escaped every `{expression}` it emitted into text or an attribute.
 * REQ-148 replaced those components with plain TypeScript functions so they run
 * in workerd, which means the escaping that was implicit in the compiler has to
 * become explicit — and has to be ONE implementation, named where a reviewer
 * looking at a component can see which sink each value went through.
 *
 * The rules match `l1/render.ts`'s emitter exactly, because the two emit into
 * the same document: a module's chrome wraps L1 fragments, and a value escaped
 * one way in one and another way in the other would be a difference with no
 * cause. Anything a module renders raw (an already-emitted L1 fragment, its
 * serialized CSS) is interpolated directly and is visible as such at the call
 * site — there is deliberately no `raw()` helper to blur the distinction.
 */

/** HTML-escape text and attribute values (the same five entities as the L1 emitter). */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * One attribute, or nothing.
 *
 * `undefined` renders no attribute at all — the shape `{cond ? x : undefined}`
 * had in the `.astro` sources, and the shape the edit channel relies on to drop
 * a form's `action` and `method` rather than blank them. `true` renders the bare
 * boolean form, `false` renders nothing. The leading space is included so a
 * caller can concatenate without deciding whether a separator is needed.
 */
export function attr(name: string, value: string | boolean | undefined): string {
  if (value === undefined || value === false) return ''
  if (value === true) return ` ${name}`
  return ` ${name}="${escapeHtml(value)}"`
}
