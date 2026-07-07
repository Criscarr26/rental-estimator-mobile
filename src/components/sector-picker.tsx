import { Ionicons } from '@expo/vector-icons';
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
        <View style={styles.triggerLeft}>
          <Ionicons name="location" size={18} color={Palette.accent} />
          <Text style={styles.triggerText}>{value}</Text>
        </View>
        <Ionicons name="chevron-down" size={18} color={Palette.textSecondary} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Elige el sector</Text>
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
                  <View style={styles.optionLeft}>
                    {item === value && (
                      <Ionicons name="checkmark-circle" size={18} color={Palette.accent} />
                    )}
                    <Text style={[styles.optionText, item === value && styles.optionTextSelected]}>
                      {item}
                    </Text>
                  </View>
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
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  triggerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  triggerText: { color: Palette.text, fontSize: 16, fontWeight: '600' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(3,7,18,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Palette.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingBottom: Spacing.four,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.border,
    marginTop: Spacing.two,
  },
  sheetTitle: {
    color: Palette.text,
    fontSize: 17,
    fontWeight: '700',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  optionSelected: { backgroundColor: Palette.cardSelected },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  optionText: { color: Palette.text, fontSize: 15 },
  optionTextSelected: { fontWeight: '700' },
  optionAvg: { color: Palette.textSecondary, fontSize: 12 },
});
