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
import { chatWithAI } from '../services/api'; // ✨ Import API function

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
  const productId = route.params?.productId; // ✨ Need productId for API call
  const reviews = route.params?.reviews || [];

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
  
  // ✨ Prevent double-click and track processed messages
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastActiveMessageId, setLastActiveMessageId] = useState<string>('1');
  const isExitingRef = useRef(false); // ✨ Track if we're in exit flow

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Fallback local analysis if API fails or for simple questions
  const analyzeReviewsLocally = (question: string): string => {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('how many')) {
      return `There are ${reviews.length} customer reviews for this product.`;
    }
    // ... (other local logic can remain as fallback)
    return 'I analyzed the reviews locally and found mixed feedback.';
  };

  // ✨ Wrapped with useCallback and double-click protection
  const handleQuestionSelect = useCallback(async (question: string, messageId: string) => {
    // Prevent double-click or processing if already in progress
    if (isProcessing || isLoading || isExitingRef.current) {
      console.log('Ignoring click - already processing');
      return;
    }
    
    // Only allow clicking on the last active message
    if (messageId !== lastActiveMessageId) {
      console.log('Ignoring click - not the active message');
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
      // ✨ Call Backend API
      let answer = '';
      if (productId) {
        const response = await chatWithAI(productId, question);
        answer = response.answer;
      } else {
        // Fallback if no productId (shouldn't happen in normal flow)
        answer = analyzeReviewsLocally(question);
      }

      const newMessageId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: newMessageId,
        role: 'assistant',
        content: answer,
        options: ['Yes', 'No'],
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      setLastActiveMessageId(newMessageId); // ✨ Update active message
      setWaitingForMore(true);
    } catch (error) {
      console.error('AI Chat Error:', error);
      const newMessageId = (Date.now() + 1).toString();
      const errorMessage: Message = {
        id: newMessageId,
        role: 'assistant',
        content: 'Sorry, I had trouble connecting to the server. Please try again.',
        options: ['Yes', 'No'],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setLastActiveMessageId(newMessageId); // ✨ Update active message
      setWaitingForMore(true);
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
    }
  }, [isProcessing, isLoading, lastActiveMessageId, productId]);

  // ✨ Wrapped with useCallback and double-click protection
  const handleMoreQuestions = useCallback((choice: string, messageId: string) => {
    // Prevent double-click or processing if already in progress
    if (isProcessing || isExitingRef.current) {
      console.log('Ignoring click - already processing');
      return;
    }
    
    // Only allow clicking on the last active message
    if (messageId !== lastActiveMessageId) {
      console.log('Ignoring click - not the active message');
      return;
    }

    setIsProcessing(true);
    setWaitingForMore(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: choice,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    if (choice === 'No') {
      // ✨ Mark as exiting to prevent any further interactions
      isExitingRef.current = true;
      
      setTimeout(() => {
        const exitMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Thank you for using AI Assistant! Feel free to come back anytime. 👋',
          timestamp: new Date(),
          // ✨ No options - exit message shouldn't have buttons
        };
        setMessages((prev) => [...prev, exitMessage]);
        setLastActiveMessageId(''); // ✨ No active message anymore

        setTimeout(() => {
          navigation.goBack();
        }, 2000);
      }, 500);
    } else {
      // choice === 'Yes'
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
        setLastActiveMessageId(newMessageId); // ✨ Update active message
        setIsProcessing(false); // ✨ Allow new interactions
      }, 500);
    }
  }, [isProcessing, lastActiveMessageId, navigation]);

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    // ✨ Check if this message's options should be interactive
    const isActiveMessage = message.id === lastActiveMessageId;
    const shouldShowOptions = !isUser && message.options && message.options.length > 0;
    const isDisabled = !isActiveMessage || isProcessing || isLoading || isExitingRef.current;

    return (
      <View
        key={message.id}
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        {!isUser && (
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

          {/* ✨ Only show options if they exist and this is the active message */}
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
                  <Text style={[
                    styles.optionText, 
                    { color: isDisabled ? colors.mutedForeground : colors.foreground }
                  ]}>
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