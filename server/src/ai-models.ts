/**
 * Claude model definitions with pricing.
 *
 * To switch models, change ACTIVE_MODEL below.
 * Pricing source: https://docs.anthropic.com/en/docs/about-claude/pricing
 */

export interface ModelConfig {
  /** Model ID to pass to the Anthropic API */
  id: string;
  /** Cost per million input tokens in dollars */
  inputPerMTok: number;
  /** Cost per million output tokens in dollars */
  outputPerMTok: number;
}

export const CLAUDE_MODELS = {
  'haiku-3.5': {
    id: 'claude-3-5-haiku-20241022',
    inputPerMTok: 0.8,
    outputPerMTok: 4,
  },
  'sonnet-4': {
    id: 'claude-sonnet-4-20250514',
    inputPerMTok: 3,
    outputPerMTok: 15,
  },
  'opus-4': {
    id: 'claude-opus-4-20250514',
    inputPerMTok: 15,
    outputPerMTok: 75,
  },
} as const satisfies Record<string, ModelConfig>;

/** The model used for AI features. Change this to swap models. */
export const ACTIVE_MODEL: ModelConfig = CLAUDE_MODELS['sonnet-4'];

/**
 * Calculate estimated cost in cents from token counts.
 */
export function estimateCostCents(
  inputTokens: number,
  outputTokens: number,
  model: ModelConfig = ACTIVE_MODEL,
): number {
  return Math.round(
    ((inputTokens * model.inputPerMTok + outputTokens * model.outputPerMTok) /
      1_000_000) *
      100,
  );
}
