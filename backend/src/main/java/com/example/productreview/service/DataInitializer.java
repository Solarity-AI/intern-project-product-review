package com.example.productreview.service;

import com.example.productreview.model.Product;
import com.example.productreview.model.Review;
import com.example.productreview.repository.ProductRepository;
import com.example.productreview.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
    private final ProductRepository productRepository;
    private final ReviewRepository reviewRepository;

    @Override
    public void run(String... args) {
        if (productRepository.count() == 0) {
            Product p1 = new Product();
            p1.setName("iPhone 15 Pro");
            p1.setDescription("The latest iPhone with A17 Pro chip and Titanium design.");
            p1.setCategory("Electronics");
            p1.setPrice(999.99);

            Product p2 = new Product();
            p2.setName("Sony WH-1000XM5");
            p2.setDescription("Industry-leading noise canceling headphones.");
            p2.setCategory("Electronics");
            p2.setPrice(349.99);

            Product p3 = new Product();
            p3.setName("MacBook Air M2");
            p3.setDescription("Strikingly thin design and incredible speed.");
            p3.setCategory("Laptops");
            p3.setPrice(1099.00);

            Product p4 = new Product();
            p4.setName("iPad Pro 12.9");
            p4.setDescription("The ultimate iPad experience with M2 chip.");
            p4.setCategory("Tablets");
            p4.setPrice(1099.00);

            Product p5 = new Product();
            p5.setName("Apple Watch Series 9");
            p5.setDescription("Smarter, brighter, and more powerful.");
            p5.setCategory("Wearables");
            p5.setPrice(399.00);

            productRepository.saveAll(Arrays.asList(p1, p2, p3, p4, p5));

            // Add some initial reviews
            addReview(p1, "John Doe", "Amazing phone! The camera is incredible.", 5);
            addReview(p1, "Jane Smith", "Battery life could be better, but overall great.", 4);
            addReview(p2, "Alice Brown", "Best noise canceling I've ever experienced.", 5);
            addReview(p3, "Bob Wilson", "Fast and light, perfect for my work.", 5);
        }
    }

    private void addReview(Product product, String name, String comment, int rating) {
        Review review = new Review();
        review.setProduct(product);
        review.setReviewerName(name);
        review.setComment(comment);
        review.setRating(rating);
        reviewRepository.save(review);

        // Update product stats
        updateProductStats(product);
    }

    private void updateProductStats(Product product) {
        var reviews = reviewRepository.findByProductId(product.getId());
        double avg = reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
        product.setAverageRating(Math.round(avg * 10.0) / 10.0);
        product.setReviewCount(reviews.size());
        productRepository.save(product);
    }
}
