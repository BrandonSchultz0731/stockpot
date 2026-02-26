import {
  Injectable,
  BadGatewayException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { AnthropicService } from '../anthropic/anthropic.service';
import { UsageTrackingService } from '../usage-tracking/usage-tracking.service';
import { ACTIVE_MODEL } from '../ai-models';
import { UnitOfMeasure, StorageLocation, ShelfLife } from '@shared/enums';
import { ScanReceiptDto } from './dto/scan-receipt.dto';

export interface ScannedItem {
  displayName: string;
  quantity: number;
  unit: string;
  estimatedShelfLife?: ShelfLife;
  suggestedStorageLocation?: string;
}

const VALID_UNITS = new Set(Object.values(UnitOfMeasure));
const VALID_STORAGE_LOCATIONS = new Set(Object.values(StorageLocation));

const SYSTEM_PROMPT = `You are a grocery receipt parser. Extract food and grocery items from the receipt image.

Return a JSON array of objects with these fields:
- "displayName": Human-readable product name. Expand common receipt abbreviations (e.g. "ORG" → "Organic", "GRN" → "Green", "BNLS" → "Boneless", "SKNLS" → "Skinless", "WHL" → "Whole", "BLK" → "Black", "WHT" → "White", "FRZ" → "Frozen", "BRST" → "Breast", "GRND" → "Ground"). Use title case.
- "quantity": Number of items (default 1 if not clear).
- "unit": One of these exact values: ${Object.values(UnitOfMeasure).join(', ')}. Use "count" if unsure.
- "estimatedShelfLife": An object with estimated shelf life in days for each storage method: { "${StorageLocation.Fridge}": number, "${StorageLocation.Freezer}": number, "${StorageLocation.Pantry}": number }. Use typical values for an unopened product. Omit a key if that storage method is not applicable (e.g. omit "${StorageLocation.Fridge}" for raw meat).
- "suggestedStorageLocation": The most common storage location for this item. One of: ${Object.values(StorageLocation).join(', ')}.

Rules:
- Only include food/grocery items. Skip taxes, discounts, subtotals, rewards, coupons, bag fees, and non-food items.
- If a line shows a quantity multiplier (e.g. "2 @ $3.99"), use that quantity.
- If the receipt is unreadable or contains no food items, return an empty array: []

Return ONLY the JSON array, no markdown fences, no explanation.`;

@Injectable()
export class ReceiptScanService {
  private readonly logger = new Logger(ReceiptScanService.name);

  constructor(
    private readonly anthropicService: AnthropicService,
    private readonly usageTrackingService: UsageTrackingService,
  ) {}

  async scanReceipt(
    userId: string,
    dto: ScanReceiptDto,
  ): Promise<{ items: ScannedItem[] }> {
    let response;

    try {
      response = await this.anthropicService.sendMessage(userId, {
        model: ACTIVE_MODEL,
        maxTokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  // Normalize non-standard mime types to ones Claude Vision accepts
                  media_type: (
                    ['image/jpg', 'image/heic', 'image/heif'].includes(dto.mimeType)
                      ? 'image/jpeg'
                      : dto.mimeType
                  ) as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
                  data: dto.imageBase64,
                },
              },
              {
                type: 'text',
                text: SYSTEM_PROMPT,
              },
            ],
          },
        ],
      });
    } catch (error) {
      this.logger.error('Claude API call failed', error);
      throw new BadGatewayException('Receipt scanning service unavailable');
    }

    // Track feature-specific counter (token/cost tracking handled by AnthropicService)
    await this.usageTrackingService.increment(userId, 'receiptScans');

    const rawText =
      response.content[0]?.type === 'text' ? response.content[0].text : '';

    const items = this.parseResponse(rawText);
    return { items };
  }

  private parseResponse(raw: string): ScannedItem[] {
    let parsed: unknown;

    // Try 1: Direct JSON parse
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Try 2: Extract from markdown code block
      const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        try {
          parsed = JSON.parse(codeBlockMatch[1].trim());
        } catch {
          // fall through
        }
      }

      // Try 3: Find array via regex
      if (!parsed) {
        const arrayMatch = raw.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          try {
            parsed = JSON.parse(arrayMatch[0]);
          } catch {
            // fall through
          }
        }
      }
    }

    if (!Array.isArray(parsed)) {
      if (parsed === undefined || parsed === null) {
        // Likely unreadable receipt
        return [];
      }
      throw new UnprocessableEntityException(
        'Could not parse receipt scan response',
      );
    }

    return parsed
      .filter(
        (item: any) =>
          item &&
          typeof item.displayName === 'string' &&
          item.displayName.trim().length > 0,
      )
      .map((item: any) => ({
        displayName: item.displayName.trim(),
        quantity:
          typeof item.quantity === 'number' && item.quantity > 0
            ? item.quantity
            : 1,
        unit: VALID_UNITS.has(item.unit) ? item.unit : UnitOfMeasure.Count,
        ...(item.estimatedShelfLife && {
          estimatedShelfLife: this.parseShelfLife(item.estimatedShelfLife),
        }),
        ...(VALID_STORAGE_LOCATIONS.has(item.suggestedStorageLocation) && {
          suggestedStorageLocation: item.suggestedStorageLocation,
        }),
      }));
  }

  private parseShelfLife(raw: unknown): ShelfLife | undefined {
    if (!raw || typeof raw !== 'object') return undefined;

    const result: ShelfLife = {};
    const obj = raw as Record<string, unknown>;

    for (const loc of Object.values(StorageLocation)) {
      const val = Number(obj[loc]);
      if (Number.isFinite(val) && val > 0) {
        result[loc] = Math.round(val);
      }
    }

    return Object.keys(result).length > 0 ? result : undefined;
  }
}
