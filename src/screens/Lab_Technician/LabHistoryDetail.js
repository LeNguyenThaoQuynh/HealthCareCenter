import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Share,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function LabHistoryDetail() {
  const route = useRoute();
  const {
    patientName = 'Bệnh nhân',
    doctorName = 'Không rõ',
    appointmentDate,
    performedAt,
    tests = [],
  } = route.params || {};

  console.log('LabHistoryDetail - Dữ liệu nhận được:', { patientName, doctorName, performedAt, totalTests: tests.length });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'normal': return { text: 'BÌNH THƯỜNG', color: '#10B981' };
      case 'abnormal': return { text: 'BẤT THƯỜNG', color: '#F59E0B' };
      case 'critical': return { text: 'NGUY HIỂM', color: '#EF4444' };
      default: return { text: 'HOÀN TẤT', color: '#64748B' };
    }
  };

  const shareResults = async () => {
    console.log('Đang chuẩn bị chia sẻ kết quả xét nghiệm...');
    try {
      let message = `KẾT QUẢ XÉT NGHIỆM\n`;
      message += `Bệnh nhân: ${patientName}\n`;
      message += `Bác sĩ chỉ định: ${doctorName}\n`;
      message += `Thời gian làm: ${formatDate(performedAt)}\n\n`;
      message += `══════════════════\n`;

      tests.forEach((t, i) => {
        const status = getStatusText(t.status);
        message += `${i + 1}. ${t.test_name}\n`;
        message += `   Kết quả: ${t.result || '—'} ${t.unit || ''}\n`;
        if (t.range) message += `   Ngưỡng: ${t.range}\n`;
        if (t.note) message += `   Ghi chú: ${t.note}\n`;
        message += `   → ${status.text}\n\n`;
      });

      console.log('Nội dung chia sẻ đã sẵn sàng');
      await Share.share({ message });
      console.log('Chia sẻ thành công');
    } catch (err) {
      console.error('Lỗi khi chia sẻ:', err);
      Alert.alert('Lỗi', 'Không thể chia sẻ kết quả');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F0FDF4' }}>
      <StatusBar barStyle="light-content" backgroundColor="#10B981" />

      <LinearGradient colors={['#10B981', '#059669']} style={{ paddingTop: 50, padding: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#fff' }}>
          Chi tiết kết quả xét nghiệm
        </Text>
        <Text style={{ fontSize: 18, color: '#ECFDF5', marginTop: 8 }}>
          {patientName}
        </Text>
      </LinearGradient>

      <View style={{ padding: 20, backgroundColor: '#fff', margin: 16, borderRadius: 20, elevation: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ color: '#64748B', fontSize: 16 }}>Bác sĩ chỉ định</Text>
          <Text style={{ fontWeight: 'bold', color: '#1E293B', fontSize: 16 }}>
            {doctorName}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ color: '#64748B', fontSize: 16 }}>Ngày khám</Text>
          <Text style={{ fontWeight: '600', color: '#1E293B' }}>
            {appointmentDate ? new Date(appointmentDate).toLocaleDateString('vi-VN') : '—'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: '#64748B', fontSize: 16 }}>Thời gian hoàn tất</Text>
          <Text style={{ fontWeight: '600', color: '#10B981' }}>
            {formatDate(performedAt)}
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {tests.map((test, index) => {
          const status = getStatusText(test.status);
          return (
            <View
              key={index}
              style={{
                backgroundColor: '#fff',
                borderRadius: 20,
                padding: 20,
                marginBottom: 16,
                elevation: 10,
                borderLeftWidth: 6,
                borderLeftColor: status.color,
              }}
            >
              <Text style={{ fontSize: 19, fontWeight: 'bold', color: '#1E293B', marginBottom: 8 }}>
                {index + 1}. {test.test_name}
              </Text>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1D4ED8' }}>
                  {test.result || '—'} {test.unit && <Text style={{ fontSize: 16, color: '#64748B' }}>{test.unit}</Text>}
                </Text>
                <View style={{ backgroundColor: status.color, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>{status.text}</Text>
                </View>
              </View>

              {test.range && (
                <Text style={{ marginTop: 12, color: '#64748B', fontSize: 15 }}>
                  Ngưỡng bình thường: <Text style={{ fontWeight: '600' }}>{test.range}</Text>
                </Text>
              )}

              {test.note && (
                <Text style={{ marginTop: 12, color: '#DC2626', fontStyle: 'italic', fontSize: 15 }}>
                  Ghi chú: {test.note}
                </Text>
              )}
            </View>
          );
        })}

        <TouchableOpacity onPress={shareResults} style={{ marginVertical: 30 }}>
          <LinearGradient
            colors={['#7C3AED', '#6D28D9']}
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: 20,
              borderRadius: 30,
              elevation: 15,
            }}
          >
            <Ionicons name="share-social" size={32} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginLeft: 12 }}>
              CHIA SẺ / IN KẾT QUẢ
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}