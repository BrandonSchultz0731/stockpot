import { Pressable, View } from 'react-native';
import AppText from './AppText';
import { BlurView } from '@react-native-community/blur';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { House, LayoutGrid, CookingPot, ChefHat, User } from 'lucide-react-native';
import colors from '../theme/colors';

const TAB_CONFIG: Record<string, { icon: typeof House; label: string }> = {
  Home: { icon: House, label: 'Home' },
  PantryStack: { icon: LayoutGrid, label: 'Pantry' },
  MealsStack: { icon: CookingPot, label: 'Plan' },
  AIChefStack: { icon: ChefHat, label: 'Chef' },
  ProfileStack: { icon: User, label: 'You' },
};

export default function FloatingTabBar({
  state,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 12);

  // Hide tab bar on any non-root screen within a stack.
  // Each tab renders a stack navigator — when the stack has navigated
  // past its initial screen (index > 0), hide the tab bar automatically.
  const activeRoute = state.routes[state.index];
  const nestedState = activeRoute.state;
  if (nestedState && typeof nestedState.index === 'number' && nestedState.index > 0) {
    return null;
  }

  return (
    <View
      className="absolute left-5 right-5 rounded-[28px] overflow-hidden"
      style={{
        bottom,
        shadowColor: '#1C1512',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 24,
        elevation: 8,
      }}
    >
      <BlurView
        blurType="light"
        blurAmount={20}
        className="rounded-[28px]"
      >
        <View className="flex-row items-center justify-around bg-white/85 py-1.5 px-2 rounded-[28px] border border-line-light">
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const config = TAB_CONFIG[route.name];
            if (!config) return null;
            const Icon = config.icon;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                className={`items-center gap-[1px] rounded-[22px] py-2 ${isFocused ? 'bg-terra px-[18px]' : 'px-3.5'}`}
              >
                <Icon
                  size={20}
                  color={isFocused ? '#FFFFFF' : colors.stone}
                />
                <AppText
                  className={`text-[9px] font-semibold tracking-[0.3px] ${isFocused ? 'text-white' : 'text-stone'}`}
                >
                  {config.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}
