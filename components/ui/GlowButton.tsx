// Powered by OnSpace.AI
// Glowing action button

import React, { memo } from 'react';
import { Pressable, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Colors, Typography, Radius, Spacing } from '@/constants/theme';

interface Props {
  label:    string;
  onPress:  () => void;
  color?:   string;
  disabled?: boolean;
  loading?:  boolean;
  variant?:  'filled' | 'outline' | 'ghost';
  size?:     'sm' | 'md' | 'lg';
  icon?:     React.ReactNode;
  fullWidth?: boolean;
}

export const GlowButton = memo(({
  label, onPress, color = Colors.primary,
  disabled, loading, variant = 'filled',
  size = 'md', icon, fullWidth = false,
}: Props) => {
  const pad     = size === 'lg' ? 18 : size === 'sm' ? 10 : 14;
  const fSize   = size === 'lg' ? Typography.sizeMd : size === 'sm' ? Typography.sizeSm : Typography.sizeBase;
  const isActive = !disabled && !loading;

  return (
    <Pressable
      onPress={isActive ? onPress : undefined}
      style={({ pressed }) => [
        styles.base,
        { paddingVertical: pad, paddingHorizontal: pad * 1.6 },
        fullWidth && styles.fullWidth,
        variant === 'filled'  && { backgroundColor: isActive ? color : Colors.surfaceBorder },
        variant === 'outline' && { borderWidth: 1.5, borderColor: isActive ? color : Colors.surfaceBorder },
        variant === 'ghost'   && {},
        pressed && isActive && { opacity: 0.75, transform: [{ scale: 0.97 }] },
        !isActive && styles.disabled,
      ]}
      hitSlop={8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'filled' ? Colors.textOnPrimary : color} size="small" />
      ) : (
        <View style={styles.row}>
          {icon && <View style={{ marginRight: 6 }}>{icon}</View>}
          <Text style={[
            styles.label,
            { fontSize: fSize },
            variant === 'filled'  && { color: Colors.textOnPrimary },
            variant === 'outline' && { color: isActive ? color : Colors.textMuted },
            variant === 'ghost'   && { color: isActive ? color : Colors.textMuted },
          ]}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    borderRadius:   Radius.md,
    alignItems:     'center',
    justifyContent: 'center',
    minHeight:      48,
  },
  fullWidth: { alignSelf: 'stretch' },
  disabled:  { opacity: 0.4 },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  label: {
    fontWeight:  Typography.weightBold,
    letterSpacing: 0.5,
  },
});
