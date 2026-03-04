import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeStackNavigator from './HomeStackNavigator';
import PantryStackNavigator from './PantryStackNavigator';
import MealsStackNavigator from './MealsStackNavigator';
import AIChefStackNavigator from './AIChefStackNavigator';
import ProfileStackNavigator from './ProfileStackNavigator';
import FloatingTabBar from '../components/FloatingTabBar';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        lazy: false,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{ popToTopOnBlur: true }}
      />
      <Tab.Screen
        name="PantryStack"
        component={PantryStackNavigator}
        options={{ popToTopOnBlur: true, title: 'Pantry' }}
      />
      <Tab.Screen
        name="MealsStack"
        component={MealsStackNavigator}
        options={{ popToTopOnBlur: true, title: 'Plan' }}
      />
      <Tab.Screen
        name="AIChefStack"
        component={AIChefStackNavigator}
        options={{ popToTopOnBlur: true, title: 'Chef' }}
      />
      <Tab.Screen
        name="ProfileStack"
        component={ProfileStackNavigator}
        options={{ popToTopOnBlur: true, title: 'You' }}
      />
    </Tab.Navigator>
  );
}
