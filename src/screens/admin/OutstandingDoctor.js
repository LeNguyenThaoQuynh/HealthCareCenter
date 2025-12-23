import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Platform,
  TouchableOpacity,
  Image,
} from "react-native";
import { supabase } from "../../api/supabase";
import theme from "../../theme/theme";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const { COLORS, SPACING, SHADOWS } = theme;
const { width } = Dimensions.get("window");

export default function TopDoctorsScreen() {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("top");
  const [topDoctors, setTopDoctors] = useState([]);
  const [ratingDoctors, setRatingDoctors] = useState([]);

  const loadTopDoctors = async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
        doctor_id,
        doctor:doctors!inner (
          id,
          name,
          avatar_url,
          department_name
        )
      `
      )
      .in("status", ["confirmed", "completed", "paid", "waiting_results"]);

    if (error) {
      console.error("❌ loadTopDoctors:", error);
      return [];
    }

    const stats = {};

    data.forEach((appt) => {
      const doc = appt.doctor;
      if (!doc) return;

      if (!stats[doc.id]) {
        stats[doc.id] = {
          id: doc.id,
          name: doc.name,
          avatar_url: doc.avatar_url,
          department_name: doc.department_name,
          bookings: 0,
        };
      }
      stats[doc.id].bookings += 1;
    });

    return Object.values(stats)
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 20);
  };

  const loadRatingDoctors = async () => {
    const { data, error } = await supabase
      .from("doctor_average_ratings")
      .select(
        `
        doctor_id,
        rating_count,
        average_rating,
        doctor:doctors!inner (
          id,
          name,
          avatar_url,
          department_name
        )
      `
      )
      .order("average_rating", { ascending: false })
      .limit(20);

    if (error) {
      console.error("❌ loadRatingDoctors:", error);
      return [];
    }

    return data.map((row) => ({
      id: row.doctor.id,
      name: row.doctor.name,
      avatar_url: row.doctor.avatar_url,
      department_name: row.doctor.department_name,
      count: row.rating_count,
      avg: row.average_rating,
    }));
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [top, rating] = await Promise.all([
        loadTopDoctors(),
        loadRatingDoctors(),
      ]);
      setTopDoctors(top);
      setRatingDoctors(rating);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const RankBadge = ({ rank }) => {
    const colors = ["#FFD700", "#C0C0C0", "#CD7F32"];
    const bg = rank <= 3 ? colors[rank - 1] : COLORS.primary;
    const isTopThree = rank <= 3;
    
    return (
      <LinearGradient
        colors={isTopThree 
          ? [bg, bg] 
          : ["#4f46e5", "#7c3aed"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.rankBadge,
          isTopThree && styles.topThreeBadge
        ]}
      >
        {isTopThree ? (
          <Ionicons 
            name={rank === 1 ? "trophy" : rank === 2 ? "medal" : "ribbon"} 
            size={18} 
            color="#FFF" 
          />
        ) : (
          <Text style={styles.rankText}>{rank}</Text>
        )}
      </LinearGradient>
    );
  };

  const DoctorCard = ({ item, index }) => {
    const isTop = activeTab === "top";
    const rank = index + 1;
    const isTopThree = rank <= 3;

    return (
      <TouchableOpacity 
        activeOpacity={0.8}
        style={[
          styles.card,
          isTopThree && styles.topThreeCard,
        ]}
      >
        <View style={styles.cardContent}>
          <View style={styles.leftSection}>
            <RankBadge rank={rank} />
            
            <View style={styles.avatarContainer}>
              {item.avatar_url ? (
                <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
              ) : (
                <LinearGradient
                  colors={["#e0e7ff", "#c7d2fe"]}
                  style={styles.avatarFallback}
                >
                  <Ionicons name="person" size={22} color="#4f46e5" />
                </LinearGradient>
              )}
              {isTopThree && (
                <View style={[
                  styles.crownContainer,
                  { backgroundColor: rank === 1 ? "#FFD700" : rank === 2 ? "#C0C0C0" : "#CD7F32" }
                ]}>
                  <Ionicons name="star" size={10} color="#FFF" />
                </View>
              )}
            </View>
            
            <View style={styles.infoContainer}>
              <Text style={styles.name}>{item.name}</Text>
              {!!item.department_name && (
                <View style={styles.departmentBadge}>
                  <Ionicons name="business" size={12} color="#4f46e5" />
                  <Text style={styles.departmentText}>{item.department_name}</Text>
                </View>
              )}
              <View style={styles.metricContainer}>
                <Ionicons 
                  name={isTop ? "calendar" : "star"} 
                  size={12} 
                  color="#94a3b8" 
                />
                <Text style={styles.metricText}>
                  {isTop
                    ? `${item.bookings} lượt đặt`
                    : `${item.count} đánh giá`}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.scoreContainer}>
            <LinearGradient
              colors={isTop ? ["#4f46e5", "#7c3aed"] : ["#f59e0b", "#d97706"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.scoreBadge}
            >
              <Text style={styles.scoreText}>
                {isTop ? item.bookings : item.avg?.toFixed(1)}
              </Text>
            </LinearGradient>
            <Text style={styles.scoreLabel}>
              {isTop ? "Lượt đặt" : "Điểm"}
            </Text>
          </View>
        </View>
        
        {isTopThree && (
          <LinearGradient
            colors={["rgba(255,215,0,0.1)", "rgba(255,215,0,0.05)"]}
            style={styles.highlightStrip}
          />
        )}
      </TouchableOpacity>
    );
  };

  const data = activeTab === "top" ? topDoctors : ratingDoctors;

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      {/* StatusBar riêng biệt */}
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />

      {/* HEADER - SÁT TOP HOÀN TOÀN */}
      <LinearGradient 
        colors={["#4f46e5", "#7c3aed"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <View style={styles.titleContainer}>
              <Ionicons name="trophy" size={26} color="#FFD700" style={styles.titleIcon} />
              <Text style={styles.headerTitle}>Bác Sĩ Nổi Bật</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              Top {data.length} bác sĩ {activeTab === "top" ? "được đặt lịch nhiều nhất" : "có đánh giá cao nhất"}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={loadAll}
            style={styles.refreshButton}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
        
        {/* TAB SWITCHER */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "top" && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab("top")}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={activeTab === "top" ? ["#818cf8", "#6366f1"] : ["transparent", "transparent"]}
              style={styles.tabButtonInner}
            >
              <Ionicons
                name="trending-up"
                size={20}
                color={activeTab === "top" ? "#FFF" : "#c7d2fe"}
              />
              <Text style={[
                styles.tabButtonText,
                activeTab === "top" && styles.tabButtonTextActive,
              ]}>
                Top Đặt Lịch
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "rating" && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab("rating")}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={activeTab === "rating" ? ["#fbbf24", "#f59e0b"] : ["transparent", "transparent"]}
              style={styles.tabButtonInner}
            >
              <Ionicons
                name="star"
                size={20}
                color={activeTab === "rating" ? "#FFF" : "#fed7aa"}
              />
              <Text style={[
                styles.tabButtonText,
                activeTab === "rating" && styles.tabButtonTextActive,
              ]}>
                Top Đánh Giá
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* CONTENT - CÓ PADDING TOP 60 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Đang phân tích dữ liệu...</Text>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={["#e0e7ff", "#c7d2fe"]}
            style={styles.emptyIconContainer}
          >
            <Ionicons name="stats-chart" size={64} color="#4f46e5" />
          </LinearGradient>
          <Text style={styles.emptyTitle}>
            {activeTab === "top"
              ? "Chưa có lượt đặt lịch nào"
              : "Chưa có đánh giá nào"}
          </Text>
          <Text style={styles.emptySubtitle}>
            Dữ liệu sẽ hiển thị sau khi có hoạt động
          </Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* TOP 3 SECTION */}
          {data.slice(0, 3).length > 0 && (
            <View style={styles.topThreeSection}>
              <Text style={styles.sectionTitle}>Top 3 Bác Sĩ</Text>
              <View style={styles.topThreeGrid}>
                {data.slice(0, 3).map((item, index) => (
                  <DoctorCard key={item.id} item={item} index={index} />
                ))}
              </View>
            </View>
          )}

          {/* REST OF THE LIST */}
          {data.slice(3).length > 0 && (
            <View style={styles.restSection}>
              <Text style={styles.sectionTitle}>Danh sách bác sĩ</Text>
              {data.slice(3).map((item, index) => (
                <DoctorCard 
                  key={item.id} 
                  item={item} 
                  index={index + 3} 
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* STATS SUMMARY */}
      {!loading && data.length > 0 && (
        <View style={styles.statsFooter}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={20} color="#4f46e5" />
            <Text style={styles.statNumber}>{data.length}</Text>
            <Text style={styles.statLabel}>Bác sĩ</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons 
              name={activeTab === "top" ? "calendar" : "star"} 
              size={20} 
              color="#4f46e5" 
            />
            <Text style={styles.statNumber}>
              {activeTab === "top" 
                ? data.reduce((sum, doc) => sum + doc.bookings, 0)
                : data.reduce((sum, doc) => sum + doc.count, 0)
              }
            </Text>
            <Text style={styles.statLabel}>
              {activeTab === "top" ? "Tổng lượt đặt" : "Tổng đánh giá"}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

/* ================= STYLES ================= */
const styles = {
  // ✅ HEADER SÁT TOP HOÀN TOÀN
  header: {
    paddingTop: 60, // Cực nhỏ để header sát top
    paddingBottom: 20,
    paddingHorizontal: 0,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 4 : 2,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerCenter: {
    alignItems: "center",
    flex: 1,
    marginHorizontal: 12,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titleIcon: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 4,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  tabSwitcher: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  tabButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  tabButtonInner: {
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#c7d2fe",
    marginTop: 4,
  },
  tabButtonTextActive: {
    color: "#FFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: "#64748b",
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },
  scrollContent: {
    paddingTop: 60, // ✅ PADDING TOP 60 CHO CONTENT
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  topThreeSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 16,
    marginLeft: 4,
  },
  topThreeGrid: {
    gap: 12,
  },
  restSection: {
    gap: 12,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    overflow: "hidden",
  },
  topThreeCard: {
    shadowColor: "#FFD700",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
    borderColor: "rgba(255, 215, 0, 0.2)",
  },
  cardContent: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  topThreeBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  rankText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "800",
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  crownContainer: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  departmentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(79, 70, 229, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    gap: 4,
    marginBottom: 6,
  },
  departmentText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4f46e5",
  },
  metricContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metricText: {
    fontSize: 12,
    color: "#64748b",
  },
  scoreContainer: {
    alignItems: "center",
    marginLeft: 12,
  },
  scoreBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
  },
  scoreLabel: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
    marginTop: 4,
  },
  highlightStrip: {
    height: 4,
    width: "100%",
  },
  statsFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1e293b",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#e2e8f0",
  },
};