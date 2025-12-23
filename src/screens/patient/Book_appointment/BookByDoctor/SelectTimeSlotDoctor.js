import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../../../api/supabase';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  ZoomIn,
  SlideInLeft,
  Layout 
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

const Colors = {
  primary: '#6366F1',
  primaryLight: '#C7D2FE',
  accent: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  text: '#1E293B',
  textLight: '#64748B',
  bg: '#F8FAFC',
  white: '#FFFFFF',
  border: '#E2E8F0',
  gradientStart: '#667EEA',
  gradientEnd: '#764BA2',
  morning: '#FBBF24',
  afternoon: '#F97316',
  evening: '#8B5CF6',
};

const DAY_MAP = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

export default function SelectTimeSlotDoctor() {
  const navigation = useNavigation();
  const route = useRoute();
  const { doctor, selectedDate } = route.params || {};

  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!doctor?.id || !selectedDate) {
      Alert.alert('Lỗi dữ liệu', 'Thiếu thông tin bác sĩ hoặc ngày khám');
      navigation.goBack();
    }
  }, [doctor, selectedDate, navigation]);

  useEffect(() => {
    if (doctor?.id && selectedDate) {
      fetchAvailableSlots();
    }
  }, [doctor?.id, selectedDate]);

  const fetchAvailableSlots = async () => {
    setLoading(true);
    try {
      const date = new Date(selectedDate);
      const dayOfWeek = DAY_MAP[date.getDay()];

      const { data: templates, error: tempErr } = await supabase
        .from('doctor_schedule_template')
        .select('id, start_time, end_time, max_patients_per_slot')
        .eq('doctor_id', doctor.id)
        .eq('day_of_week', dayOfWeek)
        .order('start_time');

      if (tempErr) throw tempErr;
      if (!templates || templates.length === 0) {
        setTimeSlots([]);
        setLoading(false);
        return;
      }

      const slotIds = templates.map(t => t.id);
      const { data: bookings, error: bookErr } = await supabase
        .from('appointments')
        .select('slot_id, status')
        .eq('doctor_id', doctor.id)
        .eq('date', selectedDate)
        .in('slot_id', slotIds);

      if (bookErr) throw bookErr;

      const bookedCount = {};
      bookings?.forEach(b => {
        if (b.status !== 'cancelled') {
          bookedCount[b.slot_id] = (bookedCount[b.slot_id] || 0) + 1;
        }
      });

      const available = templates
        .map(t => {
          const booked = bookedCount[t.id] || 0;
          const max = t.max_patients_per_slot || 5;
          const start = t.start_time.slice(0, 5);
          const end = t.end_time.slice(0, 5);
          const session = start < '12:00' ? 'morning' : start < '17:00' ? 'afternoon' : 'evening';

          return {
            id: t.id,
            display: `${start} - ${end}`,
            start,
            end,
            booked,
            max,
            remaining: max - booked,
            isFull: booked >= max,
            session,
          };
        })
        .filter(slot => !slot.isFull);

      setTimeSlots(available);
    } catch (err) {
      console.error('Lỗi lấy khung giờ:', err);
      Alert.alert('Lỗi', 'Không thể tải khung giờ khám. Vui lòng thử lại sau.');
      setTimeSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = (slot) => {
    navigation.navigate('ConfirmBookingDoctor', {
      doctor,
      selectedDate,
      timeSlot: {
        slot_id: slot.id,
        start: slot.start,
        end: slot.end,
        display: slot.display,
      },
    });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    const monthNames = [
      'tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6',
      'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'
    ];
    
    const dayOfWeek = dayNames[date.getDay()];
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    return `${dayOfWeek}, ngày ${day} ${month} năm ${year}`;
  };

  const getSessionColor = (session) => {
    switch (session) {
      case 'morning': return Colors.morning;
      case 'afternoon': return Colors.afternoon;
      case 'evening': return Colors.evening;
      default: return Colors.primary;
    }
  };

  const getSessionIcon = (session) => {
    switch (session) {
      case 'morning': return 'sunny-outline';
      case 'afternoon': return 'partly-sunny-outline';
      case 'evening': return 'moon-outline';
      default: return 'time-outline';
    }
  };

  const getSessionLabel = (session) => {
    switch (session) {
      case 'morning': return 'Buổi sáng';
      case 'afternoon': return 'Buổi chiều';
      case 'evening': return 'Buổi tối';
      default: return '';
    }
  };

  const renderSlot = ({ item, index }) => (
    <Animated.View 
      entering={FadeInUp.delay(index * 80).duration(500)}
      layout={Layout.springify()}
    >
      <TouchableOpacity
        style={styles.slotCard}
        onPress={() => handleSelectSlot(item)}
        activeOpacity={0.7}
      >
        <View style={styles.slotHeader}>
          <LinearGradient
            colors={[getSessionColor(item.session), getSessionColor(item.session) + 'DD']}
            style={styles.sessionBadge}
          >
            <Ionicons name={getSessionIcon(item.session)} size={14} color="#FFFFFF" />
            <Text style={styles.sessionBadgeText}>
              {getSessionLabel(item.session)}
            </Text>
          </LinearGradient>
          
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{item.display}</Text>
          </View>
        </View>

        <View style={styles.slotContent}>
          <View style={styles.slotInfo}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="people-outline" size={16} color={Colors.textLight} />
                <Text style={styles.infoLabel}>Đã đặt</Text>
                <Text style={styles.infoValue}>{item.booked}/{item.max}</Text>
              </View>
              
              <View style={styles.separator} />
              
              <View style={styles.infoItem}>
                <Ionicons name="calendar-outline" size={16} color={Colors.textLight} />
                <Text style={styles.infoLabel}>Còn lại</Text>
                <Text style={[
                  styles.infoValue, 
                  styles.remainingValue,
                  item.remaining <= 2 && styles.remainingWarning
                ]}>
                  {item.remaining} chỗ
                </Text>
              </View>
            </View>
            
            {item.remaining <= 2 && (
              <View style={styles.warningTag}>
                <Ionicons name="warning-outline" size={12} color={Colors.warning} />
                <Text style={styles.warningText}>Sắp kín lịch</Text>
              </View>
            )}
          </View>
          
          <View style={styles.selectButton}>
            <LinearGradient
              colors={[Colors.gradientStart, Colors.gradientEnd]}
              style={styles.selectButtonGradient}
            >
              <Text style={styles.selectButtonText}>Chọn</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </LinearGradient>
          </View>
        </View>
        
        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill,
                { 
                  width: `${(item.booked / item.max) * 100}%`,
                  backgroundColor: item.remaining <= 2 ? Colors.warning : Colors.success
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round((item.booked / item.max) * 100)}% đã đặt
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  if (!doctor || !selectedDate) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.gradientStart} />
      
      {/* Header với gradient */}
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Chọn Khung Giờ</Text>
            <Text style={styles.headerSubtitle}>Đặt lịch khám bác sĩ</Text>
          </View>
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('HomeScreen')}
            style={styles.homeButton}
            activeOpacity={0.8}
          >
            <Ionicons name="home-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Info Card */}
      <Animated.View 
        entering={FadeInDown.duration(600)}
        style={styles.infoCard}
      >
        <View style={styles.doctorInfo}>
          <View style={styles.nameContainer}>
            <Text style={styles.doctorName}>{doctor.name}</Text>
            <View style={styles.doctorBadge}>
              <Ionicons name="medical-outline" size={14} color={Colors.primary} />
              <Text style={styles.doctorBadgeText}>Bác sĩ</Text>
            </View>
          </View>
          
          {doctor.specializations && (
            <View style={styles.specialtyContainer}>
              <Ionicons name="star-outline" size={14} color={Colors.accent} />
              <Text style={styles.specialty} numberOfLines={2}>
                {Array.isArray(doctor.specializations) 
                  ? doctor.specializations.join(' • ') 
                  : doctor.specializations}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.dateContainer}>
          <View style={styles.dateIcon}>
            <Ionicons name="calendar" size={20} color={Colors.primary} />
          </View>
          <View style={styles.dateTextContainer}>
            <Text style={styles.dateLabel}>Ngày khám đã chọn</Text>
            <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Time Slots List */}
      {loading ? (
        <Animated.View entering={ZoomIn} style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải khung giờ trống...</Text>
          <Text style={styles.loadingSubtext}>Vui lòng chờ trong giây lát</Text>
        </Animated.View>
      ) : timeSlots.length === 0 ? (
        <Animated.View entering={SlideInLeft} style={styles.emptyContainer}>
          <View style={styles.emptyIllustration}>
            <Ionicons name="time-outline" size={80} color="#CBD5E1" />
          </View>
          <Text style={styles.emptyTitle}>Không có ca trống</Text>
          <Text style={styles.emptySubtitle}>
            Bác sĩ đã kín lịch vào ngày này. Vui lòng chọn ngày khác hoặc liên hệ bác sĩ.
          </Text>
          <TouchableOpacity 
            style={styles.changeDateButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.gradientStart, Colors.gradientEnd]}
              style={styles.changeDateGradient}
            >
              <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
              <Text style={styles.changeDateText}>Chọn ngày khác</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <FlatList
          data={timeSlots}
          keyExtractor={item => item.id.toString()}
          renderItem={renderSlot}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Animated.View entering={FadeInDown} style={styles.listHeader}>
              <Text style={styles.listHeaderTitle}>Các khung giờ có sẵn</Text>
              <Text style={styles.listHeaderSubtitle}>
                Chọn khung giờ phù hợp với bạn
              </Text>
            </Animated.View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.bg 
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  homeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: Colors.white,
    margin: 20,
    marginTop: -10,
    borderRadius: 25,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  doctorInfo: {
    marginBottom: 15,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  doctorName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  doctorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 6,
  },
  doctorBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  specialtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  specialty: {
    fontSize: 14,
    color: Colors.textLight,
    flex: 1,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 15,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dateTextContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 13,
    color: Colors.textLight,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  listHeader: {
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  listHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  listHeaderSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
  },
  slotCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginBottom: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 6,
  },
  sessionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timeContainer: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  timeText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  slotContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  slotInfo: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  infoItem: {
    alignItems: 'center',
    gap: 4,
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.textLight,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  remainingValue: {
    color: Colors.success,
  },
  remainingWarning: {
    color: Colors.warning,
  },
  separator: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
  },
  warningTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
    marginTop: 10,
  },
  warningText: {
    fontSize: 11,
    color: Colors.warning,
    fontWeight: '600',
  },
  selectButton: {
    marginLeft: 15,
  },
  selectButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
    gap: 8,
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  progressBarContainer: {
    marginTop: 10,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: Colors.textLight,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textLight,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIllustration: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  changeDateButton: {
    width: '80%',
  },
  changeDateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 10,
  },
  changeDateText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});