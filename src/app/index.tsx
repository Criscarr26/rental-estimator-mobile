import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SectorPicker } from '@/components/sector-picker';
import { CtaGradient, Palette, Spacing } from '@/constants/theme';
import { EstimateInput, formatDOP } from '@/lib/model';
import { estimate, MODEL } from '@/lib/model-data';
import { useSession } from '@/lib/session';
import { isCloudConfigured, supabase } from '@/lib/supabase';

interface Result {
  input: EstimateInput;
  price: number;
}

export default function EstimateScreen() {
  const { session } = useSession();

  const [sector, setSector] = useState('Bella Vista');
  const [areaText, setAreaText] = useState('85');
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(2);
  const [parking, setParking] = useState(1);
  const [furnished, setFurnished] = useState(false);
  const [ageText, setAgeText] = useState('10');

  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  function onEstimate() {
    const area = Number(areaText.replace(',', '.'));
    const age = Number(ageText.replace(',', '.'));
    if (!Number.isFinite(area) || area < 20 || area > 1000) {
      setError('Área inválida: usa un valor entre 20 y 1000 m².');
      setResult(null);
      return;
    }
    if (!Number.isFinite(age) || age < 0 || age > 80) {
      setError('Antigüedad inválida: usa un valor entre 0 y 80 años.');
      setResult(null);
      return;
    }
    const input: EstimateInput = {
      sector,
      area_m2: area,
      bedrooms,
      bathrooms,
      parking_spots: parking,
      furnished: furnished ? 1 : 0,
      age_years: age,
    };
    setError(null);
    setSaveStatus(null);
    const price = estimate(input);
    setResult({ input, price });
    autoSave(input, price);
  }

  // Every estimate is logged to the cloud automatically so there is a
  // record of what the client searched. Silent when the cloud is not set up.
  async function autoSave(input: EstimateInput, price: number) {
    if (!isCloudConfigured || !supabase) return;
    if (!session) {
      setSaveStatus('Inicia sesión en la pestaña Guardadas para llevar el historial en la nube.');
      return;
    }
    const { error: insertError } = await supabase.from('saved_estimates').insert({
      label: `${input.sector} · ${input.area_m2} m²`,
      sector: input.sector,
      area_m2: input.area_m2,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      parking_spots: input.parking_spots,
      furnished: input.furnished === 1,
      age_years: input.age_years,
      predicted_price: Math.round(price),
    });
    setSaveStatus(
      insertError
        ? `No se pudo guardar en el historial: ${insertError.message}`
        : 'Guardada en tu historial en la nube.'
    );
  }

  const rmse = MODEL.metrics.rmse;
  const sectorAvg = result ? (MODEL.avg_price_by_sector[result.input.sector] ?? 0) : 0;
  const diffVsAvg = result ? result.price - sectorAvg : 0;
  const diffPct = sectorAvg > 0 ? (diffVsAvg / sectorAvg) * 100 : 0;

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Tasador SD</Text>
            <Text style={styles.heroSubtitle}>
              Estime el alquiler mensual de una propiedad en Santo Domingo
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Datos de la propiedad</Text>

        <Text style={styles.fieldLabel}>Sector</Text>
        <SectorPicker
          sectors={MODEL.sectors}
          value={sector}
          onChange={setSector}
          avgPrices={MODEL.avg_price_by_sector}
        />

        <Text style={styles.fieldLabel}>Área (m²)</Text>
        <TextInput
          style={styles.input}
          value={areaText}
          onChangeText={setAreaText}
          keyboardType="numeric"
          placeholder="85"
          placeholderTextColor={Palette.textSecondary}
          testID="area-input"
        />

        <Stepper label="Habitaciones" value={bedrooms} onChange={setBedrooms} min={1} max={6} />
        <Stepper label="Baños" value={bathrooms} onChange={setBathrooms} min={1} max={6} />
        <Stepper label="Parqueos" value={parking} onChange={setParking} min={0} max={4} />

        <View style={styles.switchRow}>
          <Text style={styles.fieldLabel}>Amueblado</Text>
          <Switch
            value={furnished}
            onValueChange={setFurnished}
            trackColor={{ false: Palette.border, true: Palette.accent }}
            thumbColor={Palette.text}
          />
        </View>

        <Text style={styles.fieldLabel}>Antigüedad (años)</Text>
        <TextInput
          style={styles.input}
          value={ageText}
          onChangeText={setAgeText}
          keyboardType="numeric"
          placeholder="10"
          placeholderTextColor={Palette.textSecondary}
          testID="age-input"
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable onPress={onEstimate} testID="estimate-button">
          {({ pressed }) => (
            <LinearGradient
              colors={CtaGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.primaryButton, pressed && styles.primaryButtonPressed]}>
              <Text style={styles.primaryButtonText}>Estimar precio</Text>
            </LinearGradient>
          )}
        </Pressable>

        {result && (
          <View style={styles.resultCard} testID="result-card">
            <Text style={styles.resultLabel}>Alquiler mensual estimado</Text>
            <Text style={styles.resultPrice}>{formatDOP(result.price)}</Text>
            <Text style={styles.resultRange}>
              Rango típico: {formatDOP(result.price - rmse)} a {formatDOP(result.price + rmse)}
            </Text>
            <Text style={styles.resultCompare}>
              {diffVsAvg >= 0 ? 'Por encima' : 'Por debajo'} del promedio de {result.input.sector} (
              {formatDOP(sectorAvg)}) en {Math.abs(diffPct).toFixed(0)}%.
            </Text>
            {saveStatus && <Text style={styles.saveStatus}>{saveStatus}</Text>}
          </View>
        )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Stepper({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}) {
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <Pressable style={styles.stepButton} onPress={() => onChange(Math.max(min, value - 1))}>
          <Text style={styles.stepButtonText}>−</Text>
        </Pressable>
        <Text style={styles.stepValue}>{value}</Text>
        <Pressable style={styles.stepButton} onPress={() => onChange(Math.min(max, value + 1))}>
          <Text style={styles.stepButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Palette.background },
  content: { padding: Spacing.three, paddingBottom: Spacing.five },
  hero: { marginTop: Spacing.two, marginBottom: Spacing.four },
  heroTitle: {
    color: Palette.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroSubtitle: { color: Palette.textSecondary, fontSize: 14, marginTop: Spacing.one },
  sectionTitle: {
    color: Palette.textSecondary,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.two,
  },
  fieldLabel: { color: Palette.text, fontSize: 15, marginTop: Spacing.three, marginBottom: Spacing.one },
  input: {
    backgroundColor: Palette.card,
    borderColor: Palette.border,
    borderWidth: 1,
    borderRadius: 10,
    color: Palette.text,
    fontSize: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperControls: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.three },
  stepButton: {
    backgroundColor: Palette.card,
    borderColor: Palette.border,
    borderWidth: 1,
    borderRadius: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonText: { color: Palette.accent, fontSize: 20, fontWeight: '700' },
  stepValue: {
    color: Palette.text,
    fontSize: 17,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  error: { color: Palette.danger, marginTop: Spacing.three },
  primaryButton: {
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    marginTop: Spacing.four,
  },
  primaryButtonPressed: { opacity: 0.85 },
  primaryButtonText: { color: Palette.accentText, fontSize: 16, fontWeight: '700' },
  resultCard: {
    backgroundColor: Palette.card,
    borderColor: Palette.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing.three,
    marginTop: Spacing.four,
  },
  resultLabel: { color: Palette.textSecondary, fontSize: 13 },
  resultPrice: { color: Palette.accent, fontSize: 34, fontWeight: '800', marginVertical: Spacing.one },
  resultRange: { color: Palette.text, fontSize: 14, marginBottom: Spacing.one },
  resultCompare: { color: Palette.text, fontSize: 14 },
  saveStatus: { color: Palette.textSecondary, fontSize: 13, marginTop: Spacing.two },
});
