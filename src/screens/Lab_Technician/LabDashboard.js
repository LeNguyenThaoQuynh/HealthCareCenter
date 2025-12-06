import React from "react";
import { View, Text, TouchableOpacity, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../api/supabase";
import theme from "../../theme/theme";

export default function LabDashboard({ navigation }) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.COLORS.surfaceSoft }}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      <LinearGradient
        colors={["#2563EB", "#3B82F6"]}
        style={{
          paddingTop: theme.statusBarHeight,
          paddingHorizontal: theme.SPACING.lg,
          paddingBottom: theme.SPACING.xl,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>

        <Text
          style={{
            fontSize: theme.FONT_SIZE.header,
            fontWeight: theme.FONT_WEIGHT.bold,
            color: "#fff",
          }}
        >
          Phòng Xét Nghiệm
        </Text>

        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={{ padding: theme.SPACING.lg }}>
        <TouchableOpacity
          onPress={() => navigation.navigate("LabPendingTests")}
          style={{
            backgroundColor: theme.COLORS.surface,
            padding: theme.SPACING.xl,
            borderRadius: theme.BORDER_RADIUS.xl,
            marginBottom: theme.SPACING.lg,
            flexDirection: "row",
            alignItems: "center",
            ...theme.SHADOWS.floating,
          }}
        >
          <Ionicons
            name="flask"
            size={40}
            color={theme.COLORS.success}
            style={{ marginRight: theme.SPACING.lg }}
          />
          <View>
            <Text
              style={{
                fontSize: theme.FONT_SIZE.xl,
                fontWeight: theme.FONT_WEIGHT.bold,
                color: theme.COLORS.textPrimary,
              }}
            >
              Xét nghiệm cần làm
            </Text>
            <Text style={{ color: theme.COLORS.textSecondary }}>
              Nhấn để nhập kết quả
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("LabHistory")}
          style={{
            backgroundColor: theme.COLORS.surface,
            padding: theme.SPACING.xl,
            borderRadius: theme.BORDER_RADIUS.xl,
            flexDirection: "row",
            alignItems: "center",
            ...theme.SHADOWS.floating,
          }}
        >
          <Ionicons
            name="document-text"
            size={40}
            color={theme.COLORS.accentBlue}
            style={{ marginRight: theme.SPACING.lg }}
          />
          <View>
            <Text
              style={{
                fontSize: theme.FONT_SIZE.xl,
                fontWeight: theme.FONT_WEIGHT.bold,
                color: theme.COLORS.textPrimary,
              }}
            >
              Lịch sử kết quả
            </Text>
            <Text style={{ color: theme.COLORS.textSecondary }}>
              Xem lại kết quả đã nhập
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
