import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../../theme/theme';

const { SPACING, BORDER_RADIUS, SHADOWS } = theme;

export default function BookingOptionsScreen() {
  const navigation = useNavigation();

  const options = [
    {
      title: 'Theo Bác sĩ',
      subtitle: 'Chọn bác sĩ bạn muốn khám',
      icon: 'person-outline',
      screen: 'BookByDoctor',
      gradient: ['#7C3AED', '#A78BFA'],
      badge: 'PHỔ BIẾN',
    },
    {
      title: 'Theo Ngày',
      subtitle: 'Chọn ngày và khung giờ phù hợp',
      icon: 'calendar-outline',
      screen: 'BookByDate',
      gradient: ['#2563EB', '#3B82F6'], 
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đặt lịch khám</Text>
        <Text style={styles.headerSubtitle}>Chọn cách đặt lịch phù hợp với bạn</Text>
      </View>

      {options.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.card}
          activeOpacity={0.9}
          onPress={() => navigation.navigate(item.screen)}
        >
          <LinearGradient
            colors={item.gradient}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.iconCircle}>
              <Ionicons name={item.icon} size={28} color="#FFFFFF" />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>

            <View style={styles.right}>
              {item.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={26} color="#FFFFFF" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      ))}

      <View style={styles.note}>
        <Ionicons name="shield-checkmark-outline" size={22} color="#2563EB" />
        <Text style={styles.noteText}>
          Thông tin của bạn được bảo mật 100%
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxxl,
    paddingBottom: SPACING.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.xl,
    minHeight: 100,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xl,
  },
  textContainer: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  right: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  badge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7C3AED',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.xxl,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  noteText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    flex: 1,
  },
});