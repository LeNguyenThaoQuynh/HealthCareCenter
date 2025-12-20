import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../api/supabase";
import { useRoute, useNavigation } from "@react-navigation/native";
import { format } from "date-fns";

export default function AdminChatDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { conversation } = route.params;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const flatListRef = useRef(null);

  const loadMessages = async () => {
    const { data } = await supabase
      .from("support_messages")
      .select("*")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true });

    setMessages(data || []);
  };

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel(`admin-conv-${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [conversation.id]);

  const scrollToBottom = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userInput = input.trim();

    const tempMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: conversation.id,
      sender_role: "admin",
      content: userInput,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMessage]);
    setInput("");

    const { data, error } = await supabase
      .from("support_messages")
      .insert({
        conversation_id: conversation.id,
        sender_role: "admin",
        content: userInput,
      })
      .select()
      .single();

    if (!error && data) {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempMessage.id ? data : msg))
      );

      await supabase
        .from("support_conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversation.id);
    }
  };

  const formatTime = (dateString) => {
    try {
      return format(new Date(dateString), "HH:mm");
    } catch {
      return "";
    }
  };

  const renderAvatar = () => {
    const user = conversation.user_profiles;
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

  return (
    <>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          {renderAvatar()}
          <View>
            <Text style={styles.headerTitle}>
              {conversation.user_profiles?.full_name || "Người dùng"}
            </Text>
            <Text style={styles.headerSubtitle}>Đang hoạt động</Text>
          </View>
        </View>

        <TouchableOpacity onPress={loadMessages}>
          <Ionicons name="refresh" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <SafeAreaView style={styles.contentContainer}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
            onContentSizeChange={scrollToBottom}
            renderItem={({ item }) => {
              const isAdmin = item.sender_role === "admin";
              const isBot = item.sender_role === "bot";

              return (
                <View
                  style={[
                    styles.msgContainer,
                    isAdmin ? styles.msgRight : styles.msgLeft,
                  ]}
                >
                  <View
                    style={[
                      styles.msgBubble,
                      isAdmin
                        ? styles.msgAdmin
                        : isBot
                        ? styles.msgBot
                        : styles.msgUser,
                    ]}
                  >
                    <Text
                      style={[styles.msgText, isAdmin && { color: "#fff" }]}
                    >
                      {item.content}
                    </Text>
                    <Text
                      style={[styles.msgTime, isAdmin && { color: "#E0E7FF" }]}
                    >
                      {formatTime(item.created_at)}
                    </Text>
                  </View>
                </View>
              );
            }}
          />

          {/* INPUT */}
          <View style={styles.inputRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Nhập tin nhắn..."
              style={styles.input}
              multiline
              returnKeyType="send"
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={!input.trim()}
              style={[
                styles.sendButton,
                !input.trim() && styles.sendButtonDisabled,
              ]}
            >
              <Ionicons
                name="send"
                size={24}
                color={input.trim() ? "#fff" : "#94A3B8"}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    gap: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: {
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  headerSubtitle: { color: "#DBEAFE", fontSize: 14 },

  contentContainer: { flex: 1, backgroundColor: "#F8FAFC" },

  msgContainer: { marginVertical: 8, maxWidth: "80%" },
  msgLeft: { alignSelf: "flex-start" },
  msgRight: { alignSelf: "flex-end" },
  msgBubble: { padding: 12, borderRadius: 18 },
  msgUser: { backgroundColor: "#E2E8F0", borderBottomLeftRadius: 4 },
  msgBot: { backgroundColor: "#F1F5F9", borderBottomLeftRadius: 4 },
  msgAdmin: { backgroundColor: "#2563EB", borderBottomRightRadius: 4 },
  msgText: { fontSize: 15.5, color: "#1E293B", lineHeight: 22 },
  msgTime: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
    alignSelf: "flex-end",
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 120,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: { backgroundColor: "#E2E8F0" },
});
