
# Product Review Backend – Technical Architecture & Developer Guide

## Overview
This backend is a **Spring Boot–based RESTful API** designed to support a mobile Product Review application.
It follows a **layered architecture** with clear separation of concerns between
controllers, services, repositories, domain models, DTOs, configuration, and tests.

This document is intentionally **very detailed** and written for **new interns**
to understand how the system works end-to-end.

---

## Technology Stack
- Java 17+
- Spring Boot
- Spring Web (REST)
- Spring Data JPA
- Spring Cache
- JUnit 5
- Maven

---

## Project Structure
(See folder tree in repository root)

---

## Entry Point
### ProductReviewApplication.java
- Bootstraps the Spring context
- Enables component scanning
- Starts the embedded server

---

## Configuration
### CacheConfig.java
Central cache configuration used by service layer to improve performance.

---

## Controllers
### ProductController.java
- Exposes REST endpoints
- Delegates all logic to services
- Converts DTOs to HTTP responses

---

## DTOs
### ProductDTO / ReviewDTO
- API contracts
- Decouple entities from frontend

---

## Domain Models
### Product / Review
- JPA entities
- Database mapping only

---

## Repositories
### ProductRepository / ReviewRepository
- Spring Data JPA interfaces
- Handle persistence logic

---

## Services
### ProductService
- Core business logic
- Coordinates repositories and DTO mapping

### AISummaryService
- Handles AI-based review summarization

### DataInitializer
- Seeds initial data at startup

---

## Exception Handling
### GlobalExceptionHandler
- Centralized error handling
- Maps exceptions to HTTP responses

---

## Configuration Properties
### application.properties
- Database
- JPA
- Server settings

---

## Testing
### ProductServiceTest
- Unit tests for service logic

### ProductControllerIntegrationTest
- End-to-end REST API tests

---

## Build & Run
```bash
./mvnw spring-boot:run
```

---

## Frontend Integration
Mobile app communicates via REST endpoints exposed in controllers.

---

## Architectural Principles
- Separation of concerns
- DTO-based APIs
- Testability
- Scalability

---

## Notes for Interns
- Start from controller → service → repository
- Never put business logic in controllers

---

## 🚀 Planned Improvements & Roadmap

### 1. Security Enhancements
- **Spring Security Integration:** We plan to integrate Spring Security 6 to secure the API.
- **JWT Authentication:** Implementation of stateless authentication using JSON Web Tokens (JWT).
- **Authorization:** Protecting sensitive endpoints (e.g., `POST /reviews` will require login).
- **Role-Based Access Control:** Differentiating between Admin and User roles.

### 2. Validation with AOP
- **Aspect-Oriented Programming (AOP):** Centralizing validation logic using Aspects to keep controllers clean.
- **Custom Annotations:** Creating reusable annotations for business rules.
- **Global Exception Handling:** Ensuring consistent error responses across the application.

### 3. Integration Testing
- **Testcontainers:** Using Testcontainers to spin up real database instances (PostgreSQL) for reliable integration tests.
- **Environment Independence:** Ensuring tests run consistently across different environments (CI/CD, Local).
