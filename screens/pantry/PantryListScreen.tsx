import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SectionList,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronRight, MapPin, Plus, Search, Package } from 'lucide-react-native';
import TextInputRow from '../../components/TextInputRow';
import CategoryFilterPills from '../../components/pantry/CategoryFilterPills';
import CategorySectionHeader from '../../components/pantry/CategorySectionHeader';
import { usePantryQuery, type PantryItem } from '../../hooks/usePantryQuery';
import { getExpiryStatus, getExpiryLabel } from '../../utils/expiry';
import { DEFAULT_FOOD_CATEGORY, FOOD_CATEGORIES } from '../../shared/enums';
import colors from '../../theme/colors';
import type { PantryStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<PantryStackParamList, 'PantryList'>;

const EXPIRY_ACCENT: Record<string, string> = {
  expired: colors.danger.DEFAULT,
  soon: colors.warning.icon,
  good: colors.success.DEFAULT,
  none: colors.border,
};

const EXPIRY_PILL: Record<string, { bg: string; fg: string }> = {
  expired: { bg: colors.danger.pale, fg: colors.danger.DEFAULT },
  soon: { bg: colors.warning.pale, fg: colors.warning.text },
  good: { bg: colors.success.pale, fg: colors.success.DEFAULT },
};

function getItemCategory(item: PantryItem): string {
  return item.foodCache?.category ?? DEFAULT_FOOD_CATEGORY;
}

function PantryCard({
  item,
  onPress,
}: {
  item: PantryItem;
  onPress: () => void;
}) {
  const status = getExpiryStatus(item.expirationDate);
  const label = getExpiryLabel(item.expirationDate);
  const pill = EXPIRY_PILL[status];
  const accent = EXPIRY_ACCENT[status];

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-card border border-border mb-2 flex-row items-stretch overflow-hidden">
      {/* Left accent bar */}
      <View className="w-[3px]" style={{ backgroundColor: accent }} />

      <View className="flex-1 flex-row items-center px-3.5 py-3">
        {/* Left content */}
        <View className="flex-1 mr-3">
          <Text
            className="text-[15px] text-dark font-bold"
            numberOfLines={1}>
            {item.displayName}
          </Text>
          <View className="flex-row items-center mt-1">
            <Text className="text-[13px] text-body font-semibold">
              {item.quantity} {item.unit}
            </Text>
            {item.storageLocation && (
              <View className="flex-row items-center ml-2.5 rounded-full bg-navy-pale px-2 py-0.5">
                <MapPin size={9} color={colors.muted} />
                <Text className="text-[11px] text-muted ml-0.5">
                  {item.storageLocation}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Right side: expiry + chevron */}
        <View className="flex-row items-center">
          {pill && label && (
            <View
              className="rounded-full px-2.5 py-1 mr-1.5"
              style={{ backgroundColor: pill.bg }}>
              <Text
                className="text-[11px] font-semibold"
                style={{ color: pill.fg }}>
                {label}
              </Text>
            </View>
          )}
          <ChevronRight size={16} color={colors.border} />
        </View>
      </View>
    </Pressable>
  );
}

export default function PantryListScreen() {
  const navigation = useNavigation<Nav>();
  const { data: items, isLoading, refetch, isRefetching } = usePantryQuery();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Items filtered by search only (drives pills + category counts)
  const searchFiltered = useMemo(() => {
    if (!items) return [];
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(item =>
      item.displayName.toLowerCase().includes(q),
    );
  }, [items, search]);

  // Categories that have items in the search-filtered set, in FOOD_CATEGORIES order
  const availableCategories = useMemo(() => {
    const catSet = new Set(searchFiltered.map(getItemCategory));
    return FOOD_CATEGORIES.filter(c => catSet.has(c));
  }, [searchFiltered]);

  // Per-category counts from search-filtered items
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of searchFiltered) {
      const cat = getItemCategory(item);
      counts.set(cat, (counts.get(cat) ?? 0) + 1);
    }
    return counts;
  }, [searchFiltered]);

  // Items matching both search and selected category
  const filtered = useMemo(() => {
    if (!selectedCategory) return searchFiltered;
    return searchFiltered.filter(
      item => getItemCategory(item) === selectedCategory,
    );
  }, [searchFiltered, selectedCategory]);

  // Sections for SectionList (only used when "All" is selected)
  const sections = useMemo(() => {
    if (selectedCategory) return [];
    const grouped = new Map<string, PantryItem[]>();
    for (const item of searchFiltered) {
      const cat = getItemCategory(item);
      const list = grouped.get(cat);
      if (list) {
        list.push(item);
      } else {
        grouped.set(cat, [item]);
      }
    }
    return FOOD_CATEGORIES.filter(c => grouped.has(c)).map(c => ({
      title: c,
      data: grouped.get(c)!,
    }));
  }, [searchFiltered, selectedCategory]);

  // Auto-reset category when it disappears from available categories
  useEffect(() => {
    if (
      selectedCategory !== null &&
      !availableCategories.includes(selectedCategory)
    ) {
      setSelectedCategory(null);
    }
  }, [availableCategories, selectedCategory]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const renderItem = useCallback(
    ({ item }: { item: PantryItem }) => (
      <PantryCard
        item={item}
        onPress={() => navigation.navigate('EditItem', { item })}
      />
    ),
    [navigation],
  );

  const clearFilters = useCallback(() => {
    setSearch('');
    setSelectedCategory(null);
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView
        edges={['top']}
        className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color={colors.navy.DEFAULT} />
      </SafeAreaView>
    );
  }

  const hasItems = (items?.length ?? 0) > 0;
  const showNoMatchEmpty = hasItems && filtered.length === 0;

  const refreshControl = (
    <RefreshControl
      refreshing={isRefetching}
      onRefresh={handleRefresh}
      tintColor={colors.navy.DEFAULT}
    />
  );

  const emptyComponent = showNoMatchEmpty ? (
    <View className="items-center justify-center pt-20">
      <Search size={48} color={colors.muted} />
      <Text className="text-[17px] text-navy mt-4 mb-2 font-bold">
        No matching items
      </Text>
      <Pressable onPress={clearFilters}>
        <Text className="text-[14px] text-orange font-semibold">
          Clear filters
        </Text>
      </Pressable>
    </View>
  ) : (
    <View className="items-center justify-center pt-20">
      <Package size={48} color={colors.muted} />
      <Text className="text-[17px] text-navy mt-4 mb-2 font-bold">
        Your pantry is empty
      </Text>
      <Text className="text-[14px] text-muted text-center px-8">
        Tap the + button to start adding items to your pantry.
      </Text>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-cream">
      <View className="px-5 pt-4 pb-2">
        <Text
          className="text-[26px] text-navy mb-4 font-extrabold tracking-[-0.5px]">
          Pantry
        </Text>
        <TextInputRow
          icon={Search}
          placeholder="Search items..."
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {hasItems && (
        <View className="pb-2">
          <CategoryFilterPills
            categories={availableCategories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
            counts={categoryCounts}
            totalCount={searchFiltered.length}
          />
        </View>
      )}

      {selectedCategory ? (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerClassName="px-5 pt-3 pb-[100px]"
          renderItem={renderItem}
          refreshControl={refreshControl}
          ListEmptyComponent={emptyComponent}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          contentContainerClassName="px-5 pt-1 pb-[100px]"
          renderItem={renderItem}
          renderSectionHeader={({ section }) => (
            <CategorySectionHeader
              title={section.title}
              count={section.data.length}
            />
          )}
          stickySectionHeadersEnabled={false}
          refreshControl={refreshControl}
          ListEmptyComponent={emptyComponent}
        />
      )}

      <Pressable
        onPress={() => navigation.navigate('AddItemPicker')}
        className="absolute bottom-8 right-5 w-14 h-14 rounded-full bg-orange items-center justify-center shadow-md elevation-4">
        <Plus size={28} color="#FFFFFF" />
      </Pressable>
    </SafeAreaView>
  );
}
