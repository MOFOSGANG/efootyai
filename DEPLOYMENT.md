# eFooTyAi Deployment Guide for Render

## 1. Create a Web Service
- Connect your GitHub repository.
- Select **Node** as the environment.

## 2. Configuration Settings
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Plan**: Starter (or Free, but it may sleep)

## 3. Environment Variables (CRITICAL)
Add these in the Render Dashboard under **Environment**:
- `NODE_ENV`: `production`
- `MONGODB_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET`: A long random string for auth security
- `VITE_GEMINI_API_KEY`: Your Google Gemini API Key

## 4. Database Setup
- Use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Free Tier available).
- Whitelist Render IPs or allow access from everywhere (0.0.0.0/0) for testing.
