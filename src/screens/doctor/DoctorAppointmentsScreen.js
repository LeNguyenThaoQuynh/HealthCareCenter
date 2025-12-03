import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

import { DoctorAppointmentController } from '../../controllers/doctor/doctor_appointment_controller';
import { supabase } from '../../api/supabase';

import {
  COLORS,
  GRADIENTS,
} from '../../theme/theme';

import { DoctorAppointmentsStyles as styles } from '../../styles/doctor/DoctorAppointmentsStyles';

const TABS = [
  { key: 'today', title: 'Hôm nay' },
  { key: 'pending', title: 'Chờ xác nhận' },
  { key: 'confirmed', title: 'Đã xác nhận' },
  { key: 'waiting_results', title: 'Chờ kết quả' },
  { key: 'completed', title: 'Đã khám xong' },
  { key: 'cancelled', title: 'Đã hủy' },
];

const TabButton = ({ tab, activeTab, setActiveTab }) => {
  const isActive = activeTab === tab.key;
  return (
    <TouchableOpacity
      onPress={() => setActiveTab(tab.key)}
      style={styles.tabButton(isActive)}
    >
      <Text style={styles.tabText(isActive)}>{tab.title}</Text>
    </TouchableOpacity>
  );
};

export default function DoctorAppointmentsScreen() {
  const navigation = useNavigation();
  const flatListRef = useRef(null);

  const [appointments, setAppointments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [activeTab, setActiveTab] = useState('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const loadAppointments = useCallback(async (isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true);
      setError(null);
    }
    setRefreshing(isRefresh);

    await DoctorAppointmentController.loadAppointments({
      setAppointments,
      onError: setError,
      showAlert: !isRefresh,
    });

    setRefreshing(false);
    if (!isRefresh) setLoading(false);
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  useFocusEffect(
    useCallback(() => {
      if (['today', 'pending', 'confirmed', 'waiting_results'].includes(activeTab)) {
        loadAppointments();
      }
    }, [activeTab, loadAppointments])
  );

  useEffect(() => {
    let result = [...appointments];

    switch (activeTab) {
      case 'today':
        result = appointments.filter(app => {
          const d = new Date(app.appointment_date || app.date || 0);
          const appDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          return appDay.getTime() === today.getTime();
        });
        break;
      case 'pending': result = appointments.filter(a => a.status === 'pending'); break;
      case 'confirmed': result = appointments.filter(a => a.status === 'confirmed'); break;
      case 'waiting_results': result = appointments.filter(a => a.status === 'waiting_results'); break;
      case 'completed': result = appointments.filter(a => a.status === 'completed'); break;
      case 'cancelled':
        result = appointments.filter(a =>
          ['cancelled', 'patient_cancelled', 'doctor_cancelled'].includes(a.status)
        );
        break;
    }

    result.sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
    setFiltered(result);
  }, [appointments, activeTab]);

  const checkTestResults = async (appointmentId) => {
    try {
      const { data } = await supabase
        .from('test_results')
        .select('status')
        .eq('appointment_id', appointmentId);
      if (!data || data.length === 0) return false;
      return data.every(t => !['pending', 'in_progress'].includes(t.status));
    } catch {
      return false;
    }
  };

  const onRefresh = useCallback(() => loadAppointments(true), [loadAppointments]);

  const startExamination = (item) => {
    const patientId = item.user_id || item.patient?.id;
    const patientName = item.patient?.full_name || item.patient_name || 'Bệnh nhân';
    const apptDate = new Date(item.appointment_date || item.date);
    const isToday = new Date(apptDate.getFullYear(), apptDate.getMonth(), apptDate.getDate()).getTime() === today.getTime();

    if (item.status === 'pending') {
      Alert.alert(
        'Xác nhận lịch hẹn',
        `Bệnh nhân: ${patientName}\nThời gian: ${apptDate.toLocaleString('vi-VN')}`,
        [
          {
            text: 'Hủy lịch',
            style: 'destructive',
            onPress: async () => {
              const { error } = await supabase
                .from('appointments')
                .update({ status: 'doctor_cancelled' })
                .eq('id', item.id);
              if (!error) {
                Alert.alert('Đã hủy', 'Lịch đã được hủy');
                loadAppointments();
              }
            },
          },
          { text: 'Để sau', style: 'cancel' },
          {
            text: 'Xác nhận khám',
            onPress: async () => {
              try {
                const { error } = await supabase
                  .from('appointments')
                  .update({ status: 'confirmed' })
                  .eq('id', item.id);

                if (error) throw error;

                Alert.alert('Thành công!', 'Lịch hẹn đã được xác nhận', [
                  {
                    text: 'OK',
                    onPress: () => {
                      setActiveTab('confirmed');
                      loadAppointments();

                      setTimeout(() => {
                        const idx = filtered.findIndex(a => a.id === item.id);
                        if (idx !== -1 && flatListRef.current) {
                          flatListRef.current.scrollToIndex({
                            index: idx,
                            animated: true,
                            viewPosition: 0,
                          });
                        }
                      }, 700);
                    },
                  },
                ]);
              } catch {
                Alert.alert('Lỗi', 'Không thể xác nhận');
              }
            },
          },
        ],
        { cancelable: true }
      );
      return;
    }

    if (item.status === 'confirmed' && isToday) {
      navigation.navigate('OrderTests', {
        appointmentId: item.id,
        patientId,
        patientName,
      });
      return;
    }

    if (item.status === 'confirmed' && !isToday) {
      Alert.alert('Chưa đến ngày', 'Lịch này chỉ xử lý vào đúng ngày khám.');
      return;
    }

    if (item.status === 'waiting_results' && isToday) {
      checkTestResults(item.id).then(hasAllResults => {
        if (!hasAllResults) {
          return Alert.alert('Chưa đủ kết quả', 'Vui lòng đợi tất cả xét nghiệm có kết quả.');
        }
        navigation.navigate('FinalizeRecord', {
          appointmentId: item.id,
          patientId,
          patientName,
        });
      });
      return;
    }

    if (item.status === 'completed') {
      navigation.navigate('ViewMedicalRecord', { appointmentId: item.id });
    }
  };

  const getStatusGradient = (status) => {
    switch (status) {
      case 'pending': return ["#FF9F0A", "#FFB84D"];
      case 'confirmed': return GRADIENTS.appointmentCard || ["#3B82F6", "#1D4ED8"];
      case 'waiting_results': return ["#FDB813", "#F59E0B"];
      case 'completed': return GRADIENTS.successButton || ["#10B981", "#059669"];
      case 'cancelled':
      case 'patient_cancelled':
      case 'doctor_cancelled': return ["#EF4444", "#DC2626"];
      default: return ["#94A3B8", "#64748B"];
    }
  };

  const getStatusLabel = (status) => {
    const map = {
      pending: 'CHỜ XÁC NHẬN',
      confirmed: 'SẴN SÀNG KHÁM',
      waiting_results: 'CHỜ KẾT QUẢ',
      completed: 'ĐÃ HOÀN TẤT',
      patient_cancelled: 'BN HỦY',
      doctor_cancelled: 'BS HỦY',
      cancelled: 'ĐÃ HỦY',
    };
    return map[status] || 'KHÁC';
  };

  const renderItem = ({ item }) => {
    const patientName = item.patient?.full_name || item.patient_name || 'Bệnh nhân';
    const roomNumber = item.doctor_room_number || 'Chưa có phòng';
    const specialization = item.doctor_specialization_text || 'Chưa xác định';

    const date = new Date(item.appointment_date || item.date);
    const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const [g1, g2] = getStatusGradient(item.status);
    const statusLabel = getStatusLabel(item.status);
    const isToday = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() === today.getTime();

    let mainText = '';
    let mainIcon = '';
    let mainColors = ["#94A3B8", "#64748B"];
    let showMain = true;

    if (item.status === 'pending') {
      mainText = 'XÁC NHẬN / HỦY LỊCH';
      mainIcon = 'checkmark-circle-outline';
      mainColors = ["#F59E0B", "#FDB813"];
    } else if (item.status === 'confirmed') {
      mainText = isToday ? 'CHỈ ĐỊNH XÉT NGHIỆM' : 'CHỜ NGÀY KHÁM';
      mainIcon = isToday ? 'flask-outline' : 'calendar-outline';
      mainColors = isToday ? (GRADIENTS.primaryButton || ["#3B82F6", "#1D4ED8"]) : ["#94A3B8", "#64748B"];
      showMain = isToday;
    } else if (item.status === 'waiting_results') {
      mainText = 'HOÀN TẤT BỆNH ÁN';
      mainIcon = 'document-text-outline';
      mainColors = GRADIENTS.successButton || ["#10B981", "#059669"];
    } else if (item.status === 'completed') {
      mainText = 'XEM LẠI BỆNH ÁN';
      mainIcon = 'eye-outline';
      mainColors = ["#E5E7EB", "#F2F4F8"];
    } else {
      showMain = false;
    }

    return (
      <View style={styles.itemWrapper}>
        <View style={styles.itemCard}>
          <View style={styles.cardContent}>
            <View style={styles.itemHeader}>
              <Text style={styles.patientName}>{patientName}</Text>
              <LinearGradient colors={[g1, g2]} style={styles.statusBadge}>
                <Text style={styles.statusText}>{statusLabel}</Text>
              </LinearGradient>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconCircle}><Icon name="time-outline" size={18} color={COLORS.primary} /></View>
              <Text style={styles.infoText}>Thời gian: <Text style={styles.timeText}>{timeStr}</Text> ngày {dateStr}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconCircle}><Icon name="business-outline" size={18} color={COLORS.primary} /></View>
              <Text style={styles.infoText}>Phòng: <Text style={styles.timeText}>{roomNumber}</Text></Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconCircle}><Icon name="medkit-outline" size={18} color={COLORS.primary} /></View>
              <Text style={styles.infoText}>{specialization}</Text>
            </View>

            {item.symptoms ? (
              <View style={styles.symptomsBox}>
                <Text style={styles.symptomsText}>{item.symptoms}</Text>
              </View>
            ) : null}

            {['pending', 'confirmed', 'waiting_results', 'completed'].includes(item.status) && (
              <View style={styles.actionContainer}>
                {showMain && (
                  <TouchableOpacity onPress={() => startExamination(item)} style={styles.mainActionButton}>
                    <LinearGradient colors={mainColors} style={styles.mainActionGradient}>
                      <Icon name={mainIcon} size={20} color="#fff" />
                      <Text style={styles.mainActionText}>{mainText}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                {(item.status === 'pending' || (item.status === 'confirmed' && isToday)) && (
                  <TouchableOpacity
                    onPress={async () => {
                      Alert.alert('Hủy lịch', 'Bạn chắc chắn muốn hủy?', [
                        { text: 'Không', style: 'cancel' },
                        {
                          text: 'Hủy lịch',
                          style: 'destructive',
                          onPress: async () => {
                            const { error } = await supabase
                              .from('appointments')
                              .update({ status: 'doctor_cancelled' })
                              .eq('id', item.id);
                            if (!error) {
                              Alert.alert('Đã hủy', 'Lịch đã được hủy');
                              loadAppointments();
                            }
                          },
                        },
                      ]);
                    }}
                    style={styles.secondaryButton}
                  >
                    <Text style={styles.secondaryText}>Hủy lịch</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary || '#3B82F6'} />

      <LinearGradient colors={GRADIENTS.header || ['#3B82F6', '#1D4ED8']} style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lịch Khám Của Tôi</Text>
        </View>
      </LinearGradient>

      <View style={styles.tabBarContainer}>
        <FlatList
          data={TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.key}
          renderItem={({ item }) => (
            <TabButton tab={item} activeTab={activeTab} setActiveTab={setActiveTab} />
          )}
        />
      </View>

      {loading && !refreshing ? (
        <View style={styles.centeredView}>
          <ActivityIndicator size="large" color={COLORS.primary || '#3B82F6'} />
          <Text style={styles.loadingText}>Đang tải lịch khám...</Text>
        </View>
      ) : error ? (
        <View style={styles.centeredView}>
          <Icon name="cloud-offline-outline" size={80} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centeredView}>
          <Icon name="calendar-clear-outline" size={100} color="#94A3B8" />
          <Text style={styles.emptyText}>
            {activeTab === 'today' ? 'Hôm nay bạn chưa có lịch khám nào' : 'Không có lịch hẹn nào'}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={filtered}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary || '#3B82F6']} />
          }
          getItemLayout={(data, index) => ({
            length: 290,
            offset: 290 * index,
            index,
          })}
          initialNumToRender={10}
        />
      )}
    </View>
  );
}