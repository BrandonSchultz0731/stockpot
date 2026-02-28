export enum RichBlockType {
  RecipeCard = 'recipe_card',
  ActionButton = 'action_button',
  IngredientList = 'ingredient_list',
  PantrySummary = 'pantry_summary',
}

export interface RichBlock {
  type: RichBlockType;
  data: Record<string, unknown>;
}

export const RICH_BLOCK_PATTERN =
  /:::(recipe_card|action_button|ingredient_list|pantry_summary)[ \t]*\n([\s\S]*?)\n[ \t]*:::/g;

export function parseRichBlocks(text: string): RichBlock[] {
  const blocks: RichBlock[] = [];
  const regex = new RegExp(RICH_BLOCK_PATTERN.source, RICH_BLOCK_PATTERN.flags);
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const type = match[1] as RichBlockType;
    const jsonStr = match[2].trim();
    try {
      const data = JSON.parse(jsonStr);
      blocks.push({ type, data });
    } catch {
      // Skip malformed blocks
    }
  }

  return blocks;
}

export function stripRichBlocks(text: string): string {
  const regex = new RegExp(RICH_BLOCK_PATTERN.source, RICH_BLOCK_PATTERN.flags);
  return text.replace(regex, '').replace(/\n{3,}/g, '\n\n').trim();
}
