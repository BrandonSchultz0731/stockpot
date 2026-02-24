import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Camera,
  ScanBarcode,
  PenLine,
  ChevronLeft,
  Lightbulb,
} from 'lucide-react-native';
import colors from '../../theme/colors';
import type { PantryStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<PantryStackParamList, 'AddItemPicker'>;

interface MethodCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onPress: () => void;
  variant?: 'dark' | 'light';
  badge?: string;
}

function MethodCard({
  title,
  description,
  icon,
  onPress,
  variant = 'light',
  badge,
}: MethodCardProps) {
  const isDark = variant === 'dark';

  return (
    <Pressable
      onPress={onPress}
      className={`rounded-card border p-4 mb-3 ${
        isDark ? 'bg-navy border-navy' : 'bg-white border-border'
      }`}>
      <View className="flex-row items-center gap-3">
        <View
          className={`w-10 h-10 rounded-xl items-center justify-center ${
            isDark ? 'bg-white/10' : 'bg-cream'
          }`}>
          {icon}
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text
              className={`text-[15px] ${isDark ? 'text-white' : 'text-dark'}`}
              style={{ fontWeight: '600' }}>
              {title}
            </Text>
            {badge && (
              <View className="bg-orange px-2 py-0.5 rounded-full">
                <Text className="text-[10px] text-white font-bold">
                  {badge}
                </Text>
              </View>
            )}
          </View>
          <Text
            className={`text-[13px] mt-0.5 ${
              isDark ? 'text-white/60' : 'text-muted'
            }`}>
            {description}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function AddItemPickerScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-cream">
      <View className="px-5 pt-4 pb-2">
        <Pressable onPress={() => navigation.goBack()} className="mb-4">
          <ChevronLeft size={24} color={colors.navy.DEFAULT} />
        </Pressable>
        <Text
          className="text-[26px] text-navy mb-2"
          style={{ fontWeight: '800', letterSpacing: -0.5 }}>
          Add Items
        </Text>
        <Text className="text-[14px] text-muted mb-6">
          Choose how you'd like to add items to your pantry.
        </Text>
      </View>

      <View className="px-5">
        <MethodCard
          title="Receipt Scan"
          description="Snap a photo of your grocery receipt"
          icon={<Camera size={20} color="#FFFFFF" />}
          onPress={() => navigation.navigate('ReceiptScan')}
          variant="dark"
          badge="Recommended"
        />

        <MethodCard
          title="Barcode Scan"
          description="Scan a product barcode for instant lookup"
          icon={<ScanBarcode size={20} color={colors.navy.DEFAULT} />}
          onPress={() => navigation.navigate('BarcodeScan')}
        />

        <MethodCard
          title="Manual Entry"
          description="Search and add items by name"
          icon={<PenLine size={20} color={colors.navy.DEFAULT} />}
          onPress={() => navigation.navigate('ManualEntry')}
        />

        <View className="bg-orange-pale rounded-card p-4 mt-4 flex-row gap-3">
          <Lightbulb size={18} color={colors.orange.DEFAULT} />
          <View className="flex-1">
            <Text
              className="text-[13px] text-dark mb-1"
              style={{ fontWeight: '600' }}>
              Pro tip
            </Text>
            <Text className="text-[12px] text-muted leading-[18px]">
              Receipt scanning is the fastest way to add multiple items at once.
              Just snap a photo and we'll extract everything automatically.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
