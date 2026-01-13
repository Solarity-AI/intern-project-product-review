// AIAssistantScreen.tsx
// Getir/Yemeksepeti-style AI Assistant - no keyboard, choice buttons only

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../types';
import { Spacing, FontSize, BorderRadius, FontWeight, Shadow } from '../constants/theme';
import { chatWithAI } from '../services/api';

type RouteType = RouteProp<RootStackParamList, 'AIAssistant'>;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  options?: string[];
  timestamp: Date;
}

const QUESTIONS = [
  'How many reviews are there?',
  'What do customers say about quality?',
  'When were most reviews posted?',
  'What are the main complaints?',
  'Any common praise patterns?',
];

export const AIAssistantScreen: React.FC = () => {
  const route = useRoute<RouteType>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  const productName = route.params?.productName || 'this product';
  const productId = route.params?.productId;
  const reviews = route.params?.reviews || [];

  const processingRef = useRef(false);
  const isExitingRef = useRef(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi! I'm your AI assistant for ${productName}. I can help you understand customer reviews better.`,
      options: QUESTIONS,
      timestamp: new Date(),
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [waitingForMore, setWaitingForMore] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [lastActiveMessageId, setLastActiveMessageId] = useState<string>('1');

  useEffect(() => {
    const t = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(t);
  }, [messages]);

  const analyzeReviewsLocally = useCallback(
    (question: string): string => {
      const lowerQuestion = question.toLowerCase();
      if (lowerQuestion.includes('how many')) {
        return `There are ${reviews.length} customer reviews for this product.`;
      }
      return 'I analyzed the reviews locally and found mixed feedback.';
    },
    [reviews.length]
  );

  const handleQuestionSelect = useCallback(
    async (question: string, messageId: string) => {
      if (processingRef.current || isProcessing || isLoading || isExitingRef.current) return;

      processingRef.current = true;

      // only allow click for the active assistant message
      if (messageId !== lastActiveMessageId) {
        processingRef.current = false;
        return;
      }

      setIsProcessing(true);

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: question,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        let answer = '';
        if (productId) {
          const response = await chatWithAI(productId, question);
          answer = response.answer;
        } else {
          answer = analyzeReviewsLocally(question);
        }

        // 1) Answer bubble (no buttons)
        const answerMessageId = (Date.now() + 1).toString();
        const answerMessage: Message = {
          id: answerMessageId,
          role: 'assistant',
          content: answer,
          timestamp: new Date(),
        };

        // 2) Follow-up bubble with Yes/No buttons (separate bubble)
        const followUpMessageId = (Date.now() + 2).toString();
        const followUpMessage: Message = {
          id: followUpMessageId,
          role: 'assistant',
          content: 'Do you have more questions?',
          options: ['Yes', 'No'],
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, answerMessage, followUpMessage]);
        setLastActiveMessageId(followUpMessageId);
        setWaitingForMore(true);
      } catch (error) {
        console.error('AI Chat Error:', error);

        const errAnswerId = (Date.now() + 1).toString();
        const errAnswer: Message = {
          id: errAnswerId,
          role: 'assistant',
          content: 'Sorry, I had trouble connecting to the server. Please try again.',
          timestamp: new Date(),
        };

        const followUpMessageId = (Date.now() + 2).toString();
        const followUpMessage: Message = {
          id: followUpMessageId,
          role: 'assistant',
          content: 'Do you have more questions?',
          options: ['Yes', 'No'],
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errAnswer, followUpMessage]);
        setLastActiveMessageId(followUpMessageId);
        setWaitingForMore(true);
      } finally {
        setIsLoading(false);
        setIsProcessing(false);
        processingRef.current = false;
      }
    },
    [analyzeReviewsLocally, isLoading, isProcessing, lastActiveMessageId, productId]
  );

  const handleMoreQuestions = useCallback(
    (choice: string, messageId: string) => {
      if (processingRef.current || isProcessing || isExitingRef.current) return;

      processingRef.current = true;

      if (messageId !== lastActiveMessageId) {
        processingRef.current = false;
        return;
      }

      setIsProcessing(true);
      setWaitingForMore(false);

      // Show user choice as a normal user bubble (your yellow bubble)
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: choice,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      if (choice === 'No') {
        isExitingRef.current = true;

        setTimeout(() => {
          const exitMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'Thank you for using AI Assistant! Feel free to come back anytime. 👋',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, exitMessage]);
          setLastActiveMessageId('');
          setIsProcessing(false);
          processingRef.current = false;

          setTimeout(() => {
            navigation.goBack();
          }, 2000);
        }, 350);

        return;
      }

      // choice === 'Yes' -> show question options again
      setTimeout(() => {
        const newMessageId = (Date.now() + 1).toString();
        const restartMessage: Message = {
          id: newMessageId,
          role: 'assistant',
          content: 'Great! What would you like to know?',
          options: QUESTIONS,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, restartMessage]);
        setLastActiveMessageId(newMessageId);
        setIsProcessing(false);
        processingRef.current = false;
      }, 350);
    },
    [isProcessing, lastActiveMessageId, navigation]
  );

  const renderMessage = (message: Message, index: number) => {
    const isUser = message.role === 'user';
    const isActiveMessage = message.id === lastActiveMessageId;

    const shouldShowOptions =
      !isUser && isActiveMessage && !!message.options && message.options.length > 0;

    const isDisabled = isProcessing || isLoading || isExitingRef.current;

    // ✅ Show avatar only for the FIRST assistant message in a consecutive assistant block
    const prev = index > 0 ? messages[index - 1] : undefined;
    const showAvatar = !isUser && (!prev || prev.role !== 'assistant');

    if (isUser) {
      return (
        <View key={message.id} style={[styles.messageBubble, styles.userBubble]}>
          <View
            style={[
              styles.bubbleContent,
              {
                backgroundColor: colors.primary,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.messageText, { color: colors.primaryForeground }]}>
              {message.content}
            </Text>
          </View>

          <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>
            {message.timestamp.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      );
    }

    // assistant bubble(s) with grouped avatar layout
    return (
      <View key={message.id} style={[styles.assistantRow]}>
        <View style={styles.avatarColumn}>
          {showAvatar ? (
            <LinearGradient colors={['#8B5CF6', '#6366F1']} style={styles.aiIcon}>
              <Ionicons name="sparkles" size={16} color="#fff" />
            </LinearGradient>
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
        </View>

        <View style={[styles.messageBubble, styles.assistantBubble]}>
          <View
            style={[
              styles.bubbleContent,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.messageText, { color: colors.foreground }]}>
              {message.content}
            </Text>

            {shouldShowOptions && (
              <View style={styles.optionsContainer}>
                <Text style={[styles.optionsTitle, { color: colors.mutedForeground }]}>
                  {waitingForMore ? 'Choose one:' : 'Choose a question:'}
                </Text>

                {message.options!.map((option, i) => (
                  <TouchableOpacity
                    key={`${message.id}-${i}`}
                    activeOpacity={isDisabled ? 1 : 0.8}
                    disabled={isDisabled}
                    style={[
                      styles.optionButton,
                      {
                        backgroundColor: isDisabled ? colors.muted : colors.secondary,
                        borderColor: colors.border,
                        opacity: isDisabled ? 0.5 : 1,
                      },
                    ]}
                    onPress={() => {
                      if (isDisabled) return;

                      if (waitingForMore) handleMoreQuestions(option, message.id);
                      else handleQuestionSelect(option, message.id);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: isDisabled ? colors.mutedForeground : colors.foreground },
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>
            {message.timestamp.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper backgroundColor={colors.background}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <View style={styles.headerTitle}>
          <LinearGradient colors={['#8B5CF6', '#6366F1']} style={styles.headerIcon}>
            <Ionicons name="sparkles" size={20} color="#fff" />
          </LinearGradient>
          <View>
            <Text style={[styles.headerTitleText, { color: colors.foreground }]}>
              AI Assistant
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
              Analyzing {reviews.length} reviews
            </Text>
          </View>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((m, i) => renderMessage(m, i))}

        {isLoading && (
          <View style={[styles.loadingBubble, { backgroundColor: colors.card }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              Analyzing reviews...
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const AVATAR_COL_WIDTH = 44;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  headerSubtitle: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },

  messagesContainer: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },

  // ✅ assistant row layout (WhatsApp-like grouping)
  assistantRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  avatarColumn: {
    width: AVATAR_COL_WIDTH,
    alignItems: 'flex-start',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
  },
  aiIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.soft,
  },

  messageBubble: {
    gap: Spacing.xs,
  },
  userBubble: {
    alignItems: 'flex-end',
  },
  assistantBubble: {
    alignItems: 'flex-start',
    flex: 1,
  },

  bubbleContent: {
    maxWidth: '85%',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    ...Shadow.soft,
  },

  messageText: {
    fontSize: FontSize.base,
    lineHeight: FontSize.base * 1.5,
  },

  optionsContainer: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },

  optionsTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
  },

  optionButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },

  optionText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },

  timestamp: {
    fontSize: FontSize.xs,
    marginTop: 4,
  },

  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    alignSelf: 'flex-start',
    ...Shadow.soft,
  },
  loadingText: {
    fontSize: FontSize.sm,
  },
});
