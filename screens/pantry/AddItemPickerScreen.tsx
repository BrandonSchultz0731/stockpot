import { Pressable, View } from 'react-native';
import AppText from '../../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Camera,
  ScanBarcode,
  PenLine,
  Lightbulb,
} from 'lucide-react-native';
import colors from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { cardShadow } from '../../theme/shadows';
import ScreenHeader from '../../components/ScreenHeader';
import type { PantryStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<PantryStackParamList, 'AddItemPicker'>;

interface MethodCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onPress: () => void;
  variant?: 'featured' | 'light';
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
  const isFeatured = variant === 'featured';

  return (
    <Pressable
      onPress={onPress}
      className={`rounded-card p-4 mb-3 ${
        isFeatured ? 'bg-terra' : 'bg-white'
      }`}
      style={isFeatured ? undefined : cardShadow}>
      <View className="flex-row items-center gap-3">
        <View
          className={`w-10 h-10 rounded-xl items-center justify-center ${
            isFeatured ? 'bg-white/15' : 'bg-cream'
          }`}>
          {icon}
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <AppText
              className={`text-[15px] font-semibold ${isFeatured ? 'text-white' : 'text-espresso'}`}>
              {title}
            </AppText>
            {badge && (
              <View className="bg-white/25 px-2 py-0.5 rounded-full">
                <AppText className="text-[10px] text-white font-bold">
                  {badge}
                </AppText>
              </View>
            )}
          </View>
          <AppText
            className={`text-[13px] mt-0.5 ${
              isFeatured ? 'text-white/60' : 'text-stone'
            }`}>
            {description}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

export default function AddItemPickerScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-ivory">
      <ScreenHeader />
      <View className="px-5 pb-2">
        <AppText
          className="text-[26px] text-espresso mb-2 tracking-[-0.5px]"
          style={{ fontFamily: fonts.serif }}>
          Add Items
        </AppText>
        <AppText className="text-[14px] text-stone mb-6">
          Choose how you'd like to add items to your pantry.
        </AppText>
      </View>

      <View className="px-5">
        <MethodCard
          title="Receipt Scan"
          description="Snap a photo of your grocery receipt"
          icon={<Camera size={20} color="#FFFFFF" />}
          onPress={() => navigation.navigate('ReceiptScan')}
          variant="featured"
          badge="Recommended"
        />

        <MethodCard
          title="Barcode Scan"
          description="Scan a product barcode for instant lookup"
          icon={<ScanBarcode size={20} color={colors.terra.DEFAULT} />}
          onPress={() => navigation.navigate('BarcodeScan')}
        />

        <MethodCard
          title="Manual Entry"
          description="Search and add items by name"
          icon={<PenLine size={20} color={colors.terra.DEFAULT} />}
          onPress={() => navigation.navigate('ManualEntry')}
        />

        <View className="bg-terra-pale rounded-card p-4 mt-4 flex-row gap-3">
          <Lightbulb size={18} color={colors.terra.DEFAULT} />
          <View className="flex-1">
            <AppText
              className="text-[13px] text-espresso mb-1 font-semibold">
              Pro tip
            </AppText>
            <AppText className="text-[12px] text-stone leading-[18px]">
              Receipt scanning is the fastest way to add multiple items at once.
              Just snap a photo and we'll extract everything automatically.
            </AppText>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
