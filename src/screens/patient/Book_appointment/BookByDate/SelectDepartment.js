import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Dimensions,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { useCallback } from "react";
import Animated, { FadeInDown, FadeInUp, ZoomIn } from "react-native-reanimated";

import { useBookingFlow } from "../../../../controllers/patient/bookingController";
import {
  COLORS,
  GRADIENTS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  SHADOWS,
} from "../../../../theme/theme";

const { width } = Dimensions.get('window');

export default function SelectDepartment() {
  const navigation = useNavigation();
  const route = useRoute();
  const { date } = route.params || {};

  const { specializations, loadingSpecs, loadSpecializations, selectedDate } =
    useBookingFlow();

  const [search, setSearch] = useState("");

  // Load chuyên khoa khi vào màn hình hoặc quay lại
  useFocusEffect(
    useCallback(() => {
      if (date && (specializations.length === 0 || date !== selectedDate)) {
        loadSpecializations(date);
      }
    }, [date, selectedDate, specializations.length, loadSpecializations])
  );

  // Format ngày hiển thị
  const headerDate = useMemo(() => {
    return new Date(date).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [date]);

  // Tìm kiếm realtime
  const filtered = useMemo(() => {
    if (!search.trim()) return specializations;
    const q = search.toLowerCase();
    return specializations.filter((item) =>
      item.name.toLowerCase().includes(q)
    );
  }, [specializations, search]);

  const renderItem = useCallback(
    ({ item, index }) => (
      <Animated.View entering={FadeInUp.delay(index * 80)}>
        <TouchableOpacity
          style={styles.item}
          onPress={() =>
            navigation.navigate("SelectTimeSlot", {
              date,
              specialization: item.name,
              price: item.price,
            })
          }
          activeOpacity={0.7}
        >
          <View style={styles.itemContent}>
            <LinearGradient
              colors={[COLORS.primary, "#8B5CF6"]}
              style={styles.iconGradient}
            >
              <Ionicons name="medical-outline" size={26} color="#FFF" />
            </LinearGradient>
            
            <View style={styles.textContent}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.statBadge}>
                  <Ionicons name="people-outline" size={14} color="#64748B" />
                  <Text style={styles.statText}>{item.doctorCount} ca</Text>
                </View>
                <View style={styles.divider} />
               
              </View>
            </View>
          </View>
          
          <View style={styles.rightContent}>
            <LinearGradient
              colors={["#10B981", "#0D946E"]}
              style={styles.priceBadge}
            >
              <Text style={styles.price}>
                {(item.price / 1000).toFixed(0)}.000đ
              </Text>
            </LinearGradient>
            <Ionicons name="chevron-forward" size={22} color="#CBD5E1" />
          </View>
        </TouchableOpacity>
      </Animated.View>
    ),
    [navigation, date]
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* HEADER */}
      <LinearGradient 
        colors={[COLORS.primary, "#4F46E5"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Animated.Text entering={FadeInDown} style={styles.title}>
              Chọn Chuyên Khoa
            </Animated.Text>
            <Animated.Text 
              entering={FadeInDown.delay(100)}
              style={styles.date}
            >
              {headerDate}
            </Animated.Text>
          </View>

          <TouchableOpacity 
            style={styles.homeButton}
            onPress={() => navigation.navigate("HomeScreen")}
            activeOpacity={0.8}
          >
            <Ionicons name="home-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* SEARCH BAR */}
      <Animated.View entering={FadeInDown.delay(200)} style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color={COLORS.primary} />
            <TextInput
              placeholder="Tìm chuyên khoa..."
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
              placeholderTextColor="#94A3B8"
            />
            {search.length > 0 && (
              <TouchableOpacity 
                onPress={() => setSearch("")}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.View>

      {/* CONTENT */}
      {loadingSpecs ? (
        <Animated.View entering={ZoomIn} style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách chuyên khoa...</Text>
          <Text style={styles.loadingSubtext}>Vui lòng chờ trong giây lát</Text>
        </Animated.View>
      ) : filtered.length === 0 ? (
        <Animated.View entering={FadeInUp} style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="briefcase-outline" size={80} color="#CBD5E1" />
          </View>
          <Text style={styles.emptyTitle}>
            {search ? "Không tìm thấy chuyên khoa" : "Không có lịch khám"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {search 
              ? "Thử tìm kiếm với từ khóa khác"
              : "Không có lịch khám vào ngày này. Vui lòng chọn ngày khác."
            }
          </Text>
          {search && (
            <TouchableOpacity 
              style={styles.clearFilterButton}
              onPress={() => setSearch("")}
            >
              <LinearGradient
                colors={[COLORS.primary, "#4F46E5"]}
                style={styles.clearFilterGradient}
              >
                <Ionicons name="close-circle-outline" size={20} color="#FFF" />
                <Text style={styles.clearFilterText}>Xóa bộ lọc tìm kiếm</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </Animated.View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item) => item.name}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Animated.View entering={FadeInDown} style={styles.listHeader}>
              <Text style={styles.listHeaderTitle}>
                Có {filtered.length} chuyên khoa có lịch
              </Text>
              <Text style={styles.listHeaderSubtitle}>
                Chọn chuyên khoa để xem khung giờ khám
              </Text>
            </Animated.View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 0.5,
  },
  date: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 4,
    textAlign: "center",
  },
  homeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  searchWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 20,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  clearButton: {
    padding: 4,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 20,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  textContent: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: "#E2E8F0",
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  priceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 100,
    alignItems: "center",
  },
  price: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
  },
  list: {
    paddingTop: 10,
    paddingBottom: 100,
  },
  listHeader: {
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 10,
  },
  listHeaderTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  listHeaderSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 25,
  },
  clearFilterButton: {
    width: '80%',
  },
  clearFilterGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 10,
  },
  clearFilterText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});