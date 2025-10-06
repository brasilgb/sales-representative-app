import { cn } from '@/lib/utils';
import { theme } from '@/styles/theme';
import { Switch as NativeSwitch, useColorScheme, View, Text } from 'react-native';



function Switch({...props}: React.ComponentPropsWithoutRef<typeof NativeSwitch> & {
  label?: string;
}) {
  const { label, ...rest } = props;
  const colorScheme = useColorScheme();
  const currentTheme = colorScheme === 'dark' ? theme.dark : theme.light;

  const trackColor = props.trackColor || {
    false: currentTheme.background,
    true: currentTheme.foreground,
  };
  const thumbColor = props.thumbColor || currentTheme.background;
  const ios_backgroundColor =
    props.ios_backgroundColor || currentTheme.background;

  return (
    <View className={cn('flex flex-col items-start justify-center')}>
      {label && <Text className={cn('text-base')}>{label}</Text>}
      <NativeSwitch
        trackColor={trackColor}
        thumbColor={thumbColor}
        ios_backgroundColor={ios_backgroundColor}
        {...props}
      />
    </View>
  );
}

export { Switch };
