@echo off
echo Starting Zipzy Development Server...
echo.
echo Prerequisites check:
echo Node.js: 
node --version
echo npm: 
npm --version
echo.
echo Installing dependencies...
npm install --legacy-peer-deps
echo.
echo Starting development server...
echo App will be available at: http://localhost:5173
echo.
npm run dev
