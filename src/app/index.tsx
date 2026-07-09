import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SectorPicker } from '@/components/sector-picker';
import { CtaGradient, Palette, Spacing } from '@/constants/theme';
import { EstimateInput, formatDOP, predictPrice } from '@/lib/model';
import { useModel } from '@/lib/model-sync';
import { useSession } from '@/lib/session';
import { isCloudConfigured, supabase } from '@/lib/supabase';

interface Result {
  input: EstimateInput;
  price: number;
}

export default function EstimateScreen() {
  const { session } = useSession();
  const { params: model } = useModel();

  const [sector, setSector] = useState('Bella Vista');
  const [area, setArea] = useState(85);
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(2);
  const [parking, setParking] = useState(1);
  const [furnished, setFurnished] = useState(false);
  const [age, setAge] = useState(10);

  const [result, setResult] = useState<Result | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  function onEstimate() {
    const input: EstimateInput = {
      sector,
      area_m2: area,
      bedrooms,
      bathrooms,
      parking_spots: parking,
      furnished: furnished ? 1 : 0,
      age_years: age,
    };
    setSaveStatus(null);
    const price = predictPrice(model, input);
    setResult({ input, price });
    autoSave(input, price);
  }

  // Every estimate is logged to the cloud automatically so there is a
  // record of what the client searched. Silent when the cloud is not set up.
  async function autoSave(input: EstimateInput, price: number) {
    if (!isCloudConfigured || !supabase) return;
    if (!session) {
      setSaveStatus('Inicia sesión en la pestaña Historial para llevar el historial en la nube.');
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

  const rmse = model.metrics.rmse;
  const sectorAvg = result ? (model.avg_price_by_sector[result.input.sector] ?? 0) : 0;
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
            sectors={model.sectors}
            value={sector}
            onChange={setSector}
            avgPrices={model.avg_price_by_sector}
          />

          <LabeledSlider
            label="Área"
            value={area}
            onChange={setArea}
            min={20}
            max={1000}
            step={5}
            unit="m²"
            hint="Superficie construida"
          />
          <LabeledSlider
            label="Antigüedad"
            value={age}
            onChange={setAge}
            min={0}
            max={80}
            step={1}
            unit="años"
            hint="0 = a estrenar"
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

          <Pressable style={styles.collapsibleHead} onPress={() => setShowInfo((v) => !v)}>
            <Text style={styles.collapsibleTitle}>¿Cómo se calcula esto?</Text>
            <Ionicons
              name={showInfo ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={Palette.accent}
            />
          </Pressable>
          {showInfo && (
            <Text style={styles.collapsibleBody}>
              La estimación usa un modelo de regresión lineal entrenado con datos del mercado de
              alquileres de Santo Domingo, calibrado por sector (R² {model.metrics.r2.toFixed(2)},
              error medio {formatDOP(model.metrics.mae)}). Es orientativa, no una tasación oficial.
              La misma cuenta y el mismo historial funcionan en la web y en la app.
            </Text>
          )}
        </ScrollView>

        {/* CTA near the thumb: fixed above the tab bar. */}
        <View style={styles.bottomBar}>
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
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function LabeledSlider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  hint,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  unit?: string;
  hint?: string;
}) {
  return (
    <View style={styles.sliderBlock}>
      <View style={styles.sliderHead}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.sliderValue}>
          {value}
          {unit ? ` ${unit}` : ''}
        </Text>
      </View>
      <Slider
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={Palette.accent}
        maximumTrackTintColor={Palette.border}
        thumbTintColor={Palette.accent}
      />
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
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
  sliderBlock: { marginTop: Spacing.two },
  sliderHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sliderValue: {
    color: Palette.accent,
    fontSize: 15,
    fontWeight: '700',
    marginTop: Spacing.three,
  },
  fieldHint: { color: Palette.textSecondary, fontSize: 12, marginTop: 2 },
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
  collapsibleHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.four,
    paddingVertical: Spacing.two,
  },
  collapsibleTitle: { color: Palette.text, fontSize: 15, fontWeight: '700' },
  collapsibleBody: {
    color: Palette.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: Spacing.one,
  },
  bottomBar: {
    backgroundColor: Palette.background,
    borderTopColor: Palette.border,
    borderTopWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  primaryButton: {
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
  primaryButtonPressed: { opacity: 0.85 },
  primaryButtonText: { color: Palette.accentText, fontSize: 16, fontWeight: '700' },
});
