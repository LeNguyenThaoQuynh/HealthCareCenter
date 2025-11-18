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
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import AppointmentCard from '../../components/AppointmentCard';
import { AppointmentController } from '../../controllers/patient/AppointmentController';
import theme from '../../theme/theme';

const {
  COLORS,
  GRADIENTS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  SHADOWS,
} = theme;

const TABS = [
  { key: 'confirmed', title: 'Đã đồng ý',   icon: 'checkmark-circle', color: '#34C759' },
  { key: 'pending',   title: 'Chưa phản hồi', icon: 'time',          color: '#FF9500' },
  { key: 'cancelled', title: 'Đã hủy',      icon: 'close-circle',   color: '#FF3B30' },
];

export default function HistoryScreen() {
  const navigation = useNavigation();

  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('confirmed');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchAppointments = useCallback(() => {
    AppointmentController.loadAppointments(setAppointments, setLoading, setError);
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    AppointmentController.loadAppointments(setAppointments, setLoading, setError)
      .finally(() => setRefreshing(false));
  }, []);

  const filteredAppointments = appointments.filter(app => {
    if (activeTab === 'confirmed') return app.status === 'confirmed';
    if (activeTab === 'pending') return app.status === 'pending';
    return ['cancelled', 'doctor_cancelled', 'patient_cancelled'].includes(app.status);
  });

  const handleCancel = async (id) => {
    Alert.alert(
      'Hủy lịch khám',
      'Bạn có chắc chắn muốn hủy lịch này?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy lịch',
          style: 'destructive',
          onPress: async () => {
            const result = await AppointmentController.cancelAppointment(
              id,
              setAppointments,
              setError,
              'patient'
            );
            if (result.success) Alert.alert('Thành công', result.message);
            else Alert.alert('Lỗi', result.message);
          },
        },
      ]
    );
  };

  const renderTab = ({ item }) => {
    const count = appointments.filter(app => {
      if (item.key === 'confirmed') return app.status === 'confirmed';
      if (item.key === 'pending') return app.status === 'pending';
      return ['cancelled', 'doctor_cancelled', 'patient_cancelled'].includes(app.status);
    }).length;

    const isActive = activeTab === item.key;

    return (
      <TouchableOpacity
        style={[styles.tabButton, isActive && styles.tabActive]}
        onPress={() => setActiveTab(item.key)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={isActive ? [item.color, item.color + 'dd'] : ['#E5E7EB', '#F3F4F6']}
          style={styles.tabGradient}
        >
          <Ionicons name={item.icon} size={18} color={isActive ? '#FFF' : item.color} />
          <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
            {item.title}
          </Text>
          {count > 0 && (
            <View style={[styles.badge, { backgroundColor: isActive ? '#FFF' : item.color }]}>
              <Text style={[styles.badgeText, isActive && { color: item.color }]}>
                {count}
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
      </View>
    );
  }

  return (
    <View style={styles.background}>
      <Animated.View entering={FadeInDown.duration(500)}>
        <LinearGradient colors={GRADIENTS.header} style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Lịch sử đặt lịch</Text>
          <TouchableOpacity style={styles.iconButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color="#FFF" />
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>

      <View style={styles.tabContainer}>
        <FlatList
          data={TABS}
          renderItem={renderTab}
          keyExtractor={item => item.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: SPACING.xl, gap: 10 }}
        />
      </View>

      <View style={styles.container}>
        {filteredAppointments.length === 0 ? (
          <Animated.View entering={ZoomIn.duration(500)} style={styles.empty}>
            <Ionicons name="calendar-outline" size={68} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>Chưa có lịch hẹn</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'confirmed' && 'Bạn chưa có lịch nào được duyệt'}
              {activeTab === 'pending' && 'Không có lịch đang chờ duyệt'}
              {activeTab === 'cancelled' && 'Bạn chưa hủy lịch nào'}
            </Text>
          </Animated.View>
        ) : (
          <FlatList
            data={filteredAppointments}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item, index }) => (
              <AppointmentCard item={item} index={index} onCancel={handleCancel} />
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    borderBottomLeftRadius: BORDER_RADIUS.xxxl,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textOnPrimary,
  },

  tabContainer: { paddingVertical: 12, backgroundColor: COLORS.background },
  tabButton: { borderRadius: BORDER_RADIUS.full, overflow: 'hidden', ...SHADOWS.small },
  tabActive: { ...SHADOWS.card },
  tabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    gap: 8,
  },
  tabText: {
    fontSize: 13.5,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
  },
  tabTextActive: { color: '#FFF' },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: FONT_WEIGHT.bold,
    color: '#FFF',
  },

  container: { flex: 1 },
  list: { padding: SPACING.xl, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: {
    marginTop: 12,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.medium,
  },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
});