import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'react-native-calendars';
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

export default function BookByDate() {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState('');
  const [markedDates, setMarkedDates] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchAvailableDates = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .rpc('get_available_dates', { from_date: today, days_ahead: 90 });

      if (error) throw error;

      const marked = {};
      data?.forEach(item => {
        marked[item.work_date] = {
          marked: true,
          dotColor: COLORS.primary,
        };
      });

      if (selectedDate && marked[selectedDate]) {
        marked[selectedDate] = {
          ...marked[selectedDate],
          selected: true,
          selectedColor: COLORS.primary,
          selectedTextColor: COLORS.textOnPrimary,
        };
      }

      setMarkedDates(marked);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAvailableDates();
    }, [])
  );

  const handleDayPress = (day) => {
    const dateStr = day.dateString;
    if (!markedDates[dateStr]?.marked) return;

    setSelectedDate(dateStr);
    navigation.navigate('SelectDepartment', { date: dateStr });
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <View style={styles.container}>
      <LinearGradient colors={GRADIENTS.header} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color={COLORS.textOnPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Chọn ngày khám</Text>
        <TouchableOpacity onPress={() => navigation.navigate('PatientHome')}>
          <Ionicons name="home-outline" size={26} color={COLORS.textOnPrimary} />
        </TouchableOpacity>
      </LinearGradient>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải lịch khám...</Text>
        </View>
      )}

      <View style={styles.calendarWrapper}>
        <Calendar
          current={todayStr}
          minDate={todayStr}
          onDayPress={handleDayPress}
          markedDates={{
            ...markedDates,
            [selectedDate]: selectedDate ? {
              ...(markedDates[selectedDate] || {}),
              selected: true,
              selectedColor: COLORS.primary,
              selectedTextColor: COLORS.textOnPrimary,
            } : undefined,
          }}
          theme={{
            backgroundColor: COLORS.surface,
            calendarBackground: COLORS.surface,
            textSectionTitleColor: COLORS.textSecondary,
            todayTextColor: COLORS.primary,
            todayBackgroundColor: COLORS.primary + '15',
            dayTextColor: COLORS.textPrimary,
            textDisabledColor: COLORS.textLight,
            dotColor: COLORS.primary,
            selectedDotColor: COLORS.textOnPrimary,
            arrowColor: COLORS.primary,
            monthTextColor: COLORS.textPrimary,
            textDayFontWeight: '600',
            textMonthFontWeight: '800',
            textDayHeaderFontWeight: '700',
            textDayFontSize: FONT_SIZE.base,
            textMonthFontSize: FONT_SIZE.xl,
          }}
          hideExtraDays
          firstDay={1}
          enableSwipeMonths
        />
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
          <Text style={styles.legendText}>Có lịch khám</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: COLORS.textLight }]} />
          <Text style={styles.legendText}>Ngày nghỉ</Text>
        </View>
      </View>

      <Text style={styles.note}>
        Chỉ bấm vào ngày có chấm xanh để đặt lịch khám
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: BORDER_RADIUS.xxl,
    borderBottomRightRadius: BORDER_RADIUS.xxl,
  },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.textOnPrimary },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { marginTop: SPACING.md, fontSize: FONT_SIZE.base, color: COLORS.textSecondary },
  calendarWrapper: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xl,
    gap: 32,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  dot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  note: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xxxl,
    fontSize: FONT_SIZE.base,
    color: COLORS.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
});