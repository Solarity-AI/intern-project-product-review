# 🚀 Product Review Backend

This is the backend service for the Product Review Application, built with **Java 17** and **Spring Boot**. It provides a robust REST API for managing products, reviews, user wishlists, and AI-powered features.

The project follows a **clean, layered architecture** emphasizing separation of concerns, scalability, and modern development practices.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:

*   **Java Development Kit (JDK) 17** or higher
    *   Verify with: `java -version`
*   **Maven** (Optional, as the project includes the Maven Wrapper `./mvnw`)
*   **Git**
*   **IDE:** IntelliJ IDEA (Recommended) or Eclipse/VS Code

---

## 🛠️ Getting Started (From Scratch)

Follow these steps to set up the backend environment from zero:

### 1. Clone the Repository
```bash
git clone https://github.com/Solarity-AI/intern-project-engineering.git
cd intern-project-engineering/backend
```

### 2. Configure the Application
The application uses an in-memory **H2 Database** by default for development, so no external database setup is required initially.

Check `src/main/resources/application.properties` to ensure the server port is free (default: `8080`).

### 3. Build the Project
Use the Maven Wrapper to build the project and download dependencies:

**Mac/Linux:**
```bash
./mvnw clean install
```

**Windows:**
```bash
mvnw.cmd clean install
```

### 4. Run the Application
Start the Spring Boot application:

**Mac/Linux:**
```bash
./mvnw spring-boot:run
```

**Windows:**
```bash
mvnw.cmd spring-boot:run
```

The server will start at `http://localhost:8080`.

### 5. Verify Installation
Open your browser or Postman and visit:
`http://localhost:8080/api/products`

You should see a JSON response with a list of products (seeded by `DataInitializer`).

---

## ⚙️ Environment Variables & Configuration

The application is pre-configured for local development. Key settings in `application.properties`:

| Property | Default Value | Description |
| :--- | :--- | :--- |
| `server.port` | `8080` | Port the application runs on |
| `spring.datasource.url` | `jdbc:h2:mem:testdb` | In-memory database URL |
| `spring.h2.console.enabled` | `true` | Enables H2 Console at `/h2-console` |

**Production Note:** For deployment (e.g., Heroku), these values are overridden by environment variables (e.g., `JDBC_DATABASE_URL`).

---

## 📡 API Documentation

### Core Endpoints

#### 🛒 Products
*   `GET /api/products` - List all products (supports pagination, sorting, filtering)
    *   *Query Params:* `page`, `size`, `sort`, `category`, `search`
*   `GET /api/products/{id}` - Get detailed product info
*   `GET /api/products/stats` - Get global product statistics (count, avg rating)

#### ⭐ Reviews
*   `GET /api/products/{id}/reviews` - Get reviews for a product
*   `POST /api/products/{id}/reviews` - Submit a new review
*   `PUT /api/products/reviews/{id}/helpful` - Mark a review as helpful

#### 🤖 AI Features
*   `POST /api/products/{id}/chat` - Ask AI questions about a product's reviews

#### 👤 User (Wishlist & Notifications)
*   `GET /api/user/wishlist` - Get user's wishlist (IDs)
*   `GET /api/user/wishlist/products` - Get full product details for wishlist (Paged)
*   `POST /api/user/wishlist/{productId}` - Toggle product in wishlist
*   `GET /api/user/notifications` - Get user notifications

---

## 🏗️ Architecture & Key Features

The system follows a standard layered architecture:
1.  **Controller Layer:** Handles HTTP requests and maps DTOs.
2.  **Service Layer:** Contains business logic (e.g., `ProductService`, `UserService`).
3.  **Repository Layer:** Interfaces with the database using Spring Data JPA.

### Key Features
*   **Server-Side Pagination:** Efficiently handles large datasets using `Pageable`.
*   **Dynamic Filtering:** Filter products by category and search terms directly in the database.
*   **AI Integration:** Mock AI service (`AISummaryService`) simulating review analysis.
*   **Data Seeding:** `DataInitializer` automatically populates the database with sample data on startup.

---

## 🆕 Recent Improvements (Change Log)

*   **Pagination for Wishlist:** Added `/api/user/wishlist/products` to support paginated wishlist views, improving performance for users with many favorites.
*   **Global Statistics:** Added `/api/products/stats` to provide aggregate data (total reviews, average rating) for the dashboard.
*   **Enhanced Search:** Improved search functionality to filter by product name and category simultaneously.
*   **User Notifications:** Implemented a notification system for user interactions (e.g., "Review Posted").

---

## ❓ Troubleshooting

**Issue: `Address already in use`**
*   **Cause:** Another process is using port 8080.
*   **Fix:** Stop the other process or change `server.port` in `application.properties`.

**Issue: `mvnw: permission denied` (Mac/Linux)**
*   **Fix:** Run `chmod +x mvnw` to make the script executable.

**Issue: Database data is lost after restart**
*   **Cause:** H2 is an in-memory database.
*   **Fix:** This is expected behavior for dev. For persistence, configure a file-based H2 or PostgreSQL.

---

## 📚 Additional Resources

*   [Spring Boot Documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/)
*   [Spring Data JPA Guide](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/)
*   [H2 Database Console](http://localhost:8080/h2-console)
