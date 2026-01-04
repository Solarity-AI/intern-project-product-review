package com.example.productreview.service;

import com.example.productreview.dto.ProductDTO;
import com.example.productreview.dto.ReviewDTO;
import com.example.productreview.model.Product;
import com.example.productreview.model.Review;
import com.example.productreview.repository.ProductRepository;
import com.example.productreview.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;
    private final ReviewRepository reviewRepository;

    public Page<ProductDTO> getAllProducts(String category, Pageable pageable) {
        if (category != null && !category.isEmpty() && !category.equalsIgnoreCase("All")) {
            return productRepository.findByCategory(category, pageable)
                    .map(this::convertToProductDTO);
        }
        return productRepository.findAll(pageable)
                .map(this::convertToProductDTO);
    }

    public ProductDTO getProductDTOById(Long id) {
        Product product = getProductById(id);
        ProductDTO productDTO = convertToProductDTO(product);
        
        // Calculate rating breakdown only for single product view
        Map<Integer, Long> ratingBreakdown = new HashMap<>();
        // Initialize with 0 for all ratings 1-5
        for (int i = 1; i <= 5; i++) {
            ratingBreakdown.put(i, 0L);
        }
        
        List<Object[]> counts = reviewRepository.findRatingCountsByProductId(id);
        for (Object[] result : counts) {
            Integer rating = (Integer) result[0];
            Long count = (Long) result[1];
            ratingBreakdown.put(rating, count);
        }
        
        productDTO.setRatingBreakdown(ratingBreakdown);
        return productDTO;
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    public List<ReviewDTO> getReviewsByProductId(Long productId) {
        return reviewRepository.findByProductId(productId).stream()
                .map(this::convertToReviewDTO)
                .collect(Collectors.toList());
    }

    public Page<ReviewDTO> getReviewsByProductId(Long productId, Integer rating, Pageable pageable) {
        return reviewRepository.findByProductIdAndRating(productId, rating, pageable)
                .map(this::convertToReviewDTO);
    }

    @Transactional
    public ReviewDTO addReview(Long productId, ReviewDTO reviewDTO) {
        Product product = getProductById(productId);

        Review review = new Review();
        review.setReviewerName(reviewDTO.getReviewerName());
        review.setComment(reviewDTO.getComment());
        review.setRating(reviewDTO.getRating());
        review.setHelpfulCount(0);
        review.setProduct(product);

        Review savedReview = reviewRepository.save(review);

        // Update product statistics
        updateProductStats(product);

        return convertToReviewDTO(savedReview);
    }

    @Transactional
    public ReviewDTO markReviewAsHelpful(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        if (review.getHelpfulCount() == null) {
            review.setHelpfulCount(0);
        }
        
        review.setHelpfulCount(review.getHelpfulCount() + 1);
        Review savedReview = reviewRepository.save(review);

        return convertToReviewDTO(savedReview);
    }

    private void updateProductStats(Product product) {
        List<Review> reviews = reviewRepository.findByProductId(product.getId());
        int count = reviews.size();
        double average = reviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);

        product.setReviewCount(count);
        product.setAverageRating(Math.round(average * 10.0) / 10.0); // Round to 1 decimal place
        productRepository.save(product);
    }

    private ReviewDTO convertToReviewDTO(Review review) {
        return new ReviewDTO(
                review.getId(),
                review.getReviewerName(),
                review.getComment(),
                review.getRating(),
                review.getHelpfulCount() != null ? review.getHelpfulCount() : 0,
                review.getCreatedAt(),
                review.getProduct().getId()
        );
    }

    private ProductDTO convertToProductDTO(Product product) {
        return new ProductDTO(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getCategory(),
                product.getPrice(),
                product.getImageUrl(),
                product.getAverageRating(),
                product.getReviewCount(),
                null // ratingBreakdown is null by default for list view
        );
    }
}
