// src/screens/patient/Book_appointment/BookByDate/SelectTimeSlot.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../../api/supabase';

const { width } = Dimensions.get('window');
const LIST_HORIZONTAL_PADDING = 24;
const DOCTOR_CARD_PADDING_X = 16;
const INNER_CONTENT_WIDTH = width - (2 * LIST_HORIZONTAL_PADDING) - (2 * DOCTOR_CARD_PADDING_X);
const SLOT_WIDTH_V2 = (INNER_CONTENT_WIDTH - 8) / 2;

// HÀM SIÊU AN TOÀN – CHỐNG CRASH SLICE OF UNDEFINED
const safeTime = (timeVal) => {
  if (!timeVal) return null;
  const str = String(timeVal).trim();
  return str.length >= 5 ? str.slice(0, 5) : null;
};

export default function SelectTimeSlot() {
  const navigation = useNavigation();
  const route = useRoute();
  const { date, department } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState(null);

  const formatHeaderDate = useMemo(() => {
    return new Date(date).toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [date]);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setRefreshing(true);

    try {
      const dayMap = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      const dayOfWeek = dayMap[new Date(date).getDay()];

      const { data: templates, error: tempError } = await supabase
        .from('doctor_schedule_template')
        .select(`
          id,
          doctor_id,
          start_time,
          end_time,
          max_patients_per_slot,
          doctors!inner (
            id,
            name,
            room_number,
            specialization,
            experience_years,
            user_profiles!inner (
              avatar_url
            )
          )
        `)
        .eq('day_of_week', dayOfWeek)
        .eq('doctors.department_id', department.id);

      if (tempError) throw tempError;
      if (!templates || templates.length === 0) {
        setSlots([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const slotIds = templates.map(t => t.id);
      const { data: booked, error: bookError } = await supabase
        .from('appointments')
        .select('slot_id')
        .eq('date', date)
        .in('slot_id', slotIds)
        .neq('status', 'cancelled');

      if (bookError) throw bookError;

      const bookedCount = {};
      booked?.forEach(b => {
        bookedCount[b.slot_id] = (bookedCount[b.slot_id] || 0) + 1;
      });

      const availableSlots = templates
        .map(t => {
          const start = safeTime(t.start_time);
          const end = safeTime(t.end_time);

          if (!start || !end) {
            console.warn('Ca bị lỗi giờ, bỏ qua:', t);
            return null;
          }

          const booked = bookedCount[t.id] || 0;
          const max = t.max_patients_per_slot || 5;
          const available = max - booked;

          if (available <= 0) return null;

          return {
            id: t.id,
            doctor_id: t.doctor_id,
            doctor_name: t.doctors.name,
            room_number: t.doctors.room_number,
            avatar_url: t.doctors.user_profiles?.avatar_url || null,
            specialization: t.doctors.specialization,
            experience_years: t.doctors.experience_years,
            start_time: start,   // <-- ĐÃ CÓ
            end_time: end,       // <-- ĐÃ CÓ
            display: `${start} - ${end}`,
            available,
            max,
            booked,
          };
        })
        .filter(Boolean);

      const grouped = {};
      availableSlots.forEach(s => {
        const id = s.doctor_id;
        if (!grouped[id]) {
          grouped[id] = {
            doctor: {
              id,
              name: s.doctor_name,
              room_number: s.room_number,
              avatar_url: s.avatar_url,
              specialization: s.specialization,
              experience_years: s.experience_years,
            },
            slots: [],
          };
        }
        grouped[id].slots.push({
          id: s.id,
          display: s.display,
          available: s.available,
          start_time: s.start_time,  // ← TRUYỀN ĐẦY ĐỦ
          end_time: s.end_time,      // ← TRUYỀN ĐẦY ĐỦ
        });
      });

      setSlots(Object.values(grouped));
    } catch (err) {
      console.error('Lỗi tải lịch:', err);
      Alert.alert('Lỗi', 'Không thể tải lịch khám. Vui lòng thử lại.');
      setSlots([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [date, department.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => loadData(true);

  // ĐÃ FIX 100% – TRUYỀN ĐẦY ĐỦ start_time + end_time
  const handleSlotPress = (slot, doctor) => {
    setSelectedSlotId(slot.id);
    setTimeout(() => {
      navigation.navigate('ConfirmBooking', {
        date,
        department,
        doctor,
        price: department.price,
        slot: {
          id: slot.id,
          display: slot.display,
          start_time: slot.start_time,  // ← BẮT BUỘC CÓ
          end_time: slot.end_time,      // ← BẮT BUỘC CÓ
        },
      });
      setSelectedSlotId(null);
    }, 120);
  };

  const renderSlot = (slot, doctor) => {
    const isLow = slot.available <= 2;
    const isCritical = slot.available === 1;
    const isSelected = selectedSlotId === slot.id;

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        style={[
          styles.slotButton,
          isLow && styles.slotButtonWarning,
          isCritical && styles.slotButtonCritical,
          isSelected && styles.slotButtonSelected,
        ]}
        onPress={() => handleSlotPress(slot, doctor)}
      >
        <Text style={[
          styles.slotTime,
          isCritical && { color: '#B91C1C' },
          isSelected && { color: '#fff' }
        ]}>{slot.display}</Text>
        <View style={styles.slotDetails}>
          {isCritical ? (
            <Ionicons name="alert-circle" size={14} color={isSelected ? '#fff' : '#B91C1C'} />
          ) : (
            <Ionicons name="flash" size={14} color={isSelected ? '#fff' : (isLow ? '#D97706' : '#16A34A')} />
          )}
          <Text style={[
            styles.slotAvailable,
            isLow && styles.slotAvailableWarning,
            isSelected && { color: '#fff' }
          ]}>
            {slot.available} chỗ
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDoctor = ({ item }) => {
    const doctor = item.doctor;
    const firstLetter = doctor.name?.charAt(0).toUpperCase() || 'B';
    const hasAvatar = !!doctor.avatar_url;

    return (
      <View style={styles.doctorCard}>
        <View style={styles.doctorHeader}>
          {hasAvatar ? (
            <Image source={{ uri: doctor.avatar_url }} style={styles.avatar} defaultSource={require('../../../../../assets/images/default-avatar.png')} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{firstLetter}</Text>
            </View>
          )}
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{doctor.name}</Text>
            {doctor.specialization && (
              <View style={styles.badge}>
                <Ionicons name="ribbon" size={12} color="#059669" />
                <Text style={styles.specialization}>{doctor.specialization}</Text>
              </View>
            )}
            <View style={styles.row}>
              {doctor.experience_years && (
                <Text style={styles.experience}>{doctor.experience_years} năm kinh nghiệm</Text>
              )}
              {doctor.room_number && (
                <Text style={styles.doctorRoom}> • Phòng {doctor.room_number}</Text>
              )}
            </View>
          </View>
        </View>

        <Text style={styles.slotsLabel}>Chọn ca khám ({item.slots.length} ca):</Text>
        <View style={styles.slotsContainer}>
          {item.slots.map((slot) => (
            <View key={slot.id} style={styles.slotItem}>
              {renderSlot(slot, doctor)}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.center}>
      <Ionicons name="calendar-clear-outline" size={80} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>Tạm hết lịch trống</Text>
      <Text style={styles.emptyText}>
        Tất cả ca khám trong khoa <Text style={{fontWeight: 'bold'}}>{department.name}</Text> vào ngày <Text style={{fontWeight: 'bold'}}>{formatHeaderDate}</Text> đã đầy.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
        <Text style={styles.retryText}>Tải lại</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.changeDateButton} onPress={() => navigation.goBack()}>
        <Text style={styles.changeDateText}>Chọn ngày khác</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Đang tìm bác sĩ trống...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1F2937', '#3B82F6']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Chọn ca khám</Text>
        <Text style={styles.subtitle}>{department.name}</Text>
      </LinearGradient>

      <View style={styles.info}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar" size={16} color="#059669" />
          <Text style={styles.infoText}> {formatHeaderDate}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="wallet" size={16} color="#1F2937" />
          <Text style={styles.infoPrice}> {department.price?.toLocaleString('vi-VN')}đ</Text>
        </View>
      </View>

      <FlatList
        data={slots}
        keyExtractor={item => item.doctor.id.toString()}
        renderItem={renderDoctor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
        ListEmptyComponent={renderEmpty}
      />
    </View>
  );
}

// Styles đẹp lung linh như cũ
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FC' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F7FC' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 10,
  },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  subtitle: { fontSize: 16, fontWeight: '600', color: '#BEE3F8', marginTop: 4 },
  info: { marginHorizontal: LIST_HORIZONTAL_PADDING, marginTop: 16, padding: 16, backgroundColor: '#FFFFFF', borderRadius: 15, elevation: 4, flexDirection: 'row', justifyContent: 'space-between' },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoText: { fontSize: 15, color: '#059669', fontWeight: '700', marginLeft: 4 },
  infoPrice: { fontSize: 16, color: '#1F2937', fontWeight: '800', marginLeft: 4 },
  listContent: { paddingHorizontal: LIST_HORIZONTAL_PADDING, paddingTop: 16, paddingBottom: 32 },
  doctorCard: { backgroundColor: '#fff', borderRadius: 18, padding: DOCTOR_CARD_PADDING_X, marginBottom: 24, elevation: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  doctorHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 12, borderWidth: 3, borderColor: '#3B82F6' },
  avatarFallback: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 3, borderColor: '#CCE7FF' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 22 },
  doctorInfo: { flex: 1 },
  doctorName: { fontWeight: '800', color: '#1F2937', fontSize: 17 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E6FFFA', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 4 },
  specialization: { fontSize: 13, color: '#059669', fontWeight: '700', marginLeft: 4 },
  row: { flexDirection: 'row', marginTop: 4, alignItems: 'center' },
  experience: { fontSize: 13, color: '#4B5563', fontWeight: '600' },
  doctorRoom: { fontSize: 13, color: '#4B5563', fontWeight: '600', marginLeft: 8 },
  slotsLabel: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 16 },
  slotsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  slotItem: { width: SLOT_WIDTH_V2, marginBottom: 8 },
  slotButton: { backgroundColor: '#FFFFFF', paddingVertical: 8, paddingHorizontal: 8, borderRadius: 15, borderWidth: 1.5, borderColor: '#E5E7EB', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 65, elevation: 3 },
  slotButtonSelected: { backgroundColor: '#3B82F6', borderColor: '#1E40AF' },
  slotButtonWarning: { backgroundColor: '#FFFBEB', borderColor: '#FEF3C7' },
  slotButtonCritical: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  slotTime: { fontWeight: '800', color: '#1F2937', fontSize: 16, marginBottom: 2 },
  slotDetails: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  slotAvailable: { fontSize: 12, color: '#16A34A', fontWeight: '700', marginLeft: 4 },
  slotAvailableWarning: { color: '#B91C1C' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#F4F7FC' },
  loadingText: { marginTop: 16, color: '#4B5563', fontSize: 16, fontWeight: '600' },
  emptyTitle: { marginTop: 24, fontSize: 24, fontWeight: '800', color: '#374151' },
  emptyText: { marginTop: 12, color: '#6B7280', textAlign: 'center', fontSize: 15, lineHeight: 24, maxWidth: 320 },
  retryButton: { marginTop: 32, paddingHorizontal: 30, paddingVertical: 14, backgroundColor: '#3B82F6', borderRadius: 15, elevation: 8 },
  retryText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  changeDateButton: { marginTop: 18, paddingVertical: 12, paddingHorizontal: 25, backgroundColor: 'transparent', borderRadius: 15, borderWidth: 1, borderColor: '#D1D5DB' },
  changeDateText: { color: '#4B5563', fontWeight: '700', fontSize: 16 },
});