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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";

import AppointmentCard from "../../components/AppointmentCard";
import { AppointmentController } from "../../controllers/patient/AppointmentController";

const Colors = {
  primary: "#0066FF",
  gradient: ["#0066FF", "#2BB5FF"],
  confirmed: "#00C853",
  pending: "#FFB300",
  cancelled: "#FF3B30",
  completed: "#7C3AED",
  bg: "#F3F6FF",
};

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
    title: "Đã hoàn thành",
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
        activeOpacity={0.9}
        onPress={() => setActiveTab(item.key)}
        style={[styles.tabWrapper]}
      >
        <View
          style={[
            styles.tab,
            active && {
              backgroundColor: item.color + "15",
              borderColor: item.color,
            },
          ]}
        >
          <Ionicons
            name={item.icon}
            size={18}
            color={active ? item.color : "#64748b"}
          />

          <Text
            style={[
              styles.tabText,
              active && { color: item.color, fontWeight: "700" },
            ]}
          >
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
        </View>
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
      {/* HEADER */}
      <LinearGradient colors={Colors.gradient} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("HomeScreen")}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.title}>Lịch sử đặt lịch</Text>

        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={26} color="#fff" />
        </TouchableOpacity>
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
          <Animated.View entering={ZoomIn.delay(100)} style={styles.empty}>
            <Ionicons
              name={
                activeTab === "completed"
                  ? "document-text-outline"
                  : activeTab === "confirmed"
                  ? "calendar-outline"
                  : activeTab === "pending"
                  ? "hourglass-outline"
                  : "close-circle-outline"
              }
              size={100}
              color="#d3ddff"
            />

            <Text style={styles.emptyTitle}>
              {activeTab === "completed" && "Chưa có buổi khám nào hoàn tất"}
              {activeTab === "confirmed" && "Chưa có lịch được duyệt"}
              {activeTab === "pending" && "Không có lịch đang chờ"}
              {activeTab === "cancelled" && "Bạn chưa từng hủy lịch nào"}
            </Text>

            {activeTab === "completed" && (
              <Text style={styles.emptySubtitle}>
                Lịch hoàn tất sẽ xuất hiện tại đây.
              </Text>
            )}
          </Animated.View>
        ) : (
          <FlatList
            data={filteredAppointments}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index }) => (
              <Animated.View
                entering={FadeInDown.delay(index * 70).springify()}
              >
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 48,
    paddingHorizontal: 22,
    paddingBottom: 26,
    borderBottomLeftRadius: 38,
    borderBottomRightRadius: 38,
    elevation: 10,
  },

  title: { fontSize: 26, fontWeight: "900", color: "#fff" },

  tabContainer: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },

  tabWrapper: {
    paddingHorizontal: 2,
  },

  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    gap: 6,
  },

  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
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
    fontWeight: "700",
  },

  content: { flex: 1 },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#475569",
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
    color: "#1e293b",
    marginTop: 16,
    textAlign: "center",
  },

  emptySubtitle: {
    marginTop: 8,
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
  },
});
