# JewelFlow ERP | Jewellery Inventory & POS System

A comprehensive jewellery inventory management, point-of-sale (POS), and employee analytics system supporting both **Retail Showroom** (B2C with HUID, making charges, old gold exchange) and **Wholesale B2B** (bulk lots, fine gold ledger, delivery challans).

---

## 🚀 Quick Start (Local Setup)

### 1. Start Backend Server
```bash
cd server
npm install
npm start
```
*Backend runs on `http://localhost:5000`*

### 2. Start Frontend Web Client
```bash
cd client
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000`*

---

## 🌐 Deploying Live Online

### 1. Deploy Frontend (Vercel / Netlify)
1. Import your GitHub repository to [Vercel](https://vercel.com).
2. Set **Root Directory** to `client`.
3. Set **Framework Preset** to `Vite`.
4. Deploy!

### 2. Deploy Backend (Render / Railway)
1. Create a new Web Service on [Render](https://render.com).
2. Connect your GitHub repository and set **Root Directory** to `server`.
3. Set **Build Command** to `npm install` and **Start Command** to `node src/server.js`.
4. Deploy!
