// src/screens/patient/HomeScreen.js
import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  useWindowDimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

// IMPORT ĐÚNG
import { supabase } from "../../api/supabase";
import { getUserProfile } from "../../controllers/patient/userController";

export default function HomeScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isSmall = width < 400;

  const [displayName, setDisplayName] = useState("Bạn");
  const [userId, setUserId] = useState(null);

  // LẤY USER ID TỪ SUPABASE
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error) {
          console.error("Lỗi lấy user:", error.message);
          return;
        }
        if (user?.id) {
          setUserId(user.id);
        } else {
          console.warn("Không tìm thấy user ID");
        }
      } catch (err) {
        console.error("Lỗi không mong muốn khi lấy user:", err.message);
      }
    };
    fetchUser();
  }, []);

  // LẤY TÊN THẬT KHI CÓ userId
  useEffect(() => {
    if (userId) {
      getUserProfile(userId)
        .then((profile) => {
          const name = profile?.name || "Bạn";
          console.log("Profile name:", name); // Debug
          setDisplayName(name);
        })
        .catch((err) => {
          console.error("Lỗi lấy profile:", err.message);
          // Fallback: email
          supabase.auth
            .getUser()
            .then(({ data: { user } }) => {
              const fallbackName = user?.email?.split("@")[0] || "Bạn";
              console.log("Fallback name:", fallbackName); // Debug
              setDisplayName(fallbackName);
            })
            .catch((fallbackErr) => {
              console.error("Lỗi fallback:", fallbackErr.message);
              setDisplayName("Bạn");
            });
        });
    }
  }, [userId]);

  const menuItems = [
    {
      title: "Đặt khám",
      icon: "calendar-outline",
      screen: "BookingOptionsScreen",
    },
    { title: "Lịch sử", icon: "time-outline", screen: "HistoryScreen" },
    { title: "Hồ sơ", icon: "person-outline", screen: "ProfileScreen" },
    { title: "Theo dõi", icon: "pulse-outline", screen: null },
    {
      title: "Tìm bác sĩ",
      icon: "search-outline",
      screen: "SearchDoctorScreen",
    },
    { title: "Cộng đồng", icon: "people-outline", screen: null },
  ];

  const scales = useRef(menuItems.map(() => new Animated.Value(0.7))).current;

  useEffect(() => {
    const animations = scales.map((scale, i) =>
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 120,
        delay: i * 80,
        useNativeDriver: true,
      })
    );
    Animated.stagger(100, animations).start();
  }, [scales]);

  const handlePress = (index, screen) => {
    Animated.sequence([
      Animated.timing(scales[index], {
        toValue: 0.94,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scales[index], {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (screen) navigation.navigate(screen);
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* HEADER */}
      <LinearGradient colors={["#1D4ED8", "#38BDF8"]} style={styles.header}>
        <Text style={styles.greeting}>Chào mừng trở lại,</Text>
        <Text style={styles.name}>
          {displayName ? <Text>{displayName}</Text> : <Text>Bạn</Text>}
        </Text>
        <Text style={styles.subtitle}>
          Hôm nay bạn cảm thấy thế nào? Hãy bắt đầu!
        </Text>
      </LinearGradient>

      {/* INFO BOX */}
      <View style={styles.infoBox}>
        <Ionicons name="medkit-outline" size={24} color="#059669" />
        <Text style={styles.infoText}>Kiểm tra lịch khám sắp tới của bạn.</Text>
        <Ionicons name="arrow-forward" size={16} color="#4B5563" />
      </View>

      {/* GRID MENU */}
      <View style={styles.grid}>
        {menuItems.map((item, index) => {
          const isLeft = index % 2 === 0;
          return (
            <TouchableWithoutFeedback
              key={item.title}
              onPress={() => handlePress(index, item.screen)}
              disabled={!item.screen}
            >
              <Animated.View
                style={[
                  styles.card,
                  isLeft ? styles.marginRight : styles.marginLeft,
                  isSmall && { width: "48%" },
                  !item.screen && styles.disabled,
                  { transform: [{ scale: scales[index] }] },
                ]}
              >
                <LinearGradient
                  colors={["#E0F2FE", "#BFDBFE"]}
                  style={styles.iconWrapper}
                >
                  <Ionicons name={item.icon} size={28} color="#1E3A8A" />
                </LinearGradient>
                <Text style={styles.title}>
                  <Text>{item.title}</Text>
                </Text>
              </Animated.View>
            </TouchableWithoutFeedback>
          );
        })}
      </View>

      {/* TIN TỨC */}
      <View style={styles.secondaryContent}>
        <Text style={styles.secondaryTitle}>Tin tức sức khỏe mới nhất</Text>
        <View style={styles.newsCard}>
          <Ionicons name="book-outline" size={20} color="#059669" />
          <Text style={styles.newsText}>
            <Text>10 mẹo duy trì năng lượng suốt cả ngày.</Text>
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

// === STYLES (GIỮ NGUYÊN) ===
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  content: { paddingBottom: 80 },
  header: {
    paddingTop: Platform.OS === "ios" ? 70 : 40,
    paddingHorizontal: 24,
    paddingBottom: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  greeting: { fontSize: 18, color: "#E0F2FE", fontWeight: "500" },
  name: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 4,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 16, color: "#E5E7EB", marginTop: 8 },
  infoBox: {
    marginHorizontal: 24,
    marginTop: -20,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#1D4ED8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#E0F2FE",
  },
  infoText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
    flex: 1,
    marginLeft: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    justifyContent: "space-between",
    marginTop: 30,
  },
  card: {
    width: "47%",
    aspectRatio: 1,
    // height: 100,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  // marginRight: { marginRight: 8 },
  // marginLeft: { marginLeft: 8 },
  disabled: { opacity: 0.4, backgroundColor: "#F1F5F9" },
  iconWrapper: { borderRadius: 40, padding: 12, marginBottom: 6 },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
    paddingHorizontal: 4,
  },
  secondaryContent: { paddingHorizontal: 24, marginTop: 0 },
  secondaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 15,
  },
  newsCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  newsText: {
    fontSize: 14,
    color: "#4B5563",
    marginLeft: 10,
    fontWeight: "500",
  },
});
