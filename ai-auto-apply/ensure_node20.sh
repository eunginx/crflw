#!/bin/bash

# Node 20 Version Manager for AI Auto Apply
# This script ensures Node 20 is always used

echo "🔧 Ensuring Node 20 is active..."

# Load NVM if available
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  source "$NVM_DIR/nvm.sh"
  source "$NVM_DIR/bash_completion"
fi

# Check current Node version
CURRENT_NODE=$(node -v)
NODE_MAJOR=$(echo $CURRENT_NODE | sed 's/v\([0-9]*\).*/\1/')

if [ "$NODE_MAJOR" -ne "20" ]; then
  echo "🔄 Switching from Node $CURRENT_NODE to Node 20..."
  nvm use 20
  if [ $? -eq 0 ]; then
    echo "✅ Now using Node $(node -v)"
  else
    echo "❌ Failed to switch to Node 20"
    exit 1
  fi
else
  echo "✅ Already using Node $CURRENT_NODE"
fi

# Export Node 20 for current session
export PATH="$NVM_DIR/versions/node/v20.*/bin:$PATH"
