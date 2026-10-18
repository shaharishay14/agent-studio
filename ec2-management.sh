#!/bin/bash

# Agent Studio EC2 Container Management Commands
# Usage: Run these commands via SSH on the EC2 instance

EC2_HOST=YOUR_SERVER_IP
PEM_FILE=YOUR_KEY_PATH

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Agent Studio EC2 Management Commands ===${NC}\n"

# ============================================
# CHECKING CONTAINER STATUS
# ============================================
echo -e "${GREEN}1. CHECK CONTAINER STATUS${NC}"
echo "# Check all running containers:"
echo "ssh -i $PEM_FILE $EC2_HOST \"docker ps\""
echo ""
echo "# Check backend container specifically:"
echo "ssh -i $PEM_FILE $EC2_HOST \"docker ps --filter name=backend\""
echo ""
echo "# Check nginx container specifically:"
echo "ssh -i $PEM_FILE $EC2_HOST \"docker ps --filter name=nginx\""
echo ""
echo "# Check all containers (including stopped):"
echo "ssh -i $PEM_FILE $EC2_HOST \"docker ps -a\""
echo ""

# ============================================
# CHECKING LOGS
# ============================================
echo -e "${GREEN}2. CHECK LOGS${NC}"
echo "# View backend logs (last 50 lines):"
echo "ssh -i $PEM_FILE $EC2_HOST \"docker logs agent_studio_backend --tail 50\""
echo ""
echo "# View backend logs (last 100 lines):"
echo "ssh -i $PEM_FILE $EC2_HOST \"docker logs agent_studio_backend --tail 100\""
echo ""
echo "# Follow backend logs in real-time:"
echo "ssh -i $PEM_FILE $EC2_HOST \"docker logs agent_studio_backend -f\""
echo ""
echo "# View nginx logs:"
echo "ssh -i $PEM_FILE $EC2_HOST \"docker logs agent_studio_nginx --tail 50\""
echo ""
echo "# Follow nginx logs in real-time:"
echo "ssh -i $PEM_FILE $EC2_HOST \"docker logs agent_studio_nginx -f\""
echo ""

# ============================================
# CHECKING HEALTH
# ============================================
echo -e "${GREEN}3. CHECK HEALTH${NC}"
echo "# Check backend health endpoint:"
echo "curl -s https://yourdomain.com/api/health/ | python3 -m json.tool"
echo ""
echo "# Check website status:"
echo "curl -I https://yourdomain.com"
echo ""
echo "# Check API templates endpoint:"
echo "curl -s https://yourdomain.com/api/agents/templates/ | python3 -m json.tool | head -20"
echo ""
echo "# Check container health status:"
echo "ssh -i $PEM_FILE $EC2_HOST \"docker inspect --format='{{.State.Health.Status}}' agent_studio_backend\""
echo ""

# ============================================
# RESTARTING CONTAINERS
# ============================================
echo -e "${GREEN}4. RESTART CONTAINERS${NC}"
echo "# Restart backend container:"
echo "ssh -i $PEM_FILE $EC2_HOST \"cd /home/ubuntu/agent_studio && docker compose restart backend\""
echo ""
echo "# Restart nginx container:"
echo "ssh -i $PEM_FILE $EC2_HOST \"cd /home/ubuntu/agent_studio && docker compose restart nginx\""
echo ""
echo "# Restart both containers:"
echo "ssh -i $PEM_FILE $EC2_HOST \"cd /home/ubuntu/agent_studio && docker compose restart\""
echo ""

# ============================================
# REBUILDING CONTAINERS
# ============================================
echo -e "${GREEN}5. REBUILD CONTAINERS (after code changes)${NC}"
echo "# Rebuild backend container:"
echo "ssh -i $PEM_FILE $EC2_HOST \"cd /home/ubuntu/agent_studio && docker compose up -d --build backend\""
echo ""
echo "# Rebuild both containers:"
echo "ssh -i $PEM_FILE $EC2_HOST \"cd /home/ubuntu/agent_studio && docker compose up -d --build\""
echo ""

# ============================================
# UPDATING CODE
# ============================================
echo -e "${GREEN}6. UPDATE CODE${NC}"
echo "# Upload backend file:"
echo "scp -i $PEM_FILE ./backend/api_agents/agents/services/agent_service.py $EC2_HOST:/home/ubuntu/agent_studio/backend/api_agents/agents/services/agent_service.py"
echo ""
echo "# Upload frontend dist folder:"
echo "rsync -avz -e \"ssh -i $PEM_FILE\" --delete ./frontend/dist/ $EC2_HOST:/home/ubuntu/agent_studio/frontend/dist/"
echo ""
echo "# Pull from git and rebuild:"
echo "ssh -i $PEM_FILE $EC2_HOST \"cd /home/ubuntu/agent_studio && git pull origin main && docker compose up -d --build\""
echo ""

# ============================================
# STOPPING/STARTING CONTAINERS
# ============================================
echo -e "${GREEN}7. STOP/START CONTAINERS${NC}"
echo "# Stop backend container:"
echo "ssh -i $PEM_FILE $EC2_HOST \"cd /home/ubuntu/agent_studio && docker compose stop backend\""
echo ""
echo "# Start backend container:"
echo "ssh -i $PEM_FILE $EC2_HOST \"cd /home/ubuntu/agent_studio && docker compose start backend\""
echo ""
echo "# Stop all containers:"
echo "ssh -i $PEM_FILE $EC2_HOST \"cd /home/ubuntu/agent_studio && docker compose stop\""
echo ""
echo "# Start all containers:"
echo "ssh -i $PEM_FILE $EC2_HOST \"cd /home/ubuntu/agent_studio && docker compose start\""
echo ""

# ============================================
# DEBUGGING
# ============================================
echo -e "${GREEN}8. DEBUGGING${NC}"
echo "# Execute command inside backend container:"
echo "ssh -i $PEM_FILE $EC2_HOST \"docker exec -it agent_studio_backend bash\""
echo ""
echo "# Execute command inside nginx container:"
echo "ssh -i $PEM_FILE $EC2_HOST \"docker exec -it agent_studio_nginx sh\""
echo ""
echo "# Check Django migrations:"
echo "ssh -i $PEM_FILE $EC2_HOST \"docker exec agent_studio_backend python manage.py showmigrations\""
echo ""
echo "# Check disk usage:"
echo "ssh -i $PEM_FILE $EC2_HOST \"df -h\""
echo ""
echo "# Check Docker disk usage:"
echo "ssh -i $PEM_FILE $EC2_HOST \"docker system df\""
echo ""

# ============================================
# CLEANUP
# ============================================
echo -e "${GREEN}9. CLEANUP${NC}"
echo "# Remove unused Docker images:"
echo "ssh -i $PEM_FILE $EC2_HOST \"docker image prune -a -f\""
echo ""
echo "# Remove unused volumes:"
echo "ssh -i $PEM_FILE $EC2_HOST \"docker volume prune -f\""
echo ""
echo "# Clean up everything (CAUTION!):"
echo "ssh -i $PEM_FILE $EC2_HOST \"docker system prune -a -f\""
echo ""

# ============================================
# QUICK DEPLOYMENT WORKFLOW
# ============================================
echo -e "${YELLOW}=== QUICK DEPLOYMENT WORKFLOW ===${NC}"
echo ""
echo -e "${BLUE}Backend deployment (after code changes):${NC}"
echo "1. git add backend/ && git commit -m \"your message\" && git push"
echo "2. scp -i $PEM_FILE backend/path/to/file.py $EC2_HOST:/home/ubuntu/agent_studio/backend/path/to/file.py"
echo "3. ssh -i $PEM_FILE $EC2_HOST \"cd /home/ubuntu/agent_studio && docker compose up -d --build backend\""
echo "4. ssh -i $PEM_FILE $EC2_HOST \"docker logs agent_studio_backend --tail 50\""
echo ""
echo -e "${BLUE}Frontend deployment (after npm build):${NC}"
echo "1. npm run build"
echo "2. git add frontend/ && git commit -m \"your message\" && git push"
echo "3. rsync -avz -e \"ssh -i $PEM_FILE\" --delete frontend/dist/ $EC2_HOST:/home/ubuntu/agent_studio/frontend/dist/"
echo "4. ssh -i $PEM_FILE $EC2_HOST \"cd /home/ubuntu/agent_studio && docker compose restart nginx\""
echo "5. curl -I https://yourdomain.com"
echo ""
