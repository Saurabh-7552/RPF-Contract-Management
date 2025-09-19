# PowerShell script to start backend server
# Get the script directory and navigate to backend
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $scriptDir "backend"
Set-Location -Path $backendDir

Write-Host "Current directory: $(Get-Location)"
Write-Host "Backend directory: $backendDir"

# Set environment variables
$env:DATABASE_URL = "postgresql+asyncpg://postgres:verma2017@localhost:5432/rfp_contracts"
$env:SECRET_KEY = "test-secret-key-for-e2e-testing"

# Install dependencies if needed
Write-Host "Installing dependencies..."
pip install email-validator python-multipart

# Verify app module can be imported
Write-Host "Testing app module import..."
python -c "import app.main; print('✅ App module imported successfully')"

# Start the server
Write-Host "Starting backend server from: $(Get-Location)"
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000



