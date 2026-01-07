# TruyệnHub - Website Đọc Truyện

Website đọc truyện tranh tiếng Việt với giao diện Cyberpunk/Neon.

## 🚀 Deploy lên Render.com

### Frontend (Static Site)
1. Tạo **New Static Site** trên Render
2. Connect GitHub repo
3. Settings:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

### Backend (Web Service)
1. Tạo **New Web Service** trên Render
2. Connect GitHub repo
3. Settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

## 🛠️ Tech Stack
- **Frontend**: Vite + React
- **Backend**: Express.js + SQLite
- **Crawler**: Cheerio + node-fetch

## 📝 License
MIT
