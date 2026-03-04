import { View, Pressable, FlatList, Modal, ActivityIndicator } from 'react-native';
import AppText from '../../components/AppText';
import { X, Trash2, Plus } from 'lucide-react-native';
import colors from '../../theme/colors';

interface Conversation {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ConversationListSheetProps {
  visible: boolean;
  conversations: Conversation[];
  isLoading: boolean;
  activeConversationId: string | null;
  onSelect: (conversationId: string) => void;
  onDelete: (conversationId: string) => void;
  onNewChat: () => void;
  onClose: () => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
  if (diffHours < 48) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ConversationListSheet({
  visible,
  conversations,
  isLoading,
  activeConversationId,
  onSelect,
  onDelete,
  onNewChat,
  onClose,
}: ConversationListSheetProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <Pressable
        className="flex-1 bg-black/40"
        onPress={onClose}
      >
        <View className="mt-auto h-3/4 rounded-t-3xl bg-ivory">
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-line px-5 py-4">
            <AppText className="text-lg font-bold text-espresso">Conversations</AppText>
            <View className="flex-row items-center">
              <Pressable
                onPress={() => { onNewChat(); onClose(); }}
                className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-terra-pale"
              >
                <Plus size={18} color={colors.terra.DEFAULT} />
              </Pressable>
              <Pressable onPress={onClose} className="h-8 w-8 items-center justify-center">
                <X size={20} color={colors.stone} />
              </Pressable>
            </View>
          </View>

          {/* Content */}
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={colors.terra.DEFAULT} />
            </View>
          ) : conversations.length === 0 ? (
            <View className="flex-1 items-center justify-center px-8">
              <AppText className="text-center text-ink">No conversations yet. Start chatting with Chef StockPot!</AppText>
            </View>
          ) : (
            <FlatList
              data={conversations}
              keyExtractor={(item) => item.id}
              contentContainerClassName="px-5 pt-2"
              renderItem={({ item }) => {
                const isActive = item.id === activeConversationId;
                return (
                  <Pressable
                    onPress={() => { onSelect(item.id); onClose(); }}
                    className={`mb-2 flex-row items-center rounded-xl px-4 py-3 ${isActive ? 'bg-terra-pale' : 'bg-cream'
                      }`}
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                  >
                    <View className="flex-1">
                      <AppText
                        className={`text-[15px] font-semibold ${isActive ? 'text-terra' : 'text-espresso'
                          }`}
                        numberOfLines={1}
                      >
                        {item.title ?? 'New conversation'}
                      </AppText>
                      <AppText className="mt-0.5 text-xs text-stone">
                        {formatDate(item.updatedAt)}
                      </AppText>
                    </View>
                    <Pressable
                      onPress={() => onDelete(item.id)}
                      hitSlop={8}
                      className="ml-2 p-1"
                    >
                      <Trash2 size={16} color={colors.stone} />
                    </Pressable>
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      </Pressable>
    </Modal>
  );
}
