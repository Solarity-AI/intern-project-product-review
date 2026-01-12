package com.example.productreview.controller;

import com.example.productreview.dto.ProductDTO;
import com.example.productreview.dto.ReviewDTO;
import com.example.productreview.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*") // Allow all origins for mobile/web access
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ResponseEntity<Page<ProductDTO>> getAllProducts(
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name,asc") String sort) {
        
        String[] sortParams = sort.split(",");
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("desc") 
                ? Sort.Direction.DESC : Sort.Direction.ASC;
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortParams[0]));
        
        return ResponseEntity.ok(productService.getAllProducts(category, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDTO> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductDTOById(id));
    }

    @GetMapping("/{id}/reviews")
    public ResponseEntity<Page<ReviewDTO>> getReviews(
            @PathVariable Long id,
            @RequestParam(required = false) Integer rating,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {
        
        String[] sortParams = sort.split(",");
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("desc") 
                ? Sort.Direction.DESC : Sort.Direction.ASC;
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortParams[0]));
        
        if (rating != null) {
            return ResponseEntity.ok(productService.getReviewsByProductId(id, rating, pageable));
        }
        
        return ResponseEntity.ok(productService.getReviewsByProductId(id, null, pageable));
    }

    @PostMapping("/{id}/reviews")
    public ResponseEntity<ReviewDTO> addReview(@PathVariable Long id, @Valid @RequestBody ReviewDTO reviewDTO) {
        return ResponseEntity.ok(productService.addReview(id, reviewDTO));
    }

    @PutMapping("/reviews/{reviewId}/helpful")
    public ResponseEntity<ReviewDTO> markReviewAsHelpful(@PathVariable Long reviewId) {
        return ResponseEntity.ok(productService.markReviewAsHelpful(reviewId));
    }
    
    // ✨ New Chat Endpoint
    @PostMapping("/{id}/chat")
    public ResponseEntity<Map<String, String>> chatAboutProduct(
            @PathVariable Long id, 
            @RequestBody Map<String, String> request) {
        
        String question = request.get("question");
        if (question == null || question.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Question is required"));
        }
        
        String answer = productService.chatAboutProduct(id, question);
        return ResponseEntity.ok(Map.of("answer", answer));
    }
}
