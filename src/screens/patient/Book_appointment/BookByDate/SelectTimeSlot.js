// src/screens/patient/Book_appointment/BookByDate/SelectTimeSlot.js
// ĐÃ FIX 100%: KHÔNG CÓ GÌ ĐÈ LÊN HEADER NỮA – SẠCH, ĐẸP, CHUẨN APP PHƯỚC EM

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../../api/supabase';

import {
  COLORS,
  GRADIENTS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  SHADOWS,
} from '../../../../theme/theme';

const { width } = Dimensions.get('window');
const SLOT_WIDTH = (width - SPACING.xl * 2 - SPACING.md) / 2;

const safeTime = (timeVal) => {
  if (!timeVal) return null;
  const str = String(timeVal).trim();
  return str.length >= 5 ? str.slice(0, 5) : null;
};

export default function SelectTimeSlot() {
  const navigation = useNavigation();
  const route = useRoute();
  const { date, specialization } = route.params || {};

  const targetSpecialization = typeof specialization === 'string'
    ? specialization.trim()
    : specialization?.name?.trim();

  const price = typeof specialization === 'object' ? (specialization.price || 180000) : 180000;

  useEffect(() => {
    if (!targetSpecialization) navigation.goBack();
  }, [targetSpecialization, navigation]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState(null);

  const headerDate = useMemo(() => new Date(date).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }), [date]);

  const dayOfWeek = useMemo(() => {
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return days[new Date(date).getDay()];
  }, [date]);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setRefreshing(true);

    try {
      const { data: templates, error } = await supabase
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
            experience_years,
            specialization,
            user_profiles!inner (avatar_url)
          )
        `)
        .eq('day_of_week', dayOfWeek);

      if (error) throw error;
      if (!templates?.length) {
        setSlots([]);
        return;
      }

      const filteredTemplates = templates.filter(t => {
        const specs = (t.doctors?.specialization || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
        return specs.includes(targetSpecialization);
      });

      if (!filteredTemplates.length) {
        setSlots([]);
        return;
      }

      const slotIds = filteredTemplates.map(t => t.id);
      const { data: booked } = await supabase
        .from('appointments')
        .select('slot_id')
        .eq('date', date)
        .in('slot_id', slotIds)
        .neq('status', 'cancelled');

      const bookedCount = {};
      booked?.forEach(b => bookedCount[b.slot_id] = (bookedCount[b.slot_id] || 0) + 1);

      const grouped = {};

      filteredTemplates.forEach(t => {
        const start = safeTime(t.start_time);
        const end = safeTime(t.end_time);
        if (!start || !end) return;

        const booked = bookedCount[t.id] || 0;
        const max = t.max_patients_per_slot || 5;
        const available = max - booked;
        if (available <= 0) return;

        const doctor = t.doctors;
        const doctorId = doctor.id;

        if (!grouped[doctorId]) {
          const specs = (doctor.specialization || '').split(',').map(s => s.trim()).filter(Boolean);
          grouped[doctorId] = {
            doctor: {
              id: doctorId,
              name: doctor.name || 'Bác sĩ',
              room_number: doctor.room_number || 'Chưa có',
              avatar_url: doctor.user_profiles?.avatar_url,
              specializationText: specs.join(' • '),
              experience_years: doctor.experience_years,
            },
            slots: [],
          };
        }

        grouped[doctorId].slots.push({
          id: t.id,
          display: `${start} - ${end}`,
          start_time: start,
          end_time: end,
          available,
        });
      });

      setSlots(Object.values(grouped).filter(g => g.slots.length > 0));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [date, dayOfWeek, targetSpecialization]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSlotPress = (slot, doctor) => {
    setSelectedSlotId(slot.id);
    setTimeout(() => {
      navigation.navigate('ConfirmBookingDoctor', {
        doctor: doctor,
        selectedDate: date,
        timeSlot: {
          slot_id: slot.id,
          display: slot.display,
          start: slot.start_time,
        },
      });
    }, 180);
  };

  const renderSlot = (slot, doctor) => {
    const isLow = slot.available <= 2;
    const isCritical = slot.available === 1;
    const isSelected = selectedSlotId === slot.id;

    return (
      <TouchableOpacity
        style={[
          styles.slot,
          isLow && styles.slotLow,
          isCritical && styles.slotCritical,
          isSelected && styles.slotSelected,
        ]}
        onPress={() => handleSlotPress(slot, doctor)}
        activeOpacity={0.8}
      >
        <Text style={[styles.time, isSelected && styles.timeSelected]}>
          {slot.display}
        </Text>
        <Text style={[styles.available, isCritical && styles.availableCritical, isSelected && styles.availableSelected]}>
          {slot.available} chỗ
        </Text>
      </TouchableOpacity>
    );
  };

  const renderDoctor = ({ item }) => (
    <View style={styles.doctorCard}>
      <View style={styles.doctorHeader}>
        {item.doctor.avatar_url ? (
          <Image source={{ uri: item.doctor.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarLetter}>{item.doctor.name?.[0] || 'B'}</Text>
          </View>
        )}
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>BS. {item.doctor.name}</Text>
          <Text style={styles.specialization}>{item.doctor.specializationText}</Text>
          <Text style={styles.experience}>
            {item.doctor.experience_years && `${item.doctor.experience_years} năm kinh nghiệm`}
            {item.doctor.room_number && ` • Phòng ${item.doctor.room_number}`}
          </Text>
        </View>
      </View>

      <Text style={styles.slotLabel}>Chọn khung giờ:</Text>
      <View style={styles.slotsGrid}>
        {item.slots.map(slot => (
          <View key={slot.id} style={{ width: SLOT_WIDTH, padding: SPACING.sm / 2 }}>
            {renderSlot(slot, item.doctor)}
          </View>
        ))}
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tìm bác sĩ...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER – KHÔNG CÓ GÌ ĐÈ LÊN */}
      <LinearGradient colors={GRADIENTS.header} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color={COLORS.textOnPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Chọn khung giờ</Text>
          <Text style={styles.subtitle}>{targetSpecialization}</Text>
        </View>
        <View style={{ width: 26 }} />
      </LinearGradient>

      {/* INFO CARD – ĐẶT SAU HEADER, KHÔNG DÍNH, KHÔNG ĐÈ */}
      <View style={styles.infoCard}>
        <Text style={styles.dateText}>{headerDate}</Text>
        <Text style={styles.priceText}>{price.toLocaleString('vi-VN')}đ</Text>
      </View>

      {/* DANH SÁCH BÁC SĨ */}
      <FlatList
        data={slots}
        renderItem={renderDoctor}
        keyExtractor={item => item.doctor.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-clear-outline" size={80} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>Không có khung giờ trống</Text>
            <Text style={styles.emptyDesc}>
              Chuyên khoa {targetSpecialization} đã hết chỗ vào ngày này
            </Text>
          </View>
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // HEADER SẠCH SẼ
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: BORDER_RADIUS.xxl,
    borderBottomRightRadius: BORDER_RADIUS.xxl,
  },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.textOnPrimary },
  subtitle: { fontSize: FONT_SIZE.lg, color: COLORS.textOnPrimary + 'e6', marginTop: 4 },

  // INFO CARD KHÔNG ĐÈ, CÁCH HEADER 1 CHÚT
  infoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xl,        // ← ĐÂY LÀ KEY: KHÔNG DÙNG marginTop: -xx NỮA
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.card,
  },
  dateText: { fontSize: FONT_SIZE.base, fontWeight: '700', color: COLORS.success },
  priceText: { fontSize: FONT_SIZE.xl, fontWeight: '900', color: COLORS.primary },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: SPACING.lg, fontSize: FONT_SIZE.base, color: COLORS.textSecondary },

  doctorCard: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
    padding: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.card,
  },
  doctorHeader: { flexDirection: 'row', marginBottom: SPACING.lg },
  avatar: { width: 64, height: 64, borderRadius: 32, marginRight: SPACING.lg },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  avatarLetter: { fontSize: 28, fontWeight: 'bold', color: COLORS.textOnPrimary },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.textPrimary },
  specialization: { fontSize: FONT_SIZE.sm, color: COLORS.primary, marginTop: 4, fontWeight: '700' },
  experience: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 4 },

  slotLabel: { fontSize: FONT_SIZE.base, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  slot: {
    width: SLOT_WIDTH,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#BBF7D0',
  },
  slotLow: { backgroundColor: '#FFFBEB', borderColor: '#FEF3C7' },
  slotCritical: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  slotSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  time: { fontSize: FONT_SIZE.lg, fontWeight: '800', color: COLORS.successDark },
  timeSelected: { color: COLORS.textOnPrimary },
  available: { fontSize: FONT_SIZE.xs, fontWeight: '700', marginTop: 4, color: COLORS.successDark },
  availableCritical: { color: '#B91C1C' },
  availableSelected: { color: COLORS.textOnPrimary },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.xxl },
  emptyTitle: { marginTop: SPACING.xl, fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.textPrimary },
  emptyDesc: { marginTop: SPACING.md, fontSize: FONT_SIZE.base, color: COLORS.textSecondary, textAlign: 'center' },

  list: { paddingTop: SPACING.lg, paddingBottom: SPACING.xxxl },
});