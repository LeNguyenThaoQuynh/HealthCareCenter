import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../../../api/supabase';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const Colors = {
  primary: '#0055B7',
  primaryLight: '#E3F2FD',
  accent: '#00A3A3',
  success: '#00B074',
  warning: '#F59E0B',
  danger: '#EF4444',
  text: '#1E293B',
  textLight: '#64748B',
  bg: '#F8FAFC',
  white: '#FFFFFF',
  border: '#E2E8F0',
};

const DAY_MAP = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

export default function SelectTimeSlotDoctor() {
  const navigation = useNavigation();
  const route = useRoute();
  const { doctor, selectedDate } = route.params || {};

  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!doctor?.id || !selectedDate) {
      Alert.alert('Lỗi dữ liệu', 'Thiếu thông tin bác sĩ hoặc ngày khám');
      navigation.goBack();
    }
  }, [doctor, selectedDate, navigation]);

  useEffect(() => {
    if (doctor?.id && selectedDate) {
      fetchAvailableSlots();
    }
  }, [doctor?.id, selectedDate]);

  const fetchAvailableSlots = async () => {
    setLoading(true);
    try {
      const date = new Date(selectedDate);
      const dayOfWeek = DAY_MAP[date.getDay()];

      const { data: templates, error: tempErr } = await supabase
        .from('doctor_schedule_template')
        .select('id, start_time, end_time, max_patients_per_slot')
        .eq('doctor_id', doctor.id)
        .eq('day_of_week', dayOfWeek)
        .order('start_time');

      if (tempErr) throw tempErr;
      if (!templates || templates.length === 0) {
        setTimeSlots([]);
        setLoading(false);
        return;
      }

      const slotIds = templates.map(t => t.id);
      const { data: bookings, error: bookErr } = await supabase
        .from('appointments')
        .select('slot_id, status')
        .eq('doctor_id', doctor.id)
        .eq('date', selectedDate)
        .in('slot_id', slotIds);

      if (bookErr) throw bookErr;

      const bookedCount = {};
      bookings?.forEach(b => {
        if (b.status !== 'cancelled') {
          bookedCount[b.slot_id] = (bookedCount[b.slot_id] || 0) + 1;
        }
      });

      const available = templates
        .map(t => {
          const booked = bookedCount[t.id] || 0;
          const max = t.max_patients_per_slot || 5;
          const start = t.start_time.slice(0, 5);
          const end = t.end_time.slice(0, 5);

          return {
            id: t.id,
            display: `${start} - ${end}`,
            start,
            end,
            booked,
            max,
            remaining: max - booked,
            isFull: booked >= max,
          };
        })
        .filter(slot => !slot.isFull);

      setTimeSlots(available);
    } catch (err) {
      console.error('Lỗi lấy khung giờ:', err);
      Alert.alert('Lỗi', 'Không thể tải khung giờ khám. Vui lòng thử lại sau.');
      setTimeSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = (slot) => {
    navigation.navigate('ConfirmBookingDoctor', {
      doctor,
      selectedDate,
      timeSlot: {
        slot_id: slot.id,
        start: slot.start,
        end: slot.end,
        display: slot.display,
      },
    });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const renderSlot = ({ item, index }) => (
    <Animated.View entering={FadeInUp.delay(index * 100)}>
      <TouchableOpacity
        style={[styles.slotCard, item.remaining <= 2 && styles.slotWarning]}
        onPress={() => handleSelectSlot(item)}
        activeOpacity={0.8}
      >
        <View style={styles.slotTime}>
          <Text style={styles.timeText}>{item.display}</Text>
          <Text style={styles.sessionLabel}>
            {item.start < '12:00' ? 'Buổi sáng' : item.start < '17:00' ? 'Buổi chiều' : 'Buổi tối'}
          </Text>
        </View>

        <View style={styles.slotStatus}>
          <View style={styles.statusRow}>
            <Ionicons name="people-outline" size={16} color={Colors.textLight} />
            <Text style={styles.statusText}>
              {item.booked}/{item.max} đã đặt
            </Text>
          </View>
          <Text style={[styles.remainingText, item.remaining <= 2 && styles.remainingWarning]}>
            Còn {item.remaining} chỗ
          </Text>
        </View>

        <View style={styles.arrow}>
          <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  if (!doctor || !selectedDate) return null;

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chọn khung giờ</Text>
        <TouchableOpacity onPress={() => navigation.navigate('HomeScreen')}>
          <Ionicons name="home" size={26} color={Colors.white} />
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.infoSection}>
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{doctor.name}</Text>
          {doctor.specializations && (
            <Text style={styles.specialty}>
              {Array.isArray(doctor.specializations) 
                ? doctor.specializations.join(' • ') 
                : doctor.specializations}
            </Text>
          )}
        </View>
        <View style={styles.dateInfo}>
          <Ionicons name="calendar" size={20} color={Colors.primary} />
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải khung giờ trống...</Text>
        </View>
      ) : timeSlots.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={80} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>Không có ca trống</Text>
          <Text style={styles.emptySubtitle}>
            Bác sĩ đã kín lịch vào ngày này
          </Text>
          <TouchableOpacity style={styles.changeDateBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.changeDateText}>Chọn ngày khác</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={timeSlots}
          keyExtractor={item => item.id}
          renderItem={renderSlot}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: Colors.primary,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.white },
  infoSection: {
    backgroundColor: Colors.white,
    margin: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  doctorInfo: { marginBottom: 12 },
  doctorName: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  specialty: { fontSize: 14, color: Colors.accent, marginTop: 4, fontWeight: '600' },
  dateInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateText: { fontSize: 16, color: Colors.text, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  slotCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  slotWarning: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  slotTime: { flex: 1 },
  timeText: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  sessionLabel: { fontSize: 13, color: Colors.textLight, marginTop: 4 },
  slotStatus: { alignItems: 'flex-end' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { fontSize: 13, color: Colors.textLight },
  remainingText: { fontSize: 14, fontWeight: 'bold', color: Colors.success, marginTop: 4 },
  remainingWarning: { color: Colors.warning },
  arrow: { marginLeft: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: Colors.textLight },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text, marginTop: 20 },
  emptySubtitle: { fontSize: 15, color: Colors.textLight, marginTop: 8, textAlign: 'center' },
  changeDateBtn: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
  },
  changeDateText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
});