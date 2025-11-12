import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../api/supabase';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, ZoomIn, FadeInDown } from 'react-native-reanimated';

// 🎨 Bảng màu Sạch, Hiện đại (Blue Palette)
const Colors = {
  primary: '#1D4ED8', // Dark Blue - Màu chủ đạo
  secondary: '#38BDF8', // Light Blue - Màu nhấn
  iconBgStart: '#E0F2FE', // Very Light Blue
  iconBgEnd: '#BFDBFE', // Light Blue Background
  textPrimary: '#1E293B', // Dark Text
  textSecondary: '#6B7280', // Muted Text
  border: '#F1F5F9', // Light Border
  cardBg: '#FFFFFF',
  shadow: '#000',
  bg: '#F4F7FC', // Light App Background
  danger: '#DC2626',
  muted: '#9CA3AF',
  success: '#059669',
};

// --- Sub Component: Appointment Card (Tối ưu hóa UI) ---
const AppointmentCard = React.memo(({ item, index, handleCancel }) => {
  const slot = item.doctor_schedule_template || {};
  const doctor = item.doctor || {};
  const dept = item.department || {};

  // Giữ nguyên Logic
  const timeStr = slot.start_time && slot.end_time
    ? `${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}`
    : '---';

  const date = item.appointment_date ? new Date(item.appointment_date) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isPast = date ? date < today : false;
  const isCancelled = item.status === 'cancelled';
  
  let statusConfig;
  if (isCancelled) {
    statusConfig = { colors: ['#DC2626', '#F87171'], text: 'Đã hủy', icon: 'close-circle-sharp' };
  } else if (isPast) {
    statusConfig = { colors: ['#6B7280', '#9CA3AF'], text: 'Hoàn thành', icon: 'checkmark-done-sharp' };
  } else {
    statusConfig = { colors: [Colors.success, '#10B981'], text: 'Đã xác nhận', icon: 'checkmark-circle-sharp' };
  }

  const dateStr = date
    ? date.toLocaleDateString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '---';

  return (
    <Animated.View entering={FadeInUp.delay(index * 80).duration(500)} style={styles.cardWrapper}>
      <TouchableOpacity activeOpacity={0.92} disabled={isCancelled} style={styles.cardTouchArea}>
        <View style={[styles.card, isCancelled && styles.cancelledCard]}>
          <LinearGradient
            colors={[Colors.cardBg, '#F9FAFB']} // Nền trắng hơi gradient nhẹ
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* THÔNG TIN CHÍNH VÀ TRẠNG THÁI */}
            <View style={styles.headerRow}>
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName} numberOfLines={1}>
                  {/* Tăng độ đậm font cho Tên Bác sĩ */}
                  **{doctor.name || `Bác sĩ (${item.doctor_id || '---'})`}**
                </Text>
                <Text style={styles.deptName} numberOfLines={1}>{dept.name || 'Chuyên khoa (---)'}</Text>
              </View>
              <LinearGradient
                colors={statusConfig.colors}
                style={styles.statusBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name={statusConfig.icon} size={14} color="#FFF" />
                <Text style={styles.statusText}>{statusConfig.text}</Text>
              </LinearGradient>
            </View>

            <View style={styles.divider} />

            {/* CHI TIẾT NGÀY GIỜ PHÒNG */}
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={18} color={isCancelled ? Colors.muted : Colors.primary} />
                <Text style={[styles.detailValue, {color: isCancelled ? Colors.muted : Colors.textPrimary}]}>{dateStr}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={18} color={isCancelled ? Colors.muted : Colors.primary} />
                <Text style={[styles.detailValue, {color: isCancelled ? Colors.muted : Colors.textPrimary}]}>{timeStr}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={18} color={isCancelled ? Colors.muted : Colors.primary} />
                <Text style={[styles.detailValue, {color: isCancelled ? Colors.muted : Colors.textPrimary}]}>
                  {doctor.room_number ? `P. ${doctor.room_number}` : '---'}
                </Text>
              </View>
            </View>

            {/* PHẦN QR CODE (Thiết kế E-Ticket với viền chấm gạch) */}
            <View style={styles.qrContainer}>
              <View style={styles.qrBox}>
                <QRCode value={`https://your-app.com/booking/${item.id}`} size={60} />
              </View>
              <View style={styles.qrInfo}>
                  <Text style={styles.label}>Mã Phiếu Hẹn (ID)</Text>
                  <Text style={styles.qrCode} numberOfLines={1} ellipsizeMode="middle">
                    {item.id}
                  </Text>
              </View>
            </View>

            {/* NÚT HỦY */}
            {!isCancelled && !isPast && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleCancel(item.id)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[Colors.danger, '#EF4444']}
                  style={styles.cancelGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="close-circle-outline" size={18} color="#FFF" />
                  <Text style={styles.cancelText}>Hủy Lịch Khám</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// --- Component Chính: HistoryScreen ---
export default function HistoryScreen() {
  const navigation = useNavigation();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // LOGIC LẤY DỮ LIỆU (Giữ nguyên)
  const fetchAppointments = useCallback(async () => {
    // ... (Giữ nguyên logic fetchAppointments) ...
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Bước 1: Lấy danh sách appointments với doctor_id
        const { data: apptData, error: apptError } = await supabase
            .from('appointments')
            .select(`
            id,
            status,
            patient_name,
            patient_phone,
            created_at,
            appointment_date,
            slot_id,
            doctor_id,
            department_id,
            doctor_schedule_template!inner (
                start_time,
                end_time
            )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        if (apptError) throw apptError;

        // Bước 2: Lấy thông tin bác sĩ từ bảng doctors dựa trên doctor_id
        const doctorIds = apptData.map(appt => appt.doctor_id).filter(id => id !== null);
        const { data: doctorData, error: doctorError } = doctorIds.length > 0 ? await supabase
            .from('doctors')
            .select('id, name, room_number, department_id')
            .in('id', doctorIds) : { data: [], error: null };
        if (doctorError) throw doctorError;

        // Bước 3: Lấy thông tin chuyên khoa từ departments
        const deptIds = doctorData.map(doc => doc.department_id).filter(id => id !== null);
        const uniqueDeptIds = [...new Set(deptIds)];
        const { data: deptData, error: deptError } = uniqueDeptIds.length > 0
            ? await supabase.from('departments').select('id, name').in('id', uniqueDeptIds)
            : { data: [], error: null };
        if (deptError) throw deptError;

        // Bước 4: Gộp dữ liệu
        const appointmentsWithDetails = apptData.map(appt => {
            const doctor = doctorData.find(doc => doc.id === appt.doctor_id) || {};
            const dept = deptData.find(d => d.id === doctor.department_id) || {};
            return {
                ...appt,
                doctor,
                department: dept,
            };
        });

        setAppointments(appointmentsWithDetails || []);
        } catch (err) {
        console.error('Lỗi lấy lịch sử:', err);
        Alert.alert('Lỗi', 'Không thể tải lịch sử đặt lịch');
        } finally {
        setLoading(false);
        setRefreshing(false);
        }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  // LOGIC HỦY LỊCH (Giữ nguyên)
  const handleCancel = useCallback((id) => {
    Alert.alert(
      'Hủy lịch khám',
      'Bạn có chắc chắn muốn hủy lịch này?',
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
              setAppointments(prev =>
                prev.map(appt =>
                  appt.id === id ? { ...appt, status: 'cancelled' } : appt
                )
              );
              Alert.alert('Thành công', 'Đã hủy lịch khám');
            } catch (err) {
              Alert.alert('Lỗi', 'Không thể hủy lịch');
            }
          },
        },
      ]
    );
  }, []);

  // --- Màn hình Loading ---
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
      </View>
    );
  }

  // --- Màn hình chính ---
  return (
    <View style={styles.background}>
      {/* HEADER TỐI GIẢN & HIỆN ĐẠI */}
      <Animated.View entering={FadeInDown.duration(500)} style={styles.headerContainer}>
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('HomeScreen')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Lịch sử đặt lịch</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.iconButton}>
            <Ionicons name="refresh" size={24} color="#FFF" />
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>

      <View style={styles.container}>
        {appointments.length === 0 ? (
          <Animated.View entering={ZoomIn.duration(500)} style={styles.empty}>
            <View style={styles.emptyIconContainer}>
              <LinearGradient
                colors={['#BFDBFE', '#E0F2FE']}
                style={styles.emptyIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="calendar-outline" size={60} color={Colors.primary} />
              </LinearGradient>
            </View>
            <Text style={styles.emptyTitle}>Chưa có lịch hẹn nào</Text>
            <Text style={styles.emptySubtitle}>Hãy đặt lịch khám đầu tiên của bạn ngay!</Text>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => navigation.navigate('BookByDate')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                style={styles.bookGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="calendar-add-outline" size={20} color="#FFF" />
                <Text style={styles.bookText}>Đặt lịch ngay</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <FlatList
            data={appointments}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item, index }) => <AppointmentCard item={item} index={index} handleCancel={handleCancel} />}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
    </View>
  );
}

// --- STYLES (Clean and Modern) ---
const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: Colors.bg },
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    backgroundColor: 'transparent',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  loadingText: { marginTop: 12, fontSize: 16, color: Colors.textPrimary, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 30 },
  
  // Card Styles
  cardWrapper: { marginBottom: 18 },
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: Colors.cardBg,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08, // Bóng mờ hơn
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  cancelledCard: { opacity: 0.65 },
  gradient: { padding: 18 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  doctorInfo: { flex: 1, marginRight: 15 },
  doctorName: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  deptName: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, fontWeight: '500' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
    minWidth: 100,
    justifyContent: 'center',
  },
  statusText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
    justifyContent: 'flex-start',
  },
  detailValue: { fontSize: 13.5, fontWeight: '600', color: Colors.textPrimary },
  
  // QR Section (E-Ticket Look)
  qrContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed', // HIỆU ỨNG VIỀN CHẤM GẠCH MỚI
  },
  qrBox: {
    width: 68,
    height: 68,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  qrInfo: {
      flex: 1,
      marginLeft: 15,
      justifyContent: 'center',
  },
  label: {
      fontSize: 11,
      color: Colors.textSecondary,
      fontWeight: '500',
      marginBottom: 2,
  },
  qrCode: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '700',
  },

  // Cancel Button
  cancelButton: { marginTop: 15, borderRadius: 14, overflow: 'hidden' },
  cancelGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  cancelText: { color: '#FFF', fontWeight: '700', fontSize: 14.5 },

  // Empty State
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIconContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#E0F2FE',
  },
  emptyIcon: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.9,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 30, textAlign: 'center' },
  
  // Book Button
  bookButton: { borderRadius: 18, overflow: 'hidden' },
  bookGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 14, gap: 8 },
  bookText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});