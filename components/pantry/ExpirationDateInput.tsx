import { useState } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';
import AppText from '../AppText';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import colors from '../../theme/colors';

interface ExpirationDateInputProps {
  date: Date | null;
  onChange: (date: Date | null) => void;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ExpirationDateInput({
  date,
  onChange,
}: ExpirationDateInputProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(date ?? new Date());

  const handleOpen = () => {
    setTempDate(date ?? new Date());
    setShowPicker(true);
  };

  const handleConfirm = () => {
    onChange(tempDate);
    setShowPicker(false);
  };

  const handleClear = () => {
    onChange(null);
    setShowPicker(false);
  };

  const handleAndroidChange = (_event: unknown, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  if (Platform.OS === 'android') {
    return (
      <View>
        <Pressable
          onPress={() => setShowPicker(true)}
          className="flex-row items-center bg-white rounded-input border border-line px-3.5 py-3 gap-2.5">
          <Calendar size={18} color={colors.stone} />
          <AppText
            className={`text-[14px] ${date ? 'text-espresso' : 'text-stone'}`}>
            {date ? formatDate(date) : 'Expiration date (optional)'}
          </AppText>
        </Pressable>

        {showPicker && (
          <DateTimePicker
            value={date ?? new Date()}
            mode="date"
            onChange={handleAndroidChange}
            minimumDate={new Date()}
          />
        )}
      </View>
    );
  }

  return (
    <View>
      <Pressable
        onPress={handleOpen}
        className="flex-row items-center bg-white rounded-input border border-line px-3.5 py-3 gap-2.5">
        <Calendar size={18} color={colors.stone} />
        <AppText
          className={`text-[14px] ${date ? 'text-espresso' : 'text-stone'}`}>
          {date ? formatDate(date) : 'Expiration date (optional)'}
        </AppText>
      </Pressable>

      <Modal visible={showPicker} transparent animationType="fade">
        <View className="flex-1 justify-end">
          <Pressable
            className="flex-1"
            onPress={() => setShowPicker(false)}
          />
          <View className="bg-white rounded-t-2xl pb-[34px]">
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-line">
              <Pressable onPress={handleClear}>
                <AppText className="text-[14px] text-stone font-semibold">
                  Clear
                </AppText>
              </Pressable>
              <AppText className="text-[16px] text-espresso font-bold">
                Expiration Date
              </AppText>
              <Pressable onPress={handleConfirm}>
                <AppText className="text-[14px] text-terra font-semibold">
                  Done
                </AppText>
              </Pressable>
            </View>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              themeVariant="light"
              onChange={(_event, selected) => {
                if (selected) setTempDate(selected);
              }}
              minimumDate={new Date()}
              className="h-[216px]"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
