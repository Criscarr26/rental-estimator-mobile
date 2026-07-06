import { Session } from '@supabase/supabase-js';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Palette, Spacing } from '@/constants/theme';
import { formatDOP } from '@/lib/model';
import { useSession } from '@/lib/session';
import { isCloudConfigured, supabase } from '@/lib/supabase';
import { SavedEstimate } from '@/lib/types';

export default function SavedScreen() {
  const { session, loading } = useSession();

  if (!isCloudConfigured) {
    return (
      <View style={styles.centered}>
        <Text style={styles.noticeTitle}>Nube no configurada</Text>
        <Text style={styles.noticeText}>
          Crea un proyecto gratis en supabase.com, ejecuta supabase/schema.sql y copia tus llaves
          al archivo .env (mira el README). La pestaña Estimar funciona sin esto.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Palette.accent} size="large" />
      </View>
    );
  }

  if (!session) {
    return <AuthForm />;
  }

  return <SavedList session={session} />;
}

function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function signIn() {
    setBusy(true);
    setMessage(null);
    const { error } = await supabase!.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setMessage(`No se pudo iniciar sesión: ${error.message}`);
  }

  async function signUp() {
    setBusy(true);
    setMessage(null);
    const { data, error } = await supabase!.auth.signUp({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      setMessage(`No se pudo crear la cuenta: ${error.message}`);
    } else if (!data.session) {
      setMessage('Cuenta creada. Revisa tu correo y confírmala para poder entrar.');
    }
  }

  return (
    <View style={styles.authContainer}>
      <Text style={styles.noticeTitle}>Tu nube de estimaciones</Text>
      <Text style={styles.noticeText}>
        Inicia sesión para guardar estimaciones y verlas desde cualquier dispositivo.
      </Text>

      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Correo"
        placeholderTextColor={Palette.textSecondary}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Contraseña (mínimo 6 caracteres)"
        placeholderTextColor={Palette.textSecondary}
        secureTextEntry
      />

      <Pressable
        style={[styles.primaryButton, busy && styles.buttonDisabled]}
        onPress={signIn}
        disabled={busy}>
        <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
      </Pressable>
      <Pressable
        style={[styles.secondaryButton, busy && styles.buttonDisabled]}
        onPress={signUp}
        disabled={busy}>
        <Text style={styles.secondaryButtonText}>Crear cuenta</Text>
      </Pressable>

      {busy && <ActivityIndicator color={Palette.accent} style={{ marginTop: Spacing.three }} />}
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

function SavedList({ session }: { session: Session }) {
  const [items, setItems] = useState<SavedEstimate[]>([]);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    const { data, error } = await supabase!
      .from('saved_estimates')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setMessage(`Error al cargar: ${error.message}`);
    } else {
      setItems((data ?? []) as SavedEstimate[]);
      setMessage(null);
    }
    setBusy(false);
  }, []);

  // Refresh whenever the tab gains focus so new saves show up immediately.
  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [fetchItems])
  );

  function toggleSelect(id: string) {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((s) => s !== id);
      if (current.length >= 2) return [current[1], id];
      return [...current, id];
    });
  }

  async function deleteItem(id: string) {
    const { error } = await supabase!.from('saved_estimates').delete().eq('id', id);
    if (error) {
      setMessage(`Error al eliminar: ${error.message}`);
    } else {
      setItems((current) => current.filter((item) => item.id !== id));
      setSelected((current) => current.filter((s) => s !== id));
    }
    setConfirmDelete(null);
  }

  const [a, b] = selected.map((id) => items.find((item) => item.id === id));
  const comparison =
    a && b
      ? {
          cheaper: a.predicted_price <= b.predicted_price ? a : b,
          pricier: a.predicted_price <= b.predicted_price ? b : a,
        }
      : null;

  return (
    <View style={styles.flex}>
      <View style={styles.headerRow}>
        <Text style={styles.headerEmail} numberOfLines={1}>
          {session.user.email}
        </Text>
        <Pressable onPress={() => supabase!.auth.signOut()}>
          <Text style={styles.signOut}>Salir</Text>
        </Pressable>
      </View>

      {comparison && (
        <View style={styles.compareCard}>
          <Text style={styles.compareTitle}>Comparación</Text>
          <Text style={styles.compareLine}>
            {comparison.pricier.label}: {formatDOP(comparison.pricier.predicted_price)}
          </Text>
          <Text style={styles.compareLine}>
            {comparison.cheaper.label}: {formatDOP(comparison.cheaper.predicted_price)}
          </Text>
          <Text style={styles.compareDiff}>
            Diferencia: {formatDOP(comparison.pricier.predicted_price - comparison.cheaper.predicted_price)}
            {comparison.cheaper.predicted_price > 0 &&
              ` (${(
                ((comparison.pricier.predicted_price - comparison.cheaper.predicted_price) /
                  comparison.cheaper.predicted_price) *
                100
              ).toFixed(0)}% más caro)`}
          </Text>
        </View>
      )}

      {message && <Text style={styles.message}>{message}</Text>}

      {busy ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Palette.accent} size="large" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.noticeText}>
              Aún no has guardado estimaciones. Haz una en la pestaña Estimar y toca “Guardar en
              la nube”. Toca dos tarjetas para compararlas.
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.card, selected.includes(item.id) && styles.cardSelected]}
              onPress={() => toggleSelect(item.id)}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel} numberOfLines={1}>
                  {item.label}
                </Text>
                <Pressable
                  onPress={() =>
                    confirmDelete === item.id ? deleteItem(item.id) : setConfirmDelete(item.id)
                  }>
                  <Text style={styles.delete}>
                    {confirmDelete === item.id ? '¿Eliminar?' : 'Eliminar'}
                  </Text>
                </Pressable>
              </View>
              <Text style={styles.cardDetail}>
                {item.sector} · {item.area_m2} m² · {item.bedrooms} hab · {item.bathrooms} baños
              </Text>
              <Text style={styles.cardDetail}>
                {item.parking_spots} parqueos · {item.furnished ? 'amueblado' : 'sin amueblar'} ·{' '}
                {item.age_years} años
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardPrice}>{formatDOP(item.predicted_price)}</Text>
                <Text style={styles.cardDate}>{item.created_at.slice(0, 10)}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Palette.background },
  centered: {
    flex: 1,
    backgroundColor: Palette.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  noticeTitle: { color: Palette.text, fontSize: 18, fontWeight: '700', marginBottom: Spacing.two },
  noticeText: {
    color: Palette.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    paddingHorizontal: Spacing.three,
  },
  authContainer: {
    flex: 1,
    backgroundColor: Palette.background,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  input: {
    backgroundColor: Palette.card,
    borderColor: Palette.border,
    borderWidth: 1,
    borderRadius: 10,
    color: Palette.text,
    fontSize: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    marginTop: Spacing.three,
  },
  primaryButton: {
    backgroundColor: Palette.accent,
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    marginTop: Spacing.four,
  },
  primaryButtonText: { color: Palette.accentText, fontSize: 16, fontWeight: '700' },
  secondaryButton: {
    backgroundColor: Palette.card,
    borderColor: Palette.accent,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    marginTop: Spacing.three,
  },
  secondaryButtonText: { color: Palette.accent, fontSize: 15, fontWeight: '700' },
  buttonDisabled: { opacity: 0.6 },
  message: {
    color: Palette.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  headerEmail: { color: Palette.textSecondary, fontSize: 13, flex: 1, marginRight: Spacing.two },
  signOut: { color: Palette.danger, fontSize: 14, fontWeight: '600' },
  compareCard: {
    backgroundColor: Palette.card,
    borderColor: Palette.accent,
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing.three,
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
  },
  compareTitle: {
    color: Palette.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.one,
  },
  compareLine: { color: Palette.text, fontSize: 14 },
  compareDiff: { color: Palette.accent, fontSize: 15, fontWeight: '700', marginTop: Spacing.one },
  listContent: { padding: Spacing.three, paddingTop: Spacing.two },
  card: {
    backgroundColor: Palette.card,
    borderColor: Palette.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  cardSelected: { borderColor: Palette.accent, backgroundColor: Palette.cardSelected },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.one,
  },
  cardLabel: { color: Palette.text, fontSize: 16, fontWeight: '700', flex: 1, marginRight: Spacing.two },
  delete: { color: Palette.danger, fontSize: 13, fontWeight: '600' },
  cardDetail: { color: Palette.textSecondary, fontSize: 13, marginTop: 2 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  cardPrice: { color: Palette.accent, fontSize: 20, fontWeight: '800' },
  cardDate: { color: Palette.textSecondary, fontSize: 12 },
});
