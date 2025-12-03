import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../api/supabase';

export default function LabPendingTestsScreen({ navigation }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPendingByPatient = async () => {
    console.log('Đang tải danh sách bệnh nhân cần làm xét nghiệm...');
    try {
      const { data, error } = await supabase
        .from('test_results')
        .select(`
          id,
          patient_id,
          appointment_id,
          test_name,
          status,
          created_at,
          profiles:patient_id (full_name)
        `)
        .in('status', ['pending', 'in_progress'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Tải được', data.length, 'bản ghi đang chờ/in_progress');

      // -----------------------------
      // FIX LOGIC GỘP THEO 2 KHÓA:
      // patient_id + appointment_id
      // -----------------------------
      const grouped = data.reduce((acc, item) => {
        const key = `${item.patient_id}_${item.appointment_id}`;

        if (!acc[key]) {
          acc[key] = {
            patientId: item.patient_id,
            patientName: item.profiles?.full_name || 'Chưa có tên',
            appointmentId: item.appointment_id,
            testCount: 0,
            tests: [],
            created_at: item.created_at,
          };
        }

        acc[key].testCount += 1;
        acc[key].tests.push(item.test_name);

        return acc;
      }, {});

      const result = Object.values(grouped).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      console.log('Đã gộp thành công:', result.length, 'dòng dữ liệu');

      setPatients(result);
    } catch (err) {
      console.error('Lỗi fetchPendingByPatient:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPendingByPatient();
    const interval = setInterval(() => {
      console.log('Auto refresh (30s) - Load lại...');
      fetchPendingByPatient();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    console.log('Người dùng kéo để refresh');
    setRefreshing(true);
    fetchPendingByPatient();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        console.log(
          'Điều hướng nhập kết quả - Bệnh nhân:',
          item.patientName,
          '| Appointment ID:',
          item.appointmentId
        );
        navigation.navigate('LabEnterResults', {
          appointmentId: item.appointmentId,
          patientName: item.patientName,
        });
      }}
      style={{
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginVertical: 10,
        borderRadius: 20,
        padding: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.15,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 21, fontWeight: 'bold', color: '#1E293B', flex: 1 }}>
          {item.patientName}
        </Text>
        <View
          style={{
            backgroundColor: '#DC2626',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 30,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>
            {item.testCount} xét nghiệm
          </Text>
        </View>
      </View>

      <Text style={{ marginTop: 14, fontSize: 16, color: '#475569' }}>
        Danh sách:{' '}
        <Text style={{ fontWeight: '600', color: '#1D4ED8' }}>
          {item.tests.join(' • ')}
        </Text>
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
        <Ionicons name="time-outline" size={18} color="#94A3B8" />
        <Text style={{ marginLeft: 8, color: '#94A3B8', fontSize: 14 }}>
          {new Date(item.created_at).toLocaleString('vi-VN')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F0FDF4' }}>
      <StatusBar barStyle="light-content" backgroundColor="#10B981" />

      <LinearGradient
        colors={['#10B981', '#059669']}
        style={{ paddingTop: 50, padding: 20 }}
      >
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#fff' }}>
          Bệnh nhân cần làm xét nghiệm
        </Text>
        <Text style={{ fontSize: 18, color: '#ECFDF5', marginTop: 8 }}>
          Tổng cộng: {patients.length} bệnh nhân
        </Text>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 80 }} />
      ) : (
        <FlatList
          data={patients}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.patientId}_${item.appointmentId}`}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 120 }}>
              <Ionicons name="checkmark-circle-outline" size={100} color="#10B981" />
              <Text style={{ fontSize: 20, marginTop: 20, color: '#64748B', textAlign: 'center' }}>
                Không có bệnh nhân nào cần làm xét nghiệm
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </View>
  );
}
