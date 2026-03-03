---
name: rn-component-pattern
description: React Native component and screen conventions. Use when building UI components, screens, or styling with NativeWind/Tailwind.
---

# React Native Component Pattern

## Styling Rules

**Use NativeWind `className` for everything. Never use `StyleSheet` or inline `style` except for truly dynamic computed values.**

```typescript
// Good: NativeWind classes
<View className="flex-1 px-4 py-2 bg-white">
  <Text className="text-lg font-bold text-navy">Title</Text>
</View>

// Good: Tailwind for fontWeight, letterSpacing, textTransform, opacity
<Text className="font-semibold tracking-tight uppercase opacity-50">Label</Text>

// Good: inline style ONLY for dynamic computed values
<View style={{ backgroundColor: dynamicColor }}>

// Bad: never do this
const styles = StyleSheet.create({ ... });
<Text style={{ fontWeight: 'bold' }}>  // use font-bold instead
```

## Screen structure

```typescript
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SomeIcon } from 'lucide-react-native';
import colors from '../theme/colors';
import ScreenHeader from '../components/ScreenHeader';
import LoadingScreen from '../components/LoadingScreen';
import type { MyStackParamList } from '../navigation/types';

// Sub-components defined above the main export
function ItemCard({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable
      className="mx-4 mb-3 rounded-card border border-border bg-white p-4"
      onPress={onPress}>
      <Text className="text-[15px] font-semibold text-navy">{title}</Text>
    </Pressable>
  );
}

export default function MyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MyStackParamList>>();
  const { data, isLoading } = useMyQuery();

  if (isLoading) return <LoadingScreen color={colors.navy.DEFAULT} />;

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <ScreenHeader title="My Screen" />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* content */}
      </ScrollView>
    </SafeAreaView>
  );
}
```

Key conventions:
- `SafeAreaView` with `edges={['top']}` wraps every screen
- `bg-cream` as the standard background color
- `flex-1` on both SafeAreaView and ScrollView
- `ScreenHeader` component for navigation headers
- `LoadingScreen` for loading states
- Sub-components defined in the same file above the main export
- Sub-components have inline prop interfaces

## Colors

Import from `theme/colors.js`. Semantic names with variants:

```typescript
import colors from '../theme/colors';

colors.navy.DEFAULT     // #16213E - primary dark
colors.navy.pale        // #E8EDF5 - light navy background
colors.orange.DEFAULT   // #FF6B35 - primary accent
colors.orange.pale      // #FFF3ED - light orange background
colors.cream            // #FAFAF7 - screen backgrounds
colors.dark             // #1A1A2E - headings
colors.body             // #4A4A5A - body text
colors.muted            // #8E8E9A - secondary text
colors.border           // #EBEBEF - borders
colors.success.DEFAULT  // #34C759
colors.danger.DEFAULT   // #FF3B30
colors.warning.DEFAULT  // #FFCC00
```

In NativeWind classes: `text-navy`, `bg-cream`, `bg-orange-pale`, `text-muted`, `border-border`

## Icons

Use lucide-react-native. Pass `size` and `color` from theme:

```typescript
import { ChevronLeft, Clock, Heart } from 'lucide-react-native';
<ChevronLeft size={22} color={colors.navy.DEFAULT} />
```

## Shared components

Located in `components/`. Key ones:
- `Button` — variants: `primary`, `outline`, `dark`. Props: `label`, `onPress`, `variant`, `disabled`, `icon`
- `TextInputRow` — text input with icon. Props: `icon`, `value`, `onChangeText`, `placeholder`, `right`
- `ScreenHeader` — back button + title. Props: `title`, `subtitle`, `onBack`, `rightAction`, `onSave`, `centerTitle`
- `EmptyState` — icon + message + action button
- `LoadingScreen` — full-screen spinner
- `ErrorState` — error message with retry
- `SectionHeader` — section label with optional badge
- `Divider` — horizontal line with "OR" text
- `InfoBanner` — informational message banner

## Common NativeWind patterns

```
// Spacing
px-5 py-3 mx-4 mb-3 gap-2.5

// Typography
text-[26px] font-extrabold tracking-[-0.5px] text-navy  // page titles
text-[18px] font-bold text-navy                          // section headers
text-[15px] font-semibold text-navy                      // card titles
text-sm text-muted                                       // secondary text

// Cards
mx-4 mb-3 rounded-card border border-border bg-white p-4

// Buttons/Pressables
flex-row items-center justify-center rounded-button bg-orange py-3.5

// Layout
flex-1 flex-row items-center justify-between
```

## Navigation types

Defined in `navigation/types.ts`. Each stack has a `ParamList` type:

```typescript
export type PantryStackParamList = {
  PantryList: undefined;                    // no params
  EditItem: { item: PantryItem };           // required params
  ManualEntry: { displayName?: string } | undefined;  // optional params
};
```
