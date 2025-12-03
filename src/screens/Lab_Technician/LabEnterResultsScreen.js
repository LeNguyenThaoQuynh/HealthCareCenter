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

export default function LabEnterResults() {
  const navigation = useNavigation();
  const route = useRoute();
  const { appointmentId, patientName } = route.params || {};

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('LabEnterResults - appointmentId:', appointmentId);
    if (!appointmentId) {
      Alert.alert('Lỗi', 'Không tìm thấy lịch hẹn!');
      navigation.replace('LabPendingTestsScreen');
      return;
    }
    fetchTests();
  }, [appointmentId]);

  const fetchTests = async () => {
    try {
      console.log('Đang tải danh sách xét nghiệm cho appointment_id:', appointmentId);
      const { data, error } = await supabase
        .from('test_results')
        .select('id, test_name, result_value, unit, reference_range, note, patient_id, test_type')
        .eq('appointment_id', appointmentId)
        .in('status', ['pending', 'in_progress']);

      if (error) throw error;
      if (!data?.length) {
        Alert.alert('Thông báo', 'Không có xét nghiệm nào cần nhập.');
        navigation.goBack();
        return;
      }

      const mapped = data.map(t => ({
        id: t.id,
        test_name: t.test_name,
        result_value: t.result_value || '',
        unit: t.unit || '',
        reference_range: t.reference_range || '',
        note: t.note || '',
        patient_id: t.patient_id,
        test_type: t.test_type || 'lab',
      }));
      console.log('Tải thành công', mapped.length, 'xét nghiệm');
      setTests(mapped);
    } catch (err) {
      console.error('Lỗi fetchTests:', err);
      Alert.alert('Lỗi tải', err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (id, field, value) => {
    setTests(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const saveResults = async () => {
    if (tests.some(t => !t.result_value.trim())) {
      return Alert.alert('Chưa xong', 'Vui lòng nhập đầy đủ kết quả');
    }

    console.log('Bắt đầu lưu', tests.length, 'kết quả xét nghiệm');
    try {
      setLoading(true);

      const updates = tests.map(t => ({
        id: t.id,
        test_name: t.test_name,
        result_value: t.result_value.trim(),
        unit: t.unit.trim() || null,
        reference_range: t.reference_range.trim() || null,
        note: t.note.trim() || null,
        status: 'completed',
        performed_at: new Date().toISOString(),
        patient_id: t.patient_id,
        test_type: t.test_type || 'lab',
      }));

      const { error } = await supabase
        .from('test_results')
        .upsert(updates, { onConflict: 'id' });

      if (error) throw error;

      console.log('Lưu kết quả thành công!');
      Alert.alert('HOÀN TẤT!', `Đã lưu ${tests.length} kết quả thành công!`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      console.error('Lỗi khi lưu kết quả:', err);
      Alert.alert('Lỗi', err.message || 'Không thể lưu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0FDF4' }}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={{ marginTop: 20, fontSize: 18, color: '#64748B' }}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor="#10B981" />
      
      <LinearGradient colors={['#10B981', '#059669']} style={{ paddingTop: 50, padding: 20 }}>
        <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#fff' }}>Nhập kết quả xét nghiệm</Text>
        <Text style={{ fontSize: 18, color: '#ECFDF5', marginTop: 8 }}>
          Bệnh nhân: <Text style={{ fontWeight: 'bold' }}>{patientName}</Text>
        </Text>
      </LinearGradient>

      <ScrollView style={{ flex: 1, backgroundColor: '#F0FDF4' }} contentContainerStyle={{ padding: 20 }}>
        {tests.map((t, i) => (
          <View key={t.id} style={{ backgroundColor: '#fff', borderRadius: 24, padding: 22, marginBottom: 20, elevation: 10 }}>
            <Text style={{ fontSize: 19, fontWeight: 'bold', color: '#1E293B', marginBottom: 16 }}>
              {i + 1}. {t.test_name}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Kết quả"
              value={t.result_value}
              onChangeText={v => updateField(t.id, 'result_value', v)}
            />

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Đơn vị"
                value={t.unit}
                onChangeText={v => updateField(t.id, 'unit', v)}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Ngưỡng"
                value={t.reference_range}
                onChangeText={v => updateField(t.id, 'reference_range', v)}
              />
            </View>

            <TextInput
              style={[styles.input, { marginTop: 12, minHeight: 90 }]}
              placeholder="Ghi chú"
              value={t.note}
              onChangeText={v => updateField(t.id, 'note', v)}
              multiline
            />
          </View>
        ))}

        <TouchableOpacity onPress={saveResults} disabled={loading} style={{ marginVertical: 30 }}>
          <LinearGradient
            colors={loading ? ['#94A3B8', '#64748B'] : ['#DC2626', '#B91C1C']}
            style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 22, borderRadius: 30, elevation: 20 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <>
                <Ionicons name="checkmark-done-circle" size={36} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginLeft: 14 }}>
                  HOÀN TẤT & GỬI
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = {
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 18,
    fontSize: 16,
    borderWidth: 1.8,
    borderColor: '#E2E8F0',
  },
};