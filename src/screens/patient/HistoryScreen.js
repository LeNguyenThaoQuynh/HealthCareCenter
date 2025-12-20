import React, { useState, useEffect, useCallback } from "react";
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
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";

import AppointmentCard from "../../components/AppointmentCard";
import { AppointmentController } from "../../controllers/patient/AppointmentController";

/* ================= THEME ================= */
const Colors = {
  primary: "#0066FF",
  gradient: ["#0066FF", "#2BB5FF"],
  confirmed: "#00C853",
  pending: "#FFB300",
  cancelled: "#FF3B30",
  completed: "#7C3AED",
  bg: "#F3F6FF",
  textDark: "#1e293b",
  textSub: "#64748b",
};

const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20 };
const BORDER_RADIUS = { xl: 20, xxxl: 30 };

const TABS = [
  {
    key: "confirmed",
    title: "Đã xác nhận",
    icon: "checkmark-circle",
    color: Colors.confirmed,
  },
  { key: "pending", title: "Chờ duyệt", icon: "time", color: Colors.pending },
  {
    key: "completed",
    title: "Hoàn tất",
    icon: "medkit",
    color: Colors.completed,
  },
  {
    key: "cancelled",
    title: "Đã hủy",
    icon: "close-circle",
    color: Colors.cancelled,
  },
];

/* ================= SCREEN ================= */
export default function HistoryScreen() {
  const navigation = useNavigation();
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState("confirmed");
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
    } catch {
      Alert.alert("Lỗi", "Không thể tải lịch hẹn");
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

  const filteredAppointments = appointments.filter((app) => {
    if (activeTab === "confirmed") return app.status === "confirmed";
    if (activeTab === "pending") return app.status === "pending";
    if (activeTab === "completed") return app.status === "completed";
    return ["cancelled", "doctor_cancelled", "patient_cancelled"].includes(
      app.status
    );
  });

  const canCancel = (status) => ["confirmed", "pending"].includes(status);

  const handleCancel = async (id) => {
    Alert.alert("Hủy lịch khám", "Bạn chắc chắn muốn hủy lịch khám này?", [
      { text: "Không", style: "cancel" },
      {
        text: "Hủy lịch",
        style: "destructive",
        onPress: async () => {
          const result = await AppointmentController.cancelAppointment(
            id,
            setAppointments
          );
          Alert.alert(result.success ? "Thành công" : "Lỗi", result.message, [
            { text: "OK", onPress: result.success ? onRefresh : null },
          ]);
        },
      },
    ]);
  };

  const getCount = (key) => {
    if (key === "confirmed")
      return appointments.filter((a) => a.status === "confirmed").length;
    if (key === "pending")
      return appointments.filter((a) => a.status === "pending").length;
    if (key === "completed")
      return appointments.filter((a) => a.status === "completed").length;
    return appointments.filter((a) =>
      ["cancelled", "doctor_cancelled", "patient_cancelled"].includes(a.status)
    ).length;
  };

  const renderTab = ({ item }) => {
    const active = activeTab === item.key;
    const count = getCount(item.key);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setActiveTab(item.key)}
      >
        <Animated.View
          entering={FadeInDown}
          style={[
            styles.tab,
            active && {
              backgroundColor: item.color + "18",
              borderColor: item.color,
              transform: [{ scale: 1.03 }],
            },
          ]}
        >
          <Ionicons
            name={item.icon}
            size={18}
            color={active ? item.color : Colors.textSub}
          />

          <Text style={[styles.tabText, active && { color: item.color }]}>
            {item.title}
          </Text>

          {count > 0 && (
            <View
              style={[
                styles.badge,
                { backgroundColor: active ? item.color : "#cbd5e1" },
              ]}
            >
              <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
            </View>
          )}
        </Animated.View>
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
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* HEADER */}
      <LinearGradient colors={Colors.gradient} style={styles.header}>
        <TouchableOpacity
          style={styles.headerSide}
          onPress={() => navigation.navigate("HomeScreen")}
        >
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Lịch sử đặt lịch</Text>

        <View style={styles.headerSide} />
      </LinearGradient>

      {/* TABS */}
      <View style={styles.tabContainer}>
        <FlatList
          data={TABS}
          renderItem={renderTab}
          keyExtractor={(i) => i.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        />
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        {filteredAppointments.length === 0 ? (
          <Animated.View entering={ZoomIn} style={styles.empty}>
            <Ionicons name="calendar-outline" size={96} color="#d3ddff" />
            <Text style={styles.emptyTitle}>Chưa có lịch hẹn</Text>
            <Text style={styles.emptySubtitle}>
              Lịch phù hợp sẽ hiển thị tại đây
            </Text>
          </Animated.View>
        ) : (
          <FlatList
            data={filteredAppointments}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.delay(index * 60)}>
                <AppointmentCard
                  item={item}
                  onCancel={
                    canCancel(item.status)
                      ? () => handleCancel(item.id)
                      : undefined
                  }
                />
              </Animated.View>
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
            ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          />
        )}
      </View>
    </View>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    paddingBottom: 20,
    paddingHorizontal: SPACING.xl,
    borderBottomLeftRadius: BORDER_RADIUS.xxxl,
    borderBottomRightRadius: BORDER_RADIUS.xxxl,
    alignItems: "center",
    justifyContent: "center",
  },

  headerSide: {
    position: "absolute",
    left: SPACING.xl,
    bottom: 20,
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.3,
  },

  tabContainer: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },

  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    gap: 6,
  },

  tabText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textSub,
  },

  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },

  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },

  content: { flex: 1 },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: Colors.textSub,
    fontWeight: "600",
  },

  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 36,
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textDark,
    marginTop: 16,
  },

  emptySubtitle: {
    marginTop: 6,
    fontSize: 15,
    color: Colors.textSub,
    textAlign: "center",
  },
});
