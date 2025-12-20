import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../api/supabase";
import { useNavigation } from "@react-navigation/native";
import { format } from "date-fns";

export default function HelpScreen() {
  const navigation = useNavigation();

  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: convo } = await supabase
      .from("support_conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let cid = convo?.id;
    if (!cid) {
      const { data: newConvo } = await supabase
        .from("support_conversations")
        .insert({ user_id: user.id })
        .select()
        .single();
      cid = newConvo.id;

      await insertBotMessage(
        cid,
        "👋 Chào bạn! Hãy chọn câu hỏi bên dưới hoặc nhập nội dung bạn cần hỗ trợ."
      );
      await updateLastMessageAt(cid);
    }

    setConversationId(cid);

    await loadMessages();

    const { data: faqData } = await supabase
      .from("support_faq")
      .select("*")
      .eq("is_active", true)
      .order("id");

    setFaqs(faqData || []);
    setLoading(false);
  };

  const loadMessages = async () => {
    if (!conversationId) return;

    const { data } = await supabase
      .from("support_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    setMessages(data || []);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (conversationId) {
        loadMessages();
      }
    });

    return unsubscribe;
  }, [navigation, conversationId]);

  const insertBotMessage = async (cid, text) => {
    await supabase.from("support_messages").insert({
      conversation_id: cid,
      sender_role: "bot",
      content: text,
    });
  };

  const updateLastMessageAt = async (cid) => {
    await supabase
      .from("support_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", cid);
  };

  const scrollToBottom = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text) => {
    if (!text.trim()) return;

    const userInput = text.trim();

    const tempUserMessage = {
      id: `temp-${Date.now()}`,
      sender_role: "user",
      content: userInput,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMessage]);
    setInput("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("support_messages").insert({
      conversation_id: conversationId,
      sender_id: user?.id,
      sender_role: "user",
      content: userInput,
    });

    await updateLastMessageAt(conversationId);

    const matched = faqs.find((f) =>
      f.keywords?.some((k) => userInput.toLowerCase().includes(k.toLowerCase()))
    );

    if (matched) {
      const botReply = matched.answer;
      setMessages((prev) => [
        ...prev,
        {
          id: `temp-bot-${Date.now()}`,
          sender_role: "bot",
          content: botReply,
          created_at: new Date().toISOString(),
        },
      ]);
      await insertBotMessage(conversationId, botReply);
      await updateLastMessageAt(conversationId);
    } else {
      const fallback =
        "🤖 Mình chưa hiểu câu hỏi này. Hỗ trợ viên sẽ phản hồi ngay.";
      setMessages((prev) => [
        ...prev,
        {
          id: `temp-bot-${Date.now()}`,
          sender_role: "bot",
          content: fallback,
          created_at: new Date().toISOString(),
        },
      ]);
      await insertBotMessage(conversationId, fallback);
      await updateLastMessageAt(conversationId);

      await supabase
        .from("support_conversations")
        .update({ status: "waiting_admin" })
        .eq("id", conversationId);
    }
  };

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (!payload.new.id?.toString().startsWith("temp")) {
            setMessages((prev) => [...prev, payload.new]);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [conversationId]);

  const formatTime = (dateString) => {
    try {
      return format(new Date(dateString), "HH:mm");
    } catch {
      return "";
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient colors={["#2563EB", "#1E40AF"]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Ionicons name="headset-outline" size={28} color="#fff" />
          <Text style={styles.headerTitle}>Hỗ trợ</Text>
        </View>

        <TouchableOpacity onPress={loadMessages}>
          <Ionicons name="refresh" size={26} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {faqs.length > 0 && (
        <View style={styles.faqBox}>
          <Text style={styles.faqTitle}>Câu hỏi thường gặp</Text>
          <FlatList
            data={faqs}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(i) => i.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.faqItem}
                onPress={() => handleSend(item.question)}
              >
                <Text style={styles.faqText}>{item.question}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
        onContentSizeChange={scrollToBottom}
        renderItem={({ item }) => {
          const isUser = item.sender_role === "user";

          return (
            <View
              style={[
                styles.msgContainer,
                isUser ? styles.msgRight : styles.msgLeft,
              ]}
            >
              <View
                style={[
                  styles.msgBubble,
                  isUser ? styles.msgUser : styles.msgBot,
                ]}
              >
                <Text style={[styles.msgText, isUser && { color: "#fff" }]}>
                  {item.content}
                </Text>
                <Text style={[styles.msgTime, isUser && { color: "#BFDBFE" }]}>
                  {formatTime(item.created_at)}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Nhập câu hỏi của bạn..."
          value={input}
          onChangeText={setInput}
          returnKeyType="send"
          onSubmitEditing={() => handleSend(input)}
        />
        <TouchableOpacity
          onPress={() => handleSend(input)}
          disabled={!input.trim()}
        >
          <Ionicons
            name="send"
            size={26}
            color={input.trim() ? "#2563EB" : "#94A3B8"}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 16,
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },

  faqBox: { paddingVertical: 12, paddingHorizontal: 16 },
  faqTitle: {
    fontWeight: "700",
    marginBottom: 10,
    color: "#334155",
    fontSize: 16,
  },
  faqItem: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 12,
  },
  faqText: { color: "#1E40AF", fontWeight: "600", fontSize: 14 },

  msgContainer: {
    marginVertical: 8,
    maxWidth: "80%",
  },
  msgLeft: { alignSelf: "flex-start" },
  msgRight: { alignSelf: "flex-end" },
  msgBubble: {
    padding: 12,
    borderRadius: 18,
  },
  msgUser: {
    backgroundColor: "#2563EB",
    borderBottomRightRadius: 4,
  },
  msgBot: {
    backgroundColor: "#E5E7EB",
    borderBottomLeftRadius: 4,
  },
  msgText: {
    fontSize: 15.5,
    color: "#111827",
    lineHeight: 22,
  },
  msgTime: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
    alignSelf: "flex-end",
  },

  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F1F5F9",
    borderRadius: 24,
    fontSize: 16,
  },
});
