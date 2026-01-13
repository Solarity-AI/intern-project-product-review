package com.example.productreview.service;

import com.example.productreview.dto.ProductDTO;
import com.example.productreview.dto.ReviewDTO;
import com.example.productreview.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ProductService {
    // Updated to accept search query
    Page<ProductDTO> getAllProducts(String category, String search, Pageable pageable);
    
    ProductDTO getProductDTOById(Long id);
    
    Product getProductById(Long id);
    
    List<ReviewDTO> getReviewsByProductId(Long productId);
    
    Page<ReviewDTO> getReviewsByProductId(Long productId, Integer rating, Pageable pageable);
    
    ReviewDTO addReview(Long productId, ReviewDTO reviewDTO);
    
    ReviewDTO markReviewAsHelpful(Long reviewId, String userId);
    
    List<Long> getUserVotedReviewIds(String userId);

    String chatAboutProduct(Long productId, String question);
}
