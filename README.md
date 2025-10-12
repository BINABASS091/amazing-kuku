# Amazing Kuku - Poultry Management System

🐔 A comprehensive poultry management system with AI-powered disease detection

## 🚀 Features

- **Farmer Management**: Complete farmer profile and farm management
- **Batch Tracking**: Monitor poultry batches with detailed analytics
- **Disease Prediction**: AI-powered disease detection using computer vision
- **Device Management**: IoT device integration for environmental monitoring
- **Multi-language Support**: English and Swahili languages
- **Admin Dashboard**: Complete administrative control panel
- **Real-time Alerts**: Health and environmental alerts system

## 🛠 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Vite** for build optimization
- **React Router** for navigation
- **Supabase** for backend services

### Backend
- **FastAPI** for API development
- **Python 3.8+** runtime
- **External AI API** for disease prediction
- **Supabase** for database and authentication

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/BINABASS091/amazing-kuku.git
cd amazing-kuku
```

### 2. Environment Setup
```bash
# Copy environment variables
cp .env.example .env

# Edit .env with your actual values
nano .env
```

### 3. Quick Start (Recommended)
```bash
# Make the start script executable
chmod +x start-dev.sh

# Start both frontend and backend
./start-dev.sh
```

### 4. Manual Setup

#### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

#### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
python main.py
```

## 🔌 Disease Prediction API Integration

### External API Details
- **API URL**: `https://apipoultrydisease.onrender.com`
- **Documentation**: `https://apipoultrydisease.onrender.com/docs`
- **Endpoint**: `POST /predict/`

### How It Works

1. **Local Backend Integration**: Your FastAPI backend (`backend/main.py`) acts as a proxy
2. **External AI Service**: Connects to the external poultry disease prediction API
3. **Unified Interface**: Frontend uses a single API endpoint that handles the external service

### API Response Format
```json
{
  "prediction": "Healthy",
  "confidence": 0.99,
  "confidence_percentage": "99.03%",
  "timestamp": "2025-10-12T10:30:00Z",
  "filename": "chicken_image.jpg",
  "image_size": "800x600",
  "source": "external_api"
}
```

### Integration Benefits
- **Seamless User Experience**: No external redirects needed
- **Error Handling**: Robust error handling with fallbacks
- **Data Consistency**: Unified response format
- **Authentication**: Works with your existing auth system
- **History Tracking**: Can save predictions to your database

## 📱 Usage

### Accessing the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### User Roles
- **Admin**: Complete system management
- **Farmer**: Farm and batch management with disease prediction

### Disease Prediction Usage
1. Navigate to Disease Prediction page
2. Choose between "Integrated Tool" or "External Tool"
3. Upload a clear image of your poultry
4. Get instant AI-powered analysis
5. View prediction history

## 🔧 Configuration

### Environment Variables
```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key

# API Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_EXTERNAL_DISEASE_API=https://apipoultrydisease.onrender.com

# App Configuration
VITE_APP_NAME=Amazing Kuku
VITE_APP_VERSION=1.0.0
```

### Backend Configuration
The backend automatically connects to the external disease prediction API. No additional configuration required.

## 🧪 Testing the Integration

### Test Disease Prediction API
```bash
# Test external API directly
curl -X POST "https://apipoultrydisease.onrender.com/predict/" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/your/image.jpg"

# Test through your backend
curl -X POST "http://localhost:8000/predict" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/your/image.jpg" \
  -F "crop_type=poultry"
```

### Health Check
```bash
# Check backend health and external API connectivity
curl http://localhost:8000/health
```

## 📊 Database Schema

The system uses Supabase with the following main tables:
- `users` - User authentication and profiles
- `farmers` - Farmer-specific information
- `farms` - Farm registration and details
- `batches` - Poultry batch tracking
- `devices` - IoT device management
- `disease_predictions` - Disease prediction history
- `alerts` - System alerts and notifications

## 🚀 Deployment

### Frontend (Netlify/Vercel)
1. Build the project: `npm run build`
2. Deploy the `dist` folder
3. Set environment variables in deployment platform

### Backend (Railway/Render)
1. Deploy the `backend` folder
2. Set Python version to 3.8+
3. Install dependencies: `pip install -r requirements.txt`
4. Start command: `python main.py`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the API documentation at `/docs` endpoint
- Review the external API docs at https://apipoultrydisease.onrender.com/docs

## 🎯 Next Steps

1. **Save Predictions**: Implement prediction history saving to database
2. **Real-time Notifications**: Add WebSocket support for real-time alerts
3. **Mobile App**: Develop React Native mobile application
4. **Offline Support**: Add offline prediction capabilities
5. **Advanced Analytics**: Implement detailed farm analytics dashboard

---

**Made with ❤️ for the poultry farming community**
