import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
  StatusBar,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function LabHistoryDetail() {
  const route = useRoute();
  const navigation = useNavigation();

  console.log("📥 Nhận params:", route.params);

  const {
    patientName = "Bệnh nhân",
    doctorName = "Không rõ",
    appointmentDate,
    performedAt,
    tests = [],
  } = route.params || {};

  const formatDate = (d) =>
    new Date(d).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const statusStyle = (s) => {
    switch (s) {
      case "normal":
        return { text: "Bình thường", color: "#16A34A", bg: "#DCFCE7" };
      case "abnormal":
        return { text: "Bất thường", color: "#D97706", bg: "#FEF3C7" };
      case "critical":
        return { text: "Nguy hiểm", color: "#DC2626", bg: "#FEE2E2" };
      default:
        return { text: "Hoàn tất", color: "#475569", bg: "#F1F5F9" };
    }
  };

  const shareResults = async () => {
    console.log("📤 Share kết quả xét nghiệm...");

    let msg = `KẾT QUẢ XÉT NGHIỆM\n`;
    msg += `Bệnh nhân: ${patientName}\n`;
    msg += `Bác sĩ: ${doctorName}\n`;
    msg += `Hoàn tất: ${formatDate(performedAt)}\n\n`;

    tests.forEach((t, i) => {
      const s = statusStyle(t.status);
      msg += `${i + 1}. ${t.test_name}\n`;
      msg += `  Kết quả: ${t.result} ${t.unit || ""}\n`;
      msg += `  Ngưỡng: ${t.range || "—"}\n`;
      msg += `  Trạng thái: ${s.text}\n\n`;
    });

    Share.share({ message: msg });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      <LinearGradient
        colors={["#2563EB", "#3B82F6"]}
        style={{
          paddingTop: 50,
          paddingBottom: 20,
          paddingHorizontal: 16,
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              position: "absolute",
              left: 0,
              padding: 6,
            }}
          >
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              color: "white",
            }}
          >
            Chi tiết xét nghiệm
          </Text>
        </View>
      </LinearGradient>

      <View
        style={{
          backgroundColor: "#fff",
          margin: 16,
          padding: 18,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "#E5E7EB",
          elevation: 5,
        }}
      >
        {[
          ["Bác sĩ chỉ định", doctorName],
          [
            "Ngày khám",
            appointmentDate
              ? new Date(appointmentDate).toLocaleDateString("vi-VN")
              : "—",
          ],
          ["Hoàn tất lúc", formatDate(performedAt)],
        ].map(([label, value], i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: i < 2 ? 10 : 0,
            }}
          >
            <Text style={{ color: "#6B7280", fontSize: 15 }}>{label}</Text>
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#111827" }}>
              {value}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
        {tests.map((test, index) => {
          const st = statusStyle(test.status);
          console.log(`🧪 Load test ${index + 1}:`, test);

          return (
            <View
              key={index}
              style={{
                backgroundColor: "#fff",
                padding: 18,
                borderRadius: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                elevation: 3,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#111827",
                  marginBottom: 12,
                }}
              >
                {index + 1}. {test.test_name}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: "#1D4ED8",
                  }}
                >
                  {test.result}{" "}
                  {test.unit && (
                    <Text style={{ fontSize: 15, color: "#6B7280" }}>
                      {test.unit}
                    </Text>
                  )}
                </Text>

                <View
                  style={{
                    backgroundColor: st.bg,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                  }}
                >
                  <Text
                    style={{
                      color: st.color,
                      fontWeight: "700",
                      fontSize: 13,
                    }}
                  >
                    {st.text}
                  </Text>
                </View>
              </View>

              {test.range && (
                <Text
                  style={{
                    marginTop: 10,
                    color: "#6B7280",
                    fontSize: 14,
                  }}
                >
                  Ngưỡng bình thường:{" "}
                  <Text style={{ fontWeight: "600", color: "#111827" }}>
                    {test.range}
                  </Text>
                </Text>
              )}

              {test.note && (
                <Text
                  style={{
                    marginTop: 10,
                    color: "#DC2626",
                    fontSize: 14,
                    fontStyle: "italic",
                  }}
                >
                  Ghi chú: {test.note}
                </Text>
              )}
            </View>
          );
        })}

        <TouchableOpacity onPress={shareResults} style={{ marginTop: 20 }}>
          <LinearGradient
            colors={["#7C3AED", "#6D28D9"]}
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              paddingVertical: 18,
              borderRadius: 26,
              elevation: 8,
            }}
          >
            <Ionicons name="share-social-outline" size={26} color="#fff" />
            <Text
              style={{
                color: "#fff",
                marginLeft: 10,
                fontSize: 17,
                fontWeight: "700",
              }}
            >
              Chia sẻ / In kết quả
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
