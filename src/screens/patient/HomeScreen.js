import React, { useEffect, useState, useRef } from "react";
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../api/supabase";
import { getUserProfile } from "../../controllers/patient/userController";
import theme from "../../theme/theme";

const { SPACING, BORDER_RADIUS, SHADOWS } = theme;
const { width } = Dimensions.get("window");

/* ===== GRID CONFIG ===== */
const NUM_COLUMNS = 3;
const ITEM_GAP = SPACING.lg;
const ITEM_WIDTH =
  (width - SPACING.lg * 2 - ITEM_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

export default function HomeScreen() {
  const navigation = useNavigation();
  const [displayName, setDisplayName] = useState("Bạn");
  const [showTrackingModal, setShowTrackingModal] = useState(false);

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
  }, []);

  const menu = [
    { title: "Đặt khám", icon: "calendar-outline", screen: "BookingOptionsScreen" },
    { title: "Lịch sử khám", icon: "time-outline", screen: "HistoryScreen" },
    { title: "Bệnh án", icon: "document-text-outline", screen: "MedicalRecordScreen" },
    { title: "Hồ sơ", icon: "person-outline", screen: "ProfileScreen" },
    { title: "Theo dõi", icon: "heart-outline", action: () => setShowTrackingModal(true) },
    { title: "Hỗ trợ", icon: "chatbubble-outline", screen: "SupportScreen" },
  ];

  const umcMenu = [
    { title: "Hướng dẫn", icon: "help-circle-outline", screen: "CustomerGuide" },
    { title: "Bảng giá dịch vụ", icon: "pricetag-outline", screen: "PriceList" },
    { title: "Tư vấn", icon: "help-circle-outline", screen: "HelpScreen" },
  ];

  const scales = useRef(menu.map(() => new Animated.Value(1))).current;
  const umcScales = useRef(umcMenu.map(() => new Animated.Value(1))).current;

  const animatePress = (arr, index) => {
    Animated.sequence([
      Animated.timing(arr[index], { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(arr[index], { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  /* ===== BANNER ===== */
  const bannerData = [
    { id: "1", image: require("../../../assets/images/phuoc.jpg") },
    { id: "2", image: require("../../../assets/images/quynh.jpg") },
    { id: "3", image: require("../../../assets/images/phuc.jpg") },
  ];

  const flatListRef = useRef(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => {
        const next = prev === bannerData.length - 1 ? 0 : prev + 1;
        flatListRef.current?.scrollToIndex({ animated: true, index: next });
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const renderBanner = ({ item }) => (
    <View style={styles.bannerItem}>
      <Image source={item.image} style={styles.bannerImage} />
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ===== HEADER ===== */}
        <LinearGradient colors={["#2563EB", "#3B82F6"]} style={styles.header}>
          <Text style={styles.greeting}>Xin chào,</Text>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.subtitle}>Chăm sóc sức khỏe của bạn hôm nay</Text>
        </LinearGradient>

        {/* ===== INFO BOX ===== */}
        <TouchableOpacity
          style={styles.infoBox}
          onPress={() => navigation.navigate("HistoryScreen")}
        >
          <Ionicons name="notifications-outline" size={22} color="#2563EB" />
          <Text style={styles.infoText}>Bạn có lịch khám sắp tới</Text>
          <Ionicons name="chevron-forward" size={22} color="#2563EB" />
        </TouchableOpacity>

        {/* ===== GRID MENU ===== */}
        <View style={styles.grid}>
          {menu.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.menuItem}
              activeOpacity={0.85}
              onPress={() => {
                animatePress(scales, i);
                item.action ? item.action() : navigation.navigate(item.screen);
              }}
            >
              <Animated.View style={[styles.itemInner, { transform: [{ scale: scales[i] }] }]}>
                <View style={styles.iconCircle}>
                  <Ionicons name={item.icon} size={28} color="#2563EB" />
                </View>
                <Text style={styles.itemText}>{item.title}</Text>
              </Animated.View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ===== BANNER ===== */}
        <View style={styles.bannerSection}>
          <View style={styles.bannerContainer}>
            <FlatList
              ref={flatListRef}
              data={bannerData}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={renderBanner}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(
                  e.nativeEvent.contentOffset.x / (width - SPACING.xl * 2)
                );
                setCurrentBannerIndex(index);
              }}
            />
            <View style={styles.dotsContainer}>
              {bannerData.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: currentBannerIndex === i ? "#2563EB" : "#CBD5E1",
                      width: currentBannerIndex === i ? 24 : 8,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        {/* ===== NEWS ===== */}
        <View style={styles.newsHeader}>
          <Text style={styles.newsTitle}>Tin tức nổi bật</Text>
        </View>

        {/* ===== UMC GRID (TỰ CĂN GIỮA HÀNG CUỐI) ===== */}
        <View
          style={[
            styles.grid,
            umcMenu.length % NUM_COLUMNS !== 0 && styles.rowCenter,
          ]}
        >
          {umcMenu.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.menuItem}
              activeOpacity={0.85}
              onPress={() => {
                animatePress(umcScales, i);
                navigation.navigate(item.screen);
              }}
            >
              <Animated.View
                style={[styles.itemInner, { transform: [{ scale: umcScales[i] }] }]}
              >
                <View style={styles.iconCircle}>
                  <Ionicons name={item.icon} size={28} color="#2563EB" />
                </View>
                <Text style={styles.itemText}>{item.title}</Text>
              </Animated.View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

/* ===== STYLES ===== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  header: {
    paddingTop: 60,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  greeting: { fontSize: 17, color: "#FFFFFFCC", fontWeight: "600" },
  name: { fontSize: 32, color: "#FFF", fontWeight: "800", marginTop: 4 },
  subtitle: { fontSize: 15, color: "#FFFFFFE6", marginTop: 6 },

  infoBox: {
    marginHorizontal: SPACING.xl,
    marginTop: -16,
    backgroundColor: "#FFF",
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    flexDirection: "row",
    alignItems: "center",
    ...SHADOWS.card,
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  infoText: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
  },

  /* ===== GRID ===== */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    gap: ITEM_GAP,
  },
  rowCenter: {
    justifyContent: "center",
  },
  menuItem: {
    width: ITEM_WIDTH,
  },
  itemInner: {
    backgroundColor: "#FFF",
    paddingVertical: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: "center",
    ...SHADOWS.card,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#EBF5FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  itemText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
    textAlign: "center",
  },

  /* ===== BANNER ===== */
  bannerSection: { marginTop: SPACING.xxl, paddingHorizontal: SPACING.xl },
  bannerContainer: {
    height: 220,
    borderRadius: BORDER_RADIUS.xl,
    overflow: "hidden",
    backgroundColor: "#FFF",
    ...SHADOWS.card,
  },
  bannerItem: { width: width - SPACING.xl * 2, height: 220 },
  bannerImage: { width: "100%", height: "100%" },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    position: "absolute",
    bottom: 16,
    width: "100%",
  },
  dot: { height: 8, borderRadius: 4, marginHorizontal: 4 },

  newsHeader: {
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.xxl,
    marginBottom: SPACING.md,
  },
  newsTitle: { fontSize: 22, fontWeight: "800", color: "#1E293B" },
});
