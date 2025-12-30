# Product Review Application - Backend

Bu dizin, Product Review Application projesinin backend (arka yüz) kaynak kodlarını içermektedir. Proje, Spring Boot kullanılarak geliştirilmiş modern bir RESTful API mimarisine sahiptir.

## 🚀 Teknolojiler

- **Java 17**
- **Spring Boot 3.2.1**
- **Spring Data JPA**: Veritabanı işlemleri ve ORM için.
- **H2 Database**: Hafıza içi (in-memory) veritabanı, yerel geliştirme ve test kolaylığı sağlar.
- **Lombok**: Boilerplate kodları (getter, setter, constructor vb.) azaltmak için.
- **Jakarta Validation**: Giriş verilerinin doğrulanması (rating aralığı, karakter limitleri vb.) için.
- **Maven**: Proje yönetimi ve bağımlılık yönetimi için.

## 🏗️ Mimari Yapı

Proje, temiz kod prensiplerine uygun olarak katmanlı bir mimari ile yapılandırılmıştır:

- **`controller`**: API uç noktalarını (endpoints) tanımlar ve HTTP isteklerini karşılar.
- **`service`**: İş mantığının (business logic) yürütüldüğü katmandır.
- **`repository`**: Veritabanı erişim işlemlerini (CRUD) yönetir.
- **`model`**: Veritabanı tablolarını temsil eden entity sınıfları.
- **`dto` (Data Transfer Objects)**: API yanıtlarında entity nesnelerini doğrudan dışarı açmamak ve veriyi soyutlamak için kullanılan sınıflar.
- **`exception`**: Merkezi hata yönetimi (Global Exception Handling) mekanizması.

## 🔗 API Uç Noktaları

### Ürünler (Products)

| Method | Endpoint | Açıklama |
| :--- | :--- | :--- |
| `GET` | `/api/products` | Tüm ürünleri sayfalı ve sıralı bir şekilde listeler. |
| `GET` | `/api/products/{id}` | Belirtilen ID'ye sahip ürünün detaylarını getirir. |

**Örnek Sorgu (Sayfalama & Sıralama):**
`GET /api/products?page=0&size=5&sort=name,asc`

### Yorumlar (Reviews)

| Method | Endpoint | Açıklama |
| :--- | :--- | :--- |
| `GET` | `/api/products/{id}/reviews` | Bir ürüne ait tüm yorumları listeler. |
| `POST` | `/api/products/{id}/reviews` | Bir ürüne yeni bir yorum ve puan ekler. |

## 🛠️ Kurulum ve Çalıştırma

> **Önemli:** Uygulamayı çalıştırmak için sisteminizde **Java 17** veya üzeri bir sürüm yüklü olmalı ve `JAVA_HOME` ortam değişkeni bu Java dizinini göstermelidir.

1.  Projenin ana dizinine gidin: `cd backend`
2.  Uygulamayı çalıştırın:
    - **Windows:** `.\mvnw.cmd spring-boot:run`
    - **Linux/macOS:** `./mvnw spring-boot:run`
3.  Uygulama varsayılan olarak `http://localhost:8080` adresinde çalışacaktır.

### H2 Konsol Erişimi
Uygulama çalışırken veritabanını incelemek için:
- **URL**: `http://localhost:8080/h2-console`
- **JDBC URL**: `jdbc:h2:mem:testdb`
- **Kullanıcı**: `sa`
- **Şifre**: `password`

## 🧪 Testler

Proje hem birim testleri hem de entegrasyon testleri içermektedir:

- **Birim Testleri (Unit Tests)**: `ProductServiceTest` sınıfı üzerinden servis katmanı mantığı test edilir.
- **Entegrasyon Testleri (Integration Tests)**: `ProductControllerIntegrationTest` sınıfı ile API uç noktaları MockMvc kullanılarak test edilir.

Testleri çalıştırmak için:
- **Windows:** `.\mvnw.cmd test`
- **Linux/macOS:** `./mvnw test`

## ✨ Önemli Özellikler

- **Otomatik Veri Başlatma**: Uygulama ayağa kalktığında `DataInitializer` sınıfı sayesinde örnek ürünler ve yorumlar otomatik olarak veritabanına yüklenir.
- **Giriş Doğrulama**: Yorumlar için 1-5 arası puan kısıtlaması ve minimum yorum uzunluğu kontrolü gibi validasyonlar mevcuttur.
- **Global Hata Yönetimi**: Hatalar, istemciye anlamlı ve tutarlı JSON formatında dönülür.
