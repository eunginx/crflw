# 🐳 Docker Setup for AI Auto Apply

This guide explains how to run the entire AI Auto Apply environment using Docker containers instead of separate processes.

## 🚀 Quick Start

### Development Environment (with hot reload)
```bash
./docker_start.sh
```

### Production Environment (optimized builds)
```bash
./docker_start.sh prod
```

### Stop All Containers
```bash
./docker_stop.sh
```

## 📋 Services Overview

| Service | Development Port | Production Port | Description |
|---------|------------------|-----------------|-------------|
| Frontend | 3000 | 3100 | React application |
| Backend (appData) | 6001 | 6001 | Node.js API server |
| AI Service | 8000 | 8000 | AI processing service |
| PostgreSQL | 5433 | 5433 | Database |
| Redis | 6379 | 6379 | Cache/Session storage |
| PgAdmin | 5050 | 5050 | Database admin UI |

## 🔧 Configuration Files

### `docker-compose.yml` - Production Environment
- Uses optimized production builds
- Frontend served by Nginx
- No volume mounts for source code
- Suitable for deployment

### `docker-compose.dev.yml` - Development Environment  
- Uses development builds with hot reload
- Source code mounted for live editing
- Includes development dependencies
- Suitable for local development

### Dockerfiles
- `frontend/Dockerfile` - Multi-stage build (dev + build + nginx)
- `appData/Dockerfile` - Node.js backend with file upload support
- `ai-service/Dockerfile` - TypeScript service with build optimization

## 🛠️ Management Commands

### Basic Operations
```bash
# Start development environment
./docker_start.sh

# Start production environment  
./docker_start.sh prod

# Stop all containers
./docker_stop.sh

# View container status
docker-compose ps

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f frontend
```

### Advanced Operations
```bash
# Rebuild specific service
docker-compose build frontend

# Execute shell in container
docker-compose exec frontend sh
docker-compose exec appdata sh
docker-compose exec ai-service sh

# Restart specific service
docker-compose restart frontend

# Scale services (if needed)
docker-compose up -d --scale frontend=2
```

## 🗂️ Volume Management

### Persistent Volumes
- `postgres_data` - PostgreSQL data
- `redis_data` - Redis data  
- `appdata_uploads` - File uploads (resumes, documents)
- `appdata_logs` - Application logs

### Development Volumes
- Source code mounted for hot reload:
  - `./frontend:/app`
  - `./appData:/app`
  - `./ai-service:/app`

## 🔐 Environment Variables

### Frontend
- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_AI_SERVICE_URL` - AI Service URL
- `FAST_REFRESH` - Enable hot reload (dev only)

### Backend (appData)
- `NODE_ENV` - Environment mode
- `PORT` - Service port
- `DATABASE_URL` - PostgreSQL connection string
- `.env` file loaded for additional variables

### AI Service
- `NODE_ENV` - Environment mode  
- `PORT` - Service port
- `APPDATA_API_URL` - Backend API URL
- `.env` file loaded for additional variables

## 🌐 Network Configuration

All services communicate via the `ai-network` bridge network:

- **Development**: Services accessible via localhost on host ports
- **Internal**: Services communicate via container names (e.g., `appdata:6000`)

## 📊 Health Checks

All application services include health checks:

- **Backend**: `GET /health`
- **AI Service**: `GET /health`  
- **Frontend**: HTTP response check
- **Database**: Docker native health check

## 🐛 Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check what's using ports
lsof -i :3000
lsof -i :6001
lsof -i :8000

# Stop conflicting services
./local_stop.sh
```

#### Container Won't Start
```bash
# View detailed logs
docker-compose logs service-name

# Rebuild from scratch
docker-compose down --volumes
docker-compose build --no-cache
docker-compose up -d
```

#### Database Connection Issues
```bash
# Check PostgreSQL container
docker-compose exec postgres psql -U postgres -d aiautoapply

# Reset database volume
docker-compose down -v
docker-compose up -d postgres
```

#### Permission Issues
```bash
# Fix volume permissions on Linux/macOS
sudo chown -R $USER:$USER ./appData/uploads
```

### Performance Issues

#### Slow Development Build
- Use `docker-compose build --no-cache` for fresh builds
- Ensure sufficient Docker memory allocation (4GB+ recommended)

#### High Memory Usage
- Use production environment for testing
- Limit container resources in docker-compose.yml

## 🔄 Development Workflow

### 1. Initial Setup
```bash
# Clone and navigate to project
cd ai-auto-apply

# Start development environment
./docker_start.sh
```

### 2. Daily Development
```bash
# Start containers (if not running)
./docker_start.sh

# Make code changes (auto-reload enabled)

# View logs if needed
docker-compose logs -f
```

### 3. Testing Production Build
```bash
# Stop development
./docker_stop.sh

# Start production
./docker_start.sh prod

# Test optimized build
```

### 4. Cleanup
```bash
# Stop and clean up
./docker_stop.sh

# Remove all Docker data (caution!)
docker system prune -a --volumes
```

## 🚀 Deployment Considerations

### Production Deployment
- Use `docker-compose.yml` (production configuration)
- Set proper environment variables
- Configure reverse proxy (nginx/traefik)
- Enable SSL/TLS
- Set up monitoring and logging

### Environment-Specific Changes
- Update `.env` files for each environment
- Modify port mappings if needed
- Adjust resource limits
- Configure backup strategies

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Docker Health Checks](https://docs.docker.com/config/containers/healthchecks/)
- [React Development with Docker](https://mherman.org/blog/dockerizing-a-react-app/)

## 🆘 Support

If you encounter issues:

1. Check this README first
2. Review container logs: `docker-compose logs`
3. Verify Docker resources: `docker system df`
4. Restart services: `./docker_stop.sh && ./docker_start.sh`
5. Check for port conflicts: `lsof -i :<port>`
