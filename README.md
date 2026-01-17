# 📱 Product Review Full-Stack Application

Welcome to the **Product Review Application**! This project is a comprehensive full-stack ecosystem designed to demonstrate modern software architecture, clean code principles, and seamless cross-platform integration.

The system allows users to explore products, manage wishlists, interact with an AI Assistant for review analysis, and submit real-time feedback.

---

## 🚀 Quick Start (Onboarding Guide)

Follow these steps to get the entire environment running on your local machine from scratch.

### 1. Prerequisites
Ensure you have the following installed:
*   **Java JDK 17+**
*   **Node.js 20+** & **npm**
*   **Git**
*   **Android Studio / Xcode** (for mobile emulation) or **Expo Go** on a physical device.

### 2. Backend Setup
```bash
cd backend
./mvnw clean install
./mvnw spring-boot:run
```
*   **API Base URL:** `http://localhost:8080`
*   **H2 Console:** `http://localhost:8080/h2-console` (User: `sa`, Password: [empty])

### 3. Frontend Setup (React Native / Expo)
```bash
cd mobile
npm install
npx expo start
```
*   Press **'w'** for Web version.
*   Press **'a'** for Android Emulator.
*   Scan the QR code with **Expo Go** for physical device testing.

---

## 🏗️ Technical Architecture

The project follows a **Layered Clean Architecture** to ensure maintainability and testability.

### Backend (Spring Boot)
*   **Controller Layer:** REST API design with versioning and DTO mapping.
*   **Service Layer:** Business logic encapsulation with Dependency Inversion.
*   **Data Layer:** Spring Data JPA with optimized SQL queries for filtering and aggregation.
*   **Security:** (Planned) JWT-based authentication and RBAC.

### Frontend (React Native & Web)
*   **State Management:** React Context API for Wishlist, Search, and Notifications.
*   **Responsive Design:** Adaptive layouts for Mobile (Android/iOS) and Web (Vercel).
*   **Networking:** Centralized API service with race-condition protection and abort controllers.

---

## 🧩 Key Features & Recent Improvements

### 🛒 Advanced Product Management
*   **Server-Side Pagination:** Efficiently handles large datasets for both main product list and user wishlist.
*   **Dynamic Multi-Filter:** Search by name and filter by category simultaneously at the database level.
*   **Global Statistics:** Real-time dashboard showing total reviews and average ratings across the platform.

### 🤖 AI-Powered Insights
*   **AI Assistant:** Interactive chat interface to ask specific questions about product reviews.
*   **AI Summary:** Automated sentiment analysis and summary of user feedback.

### 👤 User Experience (UX)
*   **Search History:** Persistent search overlay for quick access to previous queries.
*   **Multi-Select Wishlist:** Batch actions for managing favorite products.
*   **Auto-Refresh:** Real-time UI updates immediately after submitting a review without manual reload.
*   **Dark Mode:** System-wide theme support with persistent user preference.

---

## 📂 Project Structure

```text
.
├── backend/                # Java Spring Boot Source Code
│   ├── src/main/java/      # Business logic & API Controllers
│   └── README.md           # Detailed Backend Documentation
├── mobile/                 # React Native (Expo) Source Code
│   ├── src/components/     # Reusable UI Components
│   ├── src/screens/        # Screen-level Components
│   ├── src/context/        # Global State Management
│   └── vercel.json         # Web Deployment Configuration
└── README.md               # Main Project Entry Point
```

---

## 🌐 Deployment

*   **Backend:** Hosted on **Heroku** (Eco/Basic Dynos).
*   **Web Frontend:** Hosted on **Vercel** (SPA Routing enabled).
*   **Mobile App:** Distributed via **EAS Build (APK)** with **OTA Updates** support.

---

## 🎓 Internship Assignment

Future interns are expected to:
1.  Understand the **Backend API** provided in this repository.
2.  Implement a **Native Frontend** (iOS/Swift or Android/Kotlin) that matches the features of the React Native reference implementation.
3.  Refer to `mobile/README-iOS-Swift.md` or `mobile/README-Android-Kotlin.md` for specific requirements.

---

## 🛠️ Troubleshooting

*   **Port 8080 Conflict:** If the backend fails to start, check if another process is using port 8080.
*   **Network Issues:** Ensure the `BASE_URL` in `mobile/src/services/api.ts` matches your backend IP (use local IP for physical devices).
*   **Vercel 404 on Refresh:** Fixed via `vercel.json` rewrites. If issues persist, ensure the file is in the `mobile/` root.

---

**Maintained by:** @MehmetBegun & Engineering Team
**Last Updated:** January 2026
