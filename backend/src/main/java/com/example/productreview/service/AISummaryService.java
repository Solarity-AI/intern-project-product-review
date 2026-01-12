package com.example.productreview.service;

import com.example.productreview.model.Review;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * AI-powered review summary service using ChatGPT
 * TEST MODE: Returns mock summaries without calling OpenAI API
 */
@Service
public class AISummaryService {
    
    private static final Logger log = LoggerFactory.getLogger(AISummaryService.class);
    
    private final String apiKey;
    private final String model;
    private final Integer maxTokens;
    private final boolean testMode;

    public AISummaryService(
            @Value("${openai.api.key:test-key}") String apiKey,
            @Value("${openai.model:gpt-4o-mini}") String model,
            @Value("${openai.max.tokens:500}") Integer maxTokens) {
        this.apiKey = apiKey;
        this.model = model;
        this.maxTokens = maxTokens;
        // TEST MODE: If API key is not set or is test key, use mock responses
        this.testMode = apiKey == null || apiKey.isEmpty() || 
                        apiKey.equals("test-key") || 
                        apiKey.equals("your-api-key-here") ||
                        !apiKey.startsWith("sk-");
        
        if (testMode) {
            log.warn("⚠️ AISummaryService running in TEST MODE - using mock summaries");
        } else {
            log.info("✅ AISummaryService initialized with real OpenAI API key");
        }
    }

    /**
     * Generate AI summary for product reviews
     * Result is cached for 1 hour based on productId
     * 
     * @param productId Product ID
     * @param productName Product name for context
     * @param reviews List of reviews to summarize
     * @return AI-generated summary or null if error/no reviews
     */
    @Cacheable(value = "aiSummaries", key = "#productId")
    public String generateReviewSummary(Long productId, String productName, List<Review> reviews) {
        // Generate summary if there is at least 1 review
        if (reviews == null || reviews.isEmpty()) {
            log.info("No reviews for product {}, skipping summary", productId);
            return null;
        }

        try {
            // TEST MODE: Return mock summary
            if (testMode) {
                String mockSummary = generateMockSummary(productName, reviews);
                log.info("📝 Generated MOCK summary for product {}: {} chars", productId, mockSummary.length());
                return mockSummary;
            }
            
            // REAL MODE: Call OpenAI API (requires valid API key and credits)
            log.error("❌ Real OpenAI API calls not implemented in this version");
            log.error("❌ Please use TEST MODE or implement OpenAI client");
            return generateMockSummary(productName, reviews);
            
        } catch (Exception e) {
            log.error("Error generating AI summary for product {}: {}", productId, e.getMessage(), e);
            return null;
        }
    }

    /**
     * Chat with AI about product reviews
     * @param productId Product ID
     * @param question User's question
     * @param reviews List of reviews
     * @return AI response
     */
    public String chatWithReviews(Long productId, String question, List<Review> reviews) {
        if (reviews == null || reviews.isEmpty()) {
            return "I couldn't find any reviews for this product to analyze.";
        }

        String lowerQuestion = question.toLowerCase();
        
        if (lowerQuestion.contains("how many")) {
            return String.format("There are %d reviews for this product.", reviews.size());
        }
        
        if (lowerQuestion.contains("quality") || lowerQuestion.contains("good")) {
            long positiveCount = reviews.stream().filter(r -> r.getRating() >= 4).count();
            double percentage = (double) positiveCount / reviews.size();
            
            if (percentage >= 0.7) {
                return String.format("Customers are very happy with the quality! %d out of %d reviews are positive (4-5 stars).", positiveCount, reviews.size());
            } else if (percentage >= 0.4) {
                return String.format("Opinions are mixed regarding quality. %d out of %d reviews are positive, but some users have concerns.", positiveCount, reviews.size());
            } else {
                return String.format("Many customers have concerns about the quality. Only %d out of %d reviews are positive.", positiveCount, reviews.size());
            }
        }
        
        if (lowerQuestion.contains("complaint") || lowerQuestion.contains("bad")) {
            long negativeCount = reviews.stream().filter(r -> r.getRating() <= 2).count();
            if (negativeCount == 0) return "I didn't find any major complaints in the reviews!";
            
            return String.format("There are %d negative reviews (1-2 stars). Some users mentioned issues with delivery or product defects.", negativeCount);
        }

        return "That's an interesting question! Based on the reviews, customers generally have mixed to positive feelings about this product.";
    }

    /**
     * Generate a mock summary based on review statistics
     * This simulates what ChatGPT would return
     */
    private String generateMockSummary(String productName, List<Review> reviews) {
        // Calculate statistics
        double avgRating = reviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);
        
        long positiveReviews = reviews.stream()
                .filter(r -> r.getRating() >= 4)
                .count();
        
        long negativeReviews = reviews.stream()
                .filter(r -> r.getRating() <= 2)
                .count();
        
        double positivePercentage = (positiveReviews * 100.0) / reviews.size();
        
        // Generate sentiment
        String sentiment;
        if (avgRating >= 4.0) {
            sentiment = "overwhelmingly positive";
        } else if (avgRating >= 3.5) {
            sentiment = "generally positive";
        } else if (avgRating >= 2.5) {
            sentiment = "mixed";
        } else {
            sentiment = "generally negative";
        }
        
        // Get common themes from actual reviews
        String commonPraise = extractCommonThemes(reviews, true);
        String commonComplaints = extractCommonThemes(reviews, false);
        
        // Build mock summary
        StringBuilder summary = new StringBuilder();
        summary.append(String.format("Based on %d customer reviews, the overall sentiment is %s with an average rating of %.1f stars. ", 
                reviews.size(), sentiment, avgRating));
        
        if (positivePercentage >= 70) {
            summary.append(String.format("%.0f%% of customers gave 4-5 star ratings. ", positivePercentage));
            summary.append(commonPraise);
        } else if (positivePercentage >= 40) {
            summary.append("Opinions are mixed. ");
            summary.append(commonPraise);
            summary.append(" However, ");
            summary.append(commonComplaints);
        } else {
            summary.append(commonComplaints);
        }
        
        summary.append(" Consider these factors when making your purchase decision.");
        
        return summary.toString();
    }
    
    /**
     * Extract common themes from reviews
     */
    private String extractCommonThemes(List<Review> reviews, boolean positive) {
        // Filter reviews by rating
        List<Review> filtered = reviews.stream()
                .filter(r -> positive ? r.getRating() >= 4 : r.getRating() <= 2)
                .collect(Collectors.toList());
        
        if (filtered.isEmpty()) {
            return "";
        }
        
        // Get most common words/phrases from comments
        List<String> comments = filtered.stream()
                .map(Review::getComment)
                .map(String::toLowerCase)
                .collect(Collectors.toList());
        
        // Simple theme extraction based on common words
        if (positive) {
            boolean mentionsQuality = comments.stream().anyMatch(c -> c.contains("quality") || c.contains("great") || c.contains("excellent"));
            boolean mentionsPerformance = comments.stream().anyMatch(c -> c.contains("performance") || c.contains("fast") || c.contains("speed"));
            boolean mentionsDesign = comments.stream().anyMatch(c -> c.contains("design") || c.contains("look") || c.contains("beautiful"));
            
            if (mentionsQuality && mentionsPerformance) {
                return "Customers praise the excellent quality and strong performance. ";
            } else if (mentionsQuality && mentionsDesign) {
                return "Users appreciate the high quality and attractive design. ";
            } else if (mentionsQuality) {
                return "The product quality receives consistent praise. ";
            } else if (mentionsPerformance) {
                return "Performance is highlighted as a key strength. ";
            } else if (mentionsDesign) {
                return "The design and aesthetics are well-received. ";
            } else {
                return "Most customers report positive experiences. ";
            }
        } else {
            boolean mentionsPrice = comments.stream().anyMatch(c -> c.contains("expensive") || c.contains("price") || c.contains("cost"));
            boolean mentionsBattery = comments.stream().anyMatch(c -> c.contains("battery"));
            boolean mentionsBugs = comments.stream().anyMatch(c -> c.contains("bug") || c.contains("issue") || c.contains("problem"));
            
            if (mentionsPrice && mentionsBattery) {
                return "Some customers feel the price is high and mention battery concerns. ";
            } else if (mentionsPrice) {
                return "The main complaint centers around the price point. ";
            } else if (mentionsBattery) {
                return "Battery life is a common concern among users. ";
            } else if (mentionsBugs) {
                return "Several users report technical issues or bugs. ";
            } else {
                return "Some customers have expressed concerns. ";
            }
        }
    }
}
