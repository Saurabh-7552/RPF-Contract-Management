# RFP Contract Management System

A modern, full-stack application for managing Request for Proposal (RFP) processes between buyers and suppliers. This system streamlines the entire RFP lifecycle from creation to contract award.

## 🚀 Overview

The RFP Contract Management System is designed to facilitate efficient communication and collaboration between buyers and suppliers during the procurement process. It provides a secure, scalable platform for managing RFPs, document versioning, supplier responses, and contract lifecycle management.

### Key Features

- **🔐 Secure Authentication**: JWT-based authentication with role-based access control
- **📝 RFP Management**: Create, publish, and manage RFPs with full lifecycle tracking
- **📄 Document Versioning**: Track document changes with version control and rollback capabilities
- **💬 Supplier Responses**: Streamlined response submission and review process
- **🔍 Advanced Search**: Full-text search across RFPs with filtering capabilities
- **📧 Email Notifications**: Automated notifications for key events
- **📊 Analytics**: Track RFP performance and supplier engagement
- **🔒 Security**: Comprehensive security scanning and vulnerability management

## 🛠 Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.11)
- **Database**: PostgreSQL 15+ with async SQLAlchemy
- **ORM**: SQLAlchemy with Alembic migrations
- **Authentication**: JWT with refresh tokens, Passlib (bcrypt)
- **File Storage**: AWS S3 with presigned URLs
- **Email**: SendGrid integration
- **Background Tasks**: Celery with Redis
- **Search**: PostgreSQL full-text search (tsvector)
- **Testing**: pytest with async support

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Testing**: Vitest + React Testing Library + Playwright

### Infrastructure
- **CI/CD**: GitHub Actions
- **Security**: CodeQL, Dependabot, security scanning
- **Performance**: Locust load testing, Lighthouse audits
- **Monitoring**: Health checks, performance metrics

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis (optional, for background tasks)

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd rfp_contract_management

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials (see sample below)

# Run database migrations
alembic upgrade head

# Start the development server
uvicorn app.main:app --reload
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Optional: Background Tasks

```bash
# Start Redis (for background tasks)
# Windows (if installed via Chocolatey)
redis-server
# Linux/Mac
redis-server
# Or use Docker
docker run -d -p 6379:6379 redis:alpine

# Start Celery worker (in separate terminal)
cd backend
celery -A app.celery_app worker -l info
```

**Note**: If Redis is not available, the system will automatically fall back to FastAPI BackgroundTasks for development.

## 🔧 Environment Configuration

### Sample .env file

```bash
# Database
DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost:5432/rfp_contracts

# Security
SECRET_KEY=your-super-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AWS S3 (optional - falls back to local storage)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET=your-s3-bucket-name
S3_REGION=us-east-1

# Email (optional - falls back to console logging)
SENDGRID_KEY=your-sendgrid-api-key
SENDGRID_FROM=noreply@yourdomain.com

# Redis (optional - falls back to FastAPI BackgroundTasks)
REDIS_URL=redis://localhost:6379

# Elasticsearch (optional - not implemented yet)
ELASTIC_URL=http://localhost:9200
```

## 👥 Demo Accounts

For testing purposes, you can create demo accounts:

### Buyer Account
- **Email**: `buyer@demo.com`
- **Password**: `demo123`
- **Role**: Buyer
- **Permissions**: Create RFPs, manage responses, award contracts

### Supplier Account
- **Email**: `supplier@demo.com`
- **Password**: `demo123`
- **Role**: Supplier
- **Permissions**: View published RFPs, submit responses

### Admin Account
- **Email**: `admin@demo.com`
- **Password**: `admin123`
- **Role**: Buyer (with elevated permissions)
- **Permissions**: Full system access, user management

## 🏗 System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React SPA     │    │   FastAPI       │    │   PostgreSQL    │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   TailwindCSS   │    │   Celery        │    │   Redis         │
│   (Styling)     │    │   (Tasks)       │    │   (Cache)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   AWS S3        │
                       │   (Storage)     │
                       └─────────────────┘
```

## 📊 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

### RFP Management
- `GET /rfps` - List RFPs (with pagination)
- `POST /rfps` - Create new RFP (buyers only)
- `GET /rfps/{id}` - Get RFP details
- `PUT /rfps/{id}` - Update RFP
- `POST /rfps/{id}/respond` - Submit response (suppliers only)
- `PATCH /rfps/{id}/status` - Change RFP status

### File Management
- `POST /uploads/presign` - Get presigned URL for upload
- `POST /uploads/complete` - Complete file upload
- `GET /documents/{id}/versions` - List document versions
- `POST /documents/{id}/versions` - Upload new version
- `POST /documents/{id}/versions/{version}/revert` - Revert to version

### Search
- `GET /rfps/search` - Search RFPs with full-text search

## 🔒 Security Checklist

This system implements comprehensive security measures following industry best practices:

### ✅ Environment & Configuration Security
- **🔐 Secrets via Environment Variables Only**: All sensitive data (API keys, DB passwords, JWT secrets) stored in `.env` files
- **🚫 No Hardcoded Secrets**: Zero secrets committed to version control
- **🔄 Secret Rotation**: Support for rotating API keys and database credentials

### ✅ Authentication & Authorization
- **⏰ JWT Short Lifetime**: Access tokens expire in 30 minutes (configurable)
- **🔄 Refresh Token Rotation**: Automatic refresh token rotation on use
- **🍪 Secure Cookie Storage**: Refresh tokens in httpOnly, secure, SameSite cookies
- **👥 Role-Based Access Control**: Strict buyer/supplier role separation
- **🔒 Password Security**: bcrypt hashing with 12+ rounds

### ✅ File Upload Security
- **☁️ Presigned URLs Only**: All file uploads via AWS S3 presigned URLs
- **📏 Upload Size Limits**: 50MB max file size (configurable)
- **🎯 File Type Validation**: Whitelist of allowed MIME types
- **🚫 Direct Server Uploads**: No files stored on application servers

### ✅ Input Validation & Data Protection
- **📋 Pydantic Validation**: All API inputs validated with Pydantic schemas
- **🛡️ SQL Injection Prevention**: SQLAlchemy ORM with parameterized queries
- **🔍 XSS Protection**: React's built-in sanitization + Content Security Policy
- **📊 Request Size Limits**: Max 10MB request payload

### ✅ Database Security
- **📈 Performance Indexes**: GIN indexes on search columns, B-tree on foreign keys
- **🔒 Database Constraints**: Foreign key constraints, NOT NULL validations
- **🔐 Connection Security**: SSL/TLS encrypted database connections
- **👤 Limited Privileges**: Database user with minimal required permissions

### ✅ Rate Limiting & DDoS Protection
- **⚡ Auth Endpoint Limits**: 5 requests/minute for login/register
- **🌐 Global Rate Limiting**: 100 requests/minute per IP (configurable)
- **🚨 Failure Tracking**: Account lockout after 5 failed login attempts
- **⏰ Cooldown Periods**: Progressive delays for repeated failures

### ✅ Network & Transport Security
- **🌐 CORS Configuration**: Strict origin controls for production
- **🔒 HTTPS Enforcement**: TLS 1.2+ required in production
- **🛡️ Security Headers**: HSTS, CSP, X-Frame-Options, X-Content-Type-Options
- **🚫 Information Disclosure**: Generic error messages in production

### ✅ Logging & Monitoring
- **📊 Security Event Logging**: Failed logins, permission violations, suspicious activity
- **🔍 Error Tracking**: Structured logging with correlation IDs
- **🚨 Alerting System**: Real-time alerts for security incidents
- **📈 Sentry Integration**: Error tracking and performance monitoring (placeholder)

### ✅ Development & CI/CD Security
- **🔍 Dependency Scanning**: Weekly vulnerability scans with Dependabot
- **🛡️ Static Analysis**: CodeQL, Bandit, ESLint security rules
- **🧪 Security Testing**: Automated penetration testing in CI
- **🔐 Secrets Scanning**: Pre-commit hooks to prevent secret leaks

### 🔧 Production Security Configuration

For production deployment, ensure:

```bash
# Environment Variables
ENVIRONMENT=production
SECRET_KEY=<cryptographically-strong-random-key>
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Security Headers
CORS_ORIGINS=["https://yourdomain.com"]
ALLOWED_HOSTS=["yourdomain.com"]

# Rate Limiting
RATE_LIMIT_AUTH=5/minute
RATE_LIMIT_GLOBAL=100/minute

# File Upload Limits
MAX_FILE_SIZE=52428800  # 50MB
ALLOWED_EXTENSIONS=[".pdf", ".doc", ".docx", ".xls", ".xlsx"]

# Database Security
DATABASE_SSL_MODE=require
DATABASE_SSL_CERT=/path/to/cert.pem

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=INFO
```

### 🚨 Security Incident Response

1. **Detection**: Automated alerts via Sentry and log monitoring
2. **Assessment**: Security team evaluates impact and scope
3. **Containment**: Immediate blocking of malicious IPs/accounts
4. **Recovery**: System restoration with security patches
5. **Lessons Learned**: Post-incident review and improvements

## 🧪 Testing

The system includes comprehensive testing at all levels:

- **Unit Tests**: Backend (pytest) and Frontend (Vitest)
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Playwright for full user workflows
- **Performance Tests**: Locust load testing
- **Security Tests**: Automated vulnerability scanning

## 📈 Performance

- **Async Operations**: Full async/await support for high concurrency
- **Database Optimization**: Indexed queries and connection pooling
- **Caching**: Redis for session and data caching
- **CDN Ready**: Static assets optimized for CDN delivery
- **Lazy Loading**: Frontend components loaded on demand

## 🚀 Deployment

The system is designed for easy deployment with:

- **Docker Support**: Containerized deployment ready
- **Environment Configuration**: Flexible environment-based config
- **Health Checks**: Built-in health monitoring
- **Logging**: Structured logging for production monitoring
- **Scaling**: Horizontal scaling support

## 📚 Documentation

- [Database Schema](docs/database-schema.md) - Complete database design
- [API Documentation](docs/api-docs.md) - Detailed API reference
- [Deployment Guide](docs/deployment.md) - Production deployment instructions
- [Contributing Guide](CONTRIBUTING.md) - Development guidelines

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `docs/` folder
- Review the API documentation at `/docs` when running the server

## 🔄 Version History

- **v1.0.0** - Initial release with core RFP functionality
- **v1.1.0** - Added document versioning and file uploads
- **v1.2.0** - Implemented full-text search and email notifications
- **v1.3.0** - Added comprehensive testing and CI/CD pipeline

## 🧪 Testing

### Backend Tests (pytest)
```bash
cd backend
pip install -r requirements.txt
pytest
```

Run specific test files:
```bash
pytest tests/test_auth_comprehensive.py
pytest tests/test_rfp_lifecycle.py
pytest tests/test_upload_versioning.py
```

Run with coverage:
```bash
pytest --cov=app --cov-report=html
```

### Frontend Tests (Vitest + React Testing Library)
```bash
cd frontend
npm install
npm run test
```

Run tests in watch mode:
```bash
npm run test:ui
```

Run tests with coverage:
```bash
npm run test:coverage
```

### End-to-End Tests (Playwright)
```bash
cd frontend
npm run test:e2e
```

Run E2E tests with UI:
```bash
npm run test:e2e:ui
```

Run E2E tests in headed mode (see browser):
```bash
npm run test:e2e:headed
```

## Continuous Integration

The project uses GitHub Actions for CI/CD:

### CI Workflow (`.github/workflows/ci.yml`)
- **Backend Tests**: Runs pytest with PostgreSQL service
- **Frontend Tests**: Runs Vitest and linting
- **E2E Tests**: Runs Playwright tests with full stack
- **Security Scan**: Runs safety, bandit, and npm audit
- **Build Check**: Verifies both backend and frontend build successfully

### PR Workflow (`.github/workflows/pr.yml`)
- Runs on pull requests to main/develop branches
- Includes coverage reporting
- TypeScript compilation check
- Uploads coverage to Codecov

### Deploy Workflow (`.github/workflows/deploy.yml`)
- Deploys to staging on main branch pushes
- Deploys to production after staging success
- Uses GitHub environments for deployment approval

### Dependabot (`.github/dependabot.yml`)
- Weekly updates for Python, Node.js, and GitHub Actions dependencies
- Automatic pull request creation for dependency updates

### Security Workflow (`.github/workflows/security.yml`)
- Weekly security scans with safety, bandit, semgrep, and npm audit
- Snyk integration for vulnerability detection
- Automatic PR comments with security findings

### CodeQL Analysis (`.github/workflows/codeql.yml`)
- GitHub's semantic code analysis for Python and JavaScript
- Weekly scheduled scans plus PR analysis
- Advanced security vulnerability detection

### Performance Testing (`.github/workflows/performance.yml`)
- Weekly performance tests with Locust load testing
- Lighthouse performance audits
- Automated performance issue creation

### Release Workflow (`.github/workflows/release.yml`)
- Automated releases on version tags
- Changelog generation from git commits
- Artifact uploads for backend and frontend

### Local PostgreSQL database
Create a local database:
```sql
-- psql or your preferred client
CREATE DATABASE rfp_contracts;
```

Ensure your `DATABASE_URL` in `.env` points to your local DB. Example for async SQLAlchemy with asyncpg driver:
```
postgresql+asyncpg://username:password@localhost:5432/rfp_contracts
```

> Alembic migrations can be added later under `backend/`.

---

## Frontend Setup (Vite + React + TS + Tailwind)

From the `frontend` directory:
```bash
npm install
npm run dev
```

This runs the Vite dev server. Open the printed local URL in your browser.

---

## Optional Services
- Redis: set `REDIS_URL` (e.g., `redis://localhost:6379/0`)
- Elasticsearch: set `ELASTIC_URL` (e.g., `http://localhost:9200`)

---

## Project Scripts
- Backend dev: `uvicorn app.main:app --reload`
- Frontend dev: from `frontend`, `npm run dev`