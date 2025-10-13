# 🧪 Testing Modes for Amazing Kuku

## 🎯 **Quick Commands**

### **Test with Production Backend (No Local Backend Needed)**
```bash
# Switch to production mode and start frontend only
./test-production.sh

# OR manually:
./switch-env.sh production
npm run dev
```

### **Test with Local Backend (Full Local Development)**
```bash
# Switch to local mode and start both servers  
./switch-env.sh local
./start-dev.sh

# OR manually:
./switch-env.sh local
cd backend && python main.py &
npm run dev
```

### **Switch Between Modes**
```bash
# Switch to production backend
./switch-env.sh production

# Switch to local backend  
./switch-env.sh local

# Check current mode
./switch-env.sh
```

## 🔍 **What Each Mode Tests**

### **Production Mode** (`./test-production.sh`)
- ✅ Tests deployed backend integration
- ✅ Disease prediction with external API
- ✅ No local Python environment needed
- ✅ Real production environment simulation
- 🎯 **Perfect for**: Testing without running local backend

### **Local Mode** (`./start-dev.sh`)
- ✅ Full local development
- ✅ Fast backend changes and testing
- ✅ Complete debugging capabilities
- 🎯 **Perfect for**: Development and debugging

## 📱 **Testing Scenarios**

### **Disease Prediction Testing**
1. **With Production Backend**:
   ```bash
   ./test-production.sh
   # Navigate to: http://localhost:5173/disease-prediction
   # Upload image → Should work with deployed backend
   ```

2. **With Local Backend**:
   ```bash
   ./start-dev.sh  
   # Navigate to: http://localhost:5173/disease-prediction
   # Upload image → Uses your local backend
   ```

### **Authentication Testing**
Both modes use the same Supabase configuration, so authentication works identically.

### **Performance Comparison**
- **Production**: Real network latency, production environment
- **Local**: Fast local network, development environment

## 🚀 **Current Setup**

Your files are configured as:
- `.env` - Currently set to LOCAL mode
- `.env.local` - Local backend configuration  
- `.env.production` - Production backend configuration
- `switch-env.sh` - Environment switcher
- `test-production.sh` - Production testing script
- `start-dev.sh` - Full local development script

## 🎯 **Next Steps**

1. **Deploy your backend** using the deployment guide
2. **Update `.env.production`** with your actual backend URL
3. **Test with production backend** using `./test-production.sh`
4. **Compare results** between local and production modes

---

**Ready to test without local backend? Run: `./test-production.sh`** 🚀
