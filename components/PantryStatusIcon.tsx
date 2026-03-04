import { View } from 'react-native';
import { AlertTriangle, Check, X } from 'lucide-react-native';
import { PantryStatus } from '../shared/enums';
import colors from '../theme/colors';

interface PantryStatusIconProps {
  status: PantryStatus | undefined;
  size?: number;
}

export default function PantryStatusIcon({
  status,
  size = 20,
}: PantryStatusIconProps) {
  const iconSize = Math.round(size * 0.6);

  if (status === PantryStatus.Enough) {
    return (
      <View
        className="items-center justify-center rounded-full bg-sage-pale"
        style={{ width: size, height: size }}
      >
        <Check size={iconSize} color={colors.sage.DEFAULT} />
      </View>
    );
  }

  if (status === PantryStatus.Low) {
    return (
      <View
        className="items-center justify-center rounded-full bg-honey-pale"
        style={{ width: size, height: size }}
      >
        <AlertTriangle size={iconSize} color={colors.honey.DEFAULT} />
      </View>
    );
  }

  // None or undefined
  return (
    <View
      className="items-center justify-center rounded-full bg-berry-pale"
      style={{ width: size, height: size }}
    >
      <X size={iconSize} color={colors.berry.DEFAULT} />
    </View>
  );
}
