import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import { ScanBarcode, X } from 'lucide-react-native';
import { useBarcodeLookupQuery } from '../../hooks/useBarcodeLookupQuery';
import colors from '../../theme/colors';
import type { PantryStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<PantryStackParamList, 'BarcodeScan'>;

export default function BarcodeScanScreen() {
  const navigation = useNavigation<Nav>();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const hasScannedRef = useRef(false);

  const { data, error, isFetching } = useBarcodeLookupQuery(scannedCode);

  // Request permission on mount
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const codeScanner = useCodeScanner({
    codeTypes: ['ean-13', 'ean-8', 'upc-a', 'upc-e', 'code-128', 'code-39'],
    onCodeScanned: (codes) => {
      if (hasScannedRef.current || codes.length === 0) return;
      const scanned = codes[0];
      let code = scanned.value;
      if (!code) return;
      // EAN-13 scanners prepend a leading 0 to UPC-A codes — strip it
      if (code.length === 13 && code.startsWith('0')) {
        code = code.slice(1);
      }
      hasScannedRef.current = true;
      setScannedCode(code);
    },
  });

  const resetScan = useCallback(() => {
    hasScannedRef.current = false;
    setScannedCode(null);
  }, []);

  const navigateManual = useCallback(() => {
    navigation.replace('ManualEntry');
  }, [navigation]);

  // Handle lookup result
  useEffect(() => {
    if (!scannedCode || isFetching) return;

    if (data) {
      navigation.replace('ManualEntry', {
        displayName: data.name,
        quantity: data.packageQuantity?.toString(),
        unit: data.packageUnit,
      });
    } else if (error) {
      Alert.alert(
        'Product Not Found',
        'We couldn\'t find this product in our database.',
        [
          { text: 'Try Again', onPress: resetScan },
          { text: 'Enter Manually', onPress: navigateManual },
        ],
      );
    }
  }, [data, error, isFetching, scannedCode, navigation, resetScan, navigateManual]);

  // Permission denied
  if (hasPermission === false) {
    return (
      <View className="flex-1 bg-dark items-center justify-center px-8">
        <SafeAreaView className="items-center">
          <ScanBarcode size={48} color="rgba(255,255,255,0.3)" />
          <Text
            className="text-white text-[18px] mt-6 text-center"
            style={{ fontWeight: '700' }}>
            Camera Permission Required
          </Text>
          <Text className="text-white/50 text-[14px] mt-2 text-center">
            StockPot needs camera access to scan product barcodes.
          </Text>
          <Pressable
            onPress={() => Linking.openSettings()}
            className="mt-6 bg-orange px-6 py-3 rounded-full">
            <Text className="text-white text-[14px]" style={{ fontWeight: '600' }}>
              Open Settings
            </Text>
          </Pressable>
          <Pressable onPress={() => navigation.goBack()} className="mt-4">
            <Text className="text-white/50 text-[14px]">Go Back</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  // No camera device (simulator)
  if (!device) {
    return (
      <View className="flex-1 bg-dark items-center justify-center px-8">
        <SafeAreaView className="items-center">
          <ScanBarcode size={48} color="rgba(255,255,255,0.3)" />
          <Text
            className="text-white text-[18px] mt-6 text-center"
            style={{ fontWeight: '700' }}>
            No Camera Available
          </Text>
          <Text className="text-white/50 text-[14px] mt-2 text-center">
            A camera is required to scan barcodes. This feature is not available on the simulator.
          </Text>
          <Pressable onPress={() => navigation.goBack()} className="mt-6">
            <Text className="text-white/50 text-[14px]">Go Back</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-dark">
      <Camera
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        device={device}
        isActive={!scannedCode}
        codeScanner={codeScanner}
      />

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
            {!scannedCode && (
              <View
                className="absolute left-4 right-4 h-0.5"
                style={{ backgroundColor: colors.orange.DEFAULT, top: '50%' }}
              />
            )}
          </View>

          {scannedCode && isFetching ? (
            <View className="items-center mt-6">
              <ActivityIndicator size="small" color={colors.orange.DEFAULT} />
              <Text className="text-white/70 text-[14px] mt-3">
                Looking up product...
              </Text>
            </View>
          ) : (
            <Text className="text-white/50 text-[14px] mt-6 text-center px-8">
              Point your camera at a product barcode
            </Text>
          )}
        </View>

        <View className="pb-12" />
      </SafeAreaView>
    </View>
  );
}
