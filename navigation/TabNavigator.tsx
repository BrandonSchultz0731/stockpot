import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { House, LayoutGrid, CookingPot, Zap, User } from 'lucide-react-native';
import HomeStackNavigator from './HomeStackNavigator';
import PantryStackNavigator from './PantryStackNavigator';
import MealsStackNavigator from './MealsStackNavigator';
import AIChefScreen from '../screens/AIChefScreen';
import ProfileScreen from '../screens/ProfileScreen';
import colors from '../theme/colors';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.orange.DEFAULT,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: 8,
          paddingBottom: 20,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarIcon: ({ color }) => <House size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="PantryStack"
        component={PantryStackNavigator}
        options={{
          title: 'Pantry',
          tabBarIcon: ({ color }) => <LayoutGrid size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="MealsStack"
        component={MealsStackNavigator}
        options={{
          title: 'Meals',
          tabBarIcon: ({ color }) => <CookingPot size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="AIChef"
        component={AIChefScreen}
        options={{
          title: 'AI Chef',
          tabBarIcon: ({ color }) => <Zap size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <User size={22} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
