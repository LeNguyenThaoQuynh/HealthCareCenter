import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../api/supabase';

import {
  COLORS,
  GRADIENTS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  SHADOWS,
} from '../../theme/theme';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - SPACING.xl * 2;

const TIME_RANGES = [
  { key: 'today', label: 'Hôm nay', icon: 'today-outline', days: 0 },
  { key: '7day', label: '7 ngày gần nhất', icon: 'calendar-outline', days: 6 },
  { key: '30day', label: '30 ngày gần nhất', icon: 'calendar-outline', days: 29 },
  { key: '90day', label: '3 tháng gần nhất', icon: 'trending-up-outline', days: 89 },
  { key: '1year', label: '1 năm gần nhất', icon: 'trending-up-outline', days: 364 },
  { key: 'all', label: 'Toàn bộ thời gian', icon: 'infinite-outline', days: 9999 },
];

export default function PatientStatisticsScreen() {
  const navigation = useNavigation();

  const [doctorId, setDoctorId] = useState(null);
  const [selectedRange, setSelectedRange] = useState('30day');
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalPatients, setTotalPatients] = useState(0);
  const [chartData, setChartData] = useState(null);

  // Lấy ID bác sĩ
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setDoctorId(user.id);
    })();
  }, []);

  // Tính startDate từ range
  const startDate = useMemo(() => {
    const range = TIME_RANGES.find(r => r.key === selectedRange);
    if (!range) return null;

    const date = new Date();
    if (range.days === 9999) {
      date.setFullYear(2020); // đủ sớm
    } else {
      date.setDate(date.getDate() - range.days);
    }
    date.setHours(0, 0, 0, 0);
    return date;
  }, [selectedRange]);

  // Fetch dữ liệu
  useEffect(() => {
    if (!doctorId || !startDate) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
          .from('appointments')
          .select('appointment_date')
          .eq('doctor_id', doctorId)
          .eq('status', 'completed')
          .gte('appointment_date', startDate.toISOString())
          .lte('appointment_date', endDate.toISOString())
          .order('appointment_date', { ascending: true });

        if (error) throw error;

        const dailyCount = {};
        data?.forEach(item => {
          const key = new Date(item.appointment_date).toLocaleDateString('vi-VN');
          dailyCount[key] = (dailyCount[key] || 0) + 1;
        });

        const labels = [];
        const values = [];
        let current = new Date(startDate);

        while (current <= endDate) {
          const key = current.toLocaleDateString('vi-VN');
          const isToday = current.toDateString() === new Date().toDateString();

          labels.push(isToday ? 'Hôm nay' : `${current.getDate()}/${current.getMonth() + 1}`);
          values.push(dailyCount[key] || 0);
          current.setDate(current.getDate() + 1);
        }

        const total = values.reduce((a, b) => a + b, 0);

        // Hiển thị tối đa 10 nhãn
        const maxLabels = 10;
        const step = Math.max(1, Math.floor(values.length / maxLabels));
        const displayLabels = [];
        const displayValues = [];

        for (let i = 0; i < values.length; i += step) {
          displayLabels.push(labels[i]);
          displayValues.push(values[i]);
        }
        if (values.length > 1 && (values.length - 1) % step !== 0) {
          displayLabels.push(labels[labels.length - 1]);
          displayValues.push(values[values.length - 1]);
        }

        setTotalPatients(total);
        setChartData({
          labels: displayLabels.length > 1 ? displayLabels : ['Hôm nay'],
          datasets: [{ data: displayValues.length > 0 ? displayValues : [0] }],
        });
      } catch (err) {
        console.error('Lỗi thống kê:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [doctorId, startDate]);

  const currentRange = TIME_RANGES.find(r => r.key === selectedRange) || TIME_RANGES[2];

  if (!doctorId) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER CÓ NÚT BACK + CHỮ NHỎ LẠI */}
      <LinearGradient colors={GRADIENTS.header} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color={COLORS.textOnPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Thống kê bệnh nhân</Text>

        <TouchableOpacity style={styles.rangeBtn} onPress={() => setShowPicker(true)}>
          <Ionicons name={currentRange.icon} size={20} color={COLORS.textOnPrimary} />
          <Text style={styles.rangeText}>{currentRange.label}</Text>
          <Ionicons name="chevron-down" size={18} color={COLORS.textOnPrimary} />
        </TouchableOpacity>
      </LinearGradient>

      {/* TỔNG QUAN */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Tổng bệnh nhân đã khám</Text>
        <Text style={styles.summaryValue}>{totalPatients.toLocaleString('vi-VN')}</Text>
        <Text style={styles.summarySub}>{currentRange.label}</Text>
      </View>

      {/* BIỂU ĐỒ */}
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      ) : totalPatients === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={70} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>Chưa có bệnh nhân</Text>
          <Text style={styles.emptyDesc}>Biểu đồ sẽ hiện khi bạn khám bệnh</Text>
        </View>
      ) : (
        <View style={styles.chartCard}>
          <LineChart
            data={chartData}
            width={CHART_WIDTH}
            height={280}
            yAxisSuffix=" người"
            chartConfig={{
              backgroundColor: COLORS.surface,
              backgroundGradientFrom: COLORS.surface,
              backgroundGradientTo: COLORS.surface,
              decimalPlaces: 0,
              color: () => COLORS.primary,
              labelColor: () => COLORS.textSecondary,
              propsForDots: { r: '5', strokeWidth: '3', stroke: COLORS.primary },
            }}
            bezier
            fromZero
            style={styles.chart}
            segments={5}
          />
        </View>
      )}

      {/* MODAL CHỌN KHOẢNG */}
      <Modal visible={showPicker} transparent animationType="slide">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowPicker(false)}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn khoảng thời gian</Text>
            </View>
            {TIME_RANGES.map(item => (
              <TouchableOpacity
                key={item.key}
                style={[styles.modalItem, selectedRange === item.key && styles.activeItem]}
                onPress={() => {
                  setSelectedRange(item.key);
                  setShowPicker(false);
                }}
              >
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={selectedRange === item.key ? COLORS.primary : COLORS.textSecondary}
                />
                <Text style={[styles.modalItemText, selectedRange === item.key && styles.activeText]}>
                  {item.label}
                </Text>
                {selectedRange === item.key && (
                  <Ionicons name="checkmark-circle" size={26} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

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
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textOnPrimary, flex: 1, marginLeft: 12 },

  rangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  rangeText: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.textOnPrimary },

  summaryCard: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
    padding: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  summaryLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  summaryValue: { fontSize: 46, fontWeight: '900', color: COLORS.primary, marginVertical: SPACING.sm },
  summarySub: { fontSize: FONT_SIZE.sm, color: COLORS.textLight },

  chartCard: {
    marginTop: SPACING.xl,
    marginHorizontal: SPACING.xl,
    padding: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.card,
  },
  chart: { borderRadius: BORDER_RADIUS.xl },

  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: SPACING.lg, fontSize: FONT_SIZE.base, color: COLORS.textSecondary },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.xxl },
  emptyTitle: { marginTop: SPACING.xl, fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.textPrimary },
  emptyDesc: { marginTop: SPACING.md, fontSize: FONT_SIZE.base, color: COLORS.textSecondary, textAlign: 'center' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xl,
  },
  modalHeader: {
    padding: SPACING.xl,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.textPrimary },

  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.xl,
    paddingHorizontal: SPACING.xxl,
    gap: SPACING.lg,
  },
  activeItem: { backgroundColor: COLORS.primary + '12' },
  modalItemText: { flex: 1, fontSize: FONT_SIZE.lg, color: COLORS.textPrimary },
  activeText: { fontWeight: '700', color: COLORS.primary },
});