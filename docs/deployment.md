# Deployment Guide

## Overview

This guide covers various deployment strategies for the RFP Contract Management System, from simple containerized deployments to production-ready cloud infrastructure.

## Table of Contents

1. [Docker Deployment](#docker-deployment)
2. [Cloud Deployment](#cloud-deployment)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Monitoring and Logging](#monitoring-and-logging)
6. [Security Considerations](#security-considerations)
7. [Scaling Strategies](#scaling-strategies)

## Docker Deployment

### Prerequisites

- Docker and Docker Compose
- Git

### Quick Start with Docker Compose

1. **Clone the repository**
```bash
git clone <repository-url>
cd rfp_contract_management
```

2. **Create environment file**
```bash
cp .env.example .env
# Edit .env with your production values
```

3. **Start services**
```bash
docker-compose up -d
```

### Docker Compose Configuration

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: rfp_contracts
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql+asyncpg://postgres:${POSTGRES_PASSWORD}@postgres:5432/rfp_contracts
      REDIS_URL: redis://redis:6379
      SECRET_KEY: ${SECRET_KEY}
      SENDGRID_KEY: ${SENDGRID_KEY}
      SENDGRID_FROM: ${SENDGRID_FROM}
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
      S3_BUCKET: ${S3_BUCKET}
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000

  celery:
    build: ./backend
    environment:
      DATABASE_URL: postgresql+asyncpg://postgres:${POSTGRES_PASSWORD}@postgres:5432/rfp_contracts
      REDIS_URL: redis://redis:6379
      SECRET_KEY: ${SECRET_KEY}
      SENDGRID_KEY: ${SENDGRID_KEY}
      SENDGRID_FROM: ${SENDGRID_FROM}
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
      S3_BUCKET: ${S3_BUCKET}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend:/app
    command: celery -A app.celery_app worker -l info

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      VITE_API_URL: http://localhost:8000
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend

volumes:
  postgres_data:
  redis_data:
```

### Backend Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash app
RUN chown -R app:app /app
USER app

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Install serve for production
RUN npm install -g serve

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Start command
CMD ["serve", "-s", "dist", "-l", "3000"]
```

### Nginx Configuration

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }

    upstream frontend {
        server frontend:3000;
    }

    server {
        listen 80;
        server_name localhost;

        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name localhost;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";

        # API routes
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Frontend routes
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## Cloud Deployment

### AWS Deployment

#### 1. ECS with Fargate

```yaml
# ecs-task-definition.json
{
  "family": "rfp-contract-management",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "your-account.dkr.ecr.region.amazonaws.com/rfp-backend:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DATABASE_URL",
          "value": "postgresql+asyncpg://user:pass@rds-endpoint:5432/rfp_contracts"
        }
      ],
      "secrets": [
        {
          "name": "SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:rfp/secret-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/rfp-contract-management",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "backend"
        }
      }
    }
  ]
}
```

#### 2. RDS Database Setup

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier rfp-contracts-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password YourPassword123 \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-12345678 \
  --db-subnet-group-name rfp-db-subnet-group
```

#### 3. S3 Bucket Setup

```bash
# Create S3 bucket
aws s3 mb s3://rfp-contract-management-files

# Create bucket policy
aws s3api put-bucket-policy --bucket rfp-contract-management-files --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::rfp-contract-management-files/*"
    }
  ]
}'
```

### Google Cloud Platform

#### 1. Cloud Run Deployment

```yaml
# cloud-run.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: rfp-backend
  annotations:
    run.googleapis.com/ingress: all
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: "10"
        run.googleapis.com/execution-environment: gen2
    spec:
      containerConcurrency: 100
      containers:
      - image: gcr.io/PROJECT_ID/rfp-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          value: "postgresql+asyncpg://user:pass@/rfp_contracts?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME"
        - name: SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: rfp-secrets
              key: secret-key
        resources:
          limits:
            cpu: "2"
            memory: "2Gi"
```

#### 2. Cloud SQL Setup

```bash
# Create Cloud SQL instance
gcloud sql instances create rfp-contracts-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --storage-type=SSD \
  --storage-size=10GB

# Create database
gcloud sql databases create rfp_contracts --instance=rfp-contracts-db

# Create user
gcloud sql users create rfp-user --instance=rfp-contracts-db --password=YourPassword123
```

### Azure Deployment

#### 1. Container Instances

```yaml
# azure-container-instance.yaml
apiVersion: 2021-07-01
location: eastus
name: rfp-backend
properties:
  containers:
  - name: backend
    properties:
      image: your-registry.azurecr.io/rfp-backend:latest
      ports:
      - port: 8000
        protocol: TCP
      environmentVariables:
      - name: DATABASE_URL
        value: "postgresql+asyncpg://user:pass@server.database.windows.net:5432/rfp_contracts"
      resources:
        requests:
          cpu: 1.0
          memoryInGb: 2.0
  osType: Linux
  restartPolicy: Always
  ipAddress:
    type: Public
    ports:
    - protocol: TCP
      port: 8000
```

#### 2. Azure Database for PostgreSQL

```bash
# Create PostgreSQL server
az postgres server create \
  --resource-group myResourceGroup \
  --name rfp-contracts-server \
  --location eastus \
  --admin-user rfpadmin \
  --admin-password YourPassword123 \
  --sku-name GP_Gen5_2

# Create database
az postgres db create \
  --resource-group myResourceGroup \
  --server-name rfp-contracts-server \
  --name rfp_contracts
```

## Environment Configuration

### Production Environment Variables

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/rfp_contracts

# Security
SECRET_KEY=your-super-secure-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET=your-s3-bucket-name
S3_REGION=us-east-1

# Email
SENDGRID_KEY=your-sendgrid-api-key
SENDGRID_FROM=noreply@yourdomain.com

# Redis
REDIS_URL=redis://redis-host:6379

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=INFO

# CORS
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Environment-Specific Configurations

#### Development
```bash
DEBUG=true
LOG_LEVEL=DEBUG
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

#### Staging
```bash
DEBUG=false
LOG_LEVEL=INFO
CORS_ORIGINS=https://staging.yourdomain.com
```

#### Production
```bash
DEBUG=false
LOG_LEVEL=WARNING
CORS_ORIGINS=https://yourdomain.com
```

## Database Setup

### Production Database Configuration

#### PostgreSQL Configuration

```sql
-- Create production database
CREATE DATABASE rfp_contracts_prod;

-- Create user with limited privileges
CREATE USER rfp_app_user WITH PASSWORD 'secure_password';

-- Grant privileges
GRANT CONNECT ON DATABASE rfp_contracts_prod TO rfp_app_user;
GRANT USAGE ON SCHEMA public TO rfp_app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO rfp_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rfp_app_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO rfp_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO rfp_app_user;
```

#### Database Migrations

```bash
# Run migrations in production
cd backend
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migration
alembic upgrade head
```

### Redis Configuration

#### Production Redis Setup

```bash
# Redis configuration for production
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

## Monitoring and Logging

### Application Monitoring

#### Health Checks

```python
# backend/app/health.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_async_session

router = APIRouter()

@router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

@router.get("/health/detailed")
async def detailed_health_check(session: AsyncSession = Depends(get_async_session)):
    # Check database connection
    try:
        await session.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    # Check Redis connection
    try:
        redis_client.ping()
        redis_status = "healthy"
    except Exception as e:
        redis_status = f"unhealthy: {str(e)}"
    
    return {
        "status": "healthy" if db_status == "healthy" and redis_status == "healthy" else "unhealthy",
        "database": db_status,
        "redis": redis_status,
        "timestamp": datetime.utcnow()
    }
```

#### Metrics Collection

```python
# backend/app/metrics.py
from prometheus_client import Counter, Histogram, generate_latest

REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration')

@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    REQUEST_DURATION.observe(duration)
    
    return response

@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type="text/plain")
```

### Logging Configuration

#### Structured Logging

```python
# backend/app/logging.py
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        
        if hasattr(record, 'user_id'):
            log_entry['user_id'] = record.user_id
        
        if hasattr(record, 'request_id'):
            log_entry['request_id'] = record.request_id
        
        return json.dumps(log_entry)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)
logger.handlers[0].setFormatter(JSONFormatter())
```

### Error Tracking

#### Sentry Integration

```python
# backend/app/sentry.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

sentry_sdk.init(
    dsn=settings.SENTRY_DSN,
    integrations=[
        FastApiIntegration(auto_enabling_instrumentations=False),
        SqlalchemyIntegration(),
    ],
    traces_sample_rate=0.1,
    environment=settings.ENVIRONMENT,
)
```

## Security Considerations

### SSL/TLS Configuration

#### Nginx SSL Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

### Secrets Management

#### AWS Secrets Manager

```python
# backend/app/secrets.py
import boto3
import json

def get_secret(secret_name: str) -> dict:
    client = boto3.client('secretsmanager', region_name='us-east-1')
    
    try:
        response = client.get_secret_value(SecretId=secret_name)
        secret = json.loads(response['SecretString'])
        return secret
    except Exception as e:
        raise Exception(f"Error retrieving secret: {str(e)}")

# Usage
secrets = get_secret('rfp/secret-key')
SECRET_KEY = secrets['secret_key']
```

#### Kubernetes Secrets

```yaml
# kubernetes-secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: rfp-secrets
type: Opaque
data:
  secret-key: <base64-encoded-secret>
  database-url: <base64-encoded-database-url>
  sendgrid-key: <base64-encoded-sendgrid-key>
```

### Network Security

#### VPC Configuration

```yaml
# vpc.yaml
Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: RFP-VPC

  PrivateSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: us-east-1a
      Tags:
        - Key: Name
          Value: RFP-Private-Subnet

  SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: RFP Security Group
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
```

## Scaling Strategies

### Horizontal Scaling

#### Load Balancer Configuration

```yaml
# load-balancer.yaml
apiVersion: v1
kind: Service
metadata:
  name: rfp-backend-service
spec:
  selector:
    app: rfp-backend
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rfp-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: rfp-backend
  template:
    metadata:
      labels:
        app: rfp-backend
    spec:
      containers:
      - name: backend
        image: rfp-backend:latest
        ports:
        - containerPort: 8000
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### Database Scaling

#### Read Replicas

```python
# backend/app/database.py
from sqlalchemy.ext.asyncio import create_async_engine

# Primary database for writes
PRIMARY_DATABASE_URL = "postgresql+asyncpg://user:pass@primary-db:5432/rfp_contracts"

# Read replica for reads
READ_REPLICA_URL = "postgresql+asyncpg://user:pass@read-replica:5432/rfp_contracts"

primary_engine = create_async_engine(PRIMARY_DATABASE_URL)
read_engine = create_async_engine(READ_REPLICA_URL)

# Use read replica for read operations
async def get_async_session(read_only: bool = False):
    engine = read_engine if read_only else primary_engine
    async with engine.begin() as session:
        yield session
```

### Caching Strategy

#### Redis Cluster

```yaml
# redis-cluster.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis-cluster
spec:
  serviceName: redis-cluster
  replicas: 6
  selector:
    matchLabels:
      app: redis-cluster
  template:
    metadata:
      labels:
        app: redis-cluster
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        command:
        - redis-server
        - --cluster-enabled
        - yes
        - --cluster-config-file
        - /data/nodes.conf
        - --cluster-node-timeout
        - "5000"
        - --appendonly
        - yes
        - --appendfsync
        - everysec
        - --save
        - "900 1"
        - --save
        - "300 10"
        - --save
        - "60 10000"
```

### CDN Configuration

#### CloudFront Distribution

```yaml
# cloudfront.yaml
Resources:
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Origins:
        - DomainName: yourdomain.com
          Id: S3Origin
          CustomOriginConfig:
            HTTPPort: 80
            HTTPSPort: 443
            OriginProtocolPolicy: https-only
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad
        Enabled: true
        DefaultRootObject: index.html
        PriceClass: PriceClass_100
```

## Backup and Disaster Recovery

### Database Backups

```bash
# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="rfp_contracts_$DATE.sql"

# Create backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > $BACKUP_DIR/$BACKUP_FILE

# Compress backup
gzip $BACKUP_DIR/$BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_DIR/$BACKUP_FILE.gz s3://your-backup-bucket/database/

# Clean up old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

### Application Backups

```bash
# Backup application data
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup uploaded files
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /app/uploads/

# Upload to S3
aws s3 cp $BACKUP_DIR/files_$DATE.tar.gz s3://your-backup-bucket/files/

# Clean up old backups
find $BACKUP_DIR -name "files_*.tar.gz" -mtime +30 -delete
```

## Performance Optimization

### Database Optimization

```sql
-- Create indexes for better performance
CREATE INDEX CONCURRENTLY idx_rfps_status_created ON rfps(status, created_at DESC);
CREATE INDEX CONCURRENTLY idx_responses_rfp_submitted ON responses(rfp_id, submitted_at DESC);
CREATE INDEX CONCURRENTLY idx_activity_logs_user_created ON activity_logs(user_id, created_at DESC);

-- Analyze tables for query optimization
ANALYZE users;
ANALYZE rfps;
ANALYZE responses;
ANALYZE activity_logs;
```

### Application Optimization

```python
# backend/app/optimization.py
from functools import lru_cache
import asyncio

# Cache frequently accessed data
@lru_cache(maxsize=1000)
def get_user_permissions(user_id: int):
    # Cache user permissions
    pass

# Use connection pooling
from sqlalchemy.pool import QueuePool

engine = create_async_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True,
    pool_recycle=3600
)

# Implement request caching
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend

@app.on_event("startup")
async def startup():
    redis = aioredis.from_url("redis://localhost")
    FastAPICache.init(RedisBackend(redis), prefix="rfp-cache")
```

This deployment guide provides comprehensive instructions for deploying the RFP Contract Management System in various environments, from simple Docker deployments to production-ready cloud infrastructure. Choose the approach that best fits your requirements and infrastructure.




