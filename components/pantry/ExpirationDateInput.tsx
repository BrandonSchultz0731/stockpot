import { useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
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
          className="flex-row items-center bg-white rounded-input border border-border px-3.5 py-3 gap-2.5">
          <Calendar size={18} color={colors.muted} />
          <Text
            className={`text-[14px] ${date ? 'text-dark' : 'text-muted'}`}>
            {date ? formatDate(date) : 'Expiration date (optional)'}
          </Text>
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
        className="flex-row items-center bg-white rounded-input border border-border px-3.5 py-3 gap-2.5">
        <Calendar size={18} color={colors.muted} />
        <Text
          className={`text-[14px] ${date ? 'text-dark' : 'text-muted'}`}>
          {date ? formatDate(date) : 'Expiration date (optional)'}
        </Text>
      </Pressable>

      <Modal visible={showPicker} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable
            style={{ flex: 1 }}
            onPress={() => setShowPicker(false)}
          />
          <View
            style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              paddingBottom: 34,
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}>
              <Pressable onPress={handleClear}>
                <Text
                  style={{ fontSize: 14, color: colors.muted, fontWeight: '600' }}>
                  Clear
                </Text>
              </Pressable>
              <Text
                style={{ fontSize: 16, color: colors.navy.DEFAULT, fontWeight: '700' }}>
                Expiration Date
              </Text>
              <Pressable onPress={handleConfirm}>
                <Text
                  style={{ fontSize: 14, color: colors.orange.DEFAULT, fontWeight: '600' }}>
                  Done
                </Text>
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
              style={{ height: 216 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
