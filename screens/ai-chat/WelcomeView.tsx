import { View, Pressable, ScrollView } from 'react-native';
import AppText from '../../components/AppText';
import { ChefHat } from 'lucide-react-native';
import colors from '../../theme/colors';
import { fonts } from '../../theme/typography';

const SUGGESTIONS: { text: string; bg: string }[] = [
  { text: 'What can I cook tonight?', bg: 'bg-terra-pale' },
  { text: "What's expiring soon?", bg: 'bg-sage-pale' },
  { text: 'Suggest a quick weeknight dinner', bg: 'bg-honey-pale' },
  { text: 'What meals do I have planned this week?', bg: 'bg-terra-pale' },
];

interface WelcomeViewProps {
  onSuggestionPress: (text: string) => void;
}

export default function WelcomeView({ onSuggestionPress }: WelcomeViewProps) {
  return (
    <ScrollView
      contentContainerClassName="flex-1 items-center justify-center p-6"
    >
      <View className="mb-5 h-16 w-16 items-center justify-center rounded-full bg-terra-pale">
        <ChefHat size={32} color={colors.terra.DEFAULT} />
      </View>
      <AppText
        className="mb-2 text-center text-xl text-espresso"
        style={{ fontFamily: fonts.serif }}
      >
        Hi, I'm Chef Pixel
      </AppText>
      <AppText className="mb-8 text-center text-[15px] text-ink">
        Ask me anything about cooking, your pantry, meal ideas, or what to do with ingredients
        you have on hand.
      </AppText>
      <View className="w-full">
        {SUGGESTIONS.map((suggestion) => (
          <Pressable
            key={suggestion.text}
            onPress={() => onSuggestionPress(suggestion.text)}
            className={`mb-2 rounded-2xl px-4 py-3 ${suggestion.bg}`}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            accessibilityRole="button"
            accessibilityLabel={suggestion.text}
          >
            <AppText className="text-[15px] text-espresso">{suggestion.text}</AppText>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
