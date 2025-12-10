import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  SectionList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../../api/supabase";
import theme from "../../../theme/theme";

const { SPACING } = theme;

const DEPARTMENT_COLORS = {
  "Nội khoa": "#DBEAFE",
  "Ngoại khoa": "#FEE2E2",
  "Sản phụ khoa": "#FDE8F5",
  "Nhi khoa": "#D1FAE5",
  "Xét nghiệm": "#E0E7FF",
  "Chẩn đoán hình ảnh": "#FEF3C7",
  "Khám chuyên khoa": "#E0F2FE",
  "Tim mạch": "#FCE7F3",
  "Tai mũi họng": "#E0E7FF",
  "Da liễu": "#F3E8FF",
  "Răng hàm mặt": "#ECFDF5",
  "Cơ xương khớp": "#EFF6FF",
  Khác: "#F3F4F6",
};

export default function PriceListScreen({ navigation }) {
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, [search]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("services")
        .select("id, department, name, price, code")
        .eq("is_active", true)
        .order("department")
        .order("name");

      if (search.trim()) {
        query = query.ilike("search_text", `%${search.trim().toLowerCase()}%`);
      }

      const { data: services, error } = await query;
      if (error) throw error;

      const grouped = {};
      services.forEach((s) => {
        const key = s.department || "Khác";
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(s);
      });

      const sections = Object.keys(grouped)
        .sort()
        .map((dept) => ({
          title: dept,
          color: DEPARTMENT_COLORS[dept] || "#F3F4F6",
          data: grouped[dept],
        }));

      setData(sections);
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (!price || price == 0) return "Liên hệ";
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#2563EB", "#3B82F6"]} style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Bảng giá dịch vụ</Text>
        <View style={{ width: 48 }} />
      </LinearGradient>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={24} color="#64748B" />
        <TextInput
          placeholder="Tìm tên, mã dịch vụ..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={24} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <SectionList
          sections={data}
          keyExtractor={(item) => item.id.toString()}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 180 }}
          renderSectionHeader={({ section }) => (
            <View
              style={[styles.sectionHeader, { backgroundColor: section.color }]}
            >
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionCount}>
                {section.data.length} dịch vụ
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.code && (
                  <Text style={styles.itemCode}>Mã: {item.code}</Text>
                )}
              </View>
              <Text style={styles.price}>{formatPrice(item.price)}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-off" size={80} color="#E2E8F0" />
              <Text style={styles.emptyText}>
                {search ? "Không tìm thấy dịch vụ" : "Chưa có dữ liệu"}
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.hotline}
        onPress={() => Linking.openURL("tel:0854776885")}
      >
        <LinearGradient
          colors={["#10B981", "#059669"]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.hotlineContent}>
          <Ionicons name="call" size={32} color="#FFF" />
          <View style={{ marginLeft: 16 }}>
            <Text style={styles.hotlineLabel}>Tư vấn bảng giá 24/7</Text>
            <Text style={styles.hotlineNumber}>0854 776 885</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    paddingTop: 60,
    paddingBottom: 36,
    paddingHorizontal: SPACING.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  backBtn: {
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
  },
  title: { fontSize: 27, fontWeight: "900", color: "#FFF" },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginHorizontal: SPACING.xl,
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 32,
    elevation: 10,
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 17, color: "#1e293b" },

  sectionHeader: {
    marginHorizontal: SPACING.xl,
    marginTop: 28,
    marginBottom: 12,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#1e293b" },
  sectionCount: { fontSize: 15, color: "#64748b" },

  itemCard: {
    backgroundColor: "#FFF",
    marginHorizontal: SPACING.xl,
    marginBottom: 12,
    padding: 22,
    borderRadius: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 8,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16.5, fontWeight: "700", color: "#1e293b" },
  itemCode: { fontSize: 13.5, color: "#64748b", marginTop: 4 },
  price: { fontSize: 18, fontWeight: "900", color: "#dc2626" },

  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { marginTop: 20, fontSize: 18, color: "#94a3b8" },

  hotline: {
    position: "absolute",
    bottom: 32,
    left: SPACING.xl,
    right: SPACING.xl,
    height: 88,
    borderRadius: 40,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 28,
    elevation: 20,
  },
  hotlineContent: { flexDirection: "row", alignItems: "center" },
  hotlineLabel: { color: "#D1FAE5", fontSize: 14 },
  hotlineNumber: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 4,
  },
});
