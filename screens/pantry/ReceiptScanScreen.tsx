import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  GestureResponderEvent,
  Image as RNImage,
  Linking,
  Pressable,
  StyleSheet,
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
} from 'react-native-vision-camera';
import { launchImageLibrary } from 'react-native-image-picker';
import ImageCropPicker from 'react-native-image-crop-picker';
import { Camera as CameraIcon, Image, Zap, ZapOff, X } from 'lucide-react-native';
import { useReceiptScanMutation } from '../../hooks/useReceiptScanMutation';
import colors from '../../theme/colors';
import type { PantryStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<PantryStackParamList, 'ReceiptScan'>;

export default function ReceiptScanScreen() {
  const navigation = useNavigation<Nav>();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back', {
    physicalDevices: ['ultra-wide-angle-camera', 'wide-angle-camera'],
  });
  const cameraRef = useRef<Camera>(null);

  const [flash, setFlash] = useState(false);
  const scanMutation = useReceiptScanMutation();

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const handleFocus = async (e: GestureResponderEvent) => {
    if (!cameraRef.current) return;
    try {
      // Use pageX/pageY since the Camera fills the entire screen
      await cameraRef.current.focus({
        x: e.nativeEvent.pageX,
        y: e.nativeEvent.pageY,
      });
    } catch {
      // Focus may not be supported or point is out of bounds — ignore
    }
  };

  const cropAndProcess = async (imagePath: string) => {
    try {
      // openCropper needs a file:// URI — ensure the prefix is present
      const path = imagePath.startsWith('file://') ? imagePath : `file://${imagePath}`;

      // Get actual image dimensions so the crop box starts at "Original"
      const { width, height } = await new Promise<{ width: number; height: number }>(
        (resolve, reject) =>
          RNImage.getSize(path, (w, h) => resolve({ width: w, height: h }), reject),
      );

      const result = await ImageCropPicker.openCropper({
        path,
        width,
        height,
        mediaType: 'photo',
        includeBase64: true,
        compressImageQuality: 0.8,
        freeStyleCropEnabled: true,
      });

      if (result.data) {
        processImage(result.data, result.mime || 'image/jpeg');
      }
    } catch {
      // User dismissed the cropper — do nothing
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current || scanMutation.isPending) return;

    try {
      // takeSnapshot captures from the video pipeline with physically
      // correct pixel orientation (no EXIF rotation issues in the cropper).
      // Torch is handled by the Camera `torch` prop if flash is enabled.
      const snapshot = await cameraRef.current.takeSnapshot({
        quality: 100,
      });

      await cropAndProcess(snapshot.path);
    } catch {
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const handleGallery = () => {
    if (scanMutation.isPending) return;

    launchImageLibrary(
      {
        mediaType: 'photo',
        maxWidth: 1500,
        maxHeight: 2000,
        quality: 0.8,
      },
      (response) => {
        if (response.didCancel || response.errorCode) return;

        const uri = response.assets?.[0]?.uri;
        if (!uri) return;

        // Delay so the image picker modal fully dismisses before
        // openCropper presents its own modal on iOS
        setTimeout(() => cropAndProcess(uri), 1000);
      },
    );
  };

  const processImage = (imageBase64: string, mimeType: string) => {
    scanMutation.mutate(
      { imageBase64, mimeType },
      {
        onSuccess: (result) => {
          if (result.items.length === 0) {
            Alert.alert(
              'No Items Found',
              'We couldn\'t find any grocery items in this image. Try a clearer photo of a receipt.',
            );
            return;
          }
          navigation.replace('ReceiptReview', { items: result.items });
        },
        onError: () => {
          Alert.alert(
            'Error',
            'Couldn\'t process the receipt. Please try again.',
          );
        },
      },
    );
  };

  // Permission denied
  if (hasPermission === false) {
    return (
      <View className="flex-1 bg-dark items-center justify-center px-8">
        <SafeAreaView className="items-center">
          <CameraIcon size={48} color="rgba(255,255,255,0.3)" />
          <Text className="text-white text-[18px] mt-6 text-center font-bold">
            Camera Permission Required
          </Text>
          <Text className="text-white/50 text-[14px] mt-2 text-center">
            StockPot needs camera access to scan receipts.
          </Text>
          <Pressable
            onPress={() => Linking.openSettings()}
            className="mt-6 bg-orange px-6 py-3 rounded-full">
            <Text className="text-white text-[14px] font-semibold">
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
          <CameraIcon size={48} color="rgba(255,255,255,0.3)" />
          <Text className="text-white text-[18px] mt-6 text-center font-bold">
            No Camera Available
          </Text>
          <Text className="text-white/50 text-[14px] mt-2 text-center">
            Camera is not available on the simulator. You can still pick a photo
            from the library.
          </Text>
          <Pressable onPress={handleGallery} className="mt-6 bg-orange px-6 py-3 rounded-full">
            <Text className="text-white text-[14px] font-semibold">
              Choose from Library
            </Text>
          </Pressable>
          <Pressable onPress={() => navigation.goBack()} className="mt-4">
            <Text className="text-white/50 text-[14px]">Go Back</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-dark">
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={!scanMutation.isPending}
        photo={true}
        video={true}
        torch={flash ? 'on' : 'off'}
      />

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

        {/* Tap-to-focus area + helper text */}
        <Pressable onPress={handleFocus} className="flex-1 items-center justify-center px-8">
          {!scanMutation.isPending && (
            <Text className="text-white/50 text-[14px] text-center">
              Take a photo of your receipt — you can crop it next
            </Text>
          )}
        </Pressable>

        {/* Bottom controls */}
        <View className="flex-row items-center justify-around px-8 pb-8">
          {/* Gallery button */}
          <Pressable
            onPress={handleGallery}
            disabled={scanMutation.isPending}
            className={`w-12 h-12 rounded-full bg-white/10 items-center justify-center ${scanMutation.isPending ? 'opacity-50' : ''}`}>
            <Image size={22} color="#FFFFFF" />
          </Pressable>

          {/* Capture button */}
          <Pressable
            onPress={handleCapture}
            disabled={scanMutation.isPending}
            className={`w-16 h-16 rounded-full border-4 border-white/40 items-center justify-center ${scanMutation.isPending ? 'opacity-50' : ''}`}>
            <View className="w-12 h-12 rounded-full bg-white" />
          </Pressable>

          {/* Flash toggle */}
          <Pressable
            onPress={() => setFlash((f) => !f)}
            disabled={scanMutation.isPending}
            className={`w-12 h-12 rounded-full bg-white/10 items-center justify-center ${scanMutation.isPending ? 'opacity-50' : ''}`}>
            {flash ? (
              <Zap size={22} color="#FACC15" />
            ) : (
              <ZapOff size={22} color="#FFFFFF" />
            )}
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Processing overlay */}
      {scanMutation.isPending && (
        <View className="absolute inset-0 bg-black/70 items-center justify-center">
          <ActivityIndicator size="large" color={colors.orange.DEFAULT} />
          <Text className="text-white text-[16px] mt-4 font-semibold">
            Analyzing receipt...
          </Text>
          <Text className="text-white/50 text-[13px] mt-2">
            This may take a few seconds
          </Text>
        </View>
      )}
    </View>
  );
}
