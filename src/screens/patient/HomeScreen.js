import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  FlatList,
  Image,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../api/supabase";
import { getUserProfile } from "../../controllers/patient/userController";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Màu chủ đạo xanh với palette hiện đại
const COLORS = {
  primary: "#2563EB",
  primaryLight: "#60A5FA",
  primaryDark: "#1D4ED8",
  secondary: "#10B981",
  accent: "#8B5CF6",
  accent2: "#EC4899",
  accent3: "#F59E0B",
  background: "#F8FAFC",
  card: "#FFFFFF",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  border: "#E2E8F0",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

const BANNER_HEIGHT = 220;
const BANNER_WIDTH = SCREEN_WIDTH - SPACING.xl * 2;

export default function HomeScreen() {
  const navigation = useNavigation();
  const [displayName, setDisplayName] = useState("Bạn");
  const [showTrackingModal, setShowTrackingModal] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetch = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const profile = await getUserProfile(user.id);
        setDisplayName(
          profile?.full_name || profile?.name || user.email.split("@")[0]
        );
      }
    };
    fetch();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(headerAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, 300);
  }, []);

  const menu = [
    { 
      title: "Đặt khám", 
      icon: "calendar", 
      screen: "BookingOptionsScreen",
      gradient: [COLORS.primary, "#3B82F6"]
    },
    { 
      title: "Lịch sử khám", 
      icon: "time", 
      screen: "HistoryScreen",
      gradient: [COLORS.accent, "#A855F7"]
    },
    { 
      title: "Bệnh án", 
      icon: "document-text", 
      screen: "MedicalRecordScreen",
      gradient: [COLORS.secondary, "#34D399"]
    },
    { 
      title: "Hồ sơ", 
      icon: "person", 
      screen: "ProfileScreen",
      gradient: [COLORS.accent2, "#F472B6"]
    },
    { 
      title: "Theo dõi", 
      icon: "heart", 
      action: () => setShowTrackingModal(true),
      gradient: ["#EF4444", "#F87171"]
    },
    { 
      title: "Hỗ trợ", 
      icon: "chatbubble", 
      screen: "SupportScreen",
      gradient: [COLORS.accent3, "#FBBF24"]
    },
  ];

  const umcMenu = [
    { 
      title: "Hướng dẫn", 
      icon: "help-circle", 
      screen: "CustomerGuide",
      gradient: ["#06B6D4", "#0EA5E9"]
    },
    { 
      title: "Bảng giá", 
      icon: "pricetag", 
      screen: "PriceList",
      gradient: ["#8B5CF6", "#A855F7"]
    },
    { 
      title: "Trợ giúp", 
      icon: "help-circle", 
      screen: "HelpScreen",
      gradient: ["#10B981", "#34D399"]
    },
  ];

  const scales = useRef(menu.map(() => new Animated.Value(0.9))).current;
  const umcScales = useRef(umcMenu.map(() => new Animated.Value(0.9))).current;

  const animatePress = (scale) => {
    Animated.sequence([
      Animated.timing(scale, { 
        toValue: 0.95, 
        duration: 120, 
        useNativeDriver: true 
      }),
      Animated.spring(scale, { 
        toValue: 1, 
        tension: 200, 
        friction: 3,
        useNativeDriver: true 
      }),
    ]).start();
  };

  const bannerData = [
    { 
      id: "1", 
      image: require("../../../assets/images/chirismas.jpg"),
      title: "Ưu đãi Giáng Sinh",
      subtitle: "Giảm 50% tất cả dịch vụ"
    },
    { 
      id: "2", 
      image: require("../../../assets/images/phuoc.jpg"),
    },
    { 
      id: "3", 
      image: require("../../../assets/images/quynh.jpg"),
    },
    { 
      id: "4", 
      image: require("../../../assets/images/phuc.jpg"),
    },
  ];

  const flatListRef = useRef(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => {
        const next = (prev + 1) % bannerData.length;
        flatListRef.current?.scrollToIndex({ 
          animated: true, 
          index: next,
          viewPosition: 0.5 
        });
        return next;
      });
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const renderBanner = ({ item }) => (
    <View style={styles.bannerItem}>
      <Image 
        source={item.image} 
        style={styles.bannerImage} 
        resizeMode="cover" 
      />
      {(item.title || item.subtitle) && (
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.9)"]}
          style={styles.bannerGradient}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.bannerContent}>
            {item.title && <Text style={styles.bannerTitle}>{item.title}</Text>}
            {item.subtitle && <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>}
          </View>
        </LinearGradient>
      )}
    </View>
  );

  const trackingOptions = [
    {
      id: "weight",
      title: "Cân nặng & BMI",
      description: "Theo dõi cân nặng và chỉ số BMI theo thời gian",
      icon: "scale",
      gradient: ["#10B981", "#34D399"],
      screen: "WeightBMI",
      progress: 0.75,
    },
    {
      id: "bloodPressure",
      title: "Huyết áp",
      description: "Theo dõi chỉ số huyết áp tâm thu/tâm trương",
      icon: "speedometer",
      gradient: ["#EF4444", "#F87171"],
      screen: "BloodPressure",
      progress: 0.6,
    },
    {
      id: "bloodGlucose",
      title: "Đường huyết",
      description: "Theo dõi chỉ số đường huyết trước và sau ăn",
      icon: "water",
      gradient: ["#8B5CF6", "#A855F7"],
      screen: "BloodGlucose",
      progress: 0.85,
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <View style={styles.floatingElements}>
        <View style={[styles.floatingCircle, styles.floatingCircle1]} />
        <View style={[styles.floatingCircle, styles.floatingCircle2]} />
        <View style={[styles.floatingCircle, styles.floatingCircle3]} />
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
        bounces={false}
        overScrollMode="never"
      >
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              transform: [{
                scale: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1]
                })
              }]
            }
          ]}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.wavePattern}>
              {[...Array(10)].map((_, i) => (
                <View key={i} style={[styles.wave, { left: i * 40 }]} />
              ))}
            </View>
            
            <View style={styles.headerContent}>
              <View style={styles.headerTop}>
                <View style={styles.greetingContainer}>
                  <Text style={styles.greeting}>Xin chào,</Text>
                  <Text style={styles.name}>{displayName}</Text>
                </View>
              </View>
              
              <Text style={styles.subtitle}>
                Chào mừng bạn đến với hệ thống chăm sóc sức khỏe
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Main Features Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tính năng chính</Text>
            <View style={styles.titleDecorator}>
              <View style={styles.decoratorLine} />
              <View style={styles.decoratorDot} />
            </View>
          </View>
          
          <View style={styles.featuresGrid}>
            {menu.map((item, i) => (
              <Animated.View
                key={i}
                style={{
                  transform: [{ scale: scales[i] }],
                  opacity: scales[i].interpolate({
                    inputRange: [0.9, 1],
                    outputRange: [0.7, 1]
                  })
                }}
              >
                <TouchableOpacity
                  style={styles.featureCard}
                  activeOpacity={0.9}
                  onPress={() => {
                    animatePress(scales[i]);
                    if (item.action) item.action();
                    else if (item.screen) navigation.navigate(item.screen);
                  }}
                >
                  <LinearGradient
                    colors={item.gradient}
                    style={styles.featureGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.featureIconContainer}>
                      <Ionicons name={item.icon} size={32} color="#FFF" />
                    </View>
                    <Text style={styles.featureText}>{item.title}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Banner Carousel */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tin tức & Khuyến mãi</Text>
          </View>
          
          <View style={styles.carouselContainer}>
            <FlatList
              ref={flatListRef}
              data={bannerData}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={renderBanner}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH);
                setCurrentBannerIndex(index);
              }}
              snapToInterval={BANNER_WIDTH}
              decelerationRate="fast"
              contentContainerStyle={styles.carouselContent}
            />
            
            <View style={styles.pagination}>
              {bannerData.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.paginationDot,
                    currentBannerIndex === i && styles.paginationActiveDot,
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Additional Services */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dịch vụ khác</Text>
            <View style={styles.titleDecorator}>
              <View style={styles.decoratorLine} />
              <View style={styles.decoratorDot} />
            </View>
          </View>
          
          <View style={styles.servicesGrid}>
            {umcMenu.map((item, i) => (
              <Animated.View
                key={i}
                style={{
                  transform: [{ scale: umcScales[i] }],
                  opacity: umcScales[i].interpolate({
                    inputRange: [0.9, 1],
                    outputRange: [0.7, 1]
                  })
                }}
              >
                <TouchableOpacity
                  style={styles.serviceCard}
                  activeOpacity={0.9}
                  onPress={() => {
                    animatePress(umcScales[i]);
                    navigation.navigate(item.screen);
                  }}
                >
                  <LinearGradient
                    colors={item.gradient}
                    style={styles.serviceGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.serviceIconContainer}>
                      <Ionicons name={item.icon} size={28} color="#FFF" />
                    </View>
                    <Text style={styles.serviceText}>{item.title}</Text>
                    <View style={styles.serviceArrow}>
                      <Ionicons name="arrow-forward" size={16} color="#FFF" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Health Tips Card */}
        <View style={styles.healthTipsCard}>
          <LinearGradient
            colors={[COLORS.primary + '20', COLORS.primary + '05']}
            style={styles.healthTipsGradient}
          >
            <View style={styles.healthTipsContent}>
              <View style={styles.healthTipsIcon}>
                <Ionicons name="leaf" size={32} color={COLORS.primary} />
              </View>
              <View style={styles.healthTipsText}>
                <Text style={styles.healthTipsTitle}>Mẹo sức khỏe hôm nay</Text>
                <Text style={styles.healthTipsDescription}>
                  Uống đủ 2 lít nước mỗi ngày giúp cơ thể khỏe mạnh
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </Animated.ScrollView>

      {/* Modal Theo dõi sức khỏe - Phiên bản nhỏ gọn & đẹp hơn */}
      {showTrackingModal && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowTrackingModal(false)}
          />

          <Animated.View style={styles.healthModalImproved}>
            {/* Header */}
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
              style={styles.modalHeaderImproved}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.modalHeaderContent}>
                <View style={styles.modalIconWrapper}>
                  <Ionicons name="heart" size={40} color="#FFF" />
                </View>
                <View>
                  <Text style={styles.modalTitleImproved}>Theo dõi sức khỏe</Text>
                  <Text style={styles.modalSubtitleImproved}>
                    Quản lý chỉ số quan trọng của bạn
                  </Text>
                </View>
              </View>
            </LinearGradient>

            {/* Nội dung cuộn */}
            <ScrollView 
              style={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: SPACING.xl }}
            >
              {/* Thống kê tổng quan */}
              <View style={styles.statsOverview}>
                <View style={styles.statItem}>
                  <Ionicons name="trending-up" size={28} color={COLORS.primary} />
                  <Text style={styles.statNumber}>3</Text>
                  <Text style={styles.statLabel}>Chỉ số đang theo dõi</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Ionicons name="calendar" size={28} color={COLORS.secondary} />
                  <Text style={styles.statNumber}>28</Text>
                  <Text style={styles.statLabel}>Ngày liên tục</Text>
                </View>
              </View>

              {/* Danh sách chỉ số */}
              <View style={styles.metricsContainer}>
                {trackingOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={styles.metricCardImproved}
                    activeOpacity={0.85}
                    onPress={() => {
                      setShowTrackingModal(false);
                      setTimeout(() => navigation.navigate(opt.screen), 300);
                    }}
                  >
                    <LinearGradient
                      colors={opt.gradient}
                      style={styles.metricCardGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.metricRow}>
                        <View style={styles.metricIconBig}>
                          <Ionicons name={opt.icon} size={32} color="#FFF" />
                        </View>
                        <View style={styles.metricInfo}>
                          <Text style={styles.metricTitleBig}>{opt.title}</Text>
                          <Text style={styles.metricDesc}>{opt.description}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#FFF" opacity={0.7} />
                      </View>

                      <View style={styles.progressSection}>
                        <View style={styles.progressLabel}>
                          <Text style={styles.progressPercent}>
                            {Math.round(opt.progress * 100)}%
                          </Text>
                          <Text style={styles.progressStatus}>Đã theo dõi</Text>
                        </View>
                        <View style={styles.progressBar}>
                          <View 
                            style={[
                              styles.progressFill, 
                              { width: `${opt.progress * 100}%` }
                            ]} 
                          />
                        </View>
                      </View>

                      <Text style={styles.lastUpdate}>
                        Cập nhật: 2 giờ trước
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Nút đóng */}
            <TouchableOpacity
              style={styles.closeBtnImproved}
              onPress={() => setShowTrackingModal(false)}
            >
              <Text style={styles.closeBtnText}>Đóng</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  
  floatingElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  floatingCircle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: COLORS.primary + '05',
  },
  floatingCircle1: {
    width: 300,
    height: 300,
    top: -100,
    right: -100,
  },
  floatingCircle2: {
    width: 200,
    height: 200,
    bottom: 100,
    left: -50,
  },
  floatingCircle3: {
    width: 150,
    height: 150,
    bottom: 200,
    right: -30,
  },
  
  scrollContent: { 
    paddingBottom: SPACING.xxl 
  },

  // HEADER
  header: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingBottom: SPACING.xxl,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: SPACING.xxl + 20,
    paddingHorizontal: SPACING.xl,
    position: 'relative',
    borderBottomLeftRadius: BORDER_RADIUS.xxl,
    borderBottomRightRadius: BORDER_RADIUS.xxl,
  },
  wavePattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    opacity: 0.1,
  },
  wave: {
    position: 'absolute',
    width: 80,
    height: 40,
    backgroundColor: '#FFF',
    borderRadius: 20,
    top: 10,
  },
  headerContent: {
    position: 'relative',
    zIndex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: { 
    fontSize: 18, 
    color: "rgba(255,255,255,0.9)", 
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  name: { 
    fontSize: 40, 
    color: "#FFF", 
    fontWeight: "800", 
    marginTop: SPACING.xs,
    letterSpacing: -0.5,
  },
  subtitle: { 
    fontSize: 16, 
    color: "rgba(255,255,255,0.9)", 
    marginTop: SPACING.xxl,
    fontWeight: '500',
    lineHeight: 24,
  },

  section: {
    marginBottom: SPACING.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  titleDecorator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: SPACING.lg,
  },
  decoratorLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.border,
  },
  decoratorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.sm,
  },

  // Features Grid
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
  },
  featureCard: {
    width: (SCREEN_WIDTH - SPACING.xl * 2 - SPACING.lg * 2) / 3,
    marginBottom: SPACING.lg,
    height: 140,
  },
  featureGradient: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    height: '100%',
    justifyContent: 'center',
  },
  featureIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  featureText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFF",
    textAlign: 'center',
    marginTop: SPACING.sm,
  },

  carouselContainer: {
    position: 'relative',
    height: BANNER_HEIGHT,
  },
  carouselContent: {
    paddingHorizontal: SPACING.xl,
  },
  bannerItem: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginRight: SPACING.lg,
  },
  bannerImage: { 
    width: "100%", 
    height: "100%",
  },
  bannerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  bannerContent: {
    alignItems: 'flex-start',
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: SPACING.xs,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  pagination: {
    position: 'absolute',
    bottom: SPACING.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginHorizontal: SPACING.xs,
  },
  paginationActiveDot: {
    width: 24,
    backgroundColor: COLORS.primary,
  },

  // Services Grid
  servicesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
  },
  serviceCard: {
    width: (SCREEN_WIDTH - SPACING.xl * 2 - SPACING.lg * 2) / 3,
    height: 140,
  },
  serviceGradient: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    height: '100%',
    justifyContent: 'center',
  },
  serviceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  serviceText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFF",
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  serviceArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Health Tips Card
  healthTipsCard: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xxl,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    height: 120,
  },
  healthTipsGradient: {
    padding: SPACING.xl,
    height: '100%',
    justifyContent: 'center',
  },
  healthTipsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthTipsIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  healthTipsText: {
    flex: 1,
  },
  healthTipsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  healthTipsDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // Modal Theo dõi sức khỏe - Phiên bản cải tiến
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  healthModalImproved: {
    backgroundColor: "#FFF",
    width: SCREEN_WIDTH * 0.92,
    maxWidth: 400,
    height: SCREEN_HEIGHT * 0.72,
    borderRadius: BORDER_RADIUS.xxxl,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 30,
  },
  modalHeaderImproved: {
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
  },
  modalHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.lg,
  },
  modalTitleImproved: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFF",
  },
  modalSubtitleImproved: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },
  modalScrollContent: {
    flex: 1,
  },

  // Stats Overview
  statsOverview: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    alignItems: "center",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: "100%",
    backgroundColor: COLORS.border,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginVertical: SPACING.sm,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  // Metrics List
  metricsContainer: {
    gap: SPACING.lg,
  },
  metricCardImproved: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  metricCardGradient: {
    padding: SPACING.xl,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  metricIconBig: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.lg,
  },
  metricInfo: {
    flex: 1,
  },
  metricTitleBig: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFF",
  },
  metricDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },
  progressSection: {
    marginBottom: SPACING.md,
  },
  progressLabel: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  progressPercent: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFF",
  },
  progressStatus: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  progressBar: {
    height: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FFF",
    borderRadius: 6,
  },
  lastUpdate: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },

  closeBtnImproved: {
    padding: SPACING.xl,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  closeBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
});