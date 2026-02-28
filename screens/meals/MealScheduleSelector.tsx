import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Check, X } from 'lucide-react-native';
import clsx from 'clsx';
import colors from '../../theme/colors';
import { MealType, DAY_LABELS } from '../../shared/enums';
import type { MealScheduleSlot } from '../../shared/enums';
import { getWeekStartDateForDay, orderedDaysFrom } from '../../utils/dayOfWeek';
import Button from '../../components/Button';

const MEAL_TYPES = [MealType.Breakfast, MealType.Lunch, MealType.Dinner] as const;

const SHORT_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function makeKey(day: number, type: MealType) {
  return `${day}-${type}`;
}

function allKeys(): Set<string> {
  const keys = new Set<string>();
  for (let d = 0; d < 7; d++) {
    for (const t of MEAL_TYPES) {
      keys.add(makeKey(d, t));
    }
  }
  return keys;
}

// Presets use absolute day-of-week values (calendar-based)
// Weekdays = Mon(1)–Fri(5), Weekends = Sun(0)+Sat(6)
interface Preset {
  label: string;
  keys: Set<string>;
}

const PRESETS: Preset[] = [
  { label: 'All Meals', keys: allKeys() },
  {
    label: 'Dinners Only',
    keys: new Set(Array.from({ length: 7 }, (_, d) => makeKey(d, MealType.Dinner))),
  },
  {
    label: 'Weekdays',
    keys: (() => {
      const k = new Set<string>();
      for (let d = 1; d <= 5; d++) {
        for (const t of MEAL_TYPES) k.add(makeKey(d, t));
      }
      return k;
    })(),
  },
  {
    label: 'Weekends',
    keys: (() => {
      const k = new Set<string>();
      for (const d of [0, 6]) {
        for (const t of MEAL_TYPES) k.add(makeKey(d, t));
      }
      return k;
    })(),
  },
];

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) {
    if (!b.has(v)) return false;
  }
  return true;
}

export interface MealScheduleSelectorProps {
  visible: boolean;
  onClose: () => void;
  onGenerate: (schedule: MealScheduleSlot[], weekStartDate: string) => void;
}

export default function MealScheduleSelector({
  visible,
  onClose,
  onGenerate,
}: MealScheduleSelectorProps) {
  const [selected, setSelected] = useState<Set<string>>(allKeys);
  const [startDay, setStartDay] = useState(1); // default Monday

  const orderedDays = orderedDaysFrom(startDay);
  const count = selected.size;

  const toggleCell = useCallback((key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const toggleRow = useCallback((day: number) => {
    setSelected((prev) => {
      const rowKeys = MEAL_TYPES.map((t) => makeKey(day, t));
      const allSelected = rowKeys.every((k) => prev.has(k));
      const next = new Set(prev);
      for (const k of rowKeys) {
        if (allSelected) {
          next.delete(k);
        } else {
          next.add(k);
        }
      }
      return next;
    });
  }, []);

  const toggleColumn = useCallback((type: MealType) => {
    setSelected((prev) => {
      const colKeys = Array.from({ length: 7 }, (_, d) => makeKey(d, type));
      const allSelected = colKeys.every((k) => prev.has(k));
      const next = new Set(prev);
      for (const k of colKeys) {
        if (allSelected) {
          next.delete(k);
        } else {
          next.add(k);
        }
      }
      return next;
    });
  }, []);

  const applyPreset = useCallback((preset: Preset) => {
    setSelected(new Set(preset.keys));
  }, []);

  const handleGenerate = useCallback(() => {
    const schedule: MealScheduleSlot[] = [];
    for (const d of orderedDays) {
      for (const t of MEAL_TYPES) {
        if (selected.has(makeKey(d, t))) {
          schedule.push({ dayOfWeek: d, mealType: t });
        }
      }
    }
    const weekStartDate = getWeekStartDateForDay(startDay);
    onGenerate(schedule, weekStartDate);
  }, [selected, orderedDays, startDay, onGenerate]);

  // Reset when modal opens
  useEffect(() => {
    if (visible) {
      setSelected(allKeys());
      setStartDay(1);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      {/* Backdrop */}
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />

      {/* Sheet */}
      <View className="rounded-t-2xl bg-white px-5 pb-8 pt-3">
        {/* Handle bar */}
        <View className="mb-3 items-center">
          <View className="h-1 w-10 rounded-full bg-border" />
        </View>

        {/* Header */}
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-[20px] font-bold text-dark">Plan Your Week</Text>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            className="h-8 w-8 items-center justify-center rounded-full bg-cream"
          >
            <X size={16} color={colors.muted} />
          </Pressable>
        </View>

        {/* Start day picker */}
        <View className="mb-4">
          <Text className="mb-2 text-[13px] font-semibold text-muted">
            Starts on
          </Text>
          <View className="flex-row justify-between">
            {Array.from({ length: 7 }, (_, i) => {
              const active = startDay === i;
              return (
                <Pressable
                  key={i}
                  onPress={() => setStartDay(i)}
                  className={clsx(
                    'h-9 w-9 items-center justify-center rounded-full',
                    active ? 'bg-navy' : 'border border-border bg-white',
                  )}
                >
                  <Text
                    className={clsx(
                      'text-[13px] font-semibold',
                      active ? 'text-white' : 'text-dark',
                    )}
                  >
                    {DAY_LABELS[i]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Preset pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
          contentContainerClassName="gap-2"
        >
          {PRESETS.map((preset) => {
            const active = setsEqual(selected, preset.keys);
            return (
              <Pressable
                key={preset.label}
                onPress={() => applyPreset(preset)}
                className={clsx(
                  'rounded-full px-4 py-2',
                  active ? 'bg-navy' : 'border border-border bg-white',
                )}
              >
                <Text
                  className={clsx(
                    'text-[13px] font-semibold',
                    active ? 'text-white' : 'text-dark',
                  )}
                >
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Grid */}
        <View>
          {/* Column headers */}
          <View className="mb-2 flex-row">
            {/* Empty space for row label column */}
            <View className="w-12" />
            {MEAL_TYPES.map((type) => {
              const colKeys = Array.from({ length: 7 }, (_, d) => makeKey(d, type));
              const allSelected = colKeys.every((k) => selected.has(k));
              return (
                <Pressable
                  key={type}
                  onPress={() => toggleColumn(type)}
                  className="flex-1 items-center"
                >
                  <Text
                    className={clsx(
                      'text-[11px] font-bold uppercase tracking-[0.5px]',
                      allSelected ? 'text-orange' : 'text-muted',
                    )}
                  >
                    {type}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Rows — ordered by start day */}
          {orderedDays.map((dayIndex) => {
            const rowKeys = MEAL_TYPES.map((t) => makeKey(dayIndex, t));
            const allRowSelected = rowKeys.every((k) => selected.has(k));
            return (
              <View key={dayIndex} className="mb-2 flex-row items-center">
                <Pressable onPress={() => toggleRow(dayIndex)} className="w-12">
                  <Text
                    className={clsx(
                      'text-[13px] font-semibold',
                      allRowSelected ? 'text-orange' : 'text-muted',
                    )}
                  >
                    {SHORT_DAY_NAMES[dayIndex]}
                  </Text>
                </Pressable>
                {MEAL_TYPES.map((type) => {
                  const key = makeKey(dayIndex, type);
                  const isSelected = selected.has(key);
                  return (
                    <Pressable
                      key={key}
                      onPress={() => toggleCell(key)}
                      className={clsx(
                        'mx-1.5 flex-1 items-center justify-center rounded-xl py-3',
                        isSelected
                          ? 'bg-orange'
                          : 'border border-border bg-cream',
                      )}
                    >
                      {isSelected && <Check size={16} color="#fff" />}
                    </Pressable>
                  );
                })}
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <View className="mt-4">
          <Button
            label={count > 0 ? `Generate ${count} Meals` : 'Select Meals'}
            onPress={handleGenerate}
            disabled={count === 0}
          />
        </View>
      </View>
    </Modal>
  );
}
