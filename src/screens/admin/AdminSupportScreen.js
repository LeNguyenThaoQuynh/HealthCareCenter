import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Platform,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../api/supabase";
import { useNavigation } from "@react-navigation/native";
import { format } from "date-fns";

export default function AdminSupportListScreen() {
  const navigation = useNavigation();
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    loadConversations();
    const convChannel = supabase
      .channel("admin-conversations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_conversations" },
        () => loadConversations()
      )
      .subscribe();

    return () => supabase.removeChannel(convChannel);
  }, []);
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadConversations();
    });

    return unsubscribe;
  }, [navigation]);

  const loadConversations = async () => {
    const { data } = await supabase
      .from("support_conversations")
      .select(
        `
        *,
        user_profiles:user_id(full_name, avatar_url),
        last_message:support_messages!conversation_id (
          content,
          created_at,
          sender_role
        )
        .order(created_at, { ascending: false })
        .limit(1)
      `
      )
      .order("last_message_at", { ascending: false, nullsFirst: false });

    setConversations(data || []);
  };

  const formatLastMessageTime = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return format(date, "HH:mm");
      if (diffDays === 1) return "Hôm qua";
      if (diffDays < 7) return format(date, "EEEE");
      return format(date, "dd/MM");
    } catch {
      return "";
    }
  };

  const renderAvatar = (user) => {
    const name = user?.full_name || "U";
    const initials = name.charAt(0).toUpperCase();

    if (user?.avatar_url) {
      return <Image source={{ uri: user.avatar_url }} style={styles.avatar} />;
    }

    return (
      <View style={[styles.avatar, styles.avatarFallback]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
    );
  };

  const handleSelectConv = (conv) => {
    navigation.navigate("AdminChatDetail", { conversation: conv });
  };

  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="headset-outline" size={28} color="#fff" />
          <Text style={styles.headerTitle}>Hỗ trợ khách hàng</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <SafeAreaView style={styles.contentContainer}>
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={64}
                color="#CBD5E1"
              />
              <Text style={styles.emptyTitle}>Chưa có cuộc trò chuyện nào</Text>
              <Text style={styles.emptySubtitle}>
                Khi khách hàng gửi tin nhắn, họ sẽ xuất hiện ở đây
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const lastMsg = item.last_message?.[0];
            const isWaiting = item.status === "waiting_admin";

            return (
              <TouchableOpacity
                style={styles.convItem}
                onPress={() => handleSelectConv(item)}
              >
                <View style={styles.convRow}>
                  {renderAvatar(item.user_profiles)}

                  <View style={styles.convInfo}>
                    <View style={styles.convHeaderRow}>
                      <Text style={styles.convName} numberOfLines={1}>
                        {item.user_profiles?.full_name || "Người dùng"}
                      </Text>
                      <Text style={styles.convTime}>
                        {lastMsg
                          ? formatLastMessageTime(lastMsg.created_at)
                          : formatLastMessageTime(item.created_at)}
                      </Text>
                    </View>

                    <View style={styles.convPreviewRow}>
                      <Text style={styles.convPreview} numberOfLines={1}>
                        {lastMsg
                          ? lastMsg.sender_role === "admin"
                            ? "Bạn: " + lastMsg.content
                            : lastMsg.content
                          : "Bắt đầu cuộc trò chuyện mới"}
                      </Text>
                      {isWaiting && <View style={styles.badgeNew} />}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
  },

  contentContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  convItem: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  convRow: {
    flexDirection: "row",
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarFallback: {
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  convInfo: {
    flex: 1,
    justifyContent: "center",
  },
  convHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  convName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1E293B",
    flex: 1,
  },
  convTime: {
    fontSize: 13,
    color: "#64748B",
  },
  convPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  convPreview: {
    fontSize: 15,
    color: "#64748B",
    flex: 1,
  },
  badgeNew: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#EF4444",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
  },
});
