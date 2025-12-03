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
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../api/supabase';

export default function CreateMedicalRecordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { appointmentId, patientId, patientName = 'Bệnh nhân' } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTests, setSelectedTests] = useState([]);
  const [customTest, setCustomTest] = useState('');

  const quickTests = [
    'Công thức máu', 'Đường huyết', 'Cholesterol', 'Triglyceride',
    'Chức năng gan', 'Chức năng thận', 'Nước tiểu', 'CRP',
    'Siêu âm bụng', 'X-Quang ngực', 'Điện tâm đồ', 'HBsAg', 'Anti-HCV'
  ];

  const toggleTest = (test) => {
    console.log('Toggle xét nghiệm:', test);
    setSelectedTests(prev =>
      prev.includes(test) ? prev.filter(t => t !== test) : [...prev, test]
    );
  };

  const addCustomTest = () => {
    const name = customTest.trim();
    if (name && !selectedTests.includes(name)) {
      console.log('Thêm xét nghiệm tùy chỉnh:', name);
      setSelectedTests(prev => [...prev, name]);
      setCustomTest('');
    }
  };

  const removeTest = (test) => {
    console.log('Xóa xét nghiệm:', test);
    setSelectedTests(prev => prev.filter(t => t !== test));
  };

  const handleFinishExamination = async () => {
    if (!diagnosis.trim()) {
      return Alert.alert('Lỗi', 'Vui lòng nhập chẩn đoán');
    }

    console.log('Bắt đầu lưu bệnh án và chỉ định xét nghiệm...');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Doctor ID:', user.id);

      console.log('1. Tạo bệnh án...');
      const { data: record, error: recordError } = await supabase
        .from('medical_records')
        .insert({
          patient_id: patientId,
          doctor_id: user.id,
          appointment_id: appointmentId,
          diagnosis: diagnosis.trim(),
          notes: notes.trim() || null,
        })
        .select()
        .single();

      if (recordError) throw recordError;
      console.log('Tạo bệnh án thành công, ID:', record.id);

      if (selectedTests.length > 0) {
        console.log('2. Gửi chỉ định', selectedTests.length, 'xét nghiệm...');
        const testPayload = selectedTests.map(name => ({
          patient_id: patientId,
          appointment_id: appointmentId,
          test_type: 'lab',
          test_name: name,
          status: 'pending',
        }));

        const { error: testError } = await supabase
          .from('test_results')
          .insert(testPayload);

        if (testError) throw testError;
        console.log('Gửi chỉ định xét nghiệm thành công');
      } else {
        console.log('Không có chỉ định xét nghiệm');
      }

      console.log('3. Cập nhật trạng thái lịch hẹn thành completed...');
      const { error: aptError } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId);

      if (aptError) throw aptError;
      console.log('Cập nhật lịch hẹn thành công');

      Alert.alert(
        'Thành công!',
        selectedTests.length > 0
          ? `Đã gửi chỉ định ${selectedTests.length} xét nghiệm.\nBạn có thể kê đơn thuốc khi có kết quả.`
          : 'Khám hoàn tất. Không có chỉ định xét nghiệm.',
        [{ text: 'OK', onPress: () => navigation.replace('DoctorMain') }]
      );
    } catch (err) {
      console.error('Lỗi khi lưu bệnh án:', err);
      Alert.alert('Lỗi', err.message || 'Không thể lưu bệnh án');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />

      <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={{ paddingTop: 50, paddingBottom: 24, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff', marginLeft: 16 }}>
            Tạo bệnh án
          </Text>
        </View>
        <Text style={{ color: '#E0E7FF', fontSize: 16, marginTop: 8 }}>
          Bệnh nhân: <Text style={{ fontWeight: 'bold' }}>{patientName}</Text>
        </Text>
      </LinearGradient>

      <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }} contentContainerStyle={{ padding: 20 }}>
        
        <View style={styles.card}>
          <Text style={styles.label}>Chẩn đoán <Text style={{ color: 'red' }}>*</Text></Text>
          <TextInput
            style={styles.textArea}
            placeholder="Viêm họng cấp, sốt, ho..."
            value={diagnosis}
            onChangeText={setDiagnosis}
            multiline
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Chỉ định xét nghiệm cận lâm sàng</Text>
          <Text style={{ color: '#64748B', fontSize: 14, marginBottom: 12 }}>
            Bấm để chọn – có thể chọn nhiều
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            {quickTests.map(test => (
              <TouchableOpacity
                key={test}
                onPress={() => toggleTest(test)}
                style={{
                  backgroundColor: selectedTests.includes(test) ? '#3B82F6' : '#F1F5F9',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 30,
                  borderWidth: 1.5,
                  borderColor: selectedTests.includes(test) ? '#3B82F6' : '#CBD5E1',
                }}
              >
                <Text style={{
                  color: selectedTests.includes(test) ? '#fff' : '#475569',
                  fontWeight: '600',
                }}>
                  {test}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Xét nghiệm khác..."
              value={customTest}
              onChangeText={setCustomTest}
              onSubmitEditing={addCustomTest}
            />
            <TouchableOpacity onPress={addCustomTest}>
              <Ionicons name="add-circle" size={44} color="#10B981" />
            </TouchableOpacity>
          </View>

          {selectedTests.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text style={{ fontWeight: 'bold', color: '#1E293B', marginBottom: 8 }}>
                Đã chỉ định ({selectedTests.length})
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {selectedTests.map(test => (
                  <View key={test} style={{
                    backgroundColor: '#DBEAFE',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                    <Text style={{ color: '#1E40AF', fontWeight: '600' }}>{test}</Text>
                    <TouchableOpacity onPress={() => removeTest(test)}>
                      <Ionicons name="close" size={18} color="#1E40AF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Ghi chú thêm</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Thông tin bổ sung, tiền sử dị ứng..."
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        <TouchableOpacity
          onPress={handleFinishExamination}
          disabled={loading}
          style={{ marginTop: 30, marginBottom: 40 }}
        >
          <LinearGradient
            colors={loading ? ['#94A3B8', '#64748B'] : ['#10B981', '#059669']}
            style={styles.finishBtn}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <>
                <Ionicons name="checkmark-done" size={32} color="#fff" />
                <Text style={styles.finishText}>GỬI CHỈ ĐỊNH & HOÀN TẤT KHÁM</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

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
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  finishBtn: {
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
  finishText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
};