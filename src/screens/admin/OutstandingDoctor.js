import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Image,
  Platform,
  TouchableOpacity,
} from "react-native";
import { supabase } from "../../api/supabase";
import theme from "../../theme/theme";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const { COLORS, SPACING, SHADOWS, BORDER_RADIUS, GRADIENTS } = theme;

export default function TopDoctorsScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);

  const loadTopDoctors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          doctor:doctors!inner (
            id,
            name,
            avatar_url,
            department_name
          ),
          invoices!inner (
            id,
            status
          )
        `);

      if (error) throw error;

      const stats = {};
      data.forEach((appt) => {
        const doc = appt.doctor;
        if (!stats[doc.id]) {
          stats[doc.id] = {
            name: doc.name,
            avatar_url: doc.avatar_url,
            completed: 0,
          };
        }
        appt.invoices.forEach((inv) => {
          if (inv.status === "paid") stats[doc.id].completed += 1;
        });
      });

      const topDoctors = Object.values(stats).sort(
        (a, b) => b.completed - a.completed
      );

      setDoctors(topDoctors);
    } catch (err) {
      console.log("Error loading top doctors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopDoctors();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <LinearGradient
        colors={GRADIENTS.header}
        style={{
          height: 120,
          paddingTop: Platform.OS === "ios" ? 60 : 40,
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
          justifyContent: "center",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: SPACING.lg,
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate("AdminHome")}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.25)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="chevron-back" size={26} color="#FFF" />
          </TouchableOpacity>

          <View style={{ flex: 1, alignItems: "center" }}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                color: "#FFF",
                textAlign: "center",
              }}
            >
              Bác sĩ nổi bật
            </Text>
          </View>

          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : doctors.length === 0 ? (
          <Text style={{ textAlign: "center", marginTop: 20, color: "#777" }}>
            Chưa có dữ liệu
          </Text>
        ) : (
          doctors.map((doc, index) => (
            <View key={index} style={styles.card}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {doc.avatar_url ? (
                    <Image
                      source={{ uri: doc.avatar_url }}
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        marginRight: 12,
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        backgroundColor: COLORS.surface,
                        marginRight: 12,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: COLORS.textSecondary }}>B</Text>
                    </View>
                  )}
                  <Text style={styles.name}>{doc.name}</Text>
                </View>

                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{doc.completed}</Text>
                </View>
              </View>

              <Text style={styles.completed}>Lượt khám hoàn thành</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  completed: {
    marginTop: 4,
    color: "#6B7280",
    fontSize: 14,
  },
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
