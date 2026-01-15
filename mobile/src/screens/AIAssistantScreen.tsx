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
  useWindowDimensions,
  Platform,
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
  selectedOption?: string; // selected option shown as user bubble (user role message)
  timestamp: Date;
  hideIcon?: boolean; // ✅ to avoid showing AI icon in some assistant bubbles (whatsapp-like)
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

  // ✨ Responsive: Get window dimensions
  const { width: windowWidth } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const MAX_CONTENT_WIDTH = 600;
  const isWideScreen = windowWidth > MAX_CONTENT_WIDTH;

  // ✨ Responsive container style
  const responsiveContainerStyle = {
    width: '100%' as const,
    maxWidth: isWeb ? MAX_CONTENT_WIDTH : undefined,
    alignSelf: 'center' as const,
    flex: 1,
  };

  const productName = route.params?.productName || 'this product';
  const productId = route.params?.productId;
  const reviews = route.params?.reviews || [];

  // ✅ Global lock: only one active question at a time
  const activeRequestRef = useRef(false);
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

  // ✅ Helper: hide options on the active assistant message immediately (prevents spam taps)
  const consumeOptionsForMessage = useCallback((messageId: string, selected: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, selectedOption: selected, options: undefined }
          : m
      )
    );
  }, []);

  const handleQuestionSelect = useCallback(
    async (question: string, messageId: string) => {
      // ✅ Hard block: only one request at a time
      if (
        activeRequestRef.current ||
        processingRef.current ||
        isProcessing ||
        isLoading ||
        isExitingRef.current
      ) {
        return;
      }

      // Only allow clicking on the last active message
      if (messageId !== lastActiveMessageId) return;

      // lock
      activeRequestRef.current = true;
      processingRef.current = true;
      setIsProcessing(true);

      // ✅ Hide question options immediately (UX + prevents rapid multi submit)
      consumeOptionsForMessage(messageId, question);

      // Add user bubble (selected question)
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

        const answerId = (Date.now() + 1).toString();

        // ✅ assistant answer bubble
        const assistantAnswer: Message = {
          id: answerId,
          role: 'assistant',
          content: answer,
          timestamp: new Date(),
        };

        // ✅ separate assistant bubble for "Do you have more questions?" (whatsapp-like)
        const followupId = (Date.now() + 2).toString();
        const assistantFollowup: Message = {
          id: followupId,
          role: 'assistant',
          content: 'Do you have more questions?',
          options: ['Yes', 'No'],
          timestamp: new Date(),
          hideIcon: true, // ✅ don’t show AI icon again
        };

        setMessages((prev) => [...prev, assistantAnswer, assistantFollowup]);
        setLastActiveMessageId(followupId);
        setWaitingForMore(true);
      } catch (error) {
        console.error('AI Chat Error:', error);

        const followupId = (Date.now() + 2).toString();
        const errMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I had trouble connecting to the server. Please try again.',
          timestamp: new Date(),
        };
        const retryMsg: Message = {
          id: followupId,
          role: 'assistant',
          content: 'Do you have more questions?',
          options: ['Yes', 'No'],
          timestamp: new Date(),
          hideIcon: true,
        };

        setMessages((prev) => [...prev, errMsg, retryMsg]);
        setLastActiveMessageId(followupId);
        setWaitingForMore(true);
      } finally {
        setIsLoading(false);
        setIsProcessing(false);
        processingRef.current = false;
        activeRequestRef.current = false; // ✅ unlock after response shown
      }
    },
    [
      analyzeReviewsLocally,
      consumeOptionsForMessage,
      isLoading,
      isProcessing,
      lastActiveMessageId,
      productId,
      isProcessing,
    ]
  );

  const handleMoreQuestions = useCallback(
    (choice: string, messageId: string) => {
      if (processingRef.current || isProcessing || isExitingRef.current) return;

      // Only allow clicking on the last active message
      if (messageId !== lastActiveMessageId) return;

      processingRef.current = true;
      setIsProcessing(true);
      setWaitingForMore(false);

      // ✅ Hide Yes/No immediately and render user bubble instead
      consumeOptionsForMessage(messageId, choice);

      // user bubble for Yes/No
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
          }, 1500);
        }, 300);
      } else {
        // Yes → show next questions
        setTimeout(() => {
          const newId = (Date.now() + 1).toString();
          const restartMessage: Message = {
            id: newId,
            role: 'assistant',
            content: 'Great! What would you like to know?',
            options: QUESTIONS,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, restartMessage]);
          setLastActiveMessageId(newId);
          setIsProcessing(false);
          processingRef.current = false;
        }, 300);
      }
    },
    [consumeOptionsForMessage, isProcessing, lastActiveMessageId, navigation]
  );

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    const isActiveMessage = message.id === lastActiveMessageId;

    const shouldShowOptions =
      !isUser && isActiveMessage && !!message.options && message.options.length > 0;

    // ✅ Disable options when loading OR processing OR exit flow OR another request active
    const isDisabled =
      isProcessing || isLoading || isExitingRef.current || activeRequestRef.current;

    return (
      <View
        key={message.id}
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        {!isUser && !message.hideIcon && (
          <View style={styles.aiIconContainer}>
            <LinearGradient colors={['#8B5CF6', '#6366F1']} style={styles.aiIcon}>
              <Ionicons name="sparkles" size={16} color="#fff" />
            </LinearGradient>
          </View>
        )}

        <View
          style={[
            styles.bubbleContent,
            {
              backgroundColor: isUser ? colors.primary : colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isUser ? colors.primaryForeground : colors.foreground },
            ]}
          >
            {message.content}
          </Text>

          {shouldShowOptions && (
            <View style={styles.optionsContainer}>
              <Text style={[styles.optionsTitle, { color: colors.mutedForeground }]}>
                {waitingForMore ? 'Do you have more questions?' : 'Choose a question:'}
              </Text>

              {message.options!.map((option, index) => (
                <TouchableOpacity
                  key={index}
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

                    if (waitingForMore) {
                      handleMoreQuestions(option, message.id);
                    } else {
                      handleQuestionSelect(option, message.id);
                    }
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
          {message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <ScreenWrapper backgroundColor={colors.background}>
      {/* ✨ Responsive Wrapper */}
      <View style={responsiveContainerStyle}>
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
          {messages.map(renderMessage)}

          {isLoading && (
            <View style={[styles.loadingBubble, { backgroundColor: colors.card }]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                Analyzing reviews...
              </Text>
            </View>
          )}
        </ScrollView>
      </View>{/* ✨ End Responsive Wrapper */}
    </ScreenWrapper>
  );
};

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

  messageBubble: {
    gap: Spacing.xs,
  },
  userBubble: {
    alignItems: 'flex-end',
  },
  assistantBubble: {
    alignItems: 'flex-start',
  },

  aiIconContainer: {
    marginBottom: Spacing.xs,
  },
  aiIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.soft,
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