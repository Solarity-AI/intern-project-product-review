package com.example.productreview.controller;

import com.example.productreview.dto.ProductDTO;
import com.example.productreview.dto.ReviewDTO;
import com.example.productreview.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProductController {
    private final ProductService productService;

    @GetMapping
    public Page<ProductDTO> getAllProducts(
            @RequestParam(required = false) String category,
            @PageableDefault(size = 10) Pageable pageable) {
        return productService.getAllProducts(category, pageable);
    }

    @GetMapping("/{id}")
    public ProductDTO getProductById(@PathVariable Long id) {
        return productService.getProductDTOById(id);
    }

    @GetMapping("/{id}/reviews")
    public Page<ReviewDTO> getReviewsByProductId(
            @PathVariable Long id,
            @RequestParam(required = false) Integer rating,
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable) {
        return productService.getReviewsByProductId(id, rating, pageable);
    }

    @PostMapping("/{id}/reviews")
    public ReviewDTO addReview(@PathVariable Long id, @Valid @RequestBody ReviewDTO reviewDTO) {
        return productService.addReview(id, reviewDTO);
    }

    @PutMapping("/reviews/{reviewId}/helpful")
    public ReviewDTO markReviewAsHelpful(@PathVariable Long reviewId) {
        return productService.markReviewAsHelpful(reviewId);
    }
}
