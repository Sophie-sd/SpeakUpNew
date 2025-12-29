#!/bin/bash
set -e

echo "========================================="
echo "🔧 Setting up Git Hooks"
echo "========================================="

# Перевірка чи існує .git
if [ ! -d ".git" ]; then
  echo "⚠️  .git directory not found. Initializing Git repository..."
  git init
fi

# Ініціалізація Husky
if command -v npm &> /dev/null && [ -f "package.json" ]; then
  echo "Installing Husky..."
  npx husky install || echo "Husky install failed, but continuing..."

  # Створення pre-commit hook
  echo "Creating pre-commit hook..."
  mkdir -p .husky
  cat > .husky/pre-commit << 'EOF'
#!/bin/sh
bash scripts/pre-commit-hook.sh
EOF
  chmod +x .husky/pre-commit

  # Створення pre-push hook
  echo "Creating pre-push hook..."
  cat > .husky/pre-push << 'EOF'
#!/bin/sh
npm run check:rules
EOF
  chmod +x .husky/pre-push

  echo "✅ Git hooks setup complete!"
else
  echo "❌ npm or package.json not found. Please run 'npm install' first."
  exit 1
fi




