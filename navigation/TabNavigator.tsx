import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { House, LayoutGrid, CookingPot, Zap, User } from 'lucide-react-native';
import HomeScreen from '../screens/HomeScreen';
import PantryScreen from '../screens/PantryScreen';
import MealsScreen from '../screens/MealsScreen';
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
        tabBarLabel: ({ focused, color, children }) => (
          <Text style={{ color, fontSize: 10, fontWeight: focused ? '700' : '500' }}>
            {children}
          </Text>
        ),
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
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <House size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Pantry"
        component={PantryScreen}
        options={{
          tabBarIcon: ({ color }) => <LayoutGrid size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Meals"
        component={MealsScreen}
        options={{
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
