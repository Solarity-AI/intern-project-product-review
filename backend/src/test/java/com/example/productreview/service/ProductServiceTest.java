package com.example.productreview.service;

import com.example.productreview.dto.ProductDTO;
import com.example.productreview.dto.ReviewDTO;
import com.example.productreview.model.Product;
import com.example.productreview.model.Review;
import com.example.productreview.repository.ProductRepository;
import com.example.productreview.repository.ReviewRepository;
import com.example.productreview.repository.ReviewVoteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ReviewRepository reviewRepository;
    
    @Mock
    private ReviewVoteRepository reviewVoteRepository;
    
    @Mock
    private AISummaryService aiSummaryService;

    @InjectMocks
    private ProductServiceImpl productService;

    private Product product;
    private ProductDTO productDTO;

    @BeforeEach
    void setUp() {
        product = new Product();
        product.setId(1L);
        product.setName("Test Product");
        product.setDescription("Description");
        product.setCategory("Category");
        product.setPrice(100.0);
        product.setImageUrl("http://example.com/image.jpg");
        product.setAverageRating(0.0);
        product.setReviewCount(0);

        productDTO = new ProductDTO(1L, "Test Product", "Description", "Category", 100.0, "http://example.com/image.jpg", 0.0, 0, null, null);
    }

    @Test
    void getAllProducts_ShouldReturnPageOfDTOs() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Product> productPage = new PageImpl<>(Arrays.asList(product));
        when(productRepository.findAll(pageable)).thenReturn(productPage);

        // ✨ Updated: Added null for search parameter
        Page<ProductDTO> result = productService.getAllProducts(null, null, pageable);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals(product.getName(), result.getContent().get(0).getName());
        verify(productRepository, times(1)).findAll(pageable);
    }

    @Test
    void getProductDTOById_ShouldReturnDTO() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(reviewRepository.findRatingCountsByProductId(1L)).thenReturn(new ArrayList<>());
        when(reviewRepository.findByProductId(1L)).thenReturn(new ArrayList<>()); // For AI summary check

        ProductDTO result = productService.getProductDTOById(1L);

        assertNotNull(result);
        assertEquals(product.getName(), result.getName());
    }

    @Test
    void addReview_ShouldUpdateStatsAndReturnDTO() {
        ReviewDTO reviewDTO = new ReviewDTO();
        reviewDTO.setReviewerName("User");
        reviewDTO.setComment("Good product indeed");
        reviewDTO.setRating(5);

        Review review = new Review();
        review.setId(1L);
        review.setReviewerName("User");
        review.setRating(5);
        review.setProduct(product);

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(reviewRepository.save(any(Review.class))).thenReturn(review);
        when(reviewRepository.findByProductId(1L)).thenReturn(Arrays.asList(review));

        ReviewDTO result = productService.addReview(1L, reviewDTO);

        assertNotNull(result);
        assertEquals(1, product.getReviewCount());
        assertEquals(5.0, product.getAverageRating());
        verify(productRepository, times(1)).save(product);
    }
}
