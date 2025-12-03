import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../api/supabase';
import { LinearGradient } from 'expo-linear-gradient';

const STATUS_CONFIG = {
  pending: { label: 'Đang chờ', color: '#F59E0B', bg: '#FFFBEB' },
  confirmed: { label: 'Đã xác nhận', color: '#10B981', bg: '#F0FDF4' },
  cancelled: { label: 'Đã hủy', color: '#EF4444', bg: '#FEF2F2' },
  completed: { label: 'Đã khám', color: '#6366F1', bg: '#F5F3FF' },
};

export default function AppointmentHistory() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAppointments = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setRefreshing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
        return;
      }

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          status,
          price,
          patient_name,
          patient_phone,
          doctor_id,
          slot_id,
          doctors!inner (
            name,
            room_number,
            specialization
          ),
          doctor_schedule_template!inner (
            start_time,
            end_time
          )
        `)
        .eq('user_id', user.id)
        .order('appointment_date', { ascending: false });

      if (error) throw error;

      setAppointments(data || []);
    } catch (err) {
      console.error('Lỗi tải lịch hẹn:', err);
      Alert.alert('Lỗi', 'Không thể tải lịch hẹn');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancel = (id) => {
    Alert.alert(
      'Hủy lịch khám',
      'Bạn có chắc chắn muốn hủy lịch khám này?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy lịch',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('appointments')
                .update({ status: 'cancelled' })
                .eq('id', id);

              if (error) throw error;

              Alert.alert('Thành công', 'Đã hủy lịch khám');
              fetchAppointments(true);
            } catch (err) {
              Alert.alert('Lỗi', 'Không thể hủy lịch');
            }
          },
        },
      ]
    );
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderItem = ({ item }) => {
    const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const canCancel = ['pending', 'confirmed'].includes(item.status);
    const doctor = item.doctors;
    const slot = item.doctor_schedule_template;

    return (
      <View style={styles.card}>
        <LinearGradient
          colors={[config.bg, config.bg]}
          style={[styles.statusBar, { backgroundColor: config.bg }]}
        >
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: config.color }]} />
            <Text style={[styles.statusText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
          <Text style={styles.code}># {String(item.id).padStart(6, '0')}</Text>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.row}>
            <Ionicons name="calendar" size={20} color="#059669" />
            <Text style={styles.dateText}>{formatTime(item.appointment_date)}</Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="person" size={20} color="#3B82F6" />
            <Text style={styles.doctorName}>BS. {doctor?.name || 'Chưa có'}</Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="medical" size={20} color="#8B5CF6" />
            <Text style={styles.infoText}>
              {doctor?.specialization || 'Chưa xác định'}
            </Text>
          </View>

          {doctor?.room_number && (
            <View style={styles.row}>
              <Ionicons name="location" size={20} color="#F59E0B" />
              <Text style={styles.infoText}>Phòng {doctor.room_number}</Text>
            </View>
          )}

          {slot && (
            <View style={styles.row}>
              <Ionicons name="time" size={20} color="#10B981" />
              <Text style={styles.infoText}>
                {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
              </Text>
            </View>
          )}

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Phí khám:</Text>
            <Text style={styles.priceValue}>
              {(item.price || 180000).toLocaleString('vi-VN')}đ
            </Text>
          </View>

          {canCancel && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancel(item.id)}
            >
              <Ionicons name="close-circle" size={20} color="#EF4444" />
              <Text style={styles.cancelText}>Hủy lịch</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Đang tải lịch hẹn...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lịch hẹn của tôi</Text>
        <MaterialIcons name="schedule" size={32} color="#3B82F6" />
      </View>

      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchAppointments(true)} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-clear-outline" size={80} color="#ddd" />
            <Text style={styles.emptyTitle}>Chưa có lịch hẹn</Text>
            <Text style={styles.emptyText}>Hãy đặt lịch khám ngay hôm nay!</Text>
          </View>
        }
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: '#fff',
    elevation: 4,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#1F2937' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  statusBadge: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  statusText: { fontWeight: '700', fontSize: 15 },
  code: { fontWeight: '900', fontSize: 18, color: '#1F2937' },
  content: { padding: 20 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dateText: { marginLeft: 12, fontSize: 16, fontWeight: '700', color: '#1F2937' },
  doctorName: { marginLeft: 12, fontSize: 17, fontWeight: '800', color: '#3B82F6' },
  infoText: { marginLeft: 12, fontSize: 15.5, color: '#4B5563', fontWeight: '600' },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  priceLabel: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
  priceValue: { fontSize: 18, fontWeight: '900', color: '#DC2626' },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    padding: 14,
    borderRadius: 16,
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: '#FECACA',
  },
  cancelText: { marginLeft: 8, color: '#EF4444', fontWeight: '700', fontSize: 16 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#374151', marginTop: 20 },
  emptyText: { fontSize: 15, color: '#9CA3AF', marginTop: 8, textAlign: 'center' },
});