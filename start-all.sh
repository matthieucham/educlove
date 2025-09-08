#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
    echo -e "${2}${1}${NC}"
}

# Function to cleanup on exit
cleanup() {
    print_message "\n🛑 Shutting down all services..." "$YELLOW"
    
    # Kill backend server
    if [ ! -z "$BACKEND_PID" ]; then
        print_message "Stopping backend server..." "$YELLOW"
        kill $BACKEND_PID 2>/dev/null
    fi
    
    # Kill frontend server
    if [ ! -z "$FRONTEND_PID" ]; then
        print_message "Stopping frontend server..." "$YELLOW"
        kill $FRONTEND_PID 2>/dev/null
    fi
    
    # Stop Docker containers
    print_message "Stopping Docker containers..." "$YELLOW"
    docker-compose down
    
    print_message "✅ All services stopped!" "$GREEN"
    exit 0
}

# Trap CTRL+C and other termination signals
trap cleanup INT TERM EXIT

# Main script starts here
print_message "🚀 EduClove Development Environment Startup" "$BLUE"
print_message "==========================================" "$BLUE"

# Start Docker containers (MongoDB and Mongo Express)
print_message "\n🐳 Starting Docker containers..." "$BLUE"
docker-compose up -d

if [ $? -ne 0 ]; then
    print_message "❌ Failed to start Docker containers" "$RED"
    exit 1
fi

print_message "✅ Docker containers started!" "$GREEN"

# Give MongoDB a moment to initialize
sleep 3

# Start backend server with hot reload
print_message "\n🐍 Starting backend server (with hot reload)..." "$BLUE"
cd backend

# Activate existing virtual environment
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
else
    print_message "⚠️  Virtual environment not found at backend/venv" "$YELLOW"
    print_message "   Please create it first with: python3 -m venv backend/venv" "$YELLOW"
    print_message "   Then install dependencies: pip install -r backend/requirements.txt" "$YELLOW"
    exit 1
fi

# Start backend with uvicorn hot reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Start frontend server with hot reload
print_message "\n⚛️  Starting frontend server (with hot reload)..." "$BLUE"
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_message "⚠️  node_modules not found in frontend/" "$YELLOW"
    print_message "   Please install dependencies first with: npm install" "$YELLOW"
    exit 1
fi

# Start frontend with Vite hot reload (dev mode)
npm run dev &
FRONTEND_PID=$!
cd ..

# Give services a moment to start
sleep 5

# Display status
print_message "\n✨ Development environment is running!" "$GREEN"
print_message "==========================================" "$GREEN"
print_message "📦 MongoDB:        http://localhost:27017" "$BLUE"
print_message "🗄️  Mongo Express:  http://localhost:8081" "$BLUE"
print_message "🔧 Backend API:    http://localhost:8000    (hot reload enabled)" "$BLUE"
print_message "📚 API Docs:       http://localhost:8000/docs" "$BLUE"
print_message "🎨 Frontend:       http://localhost:5173    (hot reload enabled)" "$BLUE"
print_message "==========================================" "$GREEN"
print_message "\n🛑 Press CTRL+C to stop all services" "$YELLOW"
print_message "\n💡 Hot reload is enabled for both backend and frontend" "$GREEN"
print_message "   - Backend: Changes to Python files will auto-reload" "$GREEN"
print_message "   - Frontend: Changes to React/TypeScript files will auto-reload" "$GREEN"

# Keep the script running
wait
