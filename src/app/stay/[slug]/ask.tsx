import { useLocalSearchParams, router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LineIcon, PressableFeedback } from "@/components/roam-ui";
import { useStay } from "@/hooks/use-stay";
import { posthog } from "@/lib/posthog";
import {
  answerFor,
  matchTopics,
  TOPICS,
  type AnswerCardData,
  type TopicDefinition,
} from "@/lib/ask";

interface ChatMessage {
  id: string;
  from: "roam" | "guest" | "reply";
  text?: string;
  cards?: AnswerCardData[];
}

export default function AskStayScreen() {
  const params = useLocalSearchParams<{ slug: string; q?: string }>();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const initialQuestion = typeof params.q === "string" ? params.q : "";
  const insets = useSafeAreaInsets();

  const { stay, loading } = useStay(slug);
  const [inputText, setInputText] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);

  // Initial welcome message + optional initial question
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const initialList: ChatMessage[] = [
      {
        id: "m-welcome",
        from: "roam",
        text: "Ask about check-in, pets, cancellation and more. Answers come word for word from this stay's details and Roam's policies.",
      },
    ];
    if (initialQuestion) {
      initialList.push({
        id: "m-initial-guest",
        from: "guest",
        text: initialQuestion,
      });
      const matched = matchTopics(initialQuestion);
      const cards = answerFor(stay, matched);
      initialList.push({
        id: "m-initial-reply",
        from: "reply",
        cards,
      });
    }
    return initialList;
  });

  const handleSend = useCallback(
    (questionText: string, from: "chip" | "typed") => {
      const trimmed = questionText.trim();
      if (!trimmed) return;

      const guestMsgId = `guest-${Date.now()}`;
      const guestMsg: ChatMessage = {
        id: guestMsgId,
        from: "guest",
        text: trimmed,
      };

      const matchedTopicKeys = matchTopics(trimmed);
      const answerCards = answerFor(stay, matchedTopicKeys);

      const replyMsgId = `reply-${Date.now() + 1}`;
      const replyMsg: ChatMessage = {
        id: replyMsgId,
        from: "reply",
        cards: answerCards,
      };

      setMessages((prev) => [...prev, guestMsg, replyMsg]);
      setInputText("");

      posthog?.capture("stay_ask_sent", {
        slug,
        from,
        topics: matchedTopicKeys,
        answered: answerCards[0]?.key !== "no-answer",
      });

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    [stay, slug],
  );

  useEffect(() => {
    posthog?.capture("stay_ask_opened", { slug });
  }, [slug]);

  const handleTopicChipPress = (topic: TopicDefinition) => {
    handleSend(topic.question, "chip");
  };

  const handleLinkPress = (link?: AnswerCardData["link"]) => {
    if (!link) return;
    router.back();
  };

  const isSendDisabled = !inputText.trim();
  const stayTitle = stay?.title || (loading ? "Loading stay..." : "Stay details");

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Screen Header */}
      <View style={styles.header}>
        <PressableFeedback
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <LineIcon color="#111116" name="chevron-left" size={22} strokeWidth={2.4} />
        </PressableFeedback>

        <View style={styles.headerTitleCol}>
          <Text numberOfLines={1} style={styles.headerTitle}>
            Ask about this stay
          </Text>
          <Text numberOfLines={1} style={styles.headerSubtitle}>
            {stayTitle}
          </Text>
        </View>
      </View>

      {/* Keyboard Avoiding Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        style={styles.keyboardView}
      >
        {/* Messages List */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => {
            if (msg.from === "roam") {
              return (
                <View key={msg.id} style={styles.roamBubble}>
                  <Text style={styles.roamBubbleText}>{msg.text}</Text>
                </View>
              );
            }

            if (msg.from === "guest") {
              return (
                <View key={msg.id} style={styles.guestBubble}>
                  <Text style={styles.guestBubbleText}>{msg.text}</Text>
                </View>
              );
            }

            if (msg.from === "reply" && msg.cards) {
              return (
                <View key={msg.id} style={styles.replyCardsContainer}>
                  {msg.cards.map((card) => {
                    const isNoAnswer = card.key === "no-answer";
                    return (
                      <View
                        key={card.key}
                        style={[
                          styles.answerCard,
                          isNoAnswer && styles.answerCardNoAnswer,
                        ]}
                      >
                        {/* Source Label Row */}
                        {card.source && (
                          <View style={styles.sourceRow}>
                            <LineIcon
                              color="#693BFF"
                              name={card.source.icon === "home" ? "home" : "policy"}
                              size={15}
                              strokeWidth={2.2}
                            />
                            <Text style={styles.sourceLabel}>
                              {card.source.label}
                            </Text>
                          </View>
                        )}

                        {/* Topic / Policy Title */}
                        <Text style={styles.cardTitle}>{card.title}</Text>

                        {/* Card Lines */}
                        <View style={styles.cardLines}>
                          {card.lines.map((line, lIdx) => (
                            <Text key={lIdx} style={styles.cardBodyText}>
                              {line}
                            </Text>
                          ))}
                        </View>

                        {/* Card Link */}
                        {card.link && (
                          <PressableFeedback
                            accessibilityLabel={card.link.label}
                            onPress={() => handleLinkPress(card.link)}
                            style={styles.cardLinkWrapper}
                          >
                            <Text style={styles.cardLinkText}>{card.link.label}</Text>
                          </PressableFeedback>
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            }

            return null;
          })}
        </ScrollView>

        {/* Composer Row: Topic Chips + Input Pill */}
        <View style={[styles.composerContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {/* Topic Chips */}
          <ScrollView
            horizontal
            contentContainerStyle={styles.chipsScroll}
            showsHorizontalScrollIndicator={false}
          >
            {TOPICS.map((topic) => (
              <PressableFeedback
                key={topic.key}
                accessibilityLabel={`Ask about ${topic.chip}`}
                onPress={() => handleTopicChipPress(topic)}
                style={styles.topicChip}
              >
                <Text style={styles.topicChipText}>{topic.chip}</Text>
              </PressableFeedback>
            ))}
          </ScrollView>

          {/* Input Pill */}
          <View style={styles.inputPill}>
            {/* Leading Message Icon */}
            <View style={styles.messageIconWrap}>
              <LineIcon color="#85858E" name="chat" size={21} strokeWidth={2.1} />
            </View>

            <TextInput
              accessibilityLabel="Ask a question about this stay"
              autoCapitalize="sentences"
              onChangeText={setInputText}
              onSubmitEditing={() => handleSend(inputText, "typed")}
              placeholder="Ask about this stay..."
              placeholderTextColor="#85858E"
              returnKeyType="send"
              style={styles.textInput}
              value={inputText}
            />

            <PressableFeedback
              accessibilityLabel="Send question"
              onPress={() => handleSend(inputText, "typed")}
              style={[
                styles.sendButton,
                isSendDisabled && styles.sendButtonDisabled,
              ]}
            >
              <LineIcon color="#111116" name="arrow-up" size={18} strokeWidth={2.5} />
            </PressableFeedback>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EAEAEA",
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#F1F1F3",
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 18,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    color: "#85858E",
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    marginTop: 1,
  },
  keyboardView: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 24,
    gap: 16,
  },
  roamBubble: {
    alignSelf: "flex-start",
    maxWidth: "85%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderTopLeftRadius: 6,
    backgroundColor: "#F4F5F7",
  },
  roamBubbleText: {
    color: "#111116",
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    lineHeight: 20,
  },
  guestBubble: {
    alignSelf: "flex-end",
    maxWidth: "85%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomRightRadius: 6,
    backgroundColor: "#C9B4FF",
  },
  guestBubbleText: {
    color: "#111116",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
    lineHeight: 20,
  },
  replyCardsContainer: {
    width: "100%",
    gap: 12,
  },
  answerCard: {
    width: "100%",
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#F4F0FF",
    borderWidth: 1,
    borderColor: "#EAE2FF",
    gap: 6,
  },
  answerCardNoAnswer: {
    backgroundColor: "#F4F5F7",
    borderColor: "#EAEAEA",
  },
  sourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  sourceLabel: {
    color: "#693BFF",
    fontFamily: "Manrope_700Bold",
    fontSize: 12,
    letterSpacing: 0.2,
  },
  cardTitle: {
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 16,
    letterSpacing: -0.3,
  },
  cardLines: {
    gap: 4,
    marginTop: 2,
  },
  cardBodyText: {
    color: "#222228",
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    lineHeight: 20,
  },
  cardLinkWrapper: {
    alignSelf: "flex-start",
    marginTop: 6,
    paddingVertical: 2,
  },
  cardLinkText: {
    color: "#693BFF",
    fontFamily: "Manrope_700Bold",
    fontSize: 13,
  },
  composerContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#EAEAEA",
    backgroundColor: "#FFFFFF",
    paddingTop: 10,
    gap: 10,
  },
  chipsScroll: {
    gap: 8,
    paddingHorizontal: 16,
  },
  topicChip: {
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: "#F1F1F3",
  },
  topicChipText: {
    color: "#111116",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
  },
  inputPill: {
    height: 52,
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 14,
    paddingRight: 6,
    borderRadius: 26,
    backgroundColor: "#F1F1F3",
    gap: 10,
  },
  messageIconWrap: {
    width: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  textInput: {
    flex: 1,
    height: "100%",
    paddingVertical: 6,
    color: "#111116",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#FFB800",
  },
  sendButtonDisabled: {
    opacity: 0.35,
  },
});
