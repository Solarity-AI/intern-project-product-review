# 📱 Product Review Application

**Backend:** Spring Boot (Java)  
**Frontend:** React Native (Expo) - *Reference Implementation*  
**Database:** H2 (Dev) / PostgreSQL (Prod)  
**Deployment:** Heroku (Backend) & Vercel (Web)

---

## 📌 Project Overview

The **Product Review Application** is a full-stack system designed to demonstrate modern software architecture patterns. It allows users to browse products, filter by categories, view detailed reviews with AI-generated summaries, and submit their own feedback.

The project emphasizes **clean architecture, REST API design, performance optimization (pagination, server-side filtering), and cross-platform development**.

---

## 🎓 For Future Interns

**Assignment:** You must choose and implement **only one** of the following frontend stacks:

1.  **iOS (Swift):** See [README-iOS-Swift.md](./README-iOS-Swift.md) for requirements.
2.  **Android (Kotlin):** See [README-Android-Kotlin.md](./README-Android-Kotlin.md) for requirements.

> **Note:** The current `mobile/` folder contains a **React Native** implementation. This serves as a **reference** for how the UI should look and how to consume the Backend API. You are expected to build a native version (Swift or Kotlin) matching these features.

---

## 🏗️ System Architecture

> **[Link to Excalidraw Architecture Diagram]** *(To be added)*

The system follows a layered architecture:
1.  **Presentation Layer:** Mobile/Web App (React Native, Swift, or Kotlin)
2.  **API Layer:** Spring Boot REST Controllers
3.  **Business Layer:** Service Interfaces & Implementations
4.  **Data Layer:** JPA Repositories & Database

---

## 🚀 Deliverables & Demo

### 🎥 Code Walkthroughs
- **Frontend Code Walkthrough:** [Google Drive Link] *(To be added)*
- **Backend Code Walkthrough:** [Google Drive Link] *(To be added)*

### 📱 Application Demo
- **Live App Demo:** [Google Drive Link] *(To be added)*

### 📦 Build Artifacts
- **Android APK:** [Google Drive Link] *(To be added)*
- **Public Web App:** [Vercel Link Here] (e.g., `https://product-review-app.vercel.app`)

---

## 🧩 Key Features Implemented

### 🛒 Product Management
- **Server-Side Pagination:** Efficiently loads data in chunks.
- **Dynamic Filtering:** Filter products by category and reviews by rating.
- **Rating Breakdown:** Server-calculated distribution of star ratings.

### 🤖 AI Integration
- **AI Review Summary:** Automatically generates a summary of user reviews using AI logic.
- **AI Assistant:** Interactive chat interface for product queries.

### 🛠️ Technical Highlights
- **Dependency Inversion:** Controllers depend on Interfaces, not concrete classes.
- **DTO Pattern:** Strict separation between Database Entities and API responses.
- **Optimized SQL:** Custom queries for aggregation and performance.

---

## 🔮 Future Improvements & Roadmap

### 🔒 Security Enhancements (Planned)
- **Spring Security Integration:** Implement JWT-based authentication.
- **Role-Based Access Control:** Admin vs User roles.
- **Secure Token Management:** Refresh tokens and secure storage.

### 🛡️ Validation with AOP (Planned)
- **Centralized Validation:** Use Aspect-Oriented Programming (AOP) to handle request validation globally.
- **Consistent Error Handling:** Unified error response structure.

### 🧪 Integration Testing (Planned)
- **Testcontainers:** Use Docker containers for reliable integration tests.
- **End-to-End Testing:** Validate full user flows.

---

## 🛠️ How to Run Locally

### Backend
```bash
cd backend
./mvnw spring-boot:run
```
See [backend/README_BACKEND.md](./backend/README_BACKEND.md) for more details.

### Frontend (Reference Implementation - React Native)
```bash
cd mobile
npm install
npx expo start
```
See [mobile/README_FRONTEND.md](./mobile/README_FRONTEND.md) for more details.
- Press `w` for Web
- Press `a` for Android (Emulator)
- Scan QR code for iOS (Expo Go)

---

## 📂 Project Structure

- **/backend:** Spring Boot application source code.
- **/mobile:** React Native (Expo) application source code (Reference).
- **README-iOS-Swift.md:** Instructions for iOS implementation option.
- **README-Android-Kotlin.md:** Instructions for Android implementation option.
