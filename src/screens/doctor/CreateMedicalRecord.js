import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../api/supabase';
import theme from '../../theme/theme';

const {
  COLORS,
  GRADIENTS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  FONT_SIZE,
  FONT_WEIGHT,
} = theme;

export default function CreateMedicalRecord() {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    appointmentId,
    patientId,
    patientName = 'Bệnh nhân',
    onSaveSuccess,
  } = route.params || {};

  const [saving, setSaving] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [notes, setNotes] = useState('');
  const [medicines, setMedicines] = useState([
    { id: Date.now(), name: '', dosage: '', duration: '', query: '', suggestions: [], show: false }
  ]);
  const [allMedicines, setAllMedicines] = useState([]);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const { data } = await supabase.from('medicines').select('name, generic_name, dosage, form').order('name');
      setAllMedicines(data || []);
    } catch (err) { console.log(err); }
  };

  const searchMedicine = (text, index) => {
    if (!text.trim()) {
      updateMedicine(index, 'suggestions', []);
      updateMedicine(index, 'show', false);
      return;
    }
    const filtered = allMedicines
      .filter(m => m.name.toLowerCase().includes(text.toLowerCase()) || 
                  (m.generic_name && m.generic_name.toLowerCase().includes(text.toLowerCase())))
      .slice(0, 6);
    updateMedicine(index, 'suggestions', filtered);
    updateMedicine(index, 'show', true);
  };

  const selectMedicine = (med, index) => {
    updateMedicine(index, 'name', med.name);
    updateMedicine(index, 'dosage', med.dosage || '1 viên/lần x 3 lần/ngày');
    updateMedicine(index, 'query', med.name);
    updateMedicine(index, 'suggestions', []);
    updateMedicine(index, 'show', false);
  };

  const updateMedicine = (index, field, value) => {
    setMedicines(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addMedicine = () => setMedicines(prev => [...prev, {
    id: Date.now(), name: '', dosage: '', duration: '', query: '', suggestions: [], show: false
  }]);

  const removeMedicine = (index) => {
    if (medicines.length > 1) setMedicines(prev => prev.filter((_, i) => i !== index));
  };

  const saveRecord = async () => {
    if (!diagnosis.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập chẩn đoán');

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const doctorId = user?.id;

      const { data: record } = await supabase
        .from('medical_records')
        .insert({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_id: appointmentId,
          diagnosis: diagnosis.trim(),
          treatment: treatment.trim() || null,
          notes: notes.trim() || null,
        })
        .select()
        .single();

      const validMeds = medicines.filter(m => m.name.trim());
      if (validMeds.length > 0) {
        await supabase.from('prescriptions').insert(
          validMeds.map(m => ({
            record_id: record.id,
            medicine_name: m.name,
            dosage: m.dosage,
            duration: m.duration || null,
          }))
        );
      }

      await supabase.from('appointments').update({ status: 'completed' }).eq('id', appointmentId);

      Alert.alert('Thành công', 'Bệnh án đã được lưu!', [
        { text: 'OK', onPress: () => {
          onSaveSuccess?.();
          navigation.navigate('DoctorMain', { screen: 'AppointmentsTab' });
        }}
      ]);
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể lưu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* HEADER XANH APPLE ĐẸP LUNG LINH */}
      <LinearGradient colors={GRADIENTS.header} style={{ paddingTop: theme.headerPaddingTop, paddingBottom: SPACING.xxl, paddingHorizontal: SPACING.xl }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={{ fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.heavy, color: '#fff' }}>
            Tạo bệnh án
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={{ color: '#fff', fontSize: FONT_SIZE.lg, marginTop: SPACING.sm, opacity: 0.9 }}>
          Bệnh nhân: <Text style={{ fontWeight: FONT_WEIGHT.bold }}>{patientName}</Text>
        </Text>
      </LinearGradient>

      <ScrollView 
        style={{ flex: 1, backgroundColor: COLORS.background, marginTop: -20 }}
        contentContainerfilt={{ padding: SPACING.xl, paddingTop: SPACING.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* CHẨN ĐOÁN */}
        <View style={s.card}>
          <Text style={s.label}>Chẩn đoán <Text style={{ color: COLORS.danger }}>*</Text></Text>
          <TextInput
            style={s.textArea}
            placeholder="Viêm họng cấp, sốt..."
            value={diagnosis}
            onChangeText={setDiagnosis}
            multiline
          />
        </View>

        {/* ĐƠN THUỐC – SIÊU ĐẸP, SIÊU NHANH */}
        <View style={s.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg }}>
            <Text style={s.label}>Đơn thuốc</Text>
            <TouchableOpacity onPress={addMedicine}>
              <Ionicons name="add-circle" size={36} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {medicines.map((med, i) => (
            <View key={med.id} style={{ marginBottom: SPACING.xl }}>
              <View style={s.searchBox}>
                <Ionicons name="search" size={20} color={COLORS.textLight} style={{ marginRight: SPACING.md }} />
                <TextInput
                  style={{ flex: 1, fontSize: FONT_SIZE.lg }}
                  placeholder="Tìm tên thuốc..."
                  value={med.query}
                  onChangeText={t => { updateMedicine(i, 'query', t); searchMedicine(t, i); }}
                />
                {medicines.length > 1 && (
                  <TouchableOpacity onPress={() => removeMedicine(i)}>
                    <Ionicons name="close-circle" size={28} color={COLORS.danger} />
                  </TouchableOpacity>
                )}
              </View>

              {med.show && med.suggestions.length > 0 && (
                <View style={s.suggestions}>
                  {med.suggestions.map((s, idx) => (
                    <TouchableOpacity key={idx} style={s.suggestion} onPress={() => selectMedicine(s, i)}>
                      <Text style={{ fontWeight: FONT_WEIGHT.semibold, color: COLORS.textPrimary }}>{s.name}</Text>
                      <Text style={{ fontSize: FONT_SIZE.sm, color: COLORS.textSecondary }}>
                        {s.generic_name || s.dosage}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md }}>
                <TextInput style={s.input} placeholder="Liều lượng" value={med.dosроб} onChangeText={t => updateMedicine(i, 'dosage', t)} />
                <TextInput style={s.input} placeholder="Thời gian dùng" value={med.duration} onChangeText={t => updateMedicine(i, 'duration', t)} />
              </View>
            </View>
          ))}
        </View>

        {/* DẶN DÒ */}
        <View style={s.card}>
          <Text style={s.label}>Dặn dò / Hướng dẫn điều trị</Text>
          <TextInput style={s.textArea} placeholder="Uống nhiều nước, nghỉ ngơi..." value={treatment} onChangeText={setTreatment} multiline />
        </View>

        {/* GHI CHÚ */}
        <View style={s.card}>
          <Text style={s.label}>Ghi chú thêm</Text>
          <TextInput style={s.textArea} placeholder="Thông tin bổ sung..." value={notes} onChangeText={setNotes} multiline />
        </View>

        {/* NÚT HOÀN TẤT */}
        <TouchableOpacity onPress={saveRecord} disabled={saving} style={{ marginVertical: SPACING.xxl }}>
          <LinearGradient colors={GRADIENTS.primaryButton} style={s.saveBtn}>
            {saving ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <>
                <Ionicons name="checkmark-done" size={30} color="#fff" />
                <Text style={s.saveText}>HOÀN TẤT KHÁM BỆNH</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// STYLE DỄ THƯƠNG, CHUẨN THEME, ĐẸP KHÔNG CHỊU NỔI
const s = {
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    ...SHADOWS.card,
  },
  label: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  textArea: {
    backgroundColor: '#F2F4F7',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    fontSize: FONT_SIZE.lg,
    minHeight: 110,
    textAlignVertical: 'top',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  input: {
    flex: 1,
    backgroundColor: '#F2F4F7',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    fontSize: FONT_SIZE.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F4F7',
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  suggestions: {
    backgroundColor: '#fff',
    borderRadius: BORDER_RADIUS.xl,
    marginTop: SPACING.sm,
    maxHeight: 240,
    ...SHADOWS.card,
  },
  suggestion: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
    paddingVertical: SPACING.xl,
    borderRadius: BORDER_RADIUS.xxl,
    ...SHADOWS.header,
  },
  saveText: {
    color: '#fff',
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.heavy,
    letterSpacing: 1,
  },
};