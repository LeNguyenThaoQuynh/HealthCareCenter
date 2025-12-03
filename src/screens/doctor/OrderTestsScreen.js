import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../api/supabase';

export default function OrderTestsScreen({ route, navigation }) {
  const { appointmentId, patientId, patientName } = route.params || {};

  const [initialNote, setInitialNote] = useState('');
  const [selectedTests, setSelectedTests] = useState([]); // [{ name, price }]
  const [customTest, setCustomTest] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  const commonTests = [
    { name: 'Công thức máu', price: 120000 },
    { name: 'Đường huyết', price: 50000 },
    { name: 'Chức năng gan (ALT, AST, GGT, Bil)', price: 250000 },
    { name: 'Chức năng thận (Ure, Creatinin)', price: 120000 },
    { name: 'CRP', price: 150000 },
    { name: 'Nước tiểu 10 thông số', price: 80000 },
    { name: 'Siêu âm bụng tổng quát', price: 300000 },
    { name: 'X-Quang ngực thẳng', price: 150000 },
    { name: 'Điện tâm đồ (ECG)', price: 120000 },
    { name: 'HBsAg', price: 120000 },
    { name: 'Anti-HCV', price: 200000 },
    { name: 'HIV (Combo Ag/Ab)', price: 300000 },
    { name: 'Siêu âm tuyến giáp', price: 250000 },
  ];

  const toggleTest = (test) => {
    setSelectedTests((prev) => {
      const exists = prev.find((t) => t.name === test.name);
      return exists
        ? prev.filter((t) => t.name !== test.name)
        : [...prev, { name: test.name, price: test.price }];
    });
  };

  const addCustomTest = () => {
    const name = customTest.trim();
    const priceStr = customPrice.replace(/[^0-9]/g, '');
    if (!name) return Alert.alert('Lỗi', 'Vui lòng nhập tên xét nghiệm');
    if (!priceStr || parseInt(priceStr) <= 0)
      return Alert.alert('Lỗi', 'Vui lòng nhập giá hợp lệ');

    const price = parseInt(priceStr);
    if (selectedTests.some((t) => t.name === name))
      return Alert.alert('Đã tồn tại', 'Xét nghiệm này đã được chọn');

    setSelectedTests((prev) => [...prev, { name, price }]);
    setCustomTest('');
    setCustomPrice('');
  };

  const totalPrice = selectedTests.reduce((sum, t) => sum + t.price, 0);

  const sendTests = async () => {
    if (selectedTests.length === 0) {
      return Alert.alert('Chưa chọn', 'Vui lòng chọn ít nhất 1 xét nghiệm');
    }

    try {
      // 1. Tạo bệnh án tạm
      const { data: record, error: recordError } = await supabase
        .from('medical_records')
        .insert({
          patient_id: patientId,
          appointment_id: appointmentId,
          diagnosis: 'Đang chờ kết quả xét nghiệm cận lâm sàng',
          notes: initialNote.trim() || null,
        })
        .select()
        .single();

      if (recordError || !record) throw new Error('Không tạo được bệnh án tạm');

      // 2. Gửi danh sách xét nghiệm + giá
      const testPayload = selectedTests.map((t) => ({
        patient_id: patientId,
        appointment_id: appointmentId,
        test_type: 'lab',
        test_name: t.name,
        price: t.price,
        total_price: totalPrice, // lưu tổng tiền cho cả nhóm xét nghiệm
        status: 'pending',
        ordered_at: new Date().toISOString(),
      }));

      const { error: testError } = await supabase
        .from('test_results')
        .insert(testPayload);

      if (testError) throw testError;

      // 3. Cập nhật trạng thái lịch hẹn
      const { error: aptError } = await supabase
        .from('appointments')
        .update({ status: 'waiting_results' })
        .eq('id', appointmentId);

      if (aptError) throw aptError;

      Alert.alert(
        'Thành công!',
        `Đã gửi chỉ định ${selectedTests.length} xét nghiệm.\nTổng chi phí: ${totalPrice.toLocaleString(
          'vi-VN'
        )} ₫\n\nBệnh nhân sẽ được thông báo thanh toán và thực hiện xét nghiệm.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('DoctorAppointments'),
          },
        ]
      );
    } catch (err) {
      console.error('Lỗi gửi chỉ định:', err);
      Alert.alert('Lỗi', err.message || 'Không thể gửi chỉ định xét nghiệm');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F8FAFC' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      {/* Header (làm đơn giản, tránh LinearGradient để an toàn) */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <View>
            <Text style={styles.headerTitle}>Chỉ định xét nghiệm</Text>
            <Text style={styles.headerSubtitle}>
              Bệnh nhân:{' '}
              <Text style={{ fontWeight: '700' }}>
                {patientName || 'Không xác định'}
              </Text>
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Ghi chú triệu chứng */}
        <View style={styles.card}>
          <Text style={styles.label}>Triệu chứng / Lý do khám</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Nhập triệu chứng, tiền sử bệnh..."
            value={initialNote}
            onChangeText={setInitialNote}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Danh sách xét nghiệm phổ biến */}
        <View style={styles.card}>
          <Text style={styles.label}>Chọn xét nghiệm</Text>

          <View style={styles.chipsWrap}>
            {commonTests.map((test) => {
              const isSelected = selectedTests.some((t) => t.name === test.name);
              return (
                <TouchableOpacity
                  key={test.name}
                  onPress={() => toggleTest(test)}
                  style={[
                    styles.testButton,
                    isSelected && styles.testButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.testButtonText,
                      isSelected && styles.testButtonTextSelected,
                    ]}
                  >
                    {test.name}
                    {'\n'}
                    <Text style={{ fontSize: 11, opacity: 0.9 }}>
                      {test.price.toLocaleString('vi-VN')}₫
                    </Text>
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Thêm xét nghiệm tùy chỉnh */}
          <View style={{ marginTop: 22 }}>
            <Text style={{ fontWeight: '600', marginBottom: 8, color: '#1E293B' }}>
              Thêm xét nghiệm khác
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end' }}>
              <TextInput
                style={[styles.input, { flex: 2 }]}
                placeholder="Tên xét nghiệm..."
                value={customTest}
                onChangeText={setCustomTest}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Giá (₫)"
                value={customPrice}
                onChangeText={setCustomPrice}
                keyboardType="numeric"
              />
              <TouchableOpacity onPress={addCustomTest}>
                <Ionicons name="add-circle" size={52} color="#10B981" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Danh sách đã chọn + Tổng tiền */}
          {selectedTests.length > 0 && (
            <View style={{ marginTop: 26 }}>
              <Text style={styles.selectedTitle}>
                Đã chọn ({selectedTests.length} xét nghiệm)
              </Text>

              {selectedTests.map((test, i) => (
                <View key={i} style={styles.selectedItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectedText}>
                      {i + 1}. {test.name}
                    </Text>
                    <Text style={{ color: '#059669', fontWeight: '700', fontSize: 15 }}>
                      {test.price.toLocaleString('vi-VN')} ₫
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => toggleTest({ name: test.name, price: test.price })}>
                    <Ionicons name="close-circle" size={30} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}

              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>TỔNG CHI PHÍ</Text>
                <Text style={styles.totalPrice}>{totalPrice.toLocaleString('vi-VN')} ₫</Text>
              </View>
            </View>
          )}
        </View>

        {/* Nút gửi chỉ định */}
        <View style={{ marginVertical: 20 }}>
          <TouchableOpacity onPress={sendTests} activeOpacity={0.9}>
            <View style={styles.sendButtonWrapper}>
              <View style={styles.sendButton}>
                <Ionicons name="paper-plane" size={26} color="#fff" />
                <Text style={[styles.sendButtonText, { marginLeft: 12 }]}>
                  GỬI CHỈ ĐỊNH XÉT NGHIỆM
                </Text>
              </View>
              {selectedTests.length > 0 && (
                <Text style={{ color: '#065F46', textAlign: 'center', marginTop: 8 }}>
                  Tổng: {totalPrice.toLocaleString('vi-VN')} ₫
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* STYLES - đẹp, hiện đại, hợp lý */
const styles = StyleSheet.create({
  header: {
    backgroundColor: '#2563EB',
    paddingTop: 48,
    paddingBottom: 18,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#DDEEFF',
    marginTop: 6,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  label: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },

  textArea: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 14,
    fontSize: 15,
    minHeight: 110,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    textAlignVertical: 'top',
  },

  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },

  testButton: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#E0E7FF',
    minWidth: 130,
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
  },
  testButtonSelected: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  testButtonText: {
    color: '#4338CA',
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
  },
  testButtonTextSelected: {
    color: '#fff',
  },

  selectedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    marginBottom: 10,
  },
  selectedText: {
    fontSize: 15,
    color: '#1E3A8A',
    fontWeight: '600',
  },

  totalContainer: {
    marginTop: 18,
    paddingVertical: 20,
    paddingHorizontal: 18,
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
  },
  totalPrice: {
    fontSize: 30,
    fontWeight: '800',
    color: '#059669',
    marginTop: 6,
  },

  sendButtonWrapper: {
    alignItems: 'center',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 28,
    minWidth: 260,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
