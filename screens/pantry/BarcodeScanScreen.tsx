// TODO: Install react-native-vision-camera

import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ScanBarcode, X } from 'lucide-react-native';
import colors from '../../theme/colors';

export default function BarcodeScanScreen() {
  const navigation = useNavigation();

  return (
    <View className="flex-1 bg-dark">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
          <Pressable onPress={() => navigation.goBack()}>
            <X size={24} color="#FFFFFF" />
          </Pressable>
          <Text className="text-[16px] text-white" style={{ fontWeight: '700' }}>
            Scan Barcode
          </Text>
          <View className="w-6" />
        </View>

        {/* Barcode frame */}
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-full aspect-[2/1] rounded-2xl border-2 border-dashed border-white/30 items-center justify-center overflow-hidden">
            <ScanBarcode size={48} color="rgba(255,255,255,0.3)" />

            {/* Scanning line */}
            <View
              className="absolute left-4 right-4 h-0.5"
              style={{ backgroundColor: colors.orange.DEFAULT, top: '50%' }}
            />
          </View>

          <Text className="text-white/50 text-[14px] mt-6 text-center px-8">
            Point your camera at a product barcode
          </Text>
          <Text className="text-white/30 text-[12px] mt-2 text-center">
            Camera will be available when react-native-vision-camera is installed
          </Text>
        </View>

        <View className="pb-12" />
      </SafeAreaView>
    </View>
  );
}
