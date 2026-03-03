import { Logger } from '@nestjs/common';
import { AnthropicService } from '../anthropic/anthropic.service';
import { CLAUDE_MODELS } from '../ai-models';
import { MessageType } from '@shared/enums';
import { buildUnitConversionPrompt } from '../prompts';
import { extractText, parseArrayFromAI } from '../utils/ai-response';
import type { CookDeductionResult } from './cook-deduction';

const logger = new Logger('CookDeductionAI');

/**
 * Resolve deductions that require AI for domain-specific unit conversion
 * (e.g. 3 cloves → 0.25 head, 2 cups flour → 0.55 lb).
 *
 * Mutates the deduction objects in place, setting deductQuantity and clearing
 * needsAiConversion.
 */
export async function resolveAiConversions(
  deductions: CookDeductionResult[],
  userId: string,
  anthropicService: AnthropicService,
): Promise<void> {
  const unresolved = deductions.filter((d) => d.needsAiConversion);
  if (unresolved.length === 0) return;

  const pairs = unresolved.map((d) => ({
    ingredientName: d.recipeIngredientName,
    ingredientQty: d.recipeQuantity ?? 0,
    ingredientUnit: d.recipeUnit ?? d.deductUnit,
    pantryUnit: d.deductUnit,
  }));

  const prompt = buildUnitConversionPrompt(pairs);

  try {
    const response = await anthropicService.sendMessage(userId, {
      model: CLAUDE_MODELS['haiku-4.5'],
      maxTokens: 256,
      messages: [{ role: 'user', content: prompt }],
      messageType: MessageType.CookDeduction,
    });

    const rawText = extractText(response);
    const quantities = parseArrayFromAI<number>(rawText);

    if (quantities && quantities.length === unresolved.length) {
      for (let i = 0; i < unresolved.length; i++) {
        const qty = quantities[i];
        if (typeof qty === 'number' && qty >= 0) {
          const capped = Math.min(
            Math.round(qty * 100) / 100,
            unresolved[i].currentQuantity,
          );
          unresolved[i].deductQuantity = capped;
          unresolved[i].notes = `AI converted → ${capped} ${unresolved[i].deductUnit}`;
        }
      }
    } else {
      logger.warn(
        `AI conversion returned ${quantities?.length ?? 0} results for ${unresolved.length} items`,
      );
    }
  } catch (error) {
    logger.error('AI unit conversion failed, leaving deductions at 0', error);
  }
}

