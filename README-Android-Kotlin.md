# 🤖 Android Frontend (Kotlin) - Option 2

This document outlines the requirements and structure if you choose to implement the frontend using **Kotlin (Android)**.

## 🎯 Objective
Develop a native Android application that consumes the Spring Boot backend API.

## 🛠️ Tech Stack Requirements
- **Language:** Kotlin
- **UI Toolkit:** Jetpack Compose (preferred) or XML Layouts
- **Architecture:** MVVM (Model-View-ViewModel) with Clean Architecture principles
- **Networking:** Retrofit + OkHttp
- **Dependency Injection:** Hilt or Koin
- **Image Loading:** Coil or Glide

## 📱 Key Features to Implement
1.  **Product List:** RecyclerView or LazyColumn to display products.
2.  **Product Details:** Screen showing details, rating breakdown, and AI summary.
3.  **Reviews:** List reviews with pagination support.
4.  **Add Review:** BottomSheet or Dialog to submit reviews.
5.  **AI Integration:** Handle and display `aiSummary` data.

## 📂 Recommended Project Structure
```
com.example.productreview/
├── data/
│   ├── api/
│   │   ├── ApiService.kt
│   ├── model/
│   │   ├── Product.kt
│   │   ├── Review.kt
│   ├── repository/
├── domain/
│   ├── usecase/
├── ui/
│   ├── components/
│   │   ├── ProductCard.kt
│   │   ├── ReviewItem.kt
│   ├── screens/
│   │   ├── ProductListScreen.kt
│   │   ├── ProductDetailScreen.kt
│   ├── theme/
│   ├── MainActivity.kt
```

## 🚀 Getting Started
1.  Open Android Studio and create a new project (Empty Compose Activity).
2.  Add dependencies (Retrofit, Coil, Hilt) in `build.gradle`.
3.  Configure `AndroidManifest.xml` for Internet permission.
4.  Connect to the backend API (default: `http://10.0.2.2:8080` for emulator).

## 🧪 Testing
- Write Unit Tests for Repositories and ViewModels (JUnit, MockK).
- Write UI Tests using Compose Test Rule.
