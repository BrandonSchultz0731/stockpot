import { View, Text, Pressable, ScrollView } from 'react-native';
import { ChefHat } from 'lucide-react-native';
import colors from '../../theme/colors';

const SUGGESTIONS = [
  'What can I cook tonight?',
  "What's expiring soon?",
  'Suggest a quick weeknight dinner',
  'What meals do I have planned this week?',
];

interface WelcomeViewProps {
  onSuggestionPress: (text: string) => void;
}

export default function WelcomeView({ onSuggestionPress }: WelcomeViewProps) {
  return (
    <ScrollView
      contentContainerClassName="flex-1 items-center justify-center p-6"
    >
      <View className="mb-5 h-16 w-16 items-center justify-center rounded-full bg-orange-pale">
        <ChefHat size={32} color={colors.orange.DEFAULT} />
      </View>
      <Text className="mb-2 text-center text-xl font-bold text-navy">
        Hi, I'm Chef StockPot
      </Text>
      <Text className="mb-8 text-center text-[15px] text-body">
        Ask me anything about cooking, your pantry, meal ideas, or what to do with ingredients
        you have on hand.
      </Text>
      <View className="w-full">
        {SUGGESTIONS.map((suggestion) => (
          <Pressable
            key={suggestion}
            onPress={() => onSuggestionPress(suggestion)}
            className="mb-2 rounded-2xl border border-border bg-white px-4 py-3"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text className="text-[15px] text-navy">{suggestion}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
