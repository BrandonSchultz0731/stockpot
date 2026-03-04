import { View, Text } from 'react-native';
import { Zap } from 'lucide-react-native';
import type { ChatMessage } from '../../hooks/useAiChat';
import { RICH_BLOCK_PATTERN, RichBlockType } from '../../shared/richBlocks';
import colors from '../../theme/colors';
import ToolUseIndicator from './ToolUseIndicator';
import RichRecipeCard from './RichRecipeCard';
import RichActionButton from './RichActionButton';
import RichIngredientList from './RichIngredientList';
import RichPantrySummary from './RichPantrySummary';

interface ChatBubbleProps {
  message: ChatMessage;
  onRecipePress?: (recipeId: string) => void;
  onAction?: (action: string, params: Record<string, unknown>) => void;
}

function renderRichBlock(
  type: RichBlockType,
  data: Record<string, unknown>,
  index: number,
  onRecipePress?: (recipeId: string) => void,
  onAction?: (action: string, params: Record<string, unknown>) => void,
) {
  switch (type) {
    case RichBlockType.RecipeCard:
      return <RichRecipeCard key={`rich-${index}`} data={data} onPress={onRecipePress} />;
    case RichBlockType.ActionButton:
      return <RichActionButton key={`rich-${index}`} data={data} onAction={onAction} />;
    case RichBlockType.IngredientList:
      return <RichIngredientList key={`rich-${index}`} data={data} />;
    case RichBlockType.PantrySummary:
      return <RichPantrySummary key={`rich-${index}`} data={data} />;
    default:
      return null;
  }
}

function renderAssistantContent(
  message: ChatMessage,
  onRecipePress?: (recipeId: string) => void,
  onAction?: (action: string, params: Record<string, unknown>) => void,
) {
  if (message.isStreaming) {
    return (
      <Text className="text-[15px] leading-[22px] text-ink">
        {message.content}
        <Text className="text-terra">|</Text>
      </Text>
    );
  }

  // Parse rich blocks directly from the content text (don't rely on server array indexing)
  const regex = new RegExp(RICH_BLOCK_PATTERN.source, RICH_BLOCK_PATTERN.flags);
  const content = message.content;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let matchIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    // Text before this block
    const textBefore = content.slice(lastIndex, match.index).trim();
    if (textBefore) {
      parts.push(
        <Text key={`text-${matchIndex}`} className="text-[15px] leading-[22px] text-ink">
          {textBefore}
        </Text>,
      );
    }

    // Parse the JSON from the matched content and render the block
    const type = match[1] as RichBlockType;
    const jsonStr = match[2].trim();
    try {
      const data = JSON.parse(jsonStr);
      parts.push(renderRichBlock(type, data, matchIndex, onRecipePress, onAction));
    } catch {
      // If JSON parse fails, show nothing for this block (it's stripped)
    }

    lastIndex = match.index + match[0].length;
    matchIndex++;
  }

  // Remaining text after last block
  const remaining = content.slice(lastIndex).trim();
  if (remaining) {
    parts.push(
      <Text key="text-end" className="text-[15px] leading-[22px] text-ink">
        {remaining}
      </Text>,
    );
  }

  // If no parts were generated (no rich blocks found), render as plain text
  if (parts.length === 0) {
    return (
      <Text className="text-[15px] leading-[22px] text-ink">
        {message.content}
      </Text>
    );
  }

  return <>{parts}</>;
}

export default function ChatBubble({ message, onRecipePress, onAction }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <View className="mb-3 ml-12 self-end rounded-[20px] bg-terra px-4 py-3">
        <Text className="text-[15px] leading-[22px] text-white">{message.content}</Text>
      </View>
    );
  }

  return (
    <View className="mb-3 mr-12 flex-row self-start">
      {/* AI avatar */}
      <View className="mr-2 mt-1 h-7 w-7 items-center justify-center rounded-full bg-espresso">
        <Zap size={14} color={colors.terra.DEFAULT} />
      </View>
      <View className="flex-1">
        {/* Tool use indicators */}
        {message.toolUses && message.toolUses.length > 0 && (
          <View className="mb-1">
            {message.toolUses.map((tu) => (
              <ToolUseIndicator key={tu.id} name={tu.name} done={tu.done} />
            ))}
          </View>
        )}
        <View className="rounded-[20px] rounded-tl-md bg-cream px-4 py-3">
          {renderAssistantContent(message, onRecipePress, onAction)}
        </View>
      </View>
    </View>
  );
}
