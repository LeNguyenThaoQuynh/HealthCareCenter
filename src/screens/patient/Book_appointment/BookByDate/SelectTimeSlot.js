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
const SLOT_HORIZONTAL_PADDING = 8;
const SLOT_MARGIN = 8; 
const LIST_HORIZONTAL_PADDING = 24; 

// Doctor Card Padding
const DOCTOR_CARD_PADDING_X = 16; 

// Tính toán chiều rộng động cho 2 cột bên trong Doctor Card (chiều rộng đã thu hẹp)
// Width = (width - 2*LIST_HORIZONTAL_PADDING - 2*DOCTOR_CARD_PADDING_X - 1*SLOT_MARGIN) / 2
const INNER_CONTENT_WIDTH = width - (2 * LIST_HORIZONTAL_PADDING) - (2 * DOCTOR_CARD_PADDING_X);
const SLOT_WIDTH_V2 = (INNER_CONTENT_WIDTH - SLOT_MARGIN) / 2;


export default function SelectTimeSlot() {
  const navigation = useNavigation();
  const route = useRoute();
  const { date, department, templates } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState(null); 

  // === FORMAT NGÀY CHO HEADER ===
  const formatHeaderDate = useMemo(() => {
    return new Date(date).toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [date]);

  // === TẠO KHUNG GIỜ 1 TIẾNG 30 PHÚT (Logic giữ nguyên) ===
  const timeSlots = useMemo(() => {
    const generatedSlots = [];
    const duration = 90;

    templates.forEach(t => {
      const [startH, startM] = t.start_time.split(':').map(Number);
      const [endH, endM] = t.end_time.split(':').map(Number);

      let currentTotalMinutes = startH * 60 + startM;
      const endTotalMinutes = endH * 60 + endM;

      while (currentTotalMinutes + duration <= endTotalMinutes) {
        const startH_slot = Math.floor(currentTotalMinutes / 60);
        const startM_slot = currentTotalMinutes % 60;

        const endTotalMinutes_slot = currentTotalMinutes + duration;
        const endH_slot = Math.floor(endTotalMinutes_slot / 60);
        const endM_slot = endTotalMinutes_slot % 60;

        generatedSlots.push({
          id: `${t.doctor_id || 'unknown'}_${startH_slot.toString().padStart(2, '0')}:${startM_slot.toString().padStart(2, '0')}`,
          doctor_id: t.doctor_id,
          doctor_name: t.doctors?.name || 'Bác sĩ',
          room_number: t.doctors?.room_number,
          avatar_url: t.doctors?.avatar_url,
          specialization: t.doctors?.specialization,
          experience_years: t.doctors?.experience_years,
          start_time: `${startH_slot.toString().padStart(2, '0')}:${startM_slot.toString().padStart(2, '0')}`,
          end_time: `${endH_slot.toString().padStart(2, '0')}:${endM_slot.toString().padStart(2, '0')}`,
          max_patients: 5,
          booked_count: Math.floor(Math.random() * 5),
        });

        currentTotalMinutes += duration;
      }
    });

    return generatedSlots;
  }, [templates]);

  // === LẤY DỮ LIỆU VÀ NHÓM THEO BÁC SĨ ===
  const loadData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setRefreshing(true);

    try {
      const finalSlots = timeSlots
        .map(slot => ({
          ...slot,
          available: slot.max_patients - slot.booked_count,
        }))
        .filter(s => s.available > 0);

      finalSlots.sort((a, b) => {
        const [ah, am] = a.start_time.split(':').map(Number);
        const [bh, bm] = b.start_time.split(':').map(Number);
        return (ah * 60 + am) - (bh * 60 + bm);
      });

      const grouped = {};
      finalSlots.forEach(s => {
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
          start_time: s.start_time,
          end_time: s.end_time,
          available: s.available,
        });
      });

      setSlots(Object.values(grouped));
    } catch (err) {
      console.error("Lỗi tải khung giờ:", err);
      Alert.alert('Lỗi', 'Không thể tải khung giờ.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeSlots]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    loadData(true);
  };

  const handleSlotPress = (slot, doctor) => {
    setSelectedSlotId(slot.id);
    setTimeout(() => {
      navigation.navigate('ConfirmBooking', {
        date,
        department,
        slot,
        doctor,
        price: department.price,
      });
      setSelectedSlotId(null);
    }, 100); 
  };

  // === RENDER KHUNG GIỜ (Slot) ===
  const renderSlot = (slot, doctor) => {
    const timeStr = `${slot.start_time}`;
    const isLow = slot.available <= 2;
    const isCritical = slot.available === 1;
    const isSelected = selectedSlotId === slot.id;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
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
        ]}>{timeStr}</Text>
        <View style={styles.slotDetails}>
          {isCritical ? (
            <Ionicons name="alert-circle-outline" size={14} color={isSelected ? '#fff' : '#B91C1C'} style={{ marginRight: 4 }} />
          ) : (
            <Ionicons name="flash-outline" size={14} color={isSelected ? '#fff' : (isLow ? '#B45309' : '#16A34A')} style={{ marginRight: 4 }} />
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

  // === RENDER CARD BÁC SĨ (Doctor Card) ===
  const renderDoctor = ({ item }) => {
    const doctor = item.doctor;
    const firstLetter = doctor.name?.charAt(0).toUpperCase() || 'B';
    const hasAvatar = !!doctor.avatar_url;

    return (
      <View style={styles.doctorCard}>
        {/* DOCTOR HEADER */}
        <View style={styles.doctorHeader}>
          {hasAvatar ? (
            <Image 
              source={{ uri: doctor.avatar_url }} 
              style={styles.avatar} 
              defaultSource={require('../../../../../assets/images/default-avatar.png')}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{firstLetter}</Text>
            </View>
          )}
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{doctor.name}</Text>
            {doctor.specialization && (
              <View style={styles.badge}>
                <Ionicons name="ribbon-outline" size={12} color="#059669" />
                <Text style={styles.specialization}>{doctor.specialization}</Text>
              </View>
            )}
            <View style={styles.row}>
              {doctor.experience_years && (
                <Text style={styles.experience}>
                   {doctor.experience_years} năm kinh nghiệm
                </Text>
              )}
              {doctor.room_number && (
                <Text style={styles.doctorRoom}> • Phòng {doctor.room_number}</Text>
              )}
            </View>
          </View>
        </View>
        
        {/* SLOTS CONTAINER */}
        <Text style={styles.slotsLabel}>Chọn khung giờ trống ({item.slots.length} lịch):</Text>
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
        Tất cả các khung giờ khám trong khoa này vào ngày **{formatHeaderDate}** đã được đặt hết hoặc chưa được mở.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
        <Text style={styles.retryText}>Tải lại danh sách</Text>
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
        <Text style={styles.loadingText}>Đang tìm kiếm lịch khám phù hợp...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient
        colors={['#1F2937', '#3B82F6']} 
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Chọn giờ khám</Text>
        <Text style={styles.subtitle}>{department.name}</Text>
      </LinearGradient>
      
      {/* INFO STRIP */}
      <View style={styles.info}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar" size={16} color="#059669" /> 
          <Text style={styles.infoText}> {formatHeaderDate}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="wallet-outline" size={16} color="#1F2937" />
          <Text style={styles.infoPrice}> {department.price.toLocaleString('vi-VN')}đ</Text>
        </View>
      </View>

      <FlatList
        data={slots}
        keyExtractor={item => item.doctor.id}
        renderItem={renderDoctor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#3B82F6" 
            progressViewOffset={Platform.OS === 'ios' ? 0 : 20}
          />
        }
        ListEmptyComponent={renderEmpty}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FC' }, 
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F7FC' },
  
  // === HEADER ===
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 10,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  subtitle: { fontSize: 16, fontWeight: '600', color: '#BEE3F8', marginTop: 4 },

  // === INFO STRIP ===
  info: {
    marginHorizontal: LIST_HORIZONTAL_PADDING,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoText: { fontSize: 15, color: '#059669', fontWeight: '700', marginLeft: 4 },
  infoPrice: { fontSize: 16, color: '#1F2937', fontWeight: '800', marginLeft: 4 },
  
  // === LIST CONTENT & DOCTOR CARD ===
  listContent: { 
    paddingHorizontal: LIST_HORIZONTAL_PADDING, 
    paddingTop: 16, 
    paddingBottom: 32 
  },
  doctorCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: DOCTOR_CARD_PADDING_X, // 16px
    marginBottom: 24, 
    elevation: 8, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  doctorHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 12, borderWidth: 3, borderColor: '#3B82F6' },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 3, 
    borderColor: '#CCE7FF',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 22 },
  doctorInfo: { flex: 1 },
  doctorName: { fontWeight: '800', color: '#1F2937', fontSize: 17 },
  badge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#E6FFFA',
    borderRadius: 8, 
    paddingHorizontal: 8,
    paddingVertical: 3, 
    alignSelf: 'flex-start', 
    marginTop: 4,
  },
  specialization: { fontSize: 13, color: '#059669', fontWeight: '700', marginLeft: 4 },
  row: { flexDirection: 'row', marginTop: 4, alignItems: 'center' },
  experience: { fontSize: 13, color: '#4B5563', fontWeight: '600' },
  doctorRoom: { fontSize: 13, color: '#4B5563', fontWeight: '600', marginLeft: 8 },
  
  // === SLOTS LAYOUT (Lưới 2 cột hoàn hảo) ===
  slotsLabel: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: '#374151', 
    marginBottom: 12,
    borderTopWidth: 1, 
    borderTopColor: '#F3F4F6', 
    paddingTop: 16 
  },
  slotsContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', // Quan trọng: Đảm bảo 2 cột đều nhau
    // marginHorizontal: -SLOT_MARGIN / 2, // KHÔNG DÙNG: Loại bỏ margin ngoài để dễ tính toán hơn
    marginHorizontal: 0,
  },
  slotItem: { 
    width: SLOT_WIDTH_V2, // <-- Chiều rộng đã tính toán chính xác
    marginBottom: SLOT_MARGIN,
    // marginHorizontal: SLOT_MARGIN / 2, // KHÔNG DÙNG: Giờ dùng space-between để tự căn
    marginHorizontal: 0,
  },
  slotButton: {
    backgroundColor: '#FFFFFF', 
    paddingVertical: 8,
    paddingHorizontal: SLOT_HORIZONTAL_PADDING,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: 65, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  slotButtonSelected: {
    backgroundColor: '#3B82F6', 
    borderColor: '#1E40AF',
  },
  slotButtonWarning: { backgroundColor: '#FFFAEB', borderColor: '#FDE68A' },
  slotButtonCritical: { backgroundColor: '#FFF0F0', borderColor: '#FCA5A5' },
  slotTime: { fontWeight: '800', color: '#1F2937', fontSize: 16, marginBottom: 2 },
  slotDetails: { flexDirection: 'row', alignItems: 'center' },
  slotAvailable: { fontSize: 12, color: '#16A34A', fontWeight: '700' },
  slotAvailableWarning: { color: '#B91C1C' }, 
  
  // === EMPTY & LOADING ===
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#F4F7FC' },
  loadingText: { marginTop: 16, color: '#4B5563', fontSize: 16, fontWeight: '600' },
  emptyTitle: { marginTop: 24, fontSize: 24, fontWeight: '800', color: '#374151' },
  emptyText: { marginTop: 12, color: '#6B7280', textAlign: 'center', fontSize: 15, lineHeight: 24, maxWidth: 320 },
  retryButton: { 
    marginTop: 32, 
    paddingHorizontal: 30, 
    paddingVertical: 14, 
    backgroundColor: '#3B82F6', 
    borderRadius: 15,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  retryText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  changeDateButton: {
    marginTop: 18,
    paddingVertical: 12,
    paddingHorizontal: 25,
    backgroundColor: 'transparent',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  changeDateText: { color: '#4B5563', fontWeight: '700', fontSize: 16 },
});