# 🚀 Amazing Kuku - Production Deployment Guide

## 🎯 **The Problem**
When deployed to Vercel, your frontend tries to connect to `http://localhost:8000` which doesn't exist in production, causing the `ERR_CONNECTION_REFUSED` error.

## 🏗️ **Solution: Deploy Backend + Frontend Separately**

### **Step 1: Deploy Backend to Railway (Recommended)**

#### **1.1 Create Railway Account**
- Go to [railway.app](https://railway.app)
- Sign up with GitHub
- Connect your repository

#### **1.2 Deploy Backend**
```bash
# In your project root, the following files are already created:
# - railway.toml (Railway configuration)
# - Procfile (Process configuration) 
# - runtime.txt (Python version)
# - backend/requirements.txt (Dependencies)
```

1. **Create New Railway Project**
2. **Connect GitHub Repository**: `BINABASS091/amazing-kuku`
3. **Railway will auto-detect Python** and deploy your backend
4. **Your backend will be available at**: `https://your-app-name.railway.app`

#### **1.3 Alternative: Deploy Backend to Render**
- Go to [render.com](https://render.com)
- Create "New Web Service"
- Connect GitHub repo
- Configure:
  - **Build Command**: `cd backend && pip install -r requirements.txt`
  - **Start Command**: `cd backend && python main.py`
  - **Environment**: Python 3

### **Step 2: Deploy Frontend to Vercel**

#### **2.1 Update Environment Variables**
```bash
# Copy environment template
cp .env.example .env

# Update .env with your deployed backend URL:
VITE_API_BASE_URL=https://your-backend-app.railway.app
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

#### **2.2 Deploy to Vercel**
```bash
# Option 1: Vercel CLI
npm i -g vercel
vercel

# Option 2: GitHub Integration
# - Go to vercel.com
# - Connect GitHub repo BINABASS091/amazing-kuku
# - Auto-deploy on every push
```

#### **2.3 Configure Vercel Environment Variables**
In Vercel Dashboard → Settings → Environment Variables:
```
VITE_API_BASE_URL = https://your-backend-app.railway.app
VITE_SUPABASE_URL = your_supabase_url
VITE_SUPABASE_ANON_KEY = your_supabase_key
```

### **Step 3: Test Production Deployment**

#### **3.1 Backend Health Check**
```bash
curl https://your-backend-app.railway.app/
# Should return: {"message":"Amazing Kuku - Poultry Disease Prediction API is running"...}

curl https://your-backend-app.railway.app/health
# Should return health status
```

#### **3.2 Frontend Test**
- Open your Vercel app: `https://your-app.vercel.app`
- Navigate to Disease Prediction
- Upload an image
- Should work without connection errors!

## 🔧 **Alternative Deployment Options**

### **Option 2: Netlify + Railway**
```bash
# Build command for Netlify
npm run build

# Publish directory
dist
```

### **Option 3: All-in-One with Railway**
Deploy both frontend and backend to Railway:
```toml
# railway.toml (updated)
version: "3"

services:
  backend:
    source: ./backend
    build:
      commands:
        - pip install -r requirements.txt
    start:
      command: python main.py

  frontend:
    source: .
    build:
      commands:
        - npm install
        - npm run build
    start:
      command: npm run preview
```

## 📋 **Deployment Checklist**

### **Backend Deployment** ✅
- [ ] Railway/Render account created
- [ ] Repository connected
- [ ] Environment variables configured
- [ ] Backend URL obtained
- [ ] Health check passes

### **Frontend Deployment** ✅ 
- [ ] Backend URL updated in environment
- [ ] Vercel account created
- [ ] Repository connected
- [ ] Environment variables set
- [ ] Build successful
- [ ] Disease prediction works

### **Testing** ✅
- [ ] Frontend loads correctly
- [ ] Authentication works
- [ ] Disease prediction connects to backend
- [ ] External API integration works
- [ ] No CORS errors
- [ ] All features functional

## 🚨 **Common Issues & Solutions**

### **Issue 1: CORS Errors**
```python
# In backend/main.py - already configured
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### **Issue 2: Environment Variables Not Loading**
- Ensure variables are set in both platforms
- Check variable names match exactly
- Redeploy after adding variables

### **Issue 3: Build Failures**
```bash
# Check build logs
# Common fixes:
npm install  # Install dependencies
npm run build  # Test build locally
```

## 🎯 **Final URLs**
After successful deployment:
- **Frontend**: `https://amazing-kuku.vercel.app`
- **Backend**: `https://amazing-kuku-backend.railway.app`
- **API Docs**: `https://amazing-kuku-backend.railway.app/docs`

## 🎉 **Result**
Your disease prediction will work perfectly in production:
- ✅ No more `ERR_CONNECTION_REFUSED` errors
- ✅ Frontend connects to deployed backend
- ✅ Backend connects to external AI API
- ✅ Full end-to-end functionality

---

**Ready to deploy? Start with Step 1 (Backend deployment) and then proceed to Step 2 (Frontend deployment)!**
