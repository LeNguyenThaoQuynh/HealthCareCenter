import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../api/supabase";
import { useNavigation } from "@react-navigation/native";
import { LineChart } from "react-native-chart-kit";
import theme from "../../theme/theme";

const { COLORS, SPACING, SHADOWS, GRADIENTS } = theme;
const screenWidth = Dimensions.get("window").width;

export default function RevenueStatsScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState({
    labels: [],
    totalRevenue: [],
    paidRevenue: [],
  });

  const loadRevenue = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("issued_at, total_amount, status")
        .order("issued_at", { ascending: true });

      if (error) throw error;

      const grouped = data.reduce((acc, inv) => {
        const day = new Date(inv.issued_at).toLocaleDateString();
        if (!acc[day]) acc[day] = { total: 0, paid: 0 };
        acc[day].total += Number(inv.total_amount);
        if (inv.status === "paid") acc[day].paid += Number(inv.total_amount);
        return acc;
      }, {});

      const labels = Object.keys(grouped);
      const totalRevenue = labels.map((day) => grouped[day].total);
      const paidRevenue = labels.map((day) => grouped[day].paid);

      setRevenueData({ labels, totalRevenue, paidRevenue });
    } catch (err) {
      console.log("Error load revenue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRevenue();
  }, []);

  const totalRevenueSum = revenueData.totalRevenue.reduce((a, b) => a + b, 0);
  const paidRevenueSum = revenueData.paidRevenue.reduce((a, b) => a + b, 0);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <LinearGradient
        colors={GRADIENTS.header}
        style={{
          height: 120,
          paddingTop: Platform.OS === "ios" ? 65 : 45,
          borderBottomLeftRadius: 40,
          borderBottomRightRadius: 40,
          justifyContent: "center",
          position: "relative",
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate("AdminHome")}
          style={{
            position: "absolute",
            left: SPACING.xl,
            top: Platform.OS === "ios" ? 65 : 45,
            width: 40,
            height: 40,
            borderRadius: 23,
            backgroundColor: "rgba(255,255,255,0.28)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10,
          }}
        >
          <Ionicons name="chevron-back" size={26} color="#FFF" />
        </TouchableOpacity>

        <View
          style={{
            position: "absolute",
            top: Platform.OS === "ios" ? 65 : 45,
            left: 0,
            right: 0,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: "800",
              color: "#FFF",
              textAlign: "center",
            }}
          >
            Thống kê doanh thu
          </Text>
        </View>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={{ marginTop: 50 }}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
          <View style={{ flexDirection: "row", marginBottom: 20 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "#FFF",
                borderRadius: 20,
                padding: 20,
                marginRight: 10,
                ...SHADOWS.card,
              }}
            >
              <Text style={{ color: "#64748B", fontSize: 14 }}>
                Tổng doanh thu
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: COLORS.primary,
                  marginTop: 8,
                }}
              >
                {totalRevenueSum.toLocaleString()}đ
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: "#FFF",
                borderRadius: 20,
                padding: 20,
                ...SHADOWS.card,
              }}
            >
              <Text style={{ color: "#64748B", fontSize: 14 }}>
                Đã thanh toán
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: COLORS.success,
                  marginTop: 8,
                }}
              >
                {paidRevenueSum.toLocaleString()}đ
              </Text>
            </View>
          </View>

          {revenueData.labels.length > 0 ? (
            <LineChart
              data={{
                labels: revenueData.labels,
                datasets: [
                  {
                    data: revenueData.totalRevenue,
                    color: () => COLORS.primary,
                    strokeWidth: 2,
                  },
                  {
                    data: revenueData.paidRevenue,
                    color: () => COLORS.success,
                    strokeWidth: 2,
                  },
                ],
                legend: ["Tổng doanh thu", "Đã thanh toán"],
              }}
              width={screenWidth - SPACING.lg * 2}
              height={250}
              chartConfig={{
                backgroundGradientFrom: "#fff",
                backgroundGradientTo: "#fff",
                color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                strokeWidth: 2,
                decimalPlaces: 0,
              }}
              style={{ borderRadius: 20 }}
            />
          ) : (
            <Text
              style={{
                textAlign: "center",
                marginTop: 50,
                color: "#777",
              }}
            >
              Không có dữ liệu doanh thu
            </Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}
