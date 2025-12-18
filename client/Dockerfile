# client/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package.json
COPY package.json ./

# Cài đặt thư viện
RUN npm install

# Copy toàn bộ code
COPY . .

# Mở port 5173
EXPOSE 5173

# Chạy lệnh start
CMD ["npm", "start"]