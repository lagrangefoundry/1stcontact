/**
 * Token contract re-export. `packages/site-schema` is the single source of
 * truth for which theme-token slots exist and their primitive types (DOC-7
 * §4 / REQ-4). The framework never redefines the shape — it imports it.
 */
export type {
  ThemeTokens,
  TypographyTokens,
  SpacingTokens,
  RadiusTokens,
  ShadowTokens,
  ContainerTokens,
  BreakpointTokens,
} from '@1stcontact/site-schema'

/** Deep-partial of any token group, for callers that supply only some slots. */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}
