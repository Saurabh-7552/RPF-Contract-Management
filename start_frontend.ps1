# PowerShell script to start frontend server
Set-Location -Path "frontend"

# Install dependencies if needed
Write-Host "Installing frontend dependencies..."
npm install

# Start the development server
Write-Host "Starting frontend server..."
npm run dev



