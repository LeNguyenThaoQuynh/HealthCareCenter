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

const Colors = {
  primary: '#0066FF',
  gradient: ['#0066FF', '#00D4FF'],
  confirmed: '#00D778',
  pending: '#FFB800',
  cancelled: '#FF3B30',
  completed: '#7C3AED',
  bg: '#F8FAFF',
};

const TABS = [
  { key: 'confirmed', title: 'Đã xác nhận',   icon: 'checkmark-circle', color: Colors.confirmed },
  { key: 'pending',   title: 'Chờ duyệt',     icon: 'time',             color: Colors.pending },
  { key: 'completed', title: 'Đã hoàn thành', icon: 'medkit',           color: Colors.completed },
  { key: 'cancelled', title: 'Đã hủy',        icon: 'close-circle',     color: Colors.cancelled },
];

export default function HistoryScreen() {
  const navigation = useNavigation();
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('confirmed');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      await AppointmentController.loadAppointments(
        setAppointments,
        () => setLoading(false),
        () => {}
      );
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể tải lịch hẹn');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    AppointmentController.loadAppointments(
      setAppointments,
      () => {},
      () => setRefreshing(false)
    ).catch(() => setRefreshing(false));
  }, []);

  const filteredAppointments = appointments.filter(app => {
    if (activeTab === 'confirmed') return app.status === 'confirmed';
    if (activeTab === 'pending') return app.status === 'pending';
    if (activeTab === 'completed') return app.status === 'completed';
    return ['cancelled', 'doctor_cancelled', 'patient_cancelled'].includes(app.status);
  });

  // CHỈ CHO PHÉP HỦY KHI status = confirmed HOẶC pending
  const canCancel = (status) => ['confirmed', 'pending'].includes(status);

  const handleCancel = async (id) => {
    Alert.alert(
      'Hủy lịch khám',
      'Bạn có chắc chắn muốn hủy lịch khám này không?',
      [
        { text: 'Hủy bỏ', style: 'cancel' },
        {
          text: 'Hủy lịch',
          style: 'destructive',
          onPress: async () => {
            const result = await AppointmentController.cancelAppointment(id, setAppointments);
            Alert.alert(
              result.success ? 'Thành công' : 'Lỗi',
              result.message,
              [{ text: 'OK', onPress: result.success ? onRefresh : null }]
            );
          },
        },
      ],
      { cancelable: true }
    );
  };

  const getCount = (key) => {
    if (key === 'confirmed') return appointments.filter(a => a.status === 'confirmed').length;
    if (key === 'pending') return appointments.filter(a => a.status === 'pending').length;
    if (key === 'completed') return appointments.filter(a => a.status === 'completed').length;
    return appointments.filter(a => ['cancelled', 'doctor_cancelled', 'patient_cancelled'].includes(a.status)).length;
  };

  const renderTab = ({ item }) => {
    const count = getCount(item.key);
    const isActive = activeTab === item.key;

    return (
      <TouchableOpacity
        onPress={() => setActiveTab(item.key)}
        style={[styles.tab, isActive && styles.tabActive]}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={isActive ? [item.color, item.color + 'cc'] : ['#ffffff', '#f1f5f9']}
          style={styles.tabGradient}
        >
          <Ionicons name={item.icon} size={22} color={isActive ? '#fff' : item.color} />
          <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
            {item.title}
          </Text>
          {count > 0 && (
            <View style={[styles.badge, { backgroundColor: isActive ? '#fff' : item.color }]}>
              <Text style={[styles.badgeText, isActive && { color: item.color }]}>
                {count > 99 ? '99+' : count}
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
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Đang tải lịch hẹn...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient colors={Colors.gradient} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.canGoBack() && navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Lịch sử đặt lịch</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={26} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* TABS */}
      <View style={styles.tabContainer}>
        <FlatList
          data={TABS}
          renderItem={renderTab}
          keyExtractor={i => i.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        />
      </View>

      {/* NỘI DUNG */}
      <View style={styles.content}>
        {filteredAppointments.length === 0 ? (
          <Animated.View entering={ZoomIn.duration(600)} style={styles.empty}>
            <Ionicons
              name={
                activeTab === 'completed' ? "document-text-outline" :
                activeTab === 'confirmed' ? "calendar-outline" :
                activeTab === 'pending' ? "hourglass-outline" :
                "close-circle-outline"
              }
              size={90}
              color="#cbd5e1"
            />
            <Text style={styles.emptyTitle}>
              {activeTab === 'completed' && 'Chưa có buổi khám nào hoàn tất'}
              {activeTab === 'confirmed' && 'Chưa có lịch được duyệt'}
              {activeTab === 'pending' && 'Không có lịch đang chờ'}
              {activeTab === 'cancelled' && 'Bạn chưa từng hủy lịch nào'}
            </Text>
            {activeTab === 'completed' && (
              <Text style={styles.emptySubtitle}>
                Sau khi bác sĩ hoàn tất khám, lịch sẽ xuất hiện ở đây
              </Text>
            )}
          </Animated.View>
        ) : (
          <FlatList
            data={filteredAppointments}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
                <AppointmentCard
                  item={item}
                  // HOÀN THÀNH / ĐÃ HỦY → KHÔNG TRUYỀN onCancel → NÚT HỦY BIẾN MẤT HOÀN TOÀN
                  onCancel={canCancel(item.status) ? () => handleCancel(item.id) : undefined}
                />
              </Animated.View>
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
            ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    elevation: 8,
  },
  title: { fontSize: 27, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  tabContainer: { backgroundColor: '#fff', paddingVertical: 8, elevation: 6 },
  tab: { borderRadius: 30, overflow: 'hidden', elevation: 6, shadowColor: '#000', shadowOpacity: 0.15 },
  tabActive: { elevation: 12, transform: [{ scale: 1.05 }] },
  tabGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 10 },
  tabText: { fontSize: 15, fontWeight: '700', color: '#64748b' },
  tabTextActive: { color: '#fff', fontWeight: '800' },
  badge: { minWidth: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  badgeText: { fontSize: 12, fontWeight: '900', color: '#fff' },
  content: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  loadingText: { marginTop: 16, fontSize: 16, color: '#64748B', fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 23, fontWeight: '800', color: '#1e293b', marginTop: 20, textAlign: 'center' },
  emptySubtitle: { fontSize: 16, color: '#64748b', textAlign: 'center', marginTop: 12, lineHeight: 24 },
});