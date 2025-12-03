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

export default function PrescribeMedicineScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { appointmentId, patientId, patientName = 'Bệnh nhân' } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [treatment, setTreatment] = useState('');
  const [notes, setNotes] = useState('');

  // ĐƠN THUỐC
  const [medicines, setMedicines] = useState([
    { id: Date.now(), name: '', dosage: '', duration: '', query: '', suggestions: [], show: false }
  ]);
  const [allMedicines, setAllMedicines] = useState([]);

  useEffect(() => {
    fetchTestResults();
    fetchMedicines();
  }, []);

  // LẤY KẾT QUẢ XÉT NGHIỆM (để bác sĩ đọc trước khi kê đơn)
  const fetchTestResults = async () => {
    try {
      const { data } = await supabase
        .from('test_results')
        .select('*')
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: false });

      setTestResults(data || []);
    } catch (err) {
      console.log('Lỗi tải kết quả xét nghiệm:', err);
    }
  };

  // TẢI DANH MỤC THUỐC
  const fetchMedicines = async () => {
    try {
      const { data } = await supabase
        .from('medicines')
        .select('name, generic_name, dosage, form')
        .order('name');
      setAllMedicines(data || []);
    } catch (err) {
      console.log('Lỗi tải danh mục thuốc:', err);
    }
  };

  // TÌM KIẾM THUỐC
  const searchMedicine = (text, index) => {
    if (!text.trim()) {
      updateMedicine(index, 'suggestions', []);
      updateMedicine(index, 'show', false);
      return;
    }
    const filtered = allMedicines
      .filter(m =>
        m.name.toLowerCase().includes(text.toLowerCase()) ||
        (m.generic_name && m.generic_name.toLowerCase().includes(text.toLowerCase()))
      )
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

  const addMedicine = () => {
    setMedicines(prev => [...prev, {
      id: Date.now(),
      name: '', dosage: '', duration: '', query: '', suggestions: [], show: false
    }]);
  };

  const removeMedicine = (index) => {
    if (medicines.length > 1) {
      setMedicines(prev => prev.filter((_, i) => i !== index));
    }
  };

  // LƯU ĐƠN THUỐC
  const handleSavePrescription = async () => {
    const validMeds = medicines.filter(m => m.name.trim());
    if (validMeds.length === 0) {
      return Alert.alert('Lỗi', 'Vui lòng kê ít nhất 1 loại thuốc');
    }

    setLoading(true);
    try {
      // Lấy medical_record trước đó
      const { data: record } = await supabase
        .from('medical_records')
        .select('id')
        .eq('appointment_id', appointmentId)
        .single();

      if (!record) throw new Error('Không tìm thấy bệnh án');

      // Lưu đơn thuốc
      const { error } = await supabase
        .from('prescriptions')
        .insert(
          validMeds.map(m => ({
            record_id: record.id,
            medicine_name: m.name,
            dosage: m.dosage?.trim() || null,
            duration: m.duration?.trim() || null,
          }))
        );

      if (error) throw error;

      // Cập nhật treatment + notes vào medical_records
      await supabase
        .from('medical_records')
        .update({
          treatment: treatment.trim() || null,
          notes: (notes.trim() || '') + '\n\n[Đã kê đơn thuốc]',
        })
        .eq('id', record.id);

      Alert.alert(
        'Thành công!',
        'Đơn thuốc đã được lưu và gửi cho bệnh nhân!',
        [{ text: 'OK', onPress: () => navigation.replace('DoctorMain') }]
      );
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', err.message || 'Không thể lưu đơn thuốc');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor="#10B981" />

      {/* HEADER */}
      <LinearGradient colors={['#10B981', '#059669']} style={{ paddingTop: 50, paddingBottom: 24, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff', marginLeft: 16 }}>
            Kê đơn thuốc
          </Text>
        </View>
        <Text style={{ color: '#ECFDF5', fontSize: 16, marginTop: 8 }}>
          Bệnh nhân: <Text style={{ fontWeight: 'bold' }}>{patientName}</Text>
        </Text>
      </LinearGradient>

      <ScrollView style={{ flex: 1, backgroundColor: '#F0FDF4' }} contentContainerStyle={{ padding: 20 }}>

        {/* KẾT QUẢ XÉT NGHIỆM */}
        {testResults.length > 0 && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Kết quả xét nghiệm</Text>
            {testResults.map((t, i) => (
              <View key={t.id} style={{ marginBottom: 12 }}>
                <Text style={{
                  fontWeight: 'bold',
                  color: t.status === 'abnormal' || t.status === 'critical' ? '#DC2626' : '#16A34A',
                }}>
                  {i + 1}. {t.test_name}
                  {t.status === 'abnormal' && ' ← BẤT THƯỜNG'}
                  {t.status === 'critical' && ' ← NGUY HIỂM'}
                </Text>
                {t.result_value && (
                  <Text style={{ color: '#475569', marginTop: 4 }}>
                    → {t.result_value} {t.unit || ''}{' '}
                    {t.reference_range && `(Bình thường: ${t.reference_range})`}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ĐƠN THUỐC */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={styles.label}>Đơn thuốc</Text>
            <TouchableOpacity onPress={addMedicine}>
              <Ionicons name="add-circle" size={40} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          {medicines.map((med, i) => (
            <View key={med.id} style={{ marginBottom: 20 }}>
              <View style={styles.searchBox}>
                <Ionicons name="search" size={20} color="#94A3B8" style={{ marginRight: 12 }} />
                <TextInput
                  style={{ flex: 1, fontSize: 16 }}
                  placeholder="Tìm tên thuốc..."
                  value={med.query}
                  onChangeText={t => {
                    updateMedicine(i, 'query', t);
                    searchMedicine(t, i);
                  }}
                />
                {medicines.length > 1 && (
                  <TouchableOpacity onPress={() => removeMedicine(i)}>
                    <Ionicons name="close-circle" size={28} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>

              {med.show && med.suggestions.length > 0 && (
                <View style={styles.suggestions}>
                  {med.suggestions.map((s, idx) => (
                    <TouchableOpacity key={idx} style={styles.suggestion} onPress={() => selectMedicine(s, i)}>
                      <Text style={{ fontWeight: 'bold' }}>{s.name}</Text>
                      <Text style={{ fontSize: 13, color: '#64748B' }}>
                        {s.generic_name || s.dosage || s.form}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                <TextInput style={styles.input} placeholder="Liều lượng" value={med.dosage} onChangeText={t => updateMedicine(i, 'dosage', t)} />
                <TextInput style={styles.input} placeholder="Thời gian dùng" value={med.duration} onChangeText={t => updateMedicine(i, 'duration', t)} />
              </View>
            </View>
          ))}
        </View>

        {/* DẶN DÒ */}
        <View style={styles.card}>
          <Text style={styles.label}>Dặn dò / Hướng dẫn điều trị</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Uống nhiều nước, tái khám sau 5 ngày..."
            value={treatment}
            onChangeText={setTreatment}
            multiline
          />
        </View>

        {/* NÚT HOÀN TẤT */}
        <TouchableOpacity onPress={handleSavePrescription} disabled={loading} style={{ marginVertical: 30 }}>
          <LinearGradient colors={loading ? ['#94A3B8', '#64748B'] : ['#DC2626', '#B91C1C']} style={styles.saveBtn}>
            {loading ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <>
                <Ionicons name="medkit" size={32} color="#fff" />
                <Text style={styles.saveText}>HOÀN TẤT ĐƠN THUỐC</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// STYLE ĐẸP NHƯ BỆNH VIỆN 5 SAO
const styles = {
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  resultCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 12,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  suggestions: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginTop: 8,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  suggestion: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 20,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  saveText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
};