// src/screens/patient/Book_appointment/BookByDate/BookByDate.js
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'react-native-calendars';
import { supabase } from '../../../../api/supabase';
import theme from '../../../../theme/theme'; // IMPORT THEME

const {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  SHADOWS,
  GRADIENTS,
} = theme;

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
      if (data && data.length > 0) {
        data.forEach(item => {
          marked[item.work_date] = {
            marked: true,
            dotColor: COLORS.primary,        // XANH ĐẬM ĐẸP
            selectedColor: COLORS.primaryDark,
          };
        });
      }
      setMarkedDates(marked);
    } catch (err) {
      console.error('Lỗi tải lịch:', err);
      Alert.alert('Lỗi', 'Không thể tải lịch. Vui lòng thử lại.');
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
    if (!markedDates[day.dateString]?.marked) {
      Alert.alert('Không thể đặt', 'Ngày này không có khung giờ khám.');
      return;
    }
    setSelectedDate(day.dateString);
    navigation.navigate('SelectDepartment', { date: day.dateString });
  };

  return (
    <View style={styles.container}>
      {/* HEADER GRADIENT XANH ĐẬM SIÊU ĐẸP */}
      <LinearGradient colors={GRADIENTS.header} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Chọn ngày khám</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* LOADING */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải lịch khám...</Text>
        </View>
      )}

      {/* CALENDAR CARD */}
      <View style={styles.calendarCard}>
        <Calendar
          onDayPress={handleDayPress}
          markedDates={{
            ...markedDates,
            [selectedDate]: {
              ...(markedDates[selectedDate] || {}),
              selected: true,
              selectedColor: COLORS.primaryDark,
            },
          }}
          minDate={new Date().toISOString().split('T')[0]}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: COLORS.textPrimary,
            selectedDayBackgroundColor: COLORS.primaryDark,
            selectedDayTextColor: '#ffffff',
            todayTextColor: COLORS.primary,
            todayBackgroundColor: '#E0F2FE',
            dayTextColor: COLORS.textPrimary,
            textDisabledColor: '#94A3B8',
            dotColor: COLORS.primary,
            selectedDotColor: '#ffffff',
            arrowColor: COLORS.primary,
            monthTextColor: COLORS.textPrimary,
            textDayFontWeight: '600',
            textMonthFontWeight: '800',
            textDayHeaderFontWeight: '700',
          }}
        />
      </View>

      {/* LEGEND */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
          <Text style={styles.legendText}>Có lịch khám</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#E5E7EB' }]} />
          <Text style={styles.legendText}>Không có lịch</Text>
        </View>
      </View>

      <Text style={styles.note}>
        Bấm vào ngày có chấm xanh để tiếp tục đặt khám.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.headerPaddingTop,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    ...SHADOWS.header,
  },
  backButton: {
    padding: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BORDER_RADIUS.full,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.black,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },

  calendarCard: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xxl,
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.md,
    ...SHADOWS.card,
    overflow: 'hidden',
  },

  legend: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xxl,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  legendText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  note: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxxl,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
  },
});