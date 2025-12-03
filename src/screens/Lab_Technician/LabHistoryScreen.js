import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../api/supabase';

export default function LabHistory({ navigation }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    console.log('Bắt đầu tải lịch sử xét nghiệm đã hoàn tất...');
    try {
      const { data, error } = await supabase
        .from('test_results')
        .select(`
          id,
          test_name,
          result_value,
          unit,
          reference_range,
          note,
          status,
          performed_at,
          patient_id,
          appointment_id,
          profiles:patient_id (full_name),
          appointments!appointment_id (
            appointment_date,
            doctors:doctor_id (full_name)
          )
        `)
        .eq('status', 'completed')
        .order('performed_at', { ascending: false });

      if (error) throw error;

      console.log('Tải được', data.length, 'bản ghi từ Supabase');

      const grouped = data.reduce((acc, item) => {
        const key = item.patient_id;
        if (!acc[key]) {
          acc[key] = {
            patientId: item.patient_id,
            patientName: item.profiles?.full_name || 'Chưa có tên',
            doctorName: item.appointments?.doctors?.full_name || 'Không rõ bác sĩ',
            appointmentDate: item.appointments?.appointment_date,
            performedAt: item.performed_at,
            testCount: 0,
            tests: [],
          };
        }
        acc[key].testCount += 1;
        acc[key].tests.push({
          test_name: item.test_name,
          result: item.result_value,
          unit: item.unit,
          range: item.reference_range,
          note: item.note,
          status: item.status,
        });
        if (new Date(item.performed_at) > new Date(acc[key].performedAt)) {
          acc[key].performedAt = item.performed_at;
        }
        return acc;
      }, {});

      const result = Object.values(grouped).sort(
        (a, b) => new Date(b.performedAt) - new Date(a.performedAt)
      );

      console.log('Đã gộp thành công:', result.length, 'bệnh nhân có kết quả');
      setPatients(result);
    } catch (err) {
      console.error('Lỗi fetchHistory:', err);
      Alert.alert('Lỗi', 'Không thể tải lịch sử xét nghiệm');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = () => {
    console.log('Người dùng kéo refresh');
    setRefreshing(true);
    fetchHistory();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    if (status === 'normal') return '#10B981';
    if (status === 'abnormal') return '#F59E0B';
    if (status === 'critical') return '#EF4444';
    return '#64748B';
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        console.log('Mở chi tiết cho bệnh nhân:', item.patientName, '-', item.testCount, 'xét nghiệm');
        navigation.navigate('LabHistoryDetail', {
          patientName: item.patientName,
          doctorName: item.doctorName,
          appointmentDate: item.appointmentDate,
          performedAt: item.performedAt,
          tests: item.tests,
        });
      }}
      style={{
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginVertical: 10,
        borderRadius: 24,
        padding: 22,
        elevation: 12,
        shadowColor: '#000',
        shadowOpacity: 0.15,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 21, fontWeight: 'bold', color: '#1E293B' }}>
          {item.patientName}
        </Text>
        <View style={{ backgroundColor: '#7C3AED', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 30 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
            {item.testCount} xét nghiệm
          </Text>
        </View>
      </View>

      <Text style={{ marginTop: 12, color: '#64748B', fontSize: 15 }}>
        Bác sĩ: <Text style={{ fontWeight: '600', color: '#1D4ED8' }}>{item.doctorName}</Text>
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
        <Ionicons name="calendar-outline" size={16} color="#64748B" />
        <Text style={{ marginLeft: 8, color: '#64748B' }}>
          {formatDate(item.performedAt)}
        </Text>
      </View>

      <View style={{ marginTop: 16 }}>
        {item.tests.slice(0, 3).map((t, i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 }}>
            <Text style={{ flex: 1, fontSize: 15, color: '#334155' }}>
              • {t.test_name}
            </Text>
            <Text style={{ fontWeight: 'bold', color: getStatusColor(t.status), fontSize: 15 }}>
              {t.result || '—'} {t.unit && `(${t.unit})`}
            </Text>
          </View>
        ))}
        {item.tests.length > 3 && (
          <Text style={{ textAlign: 'right', color: '#8B5CF6', fontWeight: '600', marginTop: 8 }}>
            + {item.tests.length - 3} kết quả khác → Xem chi tiết
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F0FDF4' }}>
      <StatusBar barStyle="light-content" backgroundColor="#10B981" />

      <LinearGradient colors={['#10B981', '#059669']} style={{ paddingTop: 50, padding: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#fff' }}>
          Lịch sử xét nghiệm đã làm
        </Text>
        <Text style={{ fontSize: 18, color: '#ECFDF5', marginTop: 8 }}>
          Tổng: {patients.length} bệnh nhân
        </Text>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 80 }} />
      ) : (
        <FlatList
          data={patients}
          renderItem={renderItem}
          keyExtractor={(item) => item.patientId}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 120 }}>
              <Ionicons name="flask-outline" size={100} color="#94A3B8" />
              <Text style={{ fontSize: 20, marginTop: 20, color: '#64748B', textAlign: 'center' }}>
                Chưa có kết quả xét nghiệm nào
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </View>
  );
}