import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
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

export default function SelectSpecialization() {
  const navigation = useNavigation();
  const route = useRoute();
  const { date } = route.params;

  const [specializations, setSpecializations] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const headerDate = new Date(date).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
  });

  const getDayOfWeek = (dateStr) => {
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return days[new Date(dateStr).getDay()];
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const targetDay = getDayOfWeek(date);

      const { data: schedules, error } = await supabase
        .from('doctor_schedule_template')
        .select(`
          doctor_id,
          day_of_week,
          start_time,
          end_time,
          doctors!inner (
            id,
            name,
            room_number,
            specialization,
            department_name
          )
        `)
        .eq('day_of_week', targetDay);

      if (error) throw error;
      if (!schedules || schedules.length === 0) {
        setSpecializations([]);
        setLoading(false);
        return;
      }

      const specMap = new Map();

      schedules.forEach(sch => {
        const doctor = sch.doctors;
        if (!doctor?.specialization) return;

        const specs = doctor.specialization
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);

        specs.forEach(spec => {
          if (!specMap.has(spec)) {
            specMap.set(spec, {
              name: spec,
              doctorCount: 0,
              doctors: [],
            });
          }

          const entry = specMap.get(spec);
          entry.doctorCount++;

          const exists = entry.doctors.some(d => d.id === doctor.id);
          if (!exists) {
            entry.doctors.push({
              id: doctor.id,
              name: doctor.name || 'Bác sĩ',
              room_number: doctor.room_number || 'Chưa có',
              specializationText: specs.join(' • '),
              specializations: specs,
              department_name: doctor.department_name || 'Chưa rõ khoa',
              schedule: sch,
            });
          }
        });
      });

      const result = Array.from(specMap.values())
        .map(item => ({
          ...item,
          id: `spec_${item.name}`,
          price: 180000,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setSpecializations(result);
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Không thể tải danh sách chuyên khoa');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const filteredList = useMemo(() => {
    if (!search.trim()) return specializations;
    return specializations.filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, specializations]);

  const renderItem = useCallback(({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('SelectTimeSlot', {
        date,
        specialization: item.name,
        doctors: item.doctors.map(d => ({
          doctor_id: d.id,
          doctor_name: d.name,
          room_number: d.room_number,
          specializationText: d.specializationText,
          department_name: d.department_name,
          start_time: d.schedule.start_time,
          end_time: d.schedule.end_time,
        })),
      })}
    >
      <View style={styles.left}>
        <View style={styles.icon}>
          <Ionicons name="medical-outline" size={26} color={COLORS.textOnPrimary} />
        </View>
        <View>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.count}>{item.doctorCount} bác sĩ</Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={styles.price}>{item.price.toLocaleString('vi-VN')}đ</Text>
        <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
      </View>
    </TouchableOpacity>
  ), [date, navigation]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={GRADIENTS.header} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color={COLORS.textOnPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Chọn chuyên khoa</Text>
          <Text style={styles.date}>{headerDate}</Text>
        </View>
        <View style={{ width: 26 }} />
      </LinearGradient>

      {/* TÌM KIẾM NẰM DƯỚI HEADER + TO HƠN 1 CHÚT */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={22} color={COLORS.textSecondary} />
          <TextInput
            placeholder="Tìm chuyên khoa..."
            value={search}
            onChangeText={setSearch}
            style={styles.input}
            placeholderTextColor={COLORS.textLight}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loading}>Đang tải chuyên khoa...</Text>
        </View>
      ) : filteredList.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="calendar-outline" size={80} color={COLORS.textLight} />
          <Text style={styles.empty}>Không có bác sĩ làm việc ngày này</Text>
        </View>
      ) : (
        <FlatList
          data={filteredList}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

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
  date: { fontSize: FONT_SIZE.sm, color: COLORS.textOnPrimary + 'cc', marginTop: 4 },

  // TÌM KIẾM DƯỚI HEADER, TO HƠN, ĐẸP HƠN
  searchContainer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.background,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 18,  // to hơn
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.card,
  },
  input: {
    flex: 1,
    marginLeft: SPACING.md,
    fontSize: FONT_SIZE.lg,  // chữ to hơn
    color: COLORS.textPrimary,
  },

  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.card,
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  name: { fontSize: FONT_SIZE.lg, fontWeight: '800', color: COLORS.textPrimary },
  count: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 4 },
  right: { alignItems: 'flex-end' },
  price: { fontSize: FONT_SIZE.lg, fontWeight: '800', color: COLORS.primary },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.xxl },
  loading: { marginTop: SPACING.lg, fontSize: FONT_SIZE.base, color: COLORS.textSecondary },
  empty: { marginTop: SPACING.xl, fontSize: FONT_SIZE.lg, color: COLORS.textSecondary, textAlign: 'center' },
  list: { paddingTop: SPACING.md },
});