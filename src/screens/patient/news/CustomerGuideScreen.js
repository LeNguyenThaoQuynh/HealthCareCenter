import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import theme from "../../../theme/theme";

const { SPACING } = theme;
const { width } = Dimensions.get("window");
const CARD_SIZE = (width - 64) / 3;

const guides = [
  {
    id: "booking",
    title: "Đặt lịch khám",
    icon: "calendar-outline",
    color: "#3B82F6",
  },
  {
    id: "process",
    title: "Quy trình khám",
    icon: "git-network-outline",
    color: "#8B5CF6",
  },
  {
    id: "payment",
    title: "Thanh toán",
    icon: "card-outline",
    color: "#10B981",
  },
  {
    id: "test",
    title: "Lấy mẫu xét nghiệm",
    icon: "flask-outline",
    color: "#F59E0B",
  },
  {
    id: "result",
    title: "Xem kết quả",
    icon: "document-text-outline",
    color: "#EF4444",
  },
  {
    id: "faq",
    title: "Hỏi đáp",
    icon: "help-circle-outline",
    color: "#0D6EFD",
  },
];

export default function CustomerGuideScreen({ navigation }) {
  const [activeId, setActiveId] = useState(null);
  const scrollViewRef = useRef(null);

  const toggleSection = (id) => {
    const newId = activeId === id ? null : id;
    setActiveId(newId);
    if (newId) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 480, animated: true });
      }, 200);
    }
  };

  const currentItem = guides.find((g) => g.id === activeId);

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#2563EB", "#3B82F6"]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hướng dẫn</Text>
        <View style={{ width: 26 }} />
      </LinearGradient>

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
      >
        <View style={styles.hero}>
          <Ionicons name="heart" size={60} color="#3B82F6" />
          <Text style={styles.heroTitle}>Hỗ trợ bạn{"\n"}từng bước</Text>
        </View>

        <View style={styles.grid}>
          {guides.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.9}
              style={[
                styles.smallCard,
                activeId === item.id && styles.activeCard,
              ]}
              onPress={() => toggleSection(item.id)}
            >
              <LinearGradient
                colors={[item.color + "28", "#FFFFFF"]}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={[styles.smallIcon, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon} size={28} color="#FFF" />
              </View>
              <Text style={styles.smallTitle}>{item.title}</Text>
              <Ionicons
                name={activeId === item.id ? "chevron-up" : "chevron-down"}
                size={18}
                color="#64748B"
                style={{ marginTop: 6 }}
              />
            </TouchableOpacity>
          ))}
        </View>

        {activeId && currentItem && (
          <View style={styles.activeSection}>
            <LinearGradient
              colors={[currentItem.color, currentItem.color + "E0"]}
              style={styles.activeHeader}
            >
              <Ionicons name={currentItem.icon} size={28} color="#FFF" />
              <Text style={styles.activeTitle}>{currentItem.title}</Text>
            </LinearGradient>

            <View style={styles.activeBody}>
              {activeId === "booking" && (
                <>
                  <Text style={styles.txt}>1. Trang chủ → Bấm "Đặt khám"</Text>
                  <Text style={styles.txt}>
                    2. Chọn chuyên khoa → bác sĩ → ngày giờ
                  </Text>
                  <Text style={styles.txt}>
                    3. Xác nhận → nhận mã đặt lịch qua SMS
                  </Text>
                  <Text style={styles.highlight}>
                    Hoàn thành chỉ trong 30 giây!
                  </Text>
                </>
              )}
              {activeId === "process" && (
                <>
                  <Text style={styles.txt}>1. Đăng ký tại quầy tiếp nhận</Text>
                  <Text style={styles.txt}>2. Khám lâm sàng với bác sĩ</Text>
                  <Text style={styles.txt}>
                    3. Thực hiện xét nghiệm / chẩn đoán hình ảnh
                  </Text>
                  <Text style={styles.txt}>
                    4. Nhận kết quả & tư vấn điều trị
                  </Text>
                </>
              )}
              {activeId === "payment" && (
                <>
                  <Text style={styles.txt}>
                    • Thanh toán: Tiền mặt, thẻ, chuyển khoản, QR
                  </Text>
                  <Text style={styles.txt}>
                    • Hỗ trợ BHYT và mọi loại bảo hiểm
                  </Text>
                  <Text style={styles.txt}>
                    • In hóa đơn điện tử ngay lập tức
                  </Text>
                </>
              )}
              {activeId === "test" && (
                <>
                  <Text style={styles.txt}>
                    • Nhịn ăn 6-8h nếu xét nghiệm máu
                  </Text>
                  <Text style={styles.txt}>• Mang CMND/CCCD + mã đặt lịch</Text>
                  <Text style={styles.txt}>
                    • Lấy mẫu tại Tầng 1 – Khu xét nghiệm
                  </Text>
                </>
              )}
              {activeId === "result" && (
                <>
                  <Text style={styles.txt}>• Vào app → "Bệnh án"</Text>
                  <Text style={styles.txt}>
                    • Xem ngay kết quả xét nghiệm, X-quang, siêu âm
                  </Text>
                  <Text style={styles.txt}>
                    • Tải PDF miễn phí, chia sẻ cho bác sĩ
                  </Text>
                </>
              )}
              {activeId === "faq" && (
                <>
                  <Text style={styles.txt}>
                    • Đặt lịch có mất phí không? → Hoàn toàn miễn phí
                  </Text>
                  <Text style={styles.txt}>
                    • Có hủy lịch được không? → Được, trước 2 tiếng
                  </Text>
                  <Text style={styles.txt}>
                    • Mang gì khi đi khám? → CMND + Mã đặt lịch
                  </Text>
                </>
              )}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.hotline}
          onPress={() => Linking.openURL("tel:0854776885")}
        >
          <LinearGradient
            colors={["#10B981", "#059669"]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.hotlineContent}>
            <Ionicons name="call" size={30} color="#FFF" />
            <View style={{ marginLeft: 16 }}>
              <Text style={styles.hotlineLabel}>Hỗ trợ 24/7</Text>
              <Text style={styles.hotlineNumber}>0854 776 885</Text>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: SPACING.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#FFF" },

  hero: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#F0F9FF",
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    borderRadius: 28,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1E293B",
    textAlign: "center",
    marginTop: 12,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingHorizontal: 12,
    marginTop: 10,
  },
  smallCard: {
    width: CARD_SIZE,
    height: CARD_SIZE + 10,
    backgroundColor: "#FFF",
    borderRadius: 24,
    margin: 6,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  activeCard: {
    elevation: 16,
    transform: [{ scale: 1.06 }],
    borderWidth: 2.5,
    borderColor: "#3B82F6",
  },
  smallIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  smallTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
  },

  activeSection: {
    marginHorizontal: SPACING.xl,
    marginTop: 28,
    borderRadius: 32,
    overflow: "hidden",
    elevation: 16,
  },
  activeHeader: {
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
  },
  activeTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFF",
    marginLeft: 16,
  },
  activeBody: { backgroundColor: "#FFF", padding: 26 },
  txt: { fontSize: 16.2, color: "#334155", lineHeight: 26, marginBottom: 10 },
  highlight: {
    fontSize: 17,
    color: "#10B981",
    fontWeight: "800",
    marginTop: 14,
  },

  hotline: {
    marginHorizontal: SPACING.xl,
    height: 88,
    borderRadius: 40,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 28,
    marginTop: 40,
    overflow: "hidden",
    elevation: 20,
  },
  hotlineContent: { flexDirection: "row", alignItems: "center" },
  hotlineLabel: { color: "#D1FAE5", fontSize: 14.5 },
  hotlineNumber: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 4,
  },
});
