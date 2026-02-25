import { useState, useCallback } from 'react';
import {
  ActivityIndicator,
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
import TextInputRow from '../../components/TextInputRow';
import { usePantryQuery, type PantryItem } from '../../hooks/usePantryQuery';
import { getExpiryStatus, getExpiryLabel } from '../../utils/expiry';
import colors from '../../theme/colors';
import type { PantryStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<PantryStackParamList, 'PantryList'>;

const EXPIRY_DOT_COLOR: Record<string, string> = {
  expired: colors.danger.DEFAULT,
  soon: colors.warning.DEFAULT,
  good: colors.success.DEFAULT,
};

function PantryCard({
  item,
  onPress,
}: {
  item: PantryItem;
  onPress: () => void;
}) {
  const status = getExpiryStatus(item.expirationDate);
  const label = getExpiryLabel(item.expirationDate);

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-card border border-border p-3.5 mb-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <Text
            className="text-[15px] text-dark mb-0.5 font-semibold"
            numberOfLines={1}>
            {item.displayName}
          </Text>
          <Text className="text-[13px] text-muted">
            {item.quantity} {item.unit}
            {item.storageLocation ? `  ·  ${item.storageLocation}` : ''}
          </Text>
        </View>
        {status !== 'none' && (
          <View className="flex-row items-center gap-1.5">
            <View
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: EXPIRY_DOT_COLOR[status] }}
            />
            <Text
              className="text-[12px]"
              style={{
                color:
                  status === 'expired'
                    ? colors.danger.DEFAULT
                    : colors.muted,
              }}>
              {label}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function PantryListScreen() {
  const navigation = useNavigation<Nav>();
  const { data: items, isLoading, refetch, isRefetching } = usePantryQuery();
  const [search, setSearch] = useState('');

  const filtered = items?.filter(item =>
    item.displayName.toLowerCase().includes(search.toLowerCase()),
  );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <SafeAreaView
        edges={['top']}
        className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color={colors.navy.DEFAULT} />
      </SafeAreaView>
    );
  }

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

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerClassName="px-5 pt-3 pb-[100px]"
        renderItem={({ item }) => (
          <PantryCard
            item={item}
            onPress={() => navigation.navigate('EditItem', { item })}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.navy.DEFAULT}
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center pt-20">
            <Package size={48} color={colors.muted} />
            <Text
              className="text-[17px] text-navy mt-4 mb-2 font-bold">
              Your pantry is empty
            </Text>
            <Text className="text-[14px] text-muted text-center px-8">
              Tap the + button to start adding items to your pantry.
            </Text>
          </View>
        }
      />

      <Pressable
        onPress={() => navigation.navigate('AddItemPicker')}
        className="absolute bottom-8 right-5 w-14 h-14 rounded-full bg-orange items-center justify-center shadow-md elevation-4">
        <Plus size={28} color="#FFFFFF" />
      </Pressable>
    </SafeAreaView>
  );
}
