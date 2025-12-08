import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  StatusBar,
  Platform,
  Animated,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../api/supabase";
import theme from "../../theme/theme";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

const fadeAnim = new Animated.Value(0);
const scaleAnim = new Animated.Value(0.92);

export default function ManageServicesScreen() {
  const { COLORS } = theme;
  const navigation = useNavigation();
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadServices = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("services")
      .select("*")
      .order("created_at", { ascending: false });

    setServices(data || []);
    setLoading(false);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useFocusEffect(
    React.useCallback(() => {
      loadServices();
    }, [])
  );

  const filtered = services.filter((s) =>
    [s.name, s.department, s.code].some((f) =>
      f?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const toggle = (id, active) =>
    supabase
      .from("services")
      .update({ is_active: !active })
      .eq("id", id)
      .then(loadServices);

  const remove = (id, name) => {
    Alert.alert("Xóa dịch vụ", `Xác nhận xóa "${name}"?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () =>
          supabase.from("services").delete().eq("id", id).then(loadServices),
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#eef2f7" }}>
      <StatusBar barStyle="dark-content" />

      <LinearGradient
        colors={["#4c9aff", "#2474ff"]}
        style={{
          paddingTop: Platform.OS === "ios" ? 55 : 35,
          paddingBottom: 30,
          paddingHorizontal: 26,
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
          shadowColor: "#2474ff",
          shadowOpacity: 0.25,
          shadowOffset: { width: 0, height: 6 },
          shadowRadius: 20,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={20}>
            <Ionicons name="chevron-back" size={30} color="#FFF" />
          </TouchableOpacity>

          <Text style={{ color: "#FFF", fontSize: 28, fontWeight: "800" }}>
            Dịch vụ
          </Text>

          <TouchableOpacity
            onPress={() => navigation.navigate("CreateService")}
          >
            <Ionicons name="add-circle" size={36} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View
          style={{
            marginTop: 22,
            backgroundColor: "rgba(255,255,255,0.25)",
            borderRadius: 18,
            paddingHorizontal: 16,
            height: 54,
            flexDirection: "row",
            alignItems: "center",
            backdropFilter: "blur(18px)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.4)",
          }}
        >
          <Ionicons name="search" size={22} color="#fff" />

          <TextInput
            placeholder="Tìm dịch vụ..."
            placeholderTextColor="#f1f5f9"
            style={{
              flex: 1,
              marginLeft: 12,
              color: "#fff",
              fontSize: 16,
              fontWeight: "500",
            }}
            value={search}
            onChangeText={setSearch}
          />

          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={22} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 60 }}
      >
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#2474ff"
            style={{ marginTop: 90 }}
          />
        ) : filtered.length === 0 ? (
          <View style={{ marginTop: 120, alignItems: "center" }}>
            <Ionicons name="heart-dislike-outline" size={90} color="#b0b8c2" />
            <Text
              style={{
                marginTop: 14,
                color: "#6b7280",
                fontSize: 17,
                fontWeight: "600",
              }}
            >
              Không có dịch vụ phù hợp
            </Text>
          </View>
        ) : (
          <Animated.View
            style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}
          >
            {filtered.map((item) => (
              <View
                key={item.id}
                style={{
                  marginHorizontal: 22,
                  marginBottom: 22,
                  backgroundColor: "#ffffff",
                  borderRadius: 22,
                  padding: 18,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  shadowColor: "#000",
                  shadowOpacity: 0.12,
                  shadowRadius: 18,
                  shadowOffset: { width: 0, height: 5 },
                  elevation: 6,
                  borderLeftWidth: 7,
                  borderLeftColor: item.is_active ? "#4ade80" : "#94a3b8",
                }}
              >
                <View style={{ flex: 1, paddingRight: 16 }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "700",
                      color: "#1e293b",
                    }}
                  >
                    {item.name}
                  </Text>

                  <Text
                    style={{
                      color: "#64748b",
                      marginTop: 4,
                      fontWeight: "500",
                    }}
                  >
                    {item.department || "Chưa xác định"}
                    {item.code ? `  •  ${item.code}` : ""}
                  </Text>

                  <Text
                    style={{
                      marginTop: 10,
                      fontSize: 20,
                      fontWeight: "800",
                      color: "#2474ff",
                    }}
                  >
                    {Number(item.price).toLocaleString("vi-VN")}đ
                  </Text>
                </View>

                <View
                  style={{
                    justifyContent: "center",
                    alignItems: "flex-end",
                    gap: 10,
                  }}
                >
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("EditService", { serviceId: item.id })
                    }
                    style={{
                      padding: 10,
                      backgroundColor: "#edf2ff",
                      borderRadius: 14,
                    }}
                  >
                    <Ionicons name="create-outline" size={22} color="#2474ff" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => toggle(item.id, item.is_active)}
                    style={{
                      padding: 10,
                      backgroundColor: item.is_active ? "#e9fcef" : "#f3f4f6",
                      borderRadius: 14,
                    }}
                  >
                    <Ionicons
                      name={item.is_active ? "eye-outline" : "eye-off-outline"}
                      size={22}
                      color={item.is_active ? "#22c55e" : "#9ca3af"}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => remove(item.id, item.name)}
                    style={{
                      padding: 10,
                      backgroundColor: "#feecec",
                      borderRadius: 14,
                    }}
                  >
                    <Ionicons name="trash-outline" size={22} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
