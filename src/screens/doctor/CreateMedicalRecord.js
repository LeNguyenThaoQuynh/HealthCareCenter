// src/screens/doctor/CreateMedicalRecord.js
import React, { useState } from 'react';
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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../api/supabase';

export default function CreateMedicalRecord() {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    appointmentId,
    patientId,
    patientName,
    department = 'Phòng khám',
    onSaveSuccess,
  } = route.params || {};

  const [loading, setLoading] = useState(false);

  // Hồ sơ bệnh án
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [notes, setNotes] = useState('');

  // Đơn thuốc
  const [medicines, setMedicines] = useState([
    { medicine_name: '', dosage: '', duration: '' },
  ]);

  // Kết quả xét nghiệm (tùy chọn)
  const [testResults, setTestResults] = useState([
    { test_type: '', test_name: '', result_value: '', unit: '', reference_range: '' },
  ]);

  // LẤY UID BÁC SĨ HIỆN TẠI – CHẮC CHẮN ĐÚNG 100%
  const getCurrentDoctorId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  };

  const addMedicineRow = () => setMedicines([...medicines, { medicine_name: '', dosage: '', duration: '' }]);
  const removeMedicineRow = (i) => medicines.length > 1 && setMedicines(medicines.filter((_, idx) => idx !== i));

  const updateMedicine = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const addTestRow = () => setTestResults([...testResults, { test_type: '', test_name: '', result_value: '', unit: '', reference_range: '' }]);
  const updateTest = (index, field, value) => {
    const updated = [...testResults];
    updated[index][field] = value;
    setTestResults(updated);
  };

  const handleSave = async () => {
    if (!diagnosis.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập chẩn đoán');
      return;
    }

    setLoading(true);

    try {
      const doctorId = await getCurrentDoctorId();
      if (!doctorId) throw new Error('Không xác định được bác sĩ hiện tại');

      // 1. Tạo medical_records – DÙNG doctorId = auth.uid() → RLS QUA 100%
      const { data: record, error: recordError } = await supabase
        .from('medical_records')
        .insert({
          patient_id: patientId,
          doctor_id: doctorId,           // ← QUAN TRỌNG NHẤT: DÙNG UID TRỰC TIẾP
          appointment_id: appointmentId,
          diagnosis: diagnosis.trim(),
          treatment: treatment.trim() || null,
          notes: notes.trim() || null,
        })
        .select()
        .single();

      if (recordError) throw recordError;

      // 2. Lưu đơn thuốc
      const validMedicines = medicines.filter(m => m.medicine_name.trim());
      if (validMedicines.length > 0) {
        const prescData = validMedicines.map(m => ({
          record_id: record.id,
          medicine_name: m.medicine_name.trim(),
          dosage: m.dosage.trim() || null,
          duration: m.duration.trim() || null,
        }));
        const { error: prescError } = await supabase.from('prescriptions').insert(prescData);
        if (prescError) throw prescError;
      }

      // 3. Lưu kết quả xét nghiệm
      const validTests = testResults.filter(t => t.test_name.trim());
      if (validTests.length > 0) {
        const testData = validTests.map(t => ({
          patient_id: patientId,
          appointment_id: appointmentId,
          test_type: t.test_type.trim() || null,
          test_name: t.test_name.trim(),
          result_value: t.result_value.trim() || null,
          unit: t.unit.trim() || null,
          reference_range: t.reference_range.trim() || null,
          status: t.result_value.trim() ? 'completed' : 'pending',
          performed_at: new Date().toISOString().split('T')[0],
        }));
        const { error: testError } = await supabase.from('test_results').insert(testData);
        if (testError) throw testError;
      }

      // 4. Cập nhật trạng thái lịch hẹn → đã khám xong
      await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId);

      Alert.alert(
        'HOÀN TẤT KHÁM BỆNH',
        'Hồ sơ bệnh án và đơn thuốc đã được lưu thành công!',
        [{ text: 'OK', onPress: () => {
          onSaveSuccess?.();
          navigation.navigate('DoctorMain', { screen: 'AppointmentsTab' }); // quay về lịch khám
        }}]
      );

    } catch (err) {
      console.error('Lỗi lưu hồ sơ:', err);
      Alert.alert('Lỗi', err.message || 'Không thể lưu hồ sơ bệnh án. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={['#2c8e7c', '#1e6b5f']} style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
          {/* Header */}
          <View style={{ paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#2c8e7c' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={28} color="#fff" />
              </TouchableOpacity>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff' }}>Tạo hồ sơ bệnh án</Text>
              <View style={{ width: 40 }} />
            </View>
            <Text style={{ color: '#e0f2f1', marginTop: 8, fontSize: 16 }}>
              Bệnh nhân: <Text style={{ fontWeight: '700' }}>{patientName || 'Không rõ'}</Text>
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
            {/* Chẩn đoán */}
            <View style={styles.section}>
              <Text style={styles.label}>Chẩn đoán *</Text>
              <TextInput style={styles.textArea} placeholder="Nhập chẩn đoán..." value={diagnosis} onChangeText={setDiagnosis} multiline />
            </View>

            {/* Điều trị */}
            <View style={styles.section}>
              <Text style={styles.label}>Phương pháp điều trị / Dặn dò</Text>
              <TextInput style={styles.textArea} placeholder="Tái khám, chế độ sinh hoạt..." value={treatment} onChangeText={setTreatment} multiline />
            </View>

            {/* Đơn thuốc */}
            <View style={styles.section}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.label}>Đơn thuốc</Text>
                <TouchableOpacity onPress={addMedicineRow}><Ionicons name="add-circle" size={28} color="#2c8e7c" /></TouchableOpacity>
              </View>
              {medicines.map((med, i) => (
                <View key={i} style={styles.row}>
                  <TextInput style={styles.input} placeholder="Tên thuốc" value={med.medicine_name} onChangeText={t => updateMedicine(i, 'medicine_name', t)} />
                  <TextInput style={[styles.input, { flex: 0.7 }]} placeholder="Liều" value={med.dosage} onChangeText={t => updateMedicine(i, 'dosage', t)} />
                  <TextInput style={[styles.input, { flex: 0.7 }]} placeholder="Thời gian" value={med.duration} onChangeText={t => updateMedicine(i, 'duration', t)} />
                  {medicines.length > 1 && <TouchableOpacity onPress={() => removeMedicineRow(i)}><Ionicons name="trash" size={24} color="#e74c3c" /></TouchableOpacity>}
                </View>
              ))}
            </View>

            {/* Kết quả xét nghiệm */}
            <View style={styles.section}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.label}>Kết quả xét nghiệm (nếu có)</Text>
                <TouchableOpacity onPress={addTestRow}><Ionicons name="add-circle" size={28} color="#2c8e7c" /></TouchableOpacity>
              </View>
              {testResults.map((t, i) => (
                <View key={i} style={styles.row}>
                  <TextInput style={styles.input} placeholder="Loại" value={t.test_type} onChangeText={v => updateTest(i, 'test_type', v)} />
                  <TextInput style={styles.input} placeholder="Tên xét nghiệm" value={t.test_name} onChangeText={v => updateTest(i, 'test_name', v)} />
                  <TextInput style={[styles.input, { flex: 0.6 }]} placeholder="Kết quả" value={t.result_value} onChangeText={v => updateTest(i, 'result_value', v)} keyboardType="numeric" />
                  <TextInput style={[styles.input, { flex: 0.5 }]} placeholder="Đơn vị" value={t.unit} onChangeText={v => updateTest(i, 'unit', v)} />
                </View>
              ))}
            </View>

            {/* Ghi chú */}
            <View style={styles.section}>
              <Text style={styles.label}>Ghi chú thêm</Text>
              <TextInput style={styles.textArea} placeholder="Thông tin khác..." value={notes} onChangeText={setNotes} multiline />
            </View>

            {/* Nút lưu */}
            <TouchableOpacity style={{ marginVertical: 30 }} onPress={handleSave} disabled={loading}>
              <LinearGradient colors={['#2c8e7c', '#1e6b5f']} style={styles.saveBtn}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>HOÀN TẤT KHÁM BỆNH</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

// Styles đẹp lung linh
const styles = {
  section: { marginBottom: 24, backgroundColor: '#fff', padding: 18, borderRadius: 16, elevation: 4 },
  label: { fontSize: 17, fontWeight: '700', color: '#1f2937', marginBottom: 12 },
  textArea: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, fontSize: 16, textAlignVertical: 'top', minHeight: 100 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  input: { flex: 1, backgroundColor: '#f3f4f6', padding: 14, borderRadius: 12, fontSize: 15 },
  saveBtn: { padding: 18, alignItems: 'center', borderRadius: 16, elevation: 10 },
  saveText: { color: '#fff', fontSize: 18, fontWeight: '800' },
};