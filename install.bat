@echo off
echo Installing dependencies...
npm install

echo Building project...
npm run build

echo.
echo Installation complete! You can now run the server with 'npm start'
echo To test the direct API example, run 'node dist/example_direct_api.js "Your prompt here"'
echo.
