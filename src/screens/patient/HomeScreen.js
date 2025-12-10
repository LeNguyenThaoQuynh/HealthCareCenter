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
    {
      title: "Đặt khám",
      icon: "calendar-outline",
      screen: "BookingOptionsScreen",
    },
    { title: "Lịch sử khám", icon: "time-outline", screen: "HistoryScreen" },
    {
      title: "Bệnh án",
      icon: "document-text-outline",
      screen: "MedicalRecordScreen",
    },
    { title: "Hồ sơ", icon: "person-outline", screen: "ProfileScreen" },
    {
      title: "Theo dõi",
      icon: "heart-outline",
      action: () => setShowTrackingModal(true),
    },
    { title: "Hỗ trợ", icon: "chatbubble-outline", screen: "SupportScreen" },
  ];

  const umcMenu = [
    {
      title: "Hướng dẫn khách hàng",
      icon: "help-circle-outline",
      screen: "CustomerGuide",
    },
    {
      title: "Bảng giá dịch vụ",
      icon: "pricetag-outline",
      screen: "PriceList",
    },
    {
      title: "Tin tức - Sự kiện",
      icon: "newspaper-outline",
      screen: "NewsEvents",
    },
  ];

  const scales = useRef(menu.map(() => new Animated.Value(1))).current;
  const umcScales = useRef(umcMenu.map(() => new Animated.Value(1))).current;

  const animatePress = (index) => {
    Animated.sequence([
      Animated.timing(scales[index], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scales[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateUmCPress = (index) => {
    Animated.sequence([
      Animated.timing(umcScales[index], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(umcScales[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Banner
  const bannerData = [
    { id: "1", image: require("../../../assets/images/umc-hospital.jpg") },
    { id: "2", image: require("../../../assets/images/phuocem.jpg") },
    { id: "3", image: require("../../../assets/images/quynh.jpg") },
    { id: "4", image: require("../../../assets/images/phuc.jpg") },
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
      <Image
        source={item.image}
        style={styles.bannerImage}
        resizeMode="cover"
      />
    </View>
  );

  const trackingOptions = [
    {
      title: "Cân nặng & BMI",
      description: "Theo dõi cân nặng và chỉ số BMI",
      icon: "body-outline",
      color: "#10B981",
      screen: "WeightBMI",
    },
    {
      title: "Huyết áp",
      description: "Theo dõi chỉ số huyết áp",
      icon: "pulse-outline",
      color: "#EF4444",
      screen: "BloodPressure",
    },
    {
      title: "Đường huyết",
      description: "Theo dõi chỉ số đường huyết",
      icon: "water-outline",
      color: "#8B5CF6",
      screen: "BloodGlucose",
    },
  ];

  return (
    <View style={styles.container}>
      {/* THÊM 5 THUỘC TÍNH QUAN TRỌNG DƯỚI ĐÂY ĐỂ TẮT HIỆU ỨNG ĐÀN HỒI */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        nestedScrollEnabled={true}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <LinearGradient colors={["#2563EB", "#3B82F6"]} style={styles.header}>
          <Text style={styles.greeting}>Xin chào,</Text>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.subtitle}>Chăm sóc sức khỏe của bạn hôm nay</Text>
        </LinearGradient>

        <TouchableOpacity
          style={styles.infoBox}
          onPress={() => navigation.navigate("HistoryScreen")}
        >
          <Ionicons name="notifications-outline" size={22} color="#2563EB" />
          <Text style={styles.infoText}>Bạn có lịch khám sắp tới</Text>
          <Ionicons name="chevron-forward" size={22} color="#2563EB" />
        </TouchableOpacity>

        {/* 6 ô chính */}
        <View style={styles.grid}>
          {menu.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.menuItem}
              onPress={() => {
                animatePress(i);
                if (item.action) item.action();
                else if (item.screen) navigation.navigate(item.screen);
              }}
              activeOpacity={0.85}
            >
              <Animated.View
                style={[
                  styles.itemInner,
                  { transform: [{ scale: scales[i] }] },
                ]}
              >
                <View style={styles.iconCircle}>
                  <Ionicons name={item.icon} size={28} color="#2563EB" />
                </View>
                <Text style={styles.itemText}>{item.title}</Text>
              </Animated.View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Banner */}
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
              getItemLayout={(data, index) => ({
                length: width - SPACING.xl * 2,
                offset: (width - SPACING.xl * 2) * index,
                index,
              })}
            />
            <View style={styles.dotsContainer}>
              {bannerData.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        currentBannerIndex === i ? "#2563EB" : "#CBD5E1",
                      width: currentBannerIndex === i ? 24 : 8,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Tiêu đề + 6 ô UMC Care */}
        <View style={styles.newsHeader}>
          <Text style={styles.newsTitle}>Tin tức nổi bật</Text>
          <TouchableOpacity onPress={() => navigation.navigate("NewsEvents")}>
            <Text style={styles.viewMore}>Xem thêm</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {umcMenu.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.menuItem}
              onPress={() => {
                animateUmCPress(i);
                navigation.navigate(item.screen);
              }}
              activeOpacity={0.85}
            >
              <Animated.View
                style={[
                  styles.itemInner,
                  { transform: [{ scale: umcScales[i] }] },
                ]}
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

      {/* Modal */}
      {showTrackingModal && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowTrackingModal(false)}
          />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn loại theo dõi</Text>
            {trackingOptions.map((opt, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.modalOption}
                onPress={() => {
                  setShowTrackingModal(false);
                  navigation.navigate(opt.screen);
                }}
              >
                <View
                  style={[
                    styles.modalIconCircle,
                    { backgroundColor: opt.color + "20" },
                  ]}
                >
                  <Ionicons name={opt.icon} size={32} color={opt.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalOptionText}>{opt.title}</Text>
                  <Text style={styles.modalOptionDescription}>
                    {opt.description}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#64748B" />
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowTrackingModal(false)}
            >
              <Text style={styles.modalCloseText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  greeting: { fontSize: 17, color: "#FFFFFFCC", fontWeight: "600" },
  name: { fontSize: 32, color: "#FFFFFF", fontWeight: "800", marginTop: 4 },
  subtitle: { fontSize: 15, color: "#FFFFFFE6", marginTop: 6 },

  infoBox: {
    marginHorizontal: SPACING.xl,
    marginTop: -16,
    backgroundColor: "#FFF",
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...SHADOWS.card,
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
  },
  menuItem: { width: "30%", marginBottom: SPACING.xl },
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

  bannerSection: { marginTop: SPACING.xxl, paddingHorizontal: SPACING.xl },
  bannerContainer: {
    height: 220,
    borderRadius: BORDER_RADIUS.xl,
    overflow: "hidden",
    backgroundColor: "#fff",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.xxl,
    marginBottom: SPACING.md,
  },
  newsTitle: { fontSize: 22, fontWeight: "800", color: "#1E293B" },
  viewMore: { fontSize: 16, color: "#0D6EFD", fontWeight: "700" },

  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFF",
    width: width - 60,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.card,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: SPACING.xxl,
    color: "#1E293B",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    marginBottom: SPACING.lg,
  },
  modalIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.lg,
  },
  modalOptionText: { fontSize: 17, fontWeight: "700", color: "#1E293B" },
  modalOptionDescription: { fontSize: 13, color: "#64748B", marginTop: 2 },
  modalCloseBtn: { marginTop: SPACING.xl, paddingVertical: SPACING.md },
  modalCloseText: {
    textAlign: "center",
    fontSize: 16,
    color: "#64748B",
    fontWeight: "600",
  },
});
