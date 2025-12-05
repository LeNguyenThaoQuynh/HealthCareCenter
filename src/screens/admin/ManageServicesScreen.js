import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../api/supabase";
import theme from "../../theme/theme";
import { useNavigation } from "@react-navigation/native";

const { COLORS, SPACING, BORDER_RADIUS, SHADOWS, GRADIENTS } = theme;

export default function ManageServicesScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");

  const loadServices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setServices(data || []);
    } catch (err) {
      console.log("❌ Error load services:", err);
      Alert.alert("Lỗi", "Không thể tải danh sách dịch vụ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleDelete = (id) => {
    Alert.alert("Xóa dịch vụ", "Bạn có chắc muốn xóa dịch vụ này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("services").delete().eq("id", id);
          if (error) Alert.alert("Lỗi", "Xóa thất bại.");
          else loadServices();
        },
      },
    ]);
  };

  const toggleActive = async (item) => {
    const { error } = await supabase
      .from("services")
      .update({ is_active: !item.is_active })
      .eq("id", item.id);

    if (error) Alert.alert("Lỗi", "Không thể thay đổi trạng thái.");
    else loadServices();
  };

  const filtered = services.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase()) ||
      (s.code && s.code.toLowerCase().includes(search.toLowerCase()))
  );

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
            Quản lý dịch vụ
          </Text>
        </View>
      </LinearGradient>

      <View style={{ paddingHorizontal: SPACING.lg, marginTop: 18 }}>
        <View
          style={{
            backgroundColor: "#FFF",
            borderRadius: 14,
            paddingHorizontal: 14,
            flexDirection: "row",
            alignItems: "center",
            ...SHADOWS.input,
          }}
        >
          <Ionicons name="search-outline" size={20} color="#8A8A8A" />
          <TextInput
            placeholder="Tìm theo tên, khoa, mã..."
            style={{ flex: 1, marginLeft: 8 }}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : filtered.length === 0 ? (
          <Text style={{ textAlign: "center", marginTop: 20, color: "#777" }}>
            Không có dịch vụ nào
          </Text>
        ) : (
          filtered.map((item) => (
            <View
              key={item.id}
              style={{
                backgroundColor: "#FFF",
                padding: 18,
                borderRadius: 20,
                marginBottom: 20,
                ...SHADOWS.card,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 19,
                    fontWeight: "700",
                    color: COLORS.textPrimary,
                    flex: 1,
                  }}
                >
                  {item.name}
                </Text>

                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: 12,
                    backgroundColor: item.is_active
                      ? "rgba(16,185,129,0.15)"
                      : "rgba(239,68,68,0.15)",
                  }}
                >
                  <Text
                    style={{
                      color: item.is_active ? COLORS.success : COLORS.error,
                      fontWeight: "700",
                      fontSize: 12,
                    }}
                  >
                    {item.is_active ? "Hoạt động" : "Không hoạt động"}
                  </Text>
                </View>
              </View>

              <View style={{ marginTop: 4 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <Ionicons name="business-outline" size={18} color="#64748B" />
                  <Text style={{ marginLeft: 6, fontSize: 15, color: "#475569" }}>
                    {item.department}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="pricetag-outline" size={18} color="#64748B" />
                    <Text style={{ marginLeft: 6, fontSize: 15, color: "#475569" }}>
                      {item.code || "Không có mã"}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="cash-outline" size={18} color="#64748B" />
                    <Text
                      style={{
                        marginLeft: 6,
                        fontSize: 17,
                        fontWeight: "700",
                        color: COLORS.primary,
                      }}
                    >
                      {item.price?.toLocaleString()}đ
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 14,
                }}
              >
                <TouchableOpacity
                  onPress={() => toggleActive(item)}
                  style={{
                    flex: 1,
                    paddingVertical: 11,
                    borderRadius: 12,
                    backgroundColor: item.is_active
                      ? COLORS.warning
                      : COLORS.success,
                    marginRight: 10,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#FFF", fontWeight: "700" }}>
                    {item.is_active ? "Tắt" : "Bật"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDelete(item.id)}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    backgroundColor: COLORS.error,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="trash-outline" size={22} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
