// TODO: Install react-native-vision-camera

import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Camera, Image, Zap, X } from 'lucide-react-native';

export default function ReceiptScanScreen() {
  const navigation = useNavigation();

  return (
    <View className="flex-1 bg-dark">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
          <Pressable onPress={() => navigation.goBack()}>
            <X size={24} color="#FFFFFF" />
          </Pressable>
          <Text className="text-[16px] text-white font-bold">
            Scan Receipt
          </Text>
          <View className="w-6" />
        </View>

        {/* Viewfinder */}
        <View className="flex-1 items-center justify-center px-8">
          <View
            className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-white/30 items-center justify-center">
            <Camera size={48} color="rgba(255,255,255,0.3)" />
            <Text className="text-white/50 text-[14px] mt-4 text-center px-8">
              Camera preview will appear here when react-native-vision-camera is
              installed
            </Text>
          </View>
        </View>

        {/* Bottom controls */}
        <View className="flex-row items-center justify-around px-8 pb-8">
          <Pressable
            className="w-12 h-12 rounded-full bg-white/10 items-center justify-center opacity-50"
            disabled>
            <Image size={22} color="#FFFFFF" />
          </Pressable>
          <Pressable
            className="w-16 h-16 rounded-full border-4 border-white/40 items-center justify-center opacity-50"
            disabled>
            <View className="w-12 h-12 rounded-full bg-white/30" />
          </Pressable>
          <Pressable
            className="w-12 h-12 rounded-full bg-white/10 items-center justify-center opacity-50"
            disabled>
            <Zap size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
