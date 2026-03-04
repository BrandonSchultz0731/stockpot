import { useCallback, useEffect, useRef } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  type SharedValue,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { House, LayoutGrid, CookingPot, ChefHat, User } from 'lucide-react-native';
import colors from '../theme/colors';

const TAB_CONFIG: Record<string, { icon: typeof House; label: string }> = {
  Home: { icon: House, label: 'Home' },
  PantryStack: { icon: LayoutGrid, label: 'Pantry' },
  MealsStack: { icon: CookingPot, label: 'Plan' },
  AIChefStack: { icon: ChefHat, label: 'Chef' },
  ProfileStack: { icon: User, label: 'You' },
};

const SPRING_CONFIG = { damping: 18, stiffness: 200, mass: 0.8 };

interface TabLayout {
  x: number;
  width: number;
}

function AnimatedTab({
  index,
  focusedIndex,
  config,
  onPress,
  onLayout,
}: {
  index: number;
  focusedIndex: SharedValue<number>;
  config: { icon: typeof House; label: string };
  onPress: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
}) {
  const Icon = config.icon;

  // We can't directly animate Lucide icon color with reanimated, so we
  // crossfade between a white and stone icon based on focus progress.
  const activeOpacity = useAnimatedStyle(() => {
    const progress = 1 - Math.min(Math.abs(focusedIndex.value - index), 1);
    return { opacity: progress };
  });

  const inactiveOpacity = useAnimatedStyle(() => {
    const progress = 1 - Math.min(Math.abs(focusedIndex.value - index), 1);
    return { opacity: 1 - progress };
  });

  const textStyle = useAnimatedStyle(() => {
    const progress = 1 - Math.min(Math.abs(focusedIndex.value - index), 1);
    return {
      color: interpolateColor(progress, [0, 1], [colors.stone, '#FFFFFF']),
    };
  });

  return (
    <Pressable
      onPress={onPress}
      onLayout={onLayout}
      className="items-center gap-[1px] rounded-[22px] py-2 px-3.5"
    >
      <View className="h-5 w-5 items-center justify-center">
        <Animated.View className="absolute" style={inactiveOpacity}>
          <Icon size={20} color={colors.stone} />
        </Animated.View>
        <Animated.View style={activeOpacity}>
          <Icon size={20} color="#FFFFFF" />
        </Animated.View>
      </View>
      <Animated.Text
        className="text-[9px] font-semibold tracking-[0.3px]"
        style={textStyle}
      >
        {config.label}
      </Animated.Text>
    </Pressable>
  );
}

export default function FloatingTabBar({
  state,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 12);

  // Animated shared values for the sliding pill
  const pillX = useSharedValue(0);
  const pillWidth = useSharedValue(0);
  const focusedIndex = useSharedValue(state.index);
  const tabLayouts = useRef<TabLayout[]>([]);

  // Sync pill with navigation state (handles programmatic navigation & swipe-back)
  useEffect(() => {
    const layout = tabLayouts.current[state.index];
    if (layout) {
      const extraPad = 4;
      pillX.value = withSpring(layout.x - extraPad, SPRING_CONFIG);
      pillWidth.value = withSpring(layout.width + extraPad * 2, SPRING_CONFIG);
      focusedIndex.value = withSpring(state.index, SPRING_CONFIG);
    }
  }, [state.index, pillX, pillWidth, focusedIndex]);

  const updatePill = useCallback((idx: number) => {
    const layout = tabLayouts.current[idx];
    if (!layout) return;
    const extraPad = 4;
    pillX.value = withSpring(layout.x - extraPad, SPRING_CONFIG);
    pillWidth.value = withSpring(layout.width + extraPad * 2, SPRING_CONFIG);
    focusedIndex.value = withSpring(idx, SPRING_CONFIG);
  }, [pillX, pillWidth, focusedIndex]);

  const handleLayout = useCallback((index: number, e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    tabLayouts.current[index] = { x, width };
    if (index === state.index) {
      const extraPad = 4;
      if (pillWidth.value === 0) {
        pillX.value = x - extraPad;
        pillWidth.value = width + extraPad * 2;
        focusedIndex.value = state.index;
      }
    }
  }, [state.index, pillX, pillWidth, focusedIndex]);

  const pillStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    top: 6,
    bottom: 6,
    left: pillX.value,
    width: pillWidth.value,
    borderRadius: 22,
    backgroundColor: colors.terra.DEFAULT,
  }));

  // Hide tab bar on any non-root screen within a stack.
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
          <Animated.View style={pillStyle} />

          {state.routes.map((route, index) => {
            const config = TAB_CONFIG[route.name];
            if (!config) return null;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (state.index !== index && !event.defaultPrevented) {
                updatePill(index);
                navigation.navigate(route.name);
              }
            };

            return (
              <AnimatedTab
                key={route.key}
                index={index}
                focusedIndex={focusedIndex}
                config={config}
                onPress={onPress}
                onLayout={(e) => handleLayout(index, e)}
              />
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}
