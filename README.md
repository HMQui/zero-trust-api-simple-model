# Zero Trust API Implementation (DPoP & Kong Gateway)

Dự án này là một Proof of Concept (PoC) về kiến trúc **Zero Trust API**, sử dụng cơ chế **DPoP (Demonstrating Proof-of-Possession)** theo chuẩn IETF RFC 9449 để bảo vệ API chống lại các cuộc tấn công chiếm đoạt Token (Token Theft/Replay Attacks).

Hệ thống triển khai mô hình **Gateway Offloading**, trong đó API Gateway (Kong) chịu trách nhiệm thực thi chính sách bảo mật, còn Backend (Express) hoàn toàn ẩn mình trong mạng nội bộ.

## 🏗 Kiến trúc Hệ thống

Hệ thống hoạt động theo luồng: **Client** -> **API Gateway (PEP)** -> **Resource (Backend)**.

### Các thành phần chính:

1.  **Client (ReactJS):**
    * Tự động sinh cặp khóa Public/Private Key (ES256).
    * Gửi Public Key lên Keycloak khi đăng nhập.
    * Ký số (Sign) vào header `DPoP` cho mỗi request gửi đi bằng Private Key.
# Zero Trust API — Proof of Concept (DPoP + Kong)

Dự án này là PoC cho kiến trúc Zero Trust bảo vệ API bằng DPoP (Demonstration of Proof-of-Possession, theo RFC 9449). Hệ thống sử dụng Kong làm API Gateway (PEP) và Keycloak làm Identity Provider (PDP); backend (Express) nằm trong mạng nội bộ và chỉ nhận request đã được xác thực và ràng buộc DPoP.

## Kiến trúc tổng quan

Luồng chính: Client (React) → Kong (Gateway/PEP) → Backend (Resource Server). Keycloak cấp và quản lý Access Token có claim `cnf` ràng buộc public key của client.

### Thành phần
- Client (React): tạo cặp khóa ES256, gửi public key lên Keycloak khi đăng nhập, ký DPoP proof cho mỗi request.
- Keycloak: xác thực người dùng, cấp Access Token có `cnf` claim.
- Kong (DB-less): thực thi kiểm tra DPoP và policy, proxy request đến backend khi hợp lệ.
- Backend (Express): chỉ chứa business logic, nằm trong mạng nội bộ Docker.

## Yêu cầu
- Docker & Docker Compose
- Node.js 18+
- mkcert (để tạo chứng chỉ HTTPS cho localhost — khuyên dùng cho môi trường dev)

## Thiết lập nhanh (Development)

1) Tạo chứng chỉ tin cậy cho localhost (ví dụ dùng mkcert):

```bash
# Windows (chocolatey):
choco install mkcert
mkcert -install
mkdir certs && cd certs
mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1
cd ..
```

2) Khởi dựng toàn bộ stack bằng Docker Compose:

```bash
docker-compose up -d --build
```

3) Cấu hình Keycloak (lần đầu):
- Mở https://localhost:9443, đăng nhập bằng tài khoản admin.
- Vào **Clients** → chọn client (ví dụ `react-app`) → bật **DPoP-bound access tokens** (Fine Grain OpenID Connect / DPoP setting) → Save.

Ghi chú: URL và cổng có thể khác tùy file `docker-compose.yml` và cấu hình trong `kong/kong.yml`.

## Ports mẫu

- Client (Vite dev server): host `3000` → container internal `5173` (nếu dùng Vite)
- Kong (HTTPS): host `8443` → container `8443`
- Keycloak (HTTPS): host `9443` → container `8443`
- Backend (Express): thường chạy trong mạng Docker, không map ra host (internal `3000`)

Kiểm tra file `docker-compose.yml` để biết mapping thực tế.

## Kiểm thử ngắn

- Mở https://localhost:3000 → đăng nhập → app sẽ sinh DPoP proof và gọi API qua Kong.
- Nếu thử gửi token không ràng buộc DPoP (ví dụ từ Postman), Kong sẽ từ chối (401/403).

## Cấu trúc thư mục

```
.
├── certs/               # Chứng chỉ SSL cho dev
├── client/              # React app (Vite)
├── kong/                # Cấu hình Kong (kong.yml)
├── server/              # Express backend
├── docker-compose.yml
└── README.md
```

---
