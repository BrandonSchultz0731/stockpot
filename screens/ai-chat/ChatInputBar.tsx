import { useState } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Send } from 'lucide-react-native';
import colors from '../../theme/colors';

interface ChatInputBarProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function ChatInputBar({ onSend, disabled }: ChatInputBarProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text);
    setText('');
  };

  return (
    <View className="flex-row items-end border-t border-border bg-white px-4 pb-2 pt-2">
      <TextInput
        className="mr-2 max-h-[100px] min-h-[40px] flex-1 rounded-2xl bg-cream px-4 py-2.5 text-[15px] text-navy"
        placeholder="Ask Chef StockPot..."
        placeholderTextColor={colors.muted}
        value={text}
        onChangeText={setText}
        multiline
        editable={!disabled}
        submitBehavior="newline"
      />
      <Pressable
        onPress={handleSend}
        disabled={disabled || !text.trim()}
        className="mb-0.5 h-10 w-10 items-center justify-center rounded-full"
        style={{
          backgroundColor:
            disabled || !text.trim() ? colors.border : colors.orange.DEFAULT,
        }}
      >
        <Send size={18} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
