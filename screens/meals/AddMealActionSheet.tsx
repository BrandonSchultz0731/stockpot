import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ArrowLeft, Camera, Globe, Image, X, Zap } from 'lucide-react-native';
import colors from '../../theme/colors';
import Button from '../../components/Button';

type Mode = 'choose' | 'url' | 'photo';

export interface AddMealActionSheetProps {
  visible: boolean;
  mealType: string;
  onClose: () => void;
  onAddMeal: (url?: string) => void;
  onPhotoCapture: (source: 'camera' | 'gallery') => void;
  isLoading: boolean;
}

export default function AddMealActionSheet({
  visible,
  mealType,
  onClose,
  onAddMeal,
  onPhotoCapture,
  isLoading,
}: AddMealActionSheetProps) {
  const [mode, setMode] = useState<Mode>('choose');
  const [url, setUrl] = useState('');

  // Reset state when sheet opens
  useEffect(() => {
    if (visible) {
      setMode('choose');
      setUrl('');
    }
  }, [visible]);

  const handleGenerateAI = useCallback(() => {
    onAddMeal();
  }, [onAddMeal]);

  const handleImportUrl = useCallback(() => {
    if (url.trim()) {
      onAddMeal(url.trim());
    }
  }, [onAddMeal, url]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Backdrop */}
        <Pressable className="flex-1 bg-black/40" onPress={onClose} />

        {/* Sheet */}
        <View className="rounded-t-2xl bg-white px-5 pb-8 pt-3">
        {/* Handle bar */}
        <View className="mb-3 items-center">
          <View className="h-1 w-10 rounded-full bg-border" />
        </View>

        {/* Header */}
        <View className="mb-5 flex-row items-center justify-between">
          <View className="flex-row items-center">
            {(mode === 'url' || mode === 'photo') && (
              <Pressable
                onPress={() => setMode('choose')}
                hitSlop={10}
                className="mr-2 h-8 w-8 items-center justify-center rounded-full bg-cream"
              >
                <ArrowLeft size={16} color={colors.muted} />
              </Pressable>
            )}
            <Text className="text-[20px] font-bold text-dark">
              Add {mealType}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            className="h-8 w-8 items-center justify-center rounded-full bg-cream"
          >
            <X size={16} color={colors.muted} />
          </Pressable>
        </View>

        {mode === 'choose' ? (
          <View className="gap-3">
            {/* Generate with AI */}
            <Pressable
              onPress={handleGenerateAI}
              disabled={isLoading}
              className="flex-row items-center rounded-2xl border border-border bg-white p-4"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-orange/10">
                <Zap size={20} color={colors.orange.DEFAULT} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-[15px] font-semibold text-dark">
                  Generate with AI
                </Text>
                <Text className="mt-0.5 text-[12px] text-muted">
                  Create a recipe based on your pantry
                </Text>
              </View>
              {isLoading && (
                <ActivityIndicator size="small" color={colors.orange.DEFAULT} />
              )}
            </Pressable>

            {/* Import from Website */}
            <Pressable
              onPress={() => setMode('url')}
              disabled={isLoading}
              className="flex-row items-center rounded-2xl border border-border bg-white p-4"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-navy/10">
                <Globe size={20} color={colors.navy.DEFAULT} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-[15px] font-semibold text-dark">
                  Import from Website
                </Text>
                <Text className="mt-0.5 text-[12px] text-muted">
                  Paste a URL to import a recipe
                </Text>
              </View>
            </Pressable>

            {/* Scan from Photo */}
            <Pressable
              onPress={() => setMode('photo')}
              disabled={isLoading}
              className="flex-row items-center rounded-2xl border border-border bg-white p-4"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <Camera size={20} color={colors.success.DEFAULT} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-[15px] font-semibold text-dark">
                  Scan from Photo
                </Text>
                <Text className="mt-0.5 text-[12px] text-muted">
                  Take a photo of a recipe
                </Text>
              </View>
            </Pressable>
          </View>
        ) : mode === 'url' ? (
          <View>
            <Text className="mb-2 text-[13px] font-semibold text-muted">
              Recipe URL
            </Text>
            <TextInput
              value={url}
              onChangeText={setUrl}
              placeholder="https://example.com/recipe"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              className="mb-4 rounded-xl border border-border bg-cream px-4 py-3 text-[15px] text-dark"
            />
            <Button
              label={isLoading ? 'Importing...' : 'Import Recipe'}
              onPress={handleImportUrl}
              disabled={!url.trim() || isLoading}
            />
          </View>
        ) : (
          <View className="gap-3">
            {/* Take Photo */}
            <Pressable
              onPress={() => onPhotoCapture('camera')}
              className="flex-row items-center rounded-2xl border border-border bg-white p-4"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <Camera size={20} color={colors.success.DEFAULT} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-[15px] font-semibold text-dark">
                  Take Photo
                </Text>
                <Text className="mt-0.5 text-[12px] text-muted">
                  Use your camera to capture a recipe
                </Text>
              </View>
            </Pressable>

            {/* Choose from Library */}
            <Pressable
              onPress={() => onPhotoCapture('gallery')}
              className="flex-row items-center rounded-2xl border border-border bg-white p-4"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <Image size={20} color={colors.success.DEFAULT} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-[15px] font-semibold text-dark">
                  Choose from Library
                </Text>
                <Text className="mt-0.5 text-[12px] text-muted">
                  Pick a photo from your gallery
                </Text>
              </View>
            </Pressable>
          </View>
        )}
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
