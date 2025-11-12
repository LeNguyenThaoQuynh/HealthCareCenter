// src/screens/patient/Book_appointment/BookingOptionsScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

export default function BookingOptionsScreen() {
  const navigation = useNavigation();
  const fadeAnim = new Animated.Value(0);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const options = [
    {
      title: 'Theo Bác sĩ chưa làm',
      subtitle: 'P.anh mệt rồi chưa làm ',
      icon: 'person-outline',
      screen: 'BookByDoctor',
      gradient: ['#6D28D9', '#A78BFA'],
      badge: 'PHỔ BIẾN',
      badgeBg: '#FEF3C7',
      badgeText: '#92400E',
    },
    {
      title: 'Theo Ngày',
      subtitle: 'Chọn ngày và khung giờ phù hợp',
      icon: 'calendar-outline',
      screen: 'BookByDate',
      gradient: ['#047857', '#34D399'],
    },
  ];

  const OptionCard = ({ item, index }) => {
    const cardAnim = new Animated.Value(0);

    React.useEffect(() => {
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 150,
        useNativeDriver: true,
      }).start();
    }, [cardAnim, index]);

    return (
      <Animated.View style={[styles.cardWrapper, { opacity: cardAnim }]}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate(item.screen)}
          activeOpacity={0.90}
        >
          <LinearGradient
            colors={item.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {/* Icon tròn với hiệu ứng kính mờ */}
            <View style={styles.iconWrapper}>
              <View style={styles.iconInner}>
                <Ionicons name={item.icon} size={32} color="#FFF" />
              </View>
            </View>

            {/* Text */}
            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>

            {/* Right: Badge + Arrow */}
            <View style={styles.right}>
              {item.badge && (
                <View style={[styles.badge, { backgroundColor: item.badgeBg }]}>
                  <Text style={[styles.badgeText, { color: item.badgeText }]}>
                    {item.badge}
                  </Text>
                </View>
              )}
              <View style={styles.arrowBtn}>
                <Ionicons name="chevron-forward" size={24} color="#FFF" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Text style={styles.headerSubtitle}>Chọn cách đặt lịch phù hợp với bạn</Text>
      </Animated.View>

      {/* Cards */}
      {options.map((item, i) => (
        <OptionCard key={i} item={item} index={i} />
      ))}

      {/* Note */}
      <Animated.View style={[styles.note, { opacity: fadeAnim }]}>
        <View style={styles.shield}>
          <Ionicons name="shield-checkmark" size={20} color="#10B981" />
        </View>
        <Text style={styles.noteText}>Thông tin của bạn được bảo mật 100%</Text>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { paddingHorizontal: 20, paddingTop: 32, paddingBottom: 40 },

  // Header
  header: { alignItems: 'center', marginBottom: 32 },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: '70%',
  },

  // Card
  cardWrapper: { marginBottom: 16 },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    minHeight: 110,
  },

  // Icon
  iconWrapper: {
    marginRight: 18,
  },
  iconInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },

  // Text
  textContainer: { flex: 1, paddingRight: 10 },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.95)',
    marginTop: 4,
    fontWeight: '500',
  },

  // Right Section
  right: { alignItems: 'flex-end' },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  arrowBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },

  // Note
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  shield: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FADF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  noteText: {
    fontSize: 14,
    color: '#047857',
    fontWeight: '600',
  },
});