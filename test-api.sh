#!/bin/bash

# Amazing Kuku API Testing Script
echo "🧪 Testing Amazing Kuku API Integration..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test URLs
LOCAL_API="http://localhost:8000"
EXTERNAL_API="https://apipoultrydisease.onrender.com"

echo -e "\n${YELLOW}1. Testing External Disease Prediction API...${NC}"
if curl -s --fail "${EXTERNAL_API}/docs" > /dev/null; then
    echo -e "${GREEN}✅ External API is accessible${NC}"
else
    echo -e "${RED}❌ External API is not accessible${NC}"
fi

echo -e "\n${YELLOW}2. Testing Local Backend API...${NC}"
if curl -s --fail "${LOCAL_API}/" > /dev/null; then
    echo -e "${GREEN}✅ Local API is running${NC}"
    
    # Test health endpoint
    echo -e "\n${YELLOW}3. Testing Health Check...${NC}"
    HEALTH_RESPONSE=$(curl -s "${LOCAL_API}/health")
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✅ Health check successful${NC}"
        echo "Response: $HEALTH_RESPONSE"
    else
        echo -e "${RED}❌ Health check failed${NC}"
    fi
else
    echo -e "${RED}❌ Local API is not running${NC}"
    echo "Make sure to start the backend server first:"
    echo "cd backend && python main.py"
fi

echo -e "\n${YELLOW}4. Testing with Sample Image...${NC}"
if [ -f "backend/test_images/tomato.jpg" ]; then
    echo "Testing with tomato.jpg..."
    
    # Test external API directly
    echo -e "\n${YELLOW}4a. Testing External API directly...${NC}"
    DIRECT_RESPONSE=$(curl -s -X POST "${EXTERNAL_API}/predict/" \
        -H "accept: application/json" \
        -H "Content-Type: multipart/form-data" \
        -F "file=@backend/test_images/tomato.jpg")
    
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✅ External API prediction successful${NC}"
        echo "Response: $DIRECT_RESPONSE"
    else
        echo -e "${RED}❌ External API prediction failed${NC}"
    fi
    
    # Test through local API
    if curl -s --fail "${LOCAL_API}/" > /dev/null; then
        echo -e "\n${YELLOW}4b. Testing through Local API...${NC}"
        LOCAL_RESPONSE=$(curl -s -X POST "${LOCAL_API}/predict" \
            -H "accept: application/json" \
            -H "Content-Type: multipart/form-data" \
            -F "file=@backend/test_images/tomato.jpg" \
            -F "crop_type=poultry")
        
        if [[ $? -eq 0 ]]; then
            echo -e "${GREEN}✅ Local API prediction successful${NC}"
            echo "Response: $LOCAL_RESPONSE"
        else
            echo -e "${RED}❌ Local API prediction failed${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  No test image found at backend/test_images/tomato.jpg${NC}"
    echo "You can test manually by uploading an image through the web interface"
fi

echo -e "\n${YELLOW}5. Frontend Integration Test...${NC}"
if curl -s --fail "http://localhost:5173" > /dev/null; then
    echo -e "${GREEN}✅ Frontend is running at http://localhost:5173${NC}"
    echo "You can now test the disease prediction feature through the web interface!"
else
    echo -e "${RED}❌ Frontend is not running${NC}"
    echo "Start the frontend with: npm run dev"
fi

echo -e "\n${GREEN}🎉 API Integration Testing Complete!${NC}"
echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Open http://localhost:5173 in your browser"
echo "2. Navigate to Disease Prediction page"
echo "3. Upload a poultry image to test the integration"
echo "4. Check both 'Integrated Tool' and 'External Tool' options"
