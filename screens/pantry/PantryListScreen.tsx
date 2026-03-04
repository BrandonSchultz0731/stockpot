import { useState, useCallback, useMemo } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Plus, Search, Package } from 'lucide-react-native';
import EmptyState from '../../components/EmptyState';
import LoadingScreen from '../../components/LoadingScreen';
import TextInputRow from '../../components/TextInputRow';
import AppText from '../../components/AppText';
import { usePantryQuery, type PantryItem } from '../../hooks/usePantryQuery';
import { daysUntilExpiry } from '../../utils/expiry';
import { StorageLocation } from '../../shared/enums';
import colors from '../../theme/colors';
import { cardShadow } from '../../theme/shadows';
import type { PantryStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<PantryStackParamList, 'PantryList'>;

const STORAGE_FILTERS: Array<{ label: string; value: string | null }> = [
  { label: 'All', value: null },
  { label: 'Fridge', value: StorageLocation.Fridge },
  { label: 'Freezer', value: StorageLocation.Freezer },
  { label: 'Pantry', value: StorageLocation.Pantry },
];

function PantryRow({
  item,
  onPress,
  showBorder,
}: {
  item: PantryItem;
  onPress: () => void;
  showBorder: boolean;
}) {
  const emoji = item.foodCache?.emoji;
  const initial = item.displayName[0].toUpperCase();
  const days = daysUntilExpiry(item.expirationDate);
  const showExpiry = days !== null && days <= 3;

  let expiryLabel = '';
  let expiryBg = colors.honey.pale;
  let expiryFg = colors.honey.DEFAULT;
  if (showExpiry) {
    if (days <= 1) {
      expiryLabel = 'Tomorrow';
      expiryBg = colors.berry.pale;
      expiryFg = colors.berry.DEFAULT;
    } else {
      expiryLabel = `${days}d left`;
    }
  }

  const subtitle = [
    `${item.quantity} ${item.unit}`,
    item.storageLocation,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3.5 py-3.5 ${showBorder ? 'border-b border-line' : ''}`}
    >
      {/* Emoji / initial circle */}
      <View className="items-center justify-center bg-cream w-[46px] h-[46px] rounded-[14px] shrink-0">
        {emoji ? (
          <Text className="text-[24px]">{emoji}</Text>
        ) : (
          <AppText font="sansBold" className="text-[16px] text-stone">
            {initial}
          </AppText>
        )}
      </View>

      {/* Name + subtitle */}
      <View className="flex-1">
        <AppText
          font="sansSemiBold"
          className="text-[15px] text-espresso"
          numberOfLines={1}
        >
          {item.displayName}
        </AppText>
        <AppText className="mt-0.5 text-[12px] text-stone">
          {subtitle}
        </AppText>
      </View>

      {/* Expiry badge (only ≤3 days) */}
      {showExpiry && (
        <View
          className="py-[3px] px-2 rounded-lg"
          style={{ backgroundColor: expiryBg }}
        >
          <Text
            className="text-[10px] font-bold"
            style={{ color: expiryFg }}
          >
            {expiryLabel}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export default function PantryListScreen() {
  const navigation = useNavigation<Nav>();
  const { data: items, isLoading, refetch, isRefetching } = usePantryQuery();
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!items) return [];
    let result = items;

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(item =>
        item.displayName.toLowerCase().includes(q),
      );
    }

    // Storage location filter
    if (selectedFilter) {
      result = result.filter(
        item => item.storageLocation === selectedFilter,
      );
    }

    return result;
  }, [items, search, selectedFilter]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setSelectedFilter(null);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: PantryItem; index: number }) => (
      <PantryRow
        item={item}
        showBorder={index < filtered.length - 1}
        onPress={() => navigation.navigate('EditItem', { item })}
      />
    ),
    [navigation, filtered.length],
  );

  if (isLoading) {
    return <LoadingScreen color={colors.terra.DEFAULT} />;
  }

  const hasItems = (items?.length ?? 0) > 0;
  const showNoMatchEmpty = hasItems && filtered.length === 0;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-ivory">
      {/* Header */}
      <View className="px-6 pt-4">
        <View className="flex-row items-center justify-between">
          <AppText font="serifHeavy" className="text-[28px] tracking-[-0.3px] text-espresso">
            My Pantry
          </AppText>
          <Pressable
            onPress={() => navigation.navigate('AddItemPicker')}
            className="items-center justify-center bg-terra w-10 h-10 rounded-[20px]"
            style={{
              shadowColor: '#C25B2E',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <Plus size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Search */}
        <View className="mt-4">
          <View className="bg-white rounded-[16px]" style={cardShadow}>
            <TextInputRow
              icon={Search}
              placeholder="Search pantry..."
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Storage location filters */}
        <View className="flex-row gap-2 mt-3.5 mb-2">
          {STORAGE_FILTERS.map(f => {
            const isActive = selectedFilter === f.value;
            return (
              <Pressable
                key={f.label}
                onPress={() => setSelectedFilter(f.value)}
                className={`items-center justify-center py-2 px-4 rounded-full ${isActive ? 'bg-espresso' : 'bg-white'}`}
                style={!isActive ? cardShadow : undefined}
              >
                <AppText
                  font="sansSemiBold"
                  className={`text-[13px] ${isActive ? 'text-white' : 'text-stone'}`}
                >
                  {f.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Items list — divider style */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerClassName="px-6 pt-2 pb-28"
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.terra.DEFAULT}
          />
        }
        ListEmptyComponent={
          showNoMatchEmpty ? (
            <EmptyState
              icon={<Search size={48} color={colors.stone} />}
              title="No matching items"
              actionLabel="Clear filters"
              onAction={clearFilters}
            />
          ) : (
            <EmptyState
              icon={<Package size={48} color={colors.stone} />}
              title="Your pantry is empty"
              description="Tap the + button to start adding items to your pantry."
            />
          )
        }
      />
    </SafeAreaView>
  );
}
