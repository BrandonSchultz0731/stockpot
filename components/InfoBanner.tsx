import { View } from 'react-native';
import AppText from './AppText';
import { Info } from 'lucide-react-native';
import colors from '../theme/colors';

interface InfoBannerProps {
  /** Lucide icon component — defaults to `Info` */
  icon?: React.ReactNode;
  /** Additional NativeWind classes for the outer container */
  className?: string;
  children: React.ReactNode;
}

export default function InfoBanner({
  icon,
  className,
  children,
}: InfoBannerProps) {
  return (
    <View
      className={`flex-row items-start rounded-2xl bg-terra-pale p-4 ${className ?? ''}`}
    >
      {icon ?? <Info size={16} color={colors.terra.DEFAULT} className="mt-px" />}
      <AppText className="ml-2.5 flex-1 text-sm leading-5 text-ink">
        {children}
      </AppText>
    </View>
  );
}
