import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../api/supabase";

export default function LabHistory({ navigation }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("test_results")
        .select(
          `
          id,
          test_name,
          result_value,
          unit,
          reference_range,
          note,
          status,
          performed_at,
          patient_id,
          appointment_id,
          profiles:patient_id(full_name),
          appointments:appointment_id(
            appointment_date,
            doctors:appointments_doctor_fkey(name)
          )
        `
        )
        .eq("status", "completed")
        .order("performed_at", { ascending: false });

      if (error) throw error;

      const grouped = data.reduce((acc, item) => {
        const key = item.appointment_id;

        if (!acc[key]) {
          acc[key] = {
            appointmentId: key,
            patientName: item.profiles?.full_name || "Chưa có tên",
            doctorName: item.appointments?.doctors?.name || "Không rõ",
            appointmentDate: item.appointments?.appointment_date,
            performedAt: item.performed_at,
            tests: [],
          };
        }

        acc[key].tests.push({
          name: item.test_name,
          result: item.result_value,
          unit: item.unit,
          range: item.reference_range,
          note: item.note,
          status: item.status,
        });

        return acc;
      }, {});

      setRecords(
        Object.values(grouped).sort(
          (a, b) => new Date(b.performedAt) - new Date(a.performedAt)
        )
      );
    } catch (err) {
      console.log("Lỗi fetch:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const formatDate = (d) =>
    new Date(d).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusColor = (status) => {
    if (status === "normal") return "#10B981";
    if (status === "abnormal") return "#F59E0B";
    if (status === "critical") return "#EF4444";
    return "#64748B";
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("LabHistoryDetail", {
          patientName: item.patientName,
          doctorName: item.doctorName,
          appointmentDate: item.appointmentDate,
          performedAt: item.performedAt,
          tests: item.tests,
        })
      }
      style={{
        backgroundColor: "#fff",
        marginHorizontal: 16,
        marginVertical: 12,
        borderRadius: 22,
        padding: 22,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        elevation: 10,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 20, fontWeight: "bold", color: "#1E293B" }}>
          {item.patientName}
        </Text>

        <View
          style={{
            backgroundColor: "#3B82F6",
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>
            {item.tests.length} mục
          </Text>
        </View>
      </View>

      <Text style={{ marginTop: 10, color: "#475569" }}>
        Bác sĩ:{" "}
        <Text style={{ fontWeight: "600", color: "#2563EB" }}>
          {item.doctorName}
        </Text>
      </Text>

      <View
        style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}
      >
        <Ionicons name="calendar-outline" size={16} color="#475569" />
        <Text style={{ marginLeft: 6, color: "#475569" }}>
          {formatDate(item.performedAt)}
        </Text>
      </View>

      <View style={{ marginTop: 16 }}>
        {item.tests.slice(0, 3).map((t, i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginVertical: 4,
            }}
          >
            <Text style={{ fontSize: 15, flex: 1, color: "#334155" }}>
              • {t.name}
            </Text>
            <Text
              style={{ fontWeight: "bold", color: getStatusColor(t.status) }}
            >
              {t.result || "—"} {t.unit && `(${t.unit})`}
            </Text>
          </View>
        ))}

        {item.tests.length > 3 && (
          <Text
            style={{
              marginTop: 8,
              textAlign: "right",
              fontWeight: "600",
              color: "#6366F1",
            }}
          >
            +{item.tests.length - 3} mục khác → xem chi tiết
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      <LinearGradient
        colors={["#2563EB", "#3B82F6"]}
        style={{ paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={() => navigation.navigate("LabDashboard")}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 26,
              fontWeight: "bold",
              color: "#fff",
              marginLeft: 14,
            }}
          >
            Lịch sử xét nghiệm
          </Text>
        </View>

        <Text style={{ fontSize: 17, color: "#E0E7FF", marginTop: 10 }}>
          Tổng: {records.length} lần xét nghiệm
        </Text>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2563EB"
          style={{ marginTop: 80 }}
        />
      ) : (
        <FlatList
          data={records}
          renderItem={renderItem}
          keyExtractor={(item) => item.appointmentId}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2563EB"]}
            />
          }
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 120 }}>
              <Ionicons name="flask-outline" size={100} color="#94A3B8" />
              <Text style={{ fontSize: 20, marginTop: 20, color: "#64748B" }}>
                Không có lịch sử xét nghiệm
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
