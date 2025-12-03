import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../../api/supabase';

import {
  COLORS,
  GRADIENTS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  SHADOWS,
} from '../../../../theme/theme';

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
const TIME_SLOTS = ['Sáng (07:00 - 12:00)', 'Chiều (13:00 - 17:00)', 'Tối (17:00 - 21:00)'];

export default function BookByDoctor() {
  const navigation = useNavigation();

  const [query, setQuery] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialization, setSelectedSpecialization] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [specModal, setSpecModal] = useState(false);
  const [dayModal, setDayModal] = useState(false);
  const [timeModal, setTimeModal] = useState(false);
  const [allSpecializations, setAllSpecializations] = useState(['Tất cả chuyên môn']);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from('doctors').select('specialization').not('specialization', 'is', null);
        if (data?.length) {
          const unique = [...new Set(data.flatMap(d => d.specialization?.split('•') || []).map(s => s.trim()).filter(Boolean))].sort();
          setAllSpecializations(['Tất cả chuyên môn', ...unique]);
        }
      } catch (err) { }
    })();
  }, []);

  const searchDoctors = useCallback(async () => {
    const hasFilter = query.trim() || selectedSpecialization || selectedDay || selectedTime;
    setLoading(true);
    try {
      let q = supabase.from('doctors').select(`
          id, name, avatar_url, specialization, room_number, department_name,
          doctor_schedule_template(day_of_week, start_time, end_time)
        `).limit(hasFilter ? 500 : 10).order('name');

      if (query.trim()) q = q.ilike('name', `%${query.trim()}%`);
      const { data: rawDoctors, error } = await q;
      if (error) throw error;
      if (!rawDoctors?.length) { setDoctors([]); setLoading(false); return; }

      const result = rawDoctors.map(doc => {
        const specializations = doc.specialization ? doc.specialization.split('•').map(s => s.trim()).filter(Boolean) : ['Chưa cập nhật'];
        if (selectedSpecialization && selectedSpecialization !== 'Tất cả chuyên môn' && !specializations.includes(selectedSpecialization)) return null;

        const templates = Array.isArray(doc.doctor_schedule_template) ? doc.doctor_schedule_template : doc.doctor_schedule_template ? [doc.doctor_schedule_template] : [];
        const sessions = templates.map(t => {
          if (!t.start_time || !t.day_of_week) return null;
          const hour = parseInt(t.start_time.split(':')[0], 10);
          const session = hour < 12 ? 'Sáng' : hour < 17 ? 'Chiều' : 'Tối';
          return `${session} ${t.day_of_week}`;
        }).filter(Boolean);

        const filteredSessions = sessions.filter(s => {
          if (selectedDay && !s.includes(selectedDay)) return false;
          if (selectedTime) {
            const target = selectedTime.includes('Sáng') ? 'Sáng' : selectedTime.includes('Chiều') ? 'Chiều' : 'Tối';
            if (!s.includes(target)) return false;
          }
          return true;
        });

        if (hasFilter && filteredSessions.length === 0) return null;

        return {
          id: doc.id,
          name: doc.name || 'Bác sĩ',
          avatar_url: doc.avatar_url,
          room_number: doc.room_number || 'Chưa xác định',
          department_name: doc.department_name,
          specializations,
          schedules: filteredSessions.length > 0 ? filteredSessions : hasFilter ? [] : ['Chưa có lịch công khai'],
        };
      }).filter(Boolean);

      setDoctors(result);
    } catch (err) {
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [query, selectedSpecialization, selectedDay, selectedTime]);

  useEffect(() => { searchDoctors(); }, [searchDoctors]);

  const renderDoctor = useCallback(({ item }) => (
    <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={() => navigation.navigate('SelectDate', { doctor: item })}>
      <View style={styles.cardHeader}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarLetter}>{item.name[0]?.toUpperCase() || 'B'}</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          {item.department_name && <Text style={styles.department}>{item.department_name}</Text>}
          {item.specializations.length > 0 && (
            <Text style={styles.specialty} numberOfLines={1}>{item.specializations.join(' • ')}</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={22} color={COLORS.textSecondary} />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.row}>
          <View style={styles.col}>
            <Ionicons name="medkit-outline" size={16} color={COLORS.primary} />
            <Text style={styles.label}>Phòng</Text>
            <Text style={styles.value}>{item.room_number}</Text>
          </View>
          <View style={styles.col}>
            <Ionicons name="time-outline" size={16} color={COLORS.accentTeal} />
            <Text style={styles.label}>Lịch khám</Text>
            <View style={styles.tags}>
              {item.schedules.length > 0 ? item.schedules.slice(0, 3).map((s, i) => (
                <View key={i} style={styles.tag}><Text style={styles.tagText}>{s.split(' ')[0]}</Text></View>
              )) : <Text style={styles.noSchedule}>Chưa có</Text>}
              {item.schedules.length > 3 && <Text style={styles.more}>+{item.schedules.length - 3}</Text>}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Đặt lịch ngay</Text>
        <Ionicons name="arrow-forward" size={18} color={COLORS.textOnPrimary} />
      </View>
    </TouchableOpacity>
  ), [navigation]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={GRADIENTS.header} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color={COLORS.textOnPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chọn bác sĩ</Text>
        <TouchableOpacity onPress={() => navigation.navigate('PatientHome')}>
          <Ionicons name="home-outline" size={26} color={COLORS.textOnPrimary} />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={COLORS.textSecondary} />
        <TextInput placeholder="Tìm bác sĩ..." value={query} onChangeText={setQuery} style={styles.searchInput} placeholderTextColor={COLORS.textSecondary} />
        {query ? <TouchableOpacity onPress={() => setQuery('')}><Ionicons name="close-circle" size={20} color={COLORS.textSecondary} /></TouchableOpacity> : null}
      </View>

      <View style={styles.filters}>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setSpecModal(true)}>
          <Text style={styles.filterTxt}>{selectedSpecialization || 'Chuyên môn'}</Text>
          <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setDayModal(true)}>
          <Text style={styles.filterTxt}>{selectedDay || 'Thứ'}</Text>
          <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setTimeModal(true)}>
          <Text style={styles.filterTxt}>{selectedTime || 'Buổi'}</Text>
          <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /><Text style={styles.loadingTxt}>Đang tải...</Text></View>
      ) : doctors.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="people-outline" size={70} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>Không tìm thấy bác sĩ</Text>
          <Text style={styles.emptySub}>Thử thay đổi bộ lọc</Text>
        </View>
      ) : (
        <FlatList data={doctors} keyExtractor={i => i.id} renderItem={renderDoctor} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} />
      )}

      {/* Các Modal giữ nguyên logic, chỉ thu gọn style */}
      <Modal visible={specModal} transparent animationType="slide"><View style={styles.modalOverlay}><View style={styles.modal}><View style={styles.modalHeader}><Text style={styles.modalTitle}>Chọn chuyên môn</Text><TouchableOpacity onPress={() => setSpecModal(false)}><Ionicons name="close" size={26} color={COLORS.textPrimary} /></TouchableOpacity></View><FlatList data={allSpecializations} keyExtractor={i => i} renderItem={({ item }) => (
        <TouchableOpacity style={styles.modalItem} onPress={() => { setSelectedSpecialization(item === 'Tất cả chuyên môn' ? null : item); setSpecModal(false); }}>
          <Text style={styles.modalItemTxt}>{item}</Text>
          {(selectedSpecialization || 'Tất cả chuyên môn') === item && <Ionicons name="checkmark" size={24} color={COLORS.primary} />}
        </TouchableOpacity>
      )} /></View></View></Modal>

      <Modal visible={dayModal} transparent animationType="slide"><View style={styles.modalOverlay}><View style={styles.modal}><View style={styles.modalHeader}><Text style={styles.modalTitle}>Chọn thứ</Text><TouchableOpacity onPress={() => setDayModal(false)}><Ionicons name="close" size={26} color={COLORS.textPrimary} /></TouchableOpacity></View>{DAYS.map(d => (
        <TouchableOpacity key={d} style={styles.modalItem} onPress={() => { setSelectedDay(p => p === d ? null : d); setDayModal(false); }}>
          <Text style={styles.modalItemTxt}>{d}</Text>
          {selectedDay === d && <Ionicons name="checkmark" size={24} color={COLORS.primary} />}
        </TouchableOpacity>
      ))}</View></View></Modal>

      <Modal visible={timeModal} transparent animationType="slide"><View style={styles.modalOverlay}><View style={styles.modal}><View style={styles.modalHeader}><Text style={styles.modalTitle}>Chọn buổi</Text><TouchableOpacity onPress={() => setTimeModal(false)}><Ionicons name="close" size={26} color={COLORS.textPrimary} /></TouchableOpacity></View>{TIME_SLOTS.map(s => (
        <TouchableOpacity key={s} style={styles.modalItem} onPress={() => { setSelectedTime(p => p === s ? null : s); setTimeModal(false); }}>
          <Text style={styles.modalItemTxt}>{s}</Text>
          {selectedTime === s && <Ionicons name="checkmark" size={24} color={COLORS.primary} />}
        </TouchableOpacity>
      ))}</View></View></Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xl, borderBottomLeftRadius: BORDER_RADIUS.xxl, borderBottomRightRadius: BORDER_RADIUS.xxl, overflow: 'hidden' },
  headerTitle: { fontSize: 26, fontWeight: '800', color: COLORS.textOnPrimary },

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, marginHorizontal: SPACING.xl, marginTop: SPACING.lg, paddingHorizontal: SPACING.lg, borderRadius: BORDER_RADIUS.lg, height: 48, ...SHADOWS.small },
  searchInput: { flex: 1, fontSize: FONT_SIZE.base, marginLeft: 8, color: COLORS.textPrimary },

  filters: { flexDirection: 'row', marginHorizontal: SPACING.xl, marginTop: SPACING.md, gap: SPACING.sm },
  filterBtn: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, paddingHorizontal: SPACING.md, paddingVertical: 11, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
  filterTxt: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, fontWeight: '600' },

  list: { padding: SPACING.xl },
  card: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, marginBottom: SPACING.md, ...SHADOWS.card, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  avatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2.5, borderColor: COLORS.primary + '30' },
  avatarPlaceholder: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: COLORS.textOnPrimary, fontSize: 24, fontWeight: 'bold' },
  info: { flex: 1, marginLeft: SPACING.md },
  name: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.textPrimary },
  department: { fontSize: FONT_SIZE.sm, color: COLORS.primary, marginTop: 2 },
  specialty: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 4 },

  cardBody: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { flex: 1 },
  label: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 4 },
  value: { fontSize: FONT_SIZE.base, fontWeight: '600', color: COLORS.textPrimary, marginTop: 2 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  tag: { backgroundColor: COLORS.primary + '15', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 16 },
  tagText: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: '700' },
  noSchedule: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  more: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: 'bold' },

  footer: { backgroundColor: COLORS.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, gap: 8 },
  footerText: { color: COLORS.textOnPrimary, fontSize: FONT_SIZE.base, fontWeight: '700' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingTxt: { marginTop: SPACING.md, fontSize: FONT_SIZE.base, color: COLORS.textSecondary },
  emptyTitle: { marginTop: SPACING.lg, fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.textPrimary },
  emptySub: { fontSize: FONT_SIZE.base, color: COLORS.textSecondary },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: COLORS.surface, borderTopLeftRadius: BORDER_RADIUS.xl, borderTopRightRadius: BORDER_RADIUS.xl, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontSize: FONT_SIZE.lg, fontWeight: '800', color: COLORS.textPrimary },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  modalItemTxt: { fontSize: FONT_SIZE.base, color: COLORS.textPrimary },
});