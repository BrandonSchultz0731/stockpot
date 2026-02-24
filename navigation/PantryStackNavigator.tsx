import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PantryListScreen from '../screens/pantry/PantryListScreen';
import AddItemPickerScreen from '../screens/pantry/AddItemPickerScreen';
import ManualEntryScreen from '../screens/pantry/ManualEntryScreen';
import EditItemScreen from '../screens/pantry/EditItemScreen';
import ReceiptScanScreen from '../screens/pantry/ReceiptScanScreen';
import BarcodeScanScreen from '../screens/pantry/BarcodeScanScreen';
import ReceiptReviewScreen from '../screens/pantry/ReceiptReviewScreen';
import type { PantryStackParamList } from './types';

const Stack = createNativeStackNavigator<PantryStackParamList>();

export default function PantryStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PantryList" component={PantryListScreen} />
      <Stack.Screen name="AddItemPicker" component={AddItemPickerScreen} />
      <Stack.Screen name="ManualEntry" component={ManualEntryScreen} />
      <Stack.Screen name="EditItem" component={EditItemScreen} />
      <Stack.Screen name="ReceiptScan" component={ReceiptScanScreen} />
      <Stack.Screen name="BarcodeScan" component={BarcodeScanScreen} />
      <Stack.Screen name="ReceiptReview" component={ReceiptReviewScreen} />
    </Stack.Navigator>
  );
}
