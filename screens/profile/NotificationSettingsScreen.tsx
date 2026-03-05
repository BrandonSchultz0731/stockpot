import { useState } from 'react';
import { ScrollView, Switch, View, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import ScreenHeader from '../../components/ScreenHeader';
import AppText from '../../components/AppText';
import LoadingScreen from '../../components/LoadingScreen';
import { useUserProfileQuery } from '../../hooks/useUserProfileQuery';
import { useUpdateNotificationPrefsMutation } from '../../hooks/useUpdateNotificationPrefsMutation';
import colors from '../../theme/colors';
import type { ProfileStackParamList } from '../../navigation/types';
import type { NotificationPrefs } from '../../shared/enums';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'NotificationSettings'>;

function timeStringToDate(time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function dateToTimeString(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function formatTimeDisplay(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function NotificationSettingsForm({ initial }: { initial: NotificationPrefs }) {
  const navigation = useNavigation<Nav>();
  const mutation = useUpdateNotificationPrefsMutation();

  const [expiringItems, setExpiringItems] = useState(initial.expiringItems);
  const [mealReminders, setMealReminders] = useState(initial.mealReminders);
  const [mealPlanNudge, setMealPlanNudge] = useState(initial.mealPlanNudge);
  const [mealReminderTime, setMealReminderTime] = useState(initial.mealReminderTime);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleSave = () => {
    mutation.mutate(
      { expiringItems, mealReminders, mealPlanNudge, mealReminderTime },
      { onSuccess: () => navigation.goBack() },
    );
  };

  const handleTimeChange = (_: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedDate) {
      setMealReminderTime(dateToTimeString(selectedDate));
    }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-ivory">
      <ScreenHeader
        title="Notifications"
        centerTitle
        onSave={handleSave}
        isSaving={mutation.isPending}
      />
      <ScrollView contentContainerClassName="px-5 pb-28">
        <AppText font="serif" className="text-[16px] text-espresso mt-6 mb-4">
          Alert Types
        </AppText>

        {/* Expiring Items */}
        <View className="flex-row items-center justify-between py-4 border-b border-line">
          <View className="flex-1 mr-4">
            <AppText font="sansSemiBold" className="text-[14px] text-espresso">
              Expiring Items
            </AppText>
            <AppText className="text-[12px] text-stone mt-0.5">
              Daily alert when pantry items expire tomorrow
            </AppText>
          </View>
          <Switch
            value={expiringItems}
            onValueChange={setExpiringItems}
            trackColor={{ false: colors.dust, true: colors.terra.DEFAULT }}
            thumbColor="white"
          />
        </View>

        {/* Meal Reminders */}
        <View className="flex-row items-center justify-between py-4 border-b border-line">
          <View className="flex-1 mr-4">
            <AppText font="sansSemiBold" className="text-[14px] text-espresso">
              Dinner Reminders
            </AppText>
            <AppText className="text-[12px] text-stone mt-0.5">
              Daily reminder of tonight's planned dinner
            </AppText>
          </View>
          <Switch
            value={mealReminders}
            onValueChange={setMealReminders}
            trackColor={{ false: colors.dust, true: colors.terra.DEFAULT }}
            thumbColor="white"
          />
        </View>

        {/* Reminder Time */}
        {mealReminders && (
          <View className="py-4 border-b border-line">
            <View className="flex-row items-center justify-between">
              <AppText font="sansSemiBold" className="text-[14px] text-espresso">
                Reminder Time
              </AppText>
              <Pressable
                onPress={() => setShowTimePicker(!showTimePicker)}
                className="bg-terra-pale py-1.5 px-3 rounded-lg"
              >
                <AppText font="sansSemiBold" className="text-[13px] text-terra">
                  {formatTimeDisplay(mealReminderTime)}
                </AppText>
              </Pressable>
            </View>
            {showTimePicker && (
              <DateTimePicker
                value={timeStringToDate(mealReminderTime)}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
                minuteInterval={15}
                themeVariant="light"
                accentColor={colors.terra.DEFAULT}
              />
            )}
          </View>
        )}

        {/* Meal Plan Nudge */}
        <View className="flex-row items-center justify-between py-4 border-b border-line">
          <View className="flex-1 mr-4">
            <AppText font="sansSemiBold" className="text-[14px] text-espresso">
              Weekly Meal Plan Nudge
            </AppText>
            <AppText className="text-[12px] text-stone mt-0.5">
              Saturday reminder to create next week's plan
            </AppText>
          </View>
          <Switch
            value={mealPlanNudge}
            onValueChange={setMealPlanNudge}
            trackColor={{ false: colors.dust, true: colors.terra.DEFAULT }}
            thumbColor="white"
          />
        </View>

        {mutation.isError && (
          <AppText className="text-sm text-berry mt-3 text-center">
            Something went wrong. Please try again.
          </AppText>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function NotificationSettingsScreen() {
  const { data: profile, isLoading } = useUserProfileQuery();

  if (isLoading || !profile) {
    return <LoadingScreen color={colors.espresso} />;
  }

  return <NotificationSettingsForm initial={profile.notificationPrefs} />;
}
