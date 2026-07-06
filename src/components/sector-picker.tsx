import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette, Spacing } from '@/constants/theme';
import { formatDOP } from '@/lib/model';

interface Props {
  sectors: string[];
  value: string;
  onChange: (sector: string) => void;
  avgPrices: Record<string, number>;
}

export function SectorPicker({ sectors, value, onChange, avgPrices }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable style={styles.trigger} onPress={() => setOpen(true)} testID="sector-trigger">
        <Text style={styles.triggerText}>{value}</Text>
        <Text style={styles.triggerHint}>Cambiar</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Sector</Text>
            <FlatList
              data={sectors}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.option, item === value && styles.optionSelected]}
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}>
                  <Text style={styles.optionText}>{item}</Text>
                  <Text style={styles.optionAvg}>prom. {formatDOP(avgPrices[item] ?? 0)}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.card,
    borderColor: Palette.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  triggerText: { color: Palette.text, fontSize: 16, fontWeight: '600' },
  triggerHint: { color: Palette.accent, fontSize: 13 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  sheet: {
    backgroundColor: Palette.card,
    borderRadius: 14,
    maxHeight: '70%',
    paddingVertical: Spacing.two,
  },
  sheetTitle: {
    color: Palette.textSecondary,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  optionSelected: { backgroundColor: Palette.cardSelected },
  optionText: { color: Palette.text, fontSize: 15 },
  optionAvg: { color: Palette.textSecondary, fontSize: 12 },
});
