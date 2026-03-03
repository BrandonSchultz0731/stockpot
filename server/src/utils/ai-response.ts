import Anthropic from '@anthropic-ai/sdk';

/** Extract the text content from an Anthropic Message response. */
export function extractText(response: Anthropic.Message): string {
  return response.content[0]?.type === 'text' ? response.content[0].text : '';
}

/**
 * Parse JSON from an AI response using a 3-step strategy:
 * 1. Direct JSON.parse
 * 2. Extract from markdown code block
 * 3. Regex match for top-level object or array
 */
export function parseJsonFromAI(raw: string): unknown {
  // Try 1: Direct parse
  try {
    return JSON.parse(raw);
  } catch {
    // fall through
  }

  // Try 2: Extract from markdown code block
  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      // fall through
    }
  }

  // Try 3: Find top-level object or array via regex
  const structureMatch = raw.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  if (structureMatch) {
    try {
      return JSON.parse(structureMatch[0]);
    } catch {
      // fall through
    }
  }

  return undefined;
}

/** Parse + validate that the result is a plain object. */
export function parseObjectFromAI<T = Record<string, unknown>>(
  raw: string,
): T | undefined {
  const parsed = parseJsonFromAI(raw);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as T;
  }
  return undefined;
}

/** Parse + validate that the result is an array. */
export function parseArrayFromAI<T = unknown>(raw: string): T[] | undefined {
  const parsed = parseJsonFromAI(raw);
  if (Array.isArray(parsed)) {
    return parsed as T[];
  }
  return undefined;
}
