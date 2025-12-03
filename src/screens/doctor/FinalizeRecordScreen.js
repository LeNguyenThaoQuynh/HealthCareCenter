import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../api/supabase';

export default function FinalizeRecordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { appointmentId, patientId, patientName = 'Bệnh nhân' } = route.params || {};

  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [notes, setNotes] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [medicines, setMedicines] = useState([
    {
      id: Date.now(),
      name: '',
      query: '',
      suggestions: [],
      show: false,
      morning: '1',
      noon: '0',
      afternoon: '1',
      evening: '0',
      quantityPerDose: '1',
      days: '7',
      totalQuantity: 14,
    }
  ]);
  const [allMedicines, setAllMedicines] = useState([]);

  useEffect(() => {
    if (!appointmentId || !patientId) {
      Alert.alert('Lỗi', 'Thiếu thông tin cuộc hẹn');
      navigation.goBack();
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([fetchTestResults(), fetchMedicines()]);
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể tải dữ liệu');
    }
  };

  const fetchTestResults = async () => {
    const { data } = await supabase
      .from('test_results')
      .select('*')
      .eq('appointment_id', appointmentId);
    setTestResults(data || []);
  };

  const fetchMedicines = async () => {
    const { data } = await supabase
      .from('medicines')
      .select('name, generic_name, dosage, form, price')
      .order('name');
    setAllMedicines(data || []);
  };

  const calculateTotalQuantity = (med) => {
    const dosesPerDay = 
      Number(med.morning || 0) + 
      Number(med.noon || 0) + 
      Number(med.afternoon || 0) + 
      Number(med.evening || 0);
    const perDose = Number(med.quantityPerDose) || 1;
    const days = Number(med.days) || 1;
    return dosesPerDay * perDose * days;
  };

  const updateMedicine = (index, field, value) => {
    setMedicines(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (['morning', 'noon', 'afternoon', 'evening', 'quantityPerDose', 'days'].includes(field)) {
        updated[index].totalQuantity = calculateTotalQuantity(updated[index]);
      }
      return updated;
    });
  };

  const searchMedicine = (text, index) => {
    if (!text.trim()) {
      updateMedicine(index, 'suggestions', []);
      updateMedicine(index, 'show', false);
      return;
    }
    const filtered = allMedicines
      .filter(m => 
        m.name?.toLowerCase().includes(text.toLowerCase()) || 
        m.generic_name?.toLowerCase().includes(text.toLowerCase())
      )
      .slice(0, 8);
    updateMedicine(index, 'suggestions', filtered);
    updateMedicine(index, 'show', true);
  };

  const selectMedicine = (med, index) => {
    setMedicines(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        name: med.name,
        query: med.name,
        suggestions: [],
        show: false,
        morning: '1', noon: '0', afternoon: '1', evening: '0',
        quantityPerDose: '1',
        days: '7',
        totalQuantity: 14,
      };
      return updated;
    });
  };

  const addMedicine = () => {
    setMedicines(prev => [...prev, {
      id: Date.now() + Math.random(),
      name: '', query: '', suggestions: [], show: false,
      morning: '1', noon: '0', afternoon: '1', evening: '0',
      quantityPerDose: '1', days: '7', totalQuantity: 14,
    }]);
  };

  const removeMedicine = (index) => {
    if (medicines.length === 1) return;
    setMedicines(prev => prev.filter((_, i) => i !== index));
  };

  // HOÀN TẤT + LƯU BỆNH ÁN + ĐƠN THUỐC → CHUYỂN THANH TOÁN
  const finalizeAndGoToPayment = async () => {
    if (!diagnosis.trim()) {
      return Alert.alert('Lỗi', 'Vui lòng nhập chẩn đoán chính thức');
    }

    setLoading(true);

    try {
      // 1. Tạo / Cập nhật bệnh án
      let recordId;
      const { data: existingRecord } = await supabase
        .from('medical_records')
        .select('id')
        .eq('appointment_id', appointmentId)
        .maybeSingle();

      if (existingRecord) {
        recordId = existingRecord.id;
        await supabase
          .from('medical_records')
          .update({
            diagnosis: diagnosis.trim(),
            treatment: treatment.trim() || null,
            notes: notes.trim() || null,
          })
          .eq('id', recordId);
      } else {
        const { data: newRecord } = await supabase
          .from('medical_records')
          .insert({
            patient_id: patientId,
            appointment_id: appointmentId,
            diagnosis: diagnosis.trim(),
            treatment: treatment.trim() || null,
            notes: notes.trim() || null,
          })
          .select('id')
          .single();
        recordId = newRecord.id;
      }

      // 2. Lưu đơn thuốc vào bảng prescriptions
      const validMedicines = medicines
        .filter(m => m.name.trim())
        .map(m => ({
          record_id: recordId,
          medicine_name: m.name.trim(),
          dosage: `${m.quantityPerDose} viên x ${(Number(m.morning) + Number(m.noon) + Number(m.afternoon) + Number(m.evening))} lần/ngày`,
          duration: `${m.days} ngày`,
          morning: m.morning,
          noon: m.noon,
          afternoon: m.afternoon,
          evening: m.evening,
          quantity_per_dose: Number(m.quantityPerDose) || 1,
          total_quantity: m.totalQuantity,
        }));

      if (validMedicines.length > 0) {
        const { error } = await supabase
          .from('prescriptions')
          .insert(validMedicines);
        if (error) throw error;
      }

      // 3. Chuyển sang thanh toán
      navigation.replace('PaymentSummaryScreen', {
        appointmentId,
        patientId,
        patientName,
        diagnosis: diagnosis.trim(),
        treatment: treatment.trim() || null,
        notes: notes.trim() || null,
      });

    } catch (err) {
      console.error('Lỗi hoàn tất:', err);
      Alert.alert('Lỗi', err.message || 'Không thể hoàn tất. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor="#7C2D12" />

      {/* HEADER */}
      <LinearGradient colors={['#7C2D12', '#4C1D0A']} style={{ paddingTop: 50, paddingBottom: 24, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={{ fontSize: 23, fontWeight: 'bold', color: '#fff', marginLeft: 16 }}>
            Hoàn tất khám bệnh
          </Text>
        </View>
        <Text style={{ color: '#FECACA', fontSize: 17, marginTop: 8 }}>
          Bệnh nhân: <Text style={{ fontWeight: 'bold' }}>{patientName}</Text>
        </Text>
      </LinearGradient>

      <ScrollView style={{ flex: 1, backgroundColor: '#FFFBFE' }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>

        {/* KẾT QUẢ XÉT NGHIỆM */}
        {testResults.length > 0 && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Kết quả xét nghiệm</Text>
            {testResults.map((t, i) => (
              <Text key={i} style={{
                fontWeight: 'bold',
                color: t.status === 'abnormal' ? '#DC2626' : '#16A34A',
                marginBottom: 8,
                fontSize: 16
              }}>
                • {t.test_name}: {t.result_value} {t.unit} {t.status === 'abnormal' && '(Bất thường)'}
              </Text>
            ))}
          </View>
        )}

        {/* CHẨN ĐOÁN */}
        <View style={styles.card}>
          <Text style={styles.label}>Chẩn đoán chính thức <Text style={{ color: '#DC2626' }}>*</Text></Text>
          <TextInput
            style={styles.textArea}
            placeholder="Viêm họng cấp..."
            value={diagnosis}
            onChangeText={setDiagnosis}
            multiline
          />
        </View>

        {/* ĐƠN THUỐC */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={styles.label}>Đơn thuốc ({medicines.filter(m => m.name).length})</Text>
            <TouchableOpacity onPress={addMedicine}>
              <Ionicons name="add-circle" size={48} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          {medicines.map((med, i) => (
            <View key={med.id} style={{ marginBottom: 32, backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16 }}>
              {/* UI ĐƠN THUỐC GIỮ NGUYÊN ĐẸP LUNG LINH */}
              {med.name ? (
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 19, fontWeight: 'bold', color: '#1E293B' }}>{med.name}</Text>
                    <TouchableOpacity onPress={() => {
                      setMedicines(prev => {
                        const u = [...prev];
                        u[i].name = '';
                        u[i].query = '';
                        return u;
                      });
                    }}>
                      <Text style={{ color: '#3B82F6', fontWeight: '600' }}>Sửa</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8 }}>Uống theo buổi:</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                    {['morning', 'noon', 'afternoon', 'evening'].map((time, idx) => (
                      <View key={time} style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 14, marginBottom: 4 }}>
                          {['Sáng', 'Trưa', 'Chiều', 'Tối'][idx]}
                        </Text>
                        <TextInput
                          style={styles.doseInput}
                          value={med[time]}
                          onChangeText={t => updateMedicine(i, time, t.replace(/[^0-9]/g, '') || '0')}
                          keyboardType="numeric"
                        />
                      </View>
                    ))}
                  </View>

                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, marginBottom: 4 }}>Số viên/lần</Text>
                      <TextInput style={styles.input} value={med.quantityPerDose} onChangeText={t => updateMedicine(i, 'quantityPerDose', t)} keyboardType="numeric" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, marginBottom: 4 }}>Số ngày</Text>
                      <TextInput style={styles.input} value={med.days} onChangeText={t => updateMedicine(i, 'days', t)} keyboardType="numeric" />
                    </View>
                  </View>

                  <View style={{ backgroundColor: '#DCFCE7', padding: 16, borderRadius: 12, alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#166534' }}>
                      Tổng phát: {med.totalQuantity} viên
                    </Text>
                  </View>

                  {medicines.length > 1 && (
                    <TouchableOpacity onPress={() => removeMedicine(i)} style={{ marginTop: 16, alignSelf: 'flex-end' }}>
                      <Text style={{ color: '#EF4444', fontWeight: '600' }}>Xóa thuốc</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View>
                  <View style={styles.searchBox}>
                    <Ionicons name="search" size={22} color="#94A3B8" />
                    <TextInput
                      style={{ flex: 1, fontSize: 16, paddingVertical: 14, marginLeft: 12 }}
                      placeholder="Tìm tên thuốc..."
                      value={med.query}
                      onChangeText={t => {
                        updateMedicine(i, 'query', t);
                        searchMedicine(t, i);
                      }}
                    />
                    {medicines.length > 1 && (
                      <TouchableOpacity onPress={() => removeMedicine(i)}>
                        <Ionicons name="close-circle" size={30} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {med.show && med.suggestions.length > 0 && (
                    <View style={styles.suggestions}>
                      {med.suggestions.map((s, idx) => (
                        <TouchableOpacity key={idx} style={styles.suggestion} onPress={() => selectMedicine(s, i)}>
                          <Text style={{ fontWeight: 'bold' }}>{s.name}</Text>
                          <Text style={{ fontSize: 13, color: '#64748B' }}>{s.generic_name || s.dosage}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* DẶN DÒ */}
        <View style={styles.card}>
          <Text style={styles.label}>Dặn dò bệnh nhân</Text>
          <TextInput style={styles.textArea} placeholder="Uống nhiều nước, nghỉ ngơi..." value={treatment} onChangeText={setTreatment} multiline />
        </View>

        {/* NÚT HOÀN TẤT */}
        <TouchableOpacity onPress={finalizeAndGoToPayment} disabled={loading}>
          <LinearGradient
            colors={loading ? ['#94A3B8', '#64748B'] : ['#16A34A', '#15803D']}
            style={styles.paymentBtn}
          >
            {loading ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={36} color="#fff" />
                <Text style={styles.paymentText}>HOÀN TẤT & THANH TOÁN</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = {
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, elevation: 8 },
  resultCard: { backgroundColor: '#FFF7ED', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 2, borderColor: '#F97316' },
  resultTitle: { fontSize: 19, fontWeight: 'bold', color: '#C2410C', marginBottom: 14 },
  label: { fontSize: 19, fontWeight: 'bold', color: '#1E293B', marginBottom: 12 },
  textArea: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, fontSize: 16, minHeight: 120, textAlignVertical: 'top', borderWidth: 1.5, borderColor: '#E2E8F0' },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1.5, borderColor: '#E2E8F0' },
  doseInput: { backgroundColor: '#fff', width: 50, height: 50, borderRadius: 12, textAlign: 'center', fontSize: 18, fontWeight: 'bold', borderWidth: 2, borderColor: '#22C55E' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1.5, borderColor: '#E2E8F0' },
  suggestions: { backgroundColor: '#fff', borderRadius: 16, marginTop: 8, maxHeight: 240, borderWidth: 1, borderColor: '#E2E8F0' },
  suggestion: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  paymentBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, paddingVertical: 28, borderRadius: 30, marginVertical: 30, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 20, elevation: 18 },
  paymentText: { color: '#fff', fontSize: 24, fontWeight: 'bold', letterSpacing: 1.5 },
};