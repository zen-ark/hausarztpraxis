#!/bin/bash

# Git Helper Scripts for Branching Strategy
# Usage: source scripts/git-helpers.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to start a new feature
start_feature() {
    if [ -z "$1" ]; then
        echo -e "${RED}Error: Please provide a feature name${NC}"
        echo "Usage: start_feature feature-name"
        return 1
    fi
    
    local feature_name=$1
    echo -e "${BLUE}🚀 Starting new feature: $feature_name${NC}"
    
    git checkout develop
    git pull origin develop
    git checkout -b "feature/$feature_name"
    
    echo -e "${GREEN}✅ Feature branch 'feature/$feature_name' created and ready!${NC}"
}

# Function to finish a feature
finish_feature() {
    local current_branch=$(git branch --show-current)
    
    if [[ ! $current_branch == feature/* ]]; then
        echo -e "${RED}Error: You must be on a feature branch to finish it${NC}"
        return 1
    fi
    
    echo -e "${BLUE}🏁 Finishing feature: $current_branch${NC}"
    
    git checkout develop
    git pull origin develop
    git merge "$current_branch"
    git push origin develop
    
    echo -e "${GREEN}✅ Feature merged to develop and pushed!${NC}"
    echo -e "${YELLOW}💡 You can now delete the feature branch with: git branch -d $current_branch${NC}"
}

# Function to deploy to production
deploy_production() {
    echo -e "${BLUE}🚀 Deploying to production...${NC}"
    
    git checkout main
    git pull origin main
    git merge develop
    git push origin main
    
    echo -e "${GREEN}✅ Production deployment triggered!${NC}"
}

# Function to show current status
show_status() {
    echo -e "${BLUE}📊 Current Git Status:${NC}"
    echo ""
    echo -e "${YELLOW}Current branch:${NC} $(git branch --show-current)"
    echo -e "${YELLOW}Last commit:${NC} $(git log -1 --oneline)"
    echo ""
    echo -e "${YELLOW}Branch status:${NC}"
    git status --short
    echo ""
    echo -e "${YELLOW}Recent branches:${NC}"
    git branch -v | head -5
}

# Function to sync all branches
sync_all() {
    echo -e "${BLUE}🔄 Syncing all branches...${NC}"
    
    git checkout develop
    git pull origin develop
    
    git checkout main
    git pull origin main
    
    echo -e "${GREEN}✅ All branches synced!${NC}"
}

# Help function
show_help() {
    echo -e "${BLUE}🛠️  Git Helper Commands:${NC}"
    echo ""
    echo -e "${GREEN}start_feature <name>${NC}     - Start a new feature branch"
    echo -e "${GREEN}finish_feature${NC}           - Merge current feature to develop"
    echo -e "${GREEN}deploy_production${NC}        - Deploy develop to production"
    echo -e "${GREEN}show_status${NC}              - Show current git status"
    echo -e "${GREEN}sync_all${NC}                - Sync all branches with remote"
    echo -e "${GREEN}show_help${NC}                - Show this help message"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  start_feature user-authentication"
    echo "  finish_feature"
    echo "  deploy_production"
}

# Show help by default
show_help
