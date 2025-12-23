# Zero Trust API Implementation (DPoP & Kong Gateway)

Dự án này là một Proof of Concept (PoC) về kiến trúc **Zero Trust API**, sử dụng cơ chế **DPoP (Demonstrating Proof-of-Possession)** theo chuẩn IETF RFC 9449 để bảo vệ API chống lại các cuộc tấn công chiếm đoạt Token (Token Theft/Replay Attacks).

Hệ thống triển khai mô hình **Gateway Offloading**, trong đó API Gateway (Kong) chịu trách nhiệm thực thi chính sách bảo mật, còn Backend (Express) hoàn toàn ẩn mình trong mạng nội bộ.

## 🏗 Kiến trúc Hệ thống

Hệ thống hoạt động theo luồng: **Client** -> **API Gateway (PEP)** -> **Resource (Backend)**.

```mermaid
graph LR
    subgraph Trusted_Device [Client - ReactJS]
        C[Client App] -- HTTPS + DPoP Sig --> G
    end

    subgraph Security_Infrastructure [Zero Trust Zone]
        G[Kong Gateway (PEP)] -- Forward Request --> B[Backend API]
        I[Keycloak (PDP)] -. Issue DPoP Token .- C
    end

    style C fill:#d4f1f9,stroke:#333,stroke-width:2px
    style G fill:#ffccbc,stroke:#333,stroke-width:2px
    style B fill:#c8e6c9,stroke:#333,stroke-width:2px
    style I fill:#fff9c4,stroke:#333,stroke-width:2px
```

### Các thành phần chính:

1.  **Client (ReactJS):**
    * Tự động sinh cặp khóa Public/Private Key (ES256).
    * Gửi Public Key lên Keycloak khi đăng nhập.
    * Ký số (Sign) vào header `DPoP` cho mỗi request gửi đi bằng Private Key.

2.  **Identity Provider (Keycloak 24):**
    * Xác thực người dùng.
    * Cấp phát Access Token có chứa claim `cnf` (Confirmation) - chính là "vân tay" của Public Key client gửi lên.

3.  **API Gateway (Kong 3.6 - DB-less):**
    * Đóng vai trò Policy Enforcement Point (PEP).
    * Chặn mọi request, kiểm tra chữ ký DPoP và đối chiếu với Access Token.
    * Nếu hợp lệ: Chuyển tiếp (Proxy) xuống Backend.
    * Nếu không hợp lệ: Trả về 401/403 ngay lập tức.

4.  **Backend (ExpressJS):**
    * Chỉ chứa Business Logic.
    * Nằm trong mạng nội bộ Docker, không public ra Internet.

---

## 🛠 Yêu cầu cài đặt (Prerequisites)

* [Docker](https://www.docker.com/) & Docker Compose
* [mkcert](https://github.com/FiloSottile/mkcert) (Để tạo chứng chỉ SSL cho localhost)
* Node.js (Phiên bản 18+)

---

## 🚀 Hướng dẫn khởi chạy (Getting Started)

### Bước 1: Tạo chứng chỉ SSL (Self-signed)

Vì hệ thống triển khai Zero Trust nên bắt buộc phải có HTTPS. Chúng ta sẽ tạo chứng chỉ tin cậy cho localhost.

1.  Cài đặt `mkcert` (nếu chưa có):

    ```bash
    # Windows (Chocolatey)
    choco install mkcert
    # MacOS (Homebrew)
    brew install mkcert
    ```

2.  Khởi tạo Root CA:

    ```bash
    mkcert -install
    ```

3.  Tạo chứng chỉ cho dự án:
    Tại thư mục gốc của dự án:

    ```bash
    mkdir certs
    cd certs
    # Tạo cert chung cho tất cả service
    mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1 keycloak kong client
    cd ..
    ```

### Bước 2: Khởi động hệ thống

Sử dụng Docker Compose để dựng toàn bộ hạ tầng:

```bash
docker-compose up -d --build
```

### Bước 3: Cấu hình Keycloak (Bắt buộc)

Lần đầu chạy, bạn cần bật tính năng DPoP cho Client.

1.  Truy cập: `https://localhost:9443` (Tài khoản: `admin` / `admin`).
2.  Vào mục **Clients** -> Chọn **react-app**.
3.  Chuyển sang tab **Advanced** (hoặc Capability config tùy giao diện).
4.  Tìm mục **"Fine Grain OpenID Connect Configuration"**.
5.  Bật **OAuth 2.0 DPoP Bound Access Tokens** -> **ON**.
6.  Lưu lại (Save).

---

## ⚙️ Thông số kỹ thuật (Technical Specs)

### 1. Danh sách cổng (Ports)

| Service | Protocol | Local Port | Docker Internal | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| **Client** | HTTPS | `3000` | `5173` | Giao diện React App |
| **Kong** | HTTPS | `8443` | `8443` | Cổng vào API an toàn |
| **Keycloak** | HTTPS | `9443` | `8443` | Trang đăng nhập/Quản lý |
| **Server** | HTTP | N/A | `3000` | Backend (Ẩn, không map port) |

### 2. Cấu hình TLS/SSL

* Sử dụng chứng chỉ tự ký (`Self-signed`) tạo bởi `mkcert`.
* Cấu hình **End-to-End Encryption**: Client (HTTPS) -> Gateway (HTTPS) -> Keycloak (HTTPS).

### 3. Cơ chế ký DPoP (Client-side)

* Thư viện sử dụng: `jose` (JavaScript Object Signing and Encryption).
* Thuật toán ký: `ES256` (Elliptic Curve Digital Signature Algorithm).
* Lưu trữ khóa: `LocalStorage` (hoặc IndexedDB thông qua `oidc-client-ts`).
* **Quy trình ký:**
    1.  Tạo Header JWT với `typ: dpop+jwt`.
    2.  Payload chứa: `htu` (HTTP URI), `htm` (HTTP Method), `jti` (Unique ID).
    3.  Ký bằng Private Key và gửi kèm trong header `DPoP`.

---

## 🧪 Kiểm thử (Testing)

### ✅ Kịch bản 1: Truy cập hợp lệ (Web App)

1.  Truy cập `https://localhost:3000`.
2.  Đăng nhập.
3.  Web App sẽ tự động tạo DPoP Proof và gọi API.
4.  Kết quả: Hiển thị dữ liệu thành công.

### ❌ Kịch bản 2: Giả lập tấn công (Postman)

1.  Lấy `access_token` từ Web App (F12 -> Application -> LocalStorage).
2.  Mở Postman, tạo request GET tới `https://localhost:8443/api`.
3.  Dán token vào Authorization: Bearer ...
4.  **Kết quả:** Nhận lỗi **403 Forbidden** hoặc **401 Unauthorized**.
    * Lý do: `Zero Trust Violation: Token is not DPoP bound`.

---

## 📁 Cấu trúc thư mục

```text
.
├── certs/               # Chứa SSL Certificates (cert.pem, key.pem)
├── client/              # Source code ReactJS
├── kong/
│   └── kong.yml         # Cấu hình Route & Plugin (Lua Script) cho Kong
├── server/              # Source code ExpressJS
├── docker-compose.yml   # Orchestration
└── README.md            # Tài liệu dự án
```