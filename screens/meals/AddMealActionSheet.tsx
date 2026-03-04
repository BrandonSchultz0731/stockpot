import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import AppText from '../../components/AppText';
import { ArrowLeft, Camera, Globe, Image, Minus, Plus, UtensilsCrossed, X, Zap } from 'lucide-react-native';
import colors from '../../theme/colors';
import Button from '../../components/Button';
import type { AvailableLeftover } from '../../hooks/useMealPlanMutations';

type Mode = 'choose' | 'url' | 'photo' | 'leftovers';

export interface AddMealActionSheetProps {
  visible: boolean;
  mealType: string;
  onClose: () => void;
  onAddMeal: (url?: string) => void;
  onPhotoCapture: (source: 'camera' | 'gallery') => void;
  isLoading: boolean;
  availableLeftovers?: AvailableLeftover[];
  onAddLeftover?: (sourceEntryId: string, servings: number) => void;
}

export default function AddMealActionSheet({
  visible,
  mealType,
  onClose,
  onAddMeal,
  onPhotoCapture,
  isLoading,
  availableLeftovers,
  onAddLeftover,
}: AddMealActionSheetProps) {
  const [mode, setMode] = useState<Mode>('choose');
  const [url, setUrl] = useState('');
  const [selectedLeftover, setSelectedLeftover] = useState<AvailableLeftover | null>(null);
  const [leftoverServings, setLeftoverServings] = useState(1);

  const hasLeftovers = (availableLeftovers?.length ?? 0) > 0;

  // Reset state when sheet opens
  useEffect(() => {
    if (visible) {
      setMode('choose');
      setUrl('');
      setSelectedLeftover(null);
      setLeftoverServings(1);
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
          <View className="h-1 w-10 rounded-full bg-line" />
        </View>

        {/* Header */}
        <View className="mb-5 flex-row items-center justify-between">
          <View className="flex-row items-center">
            {mode !== 'choose' && (
              <Pressable
                onPress={() => setMode('choose')}
                hitSlop={10}
                className="mr-2 h-8 w-8 items-center justify-center rounded-full bg-cream"
              >
                <ArrowLeft size={16} color={colors.stone} />
              </Pressable>
            )}
            <AppText className="text-[20px] font-bold text-espresso">
              Add {mealType}
            </AppText>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            className="h-8 w-8 items-center justify-center rounded-full bg-cream"
          >
            <X size={16} color={colors.stone} />
          </Pressable>
        </View>

        {mode === 'choose' ? (
          <View className="gap-3">
            {/* Generate with AI */}
            <Pressable
              onPress={handleGenerateAI}
              disabled={isLoading}
              className="flex-row items-center rounded-2xl border border-line bg-white p-4"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-terra/10">
                <Zap size={20} color={colors.terra.DEFAULT} />
              </View>
              <View className="ml-3 flex-1">
                <AppText className="text-[15px] font-semibold text-espresso">
                  Generate with AI
                </AppText>
                <AppText className="mt-0.5 text-[12px] text-stone">
                  Create a recipe based on your pantry
                </AppText>
              </View>
              {isLoading && (
                <ActivityIndicator size="small" color={colors.terra.DEFAULT} />
              )}
            </Pressable>

            {/* Import from Website */}
            <Pressable
              onPress={() => setMode('url')}
              disabled={isLoading}
              className="flex-row items-center rounded-2xl border border-line bg-white p-4"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-espresso/10">
                <Globe size={20} color={colors.espresso} />
              </View>
              <View className="ml-3 flex-1">
                <AppText className="text-[15px] font-semibold text-espresso">
                  Import from Website
                </AppText>
                <AppText className="mt-0.5 text-[12px] text-stone">
                  Paste a URL to import a recipe
                </AppText>
              </View>
            </Pressable>

            {/* Scan from Photo */}
            <Pressable
              onPress={() => setMode('photo')}
              disabled={isLoading}
              className="flex-row items-center rounded-2xl border border-line bg-white p-4"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-sage/10">
                <Camera size={20} color={colors.sage.DEFAULT} />
              </View>
              <View className="ml-3 flex-1">
                <AppText className="text-[15px] font-semibold text-espresso">
                  Scan from Photo
                </AppText>
                <AppText className="mt-0.5 text-[12px] text-stone">
                  Take a photo of a recipe
                </AppText>
              </View>
            </Pressable>

            {/* Eat Leftovers */}
            <Pressable
              onPress={() => setMode('leftovers')}
              disabled={isLoading || !hasLeftovers}
              className={`flex-row items-center rounded-2xl border border-line bg-white p-4 ${!hasLeftovers ? 'opacity-40' : ''}`}
            >
              <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: colors.honey.pale }}>
                <UtensilsCrossed size={20} color={colors.honey.DEFAULT} />
              </View>
              <View className="ml-3 flex-1">
                <AppText className="text-[15px] font-semibold text-espresso">
                  Eat Leftovers
                </AppText>
                <AppText className="mt-0.5 text-[12px] text-stone">
                  {hasLeftovers
                    ? 'Use leftover servings from another meal'
                    : 'No leftovers available'}
                </AppText>
              </View>
            </Pressable>
          </View>
        ) : mode === 'url' ? (
          <View>
            <AppText className="mb-2 text-[13px] font-semibold text-stone">
              Recipe URL
            </AppText>
            <TextInput
              value={url}
              onChangeText={setUrl}
              placeholder="https://example.com/recipe"
              placeholderTextColor={colors.stone}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              className="mb-4 rounded-xl border border-line bg-cream px-4 py-3 text-[15px] text-espresso"
            />
            <Button
              label={isLoading ? 'Importing...' : 'Import Recipe'}
              onPress={handleImportUrl}
              disabled={!url.trim() || isLoading}
            />
          </View>
        ) : mode === 'photo' ? (
          <View className="gap-3">
            {/* Take Photo */}
            <Pressable
              onPress={() => onPhotoCapture('camera')}
              className="flex-row items-center rounded-2xl border border-line bg-white p-4"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-sage/10">
                <Camera size={20} color={colors.sage.DEFAULT} />
              </View>
              <View className="ml-3 flex-1">
                <AppText className="text-[15px] font-semibold text-espresso">
                  Take Photo
                </AppText>
                <AppText className="mt-0.5 text-[12px] text-stone">
                  Use your camera to capture a recipe
                </AppText>
              </View>
            </Pressable>

            {/* Choose from Library */}
            <Pressable
              onPress={() => onPhotoCapture('gallery')}
              className="flex-row items-center rounded-2xl border border-line bg-white p-4"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-sage/10">
                <Image size={20} color={colors.sage.DEFAULT} />
              </View>
              <View className="ml-3 flex-1">
                <AppText className="text-[15px] font-semibold text-espresso">
                  Choose from Library
                </AppText>
                <AppText className="mt-0.5 text-[12px] text-stone">
                  Pick a photo from your gallery
                </AppText>
              </View>
            </Pressable>
          </View>
        ) : mode === 'leftovers' ? (
          <View>
            {!selectedLeftover ? (
              <ScrollView className="max-h-[300px]">
                <View className="gap-3">
                  {availableLeftovers?.map((lo) => (
                    <Pressable
                      key={lo.sourceEntryId}
                      onPress={() => {
                        setSelectedLeftover(lo);
                        setLeftoverServings(1);
                      }}
                      className="flex-row items-center rounded-2xl border border-line bg-white p-4"
                    >
                      <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: colors.honey.pale }}>
                        <UtensilsCrossed size={20} color={colors.honey.DEFAULT} />
                      </View>
                      <View className="ml-3 flex-1">
                        <AppText className="text-[15px] font-semibold text-espresso" numberOfLines={1}>
                          {lo.recipeTitle}
                        </AppText>
                        <AppText className="mt-0.5 text-[12px] text-stone">
                          {lo.availableServings} {lo.availableServings === 1 ? 'serving' : 'servings'} available
                        </AppText>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <View>
                <AppText className="mb-1 text-[15px] font-semibold text-espresso" numberOfLines={1}>
                  {selectedLeftover.recipeTitle}
                </AppText>
                <AppText className="mb-4 text-[12px] text-stone">
                  {selectedLeftover.availableServings} {selectedLeftover.availableServings === 1 ? 'serving' : 'servings'} available
                </AppText>
                <View className="mb-4 flex-row items-center justify-center">
                  <Pressable
                    onPress={() => setLeftoverServings((s) => Math.max(1, s - 1))}
                    disabled={leftoverServings <= 1}
                    className={`h-10 w-10 items-center justify-center rounded-lg border border-line ${leftoverServings <= 1 ? 'opacity-30' : ''}`}
                  >
                    <Minus size={16} color={colors.espresso} />
                  </Pressable>
                  <AppText className="mx-5 text-[22px] font-bold text-terra">
                    {leftoverServings}
                  </AppText>
                  <Pressable
                    onPress={() =>
                      setLeftoverServings((s) =>
                        Math.min(selectedLeftover.availableServings, s + 1),
                      )
                    }
                    disabled={leftoverServings >= selectedLeftover.availableServings}
                    className={`h-10 w-10 items-center justify-center rounded-lg border border-line ${leftoverServings >= selectedLeftover.availableServings ? 'opacity-30' : ''}`}
                  >
                    <Plus size={16} color={colors.espresso} />
                  </Pressable>
                </View>
                <Button
                  label={`Add ${leftoverServings} ${leftoverServings === 1 ? 'serving' : 'servings'}`}
                  onPress={() => {
                    onAddLeftover?.(selectedLeftover.sourceEntryId, leftoverServings);
                    onClose();
                  }}
                />
              </View>
            )}
          </View>
        ) : null}
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
