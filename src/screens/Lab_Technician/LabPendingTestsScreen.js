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

export default function LabPendingTestsScreen({ navigation }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPendingByPatient = async () => {
    try {
      const { data, error } = await supabase
        .from("test_results")
        .select(
          `
          id,
          patient_id,
          appointment_id,
          test_name,
          status,
          created_at,
          profiles:patient_id (full_name)
        `
        )
        .in("status", ["pending", "in_progress"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      const grouped = data.reduce((acc, item) => {
        const key = `${item.patient_id}_${item.appointment_id}`;
        if (!acc[key]) {
          acc[key] = {
            patientId: item.patient_id,
            patientName: item.profiles?.full_name || "Chưa có tên",
            appointmentId: item.appointment_id,
            testCount: 0,
            tests: [],
            created_at: item.created_at,
          };
        }
        acc[key].testCount += 1;
        acc[key].tests.push(item.test_name);
        return acc;
      }, {});

      const result = Object.values(grouped).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setPatients(result);
    } catch (err) {
      console.error("Error loading pending tests:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPendingByPatient();
    const interval = setInterval(() => {
      fetchPendingByPatient();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPendingByPatient();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("LabEnterResults", {
          appointmentId: item.appointmentId,
          patientName: item.patientName,
        })
      }
      style={{
        backgroundColor: "#fff",
        marginHorizontal: 16,
        marginVertical: 10,
        borderRadius: 20,
        padding: 20,
        elevation: 8,
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 6,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text
          style={{ fontSize: 20, fontWeight: "700", color: "#1E293B", flex: 1 }}
        >
          {item.patientName}
        </Text>

        <View
          style={{
            backgroundColor: "#DC2626",
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 20,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 12 }}>
            {item.testCount} xét nghiệm
          </Text>
        </View>
      </View>

      <Text style={{ marginTop: 12, fontSize: 15, color: "#475569" }}>
        Danh sách:{" "}
        <Text style={{ fontWeight: "600", color: "#1D4ED8" }}>
          {item.tests.join(" • ")}
        </Text>
      </Text>

      <View
        style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}
      >
        <Ionicons name="time-outline" size={18} color="#94A3B8" />
        <Text style={{ marginLeft: 8, color: "#94A3B8", fontSize: 13 }}>
          {new Date(item.created_at).toLocaleString("vi-VN")}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F1F5F9" }}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      {/* HEADER */}
      <LinearGradient
        colors={["#2563EB", "#3B82F6"]}
        style={{ paddingTop: 48, paddingHorizontal: 20, paddingBottom: 22 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => navigation.navigate("LabDashboard")}
            style={{
              marginRight: 14,
              backgroundColor: "rgba(255,255,255,0.18)",
              padding: 8,
              borderRadius: 50,
            }}
          >
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              color: "#fff",
              flex: 1,
            }}
          >
            Bệnh nhân cần làm xét nghiệm
          </Text>
        </View>

        <Text
          style={{
            fontSize: 17,
            color: "#E0ECFF",
            marginTop: 8,
            marginLeft: 2,
            fontWeight: "500",
          }}
        >
          Tổng cộng: {patients.length} bệnh nhân
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
          data={patients}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.patientId}_${item.appointmentId}`}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2563EB"]}
            />
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 120 }}>
              <Ionicons
                name="checkmark-circle-outline"
                size={100}
                color="#2563EB"
              />
              <Text
                style={{
                  fontSize: 18,
                  marginTop: 20,
                  color: "#64748B",
                  textAlign: "center",
                }}
              >
                Không có bệnh nhân nào cần làm xét nghiệm
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </View>
  );
}
