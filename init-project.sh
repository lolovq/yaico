#!/bin/bash

# ============================================
# YAICO PROJECT INITIALIZATION SCRIPT
# ============================================
# This script sets up the complete Yaico project structure
# Run: chmod +x init-project.sh && ./init-project.sh

set -e # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "============================================"
echo "🚀 YAICO PROJECT INITIALIZATION"
echo "============================================"
echo ""

# Check Node.js version
print_status "Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js 18+ is required. Current version: $(node -v)"
    exit 1
fi
print_status "Node.js version: $(node -v)"

# Create project directory structure
print_status "Creating project structure..."

directories=(
    "src/app/(auth)/sign-in"
    "src/app/(auth)/sign-up"
    "src/app/(auth)/forgot-password"
    "src/app/(app)/dashboard"
    "src/app/(app)/transactions"
    "src/app/(app)/clients"
    "src/app/(app)/compliance"
    "src/app/(app)/settings/profile"
    "src/app/(app)/settings/billing"
    "src/app/(app)/settings/team"
    "src/app/api/webhooks/stripe"
    "src/app/api/webhooks/ai-process"
    "src/app/api/health"
    "src/components/auth"
    "src/components/dashboard"
    "src/components/transactions"
    "src/components/clients"
    "src/components/compliance"
    "src/components/billing"
    "src/components/common"
    "src/components/ui"
    "src/components/mobile"
    "src/hooks"
    "src/lib/auth"
    "src/lib/firebase"
    "src/lib/types"
    "src/lib/utils"
    "src/lib/ai"
    "src/lib/tax"
    "src/lib/compliance"
    "src/lib/monitoring"
    "src/lib/performance"
    "src/lib/security"
    "src/server/actions"
    "src/server/gateways"
    "src/server/services"
    "src/styles"
    "src/config"
    "src/__tests__/unit"
    "src/__tests__/integration"
    "src/__tests__/e2e"
    "src/test"
    "firebase/functions/src/triggers"
    "firebase/functions/src/scheduled"
    "firebase/functions/src/lib"
    "firebase/functions/src/services"
    "public/icons"
    "public/images"
    "scripts"
    "docs/api"
    "docs/architecture"
    ".github/workflows"
)

for dir in "${directories[@]}"; do
    mkdir -p "$dir"
done

print_status "Project structure created"

# Create essential files
print_status "Creating essential files..."

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output
playwright-report/
test-results/

# Next.js
.next/
out/
build/
dist/

# Production
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store
Thumbs.db

# Firebase
.firebase/
firebase-debug.log
firestore-debug.log
ui-debug.log
firebase-export-*
firestore.indexes.json
service-account*.json

# Misc
*.pem
.vercel
.turbo
.cache/
lighthouse-report.html

# Lock files (keep only one)
package-lock.json
yarn.lock
pnpm-lock.yaml
EOF

# Create README.md
cat > README.md << 'EOF'
# 🚀 Yaico - AI-Powered Financial Management for Dutch Freelancers

## Overview
Yaico is a comprehensive financial management platform designed specifically for Dutch freelancers and small businesses. It combines AI-powered transaction categorization, compliance monitoring, and tax optimization in one seamless platform.

## 🌟 Key Features
- **AI Transaction Categorization**: Automatic categorization with human-in-the-loop validation
- **DBA Compliance Monitoring**: Real-time monitoring of client concentration risks
- **VAT Management**: Automated VAT calculations for domestic and international transactions
- **Bank Integration**: Secure connection to Dutch banks via Plaid
- **Real-time Dashboard**: Aggregated financial insights updated in real-time
- **Multi-tier SaaS**: Flexible pricing with usage-based limits

## 🛠️ Tech Stack
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Firebase (Firestore, Functions, Auth)
- **AI**: Google Gemini API
- **Payments**: Stripe
- **Security**: Google Cloud KMS
- **Monitoring**: OpenTelemetry, Sentry

## 🚀 Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/yaico.git
cd yaico
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. **Initialize Firebase**
```bash
firebase login
firebase init
firebase use --add
```

5. **Run development server**
```bash
npm run dev
```

6. **Run Firebase emulators (optional)**
```bash
npm run firebase:emulators
```

Visit `http://localhost:3000` to see the application.

## 📝 Documentation
- [Architecture Overview](docs/architecture/README.md)
- [API Documentation](docs/api/README.md)
- [Deployment Guide](docs/deployment.md)
- [Contributing Guidelines](CONTRIBUTING.md)

## 🧪 Testing
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
```

## 📦 Deployment
The application is configured for automatic deployment via GitHub Actions.

**Staging**: Push to `staging` branch
**Production**: Push to `main` branch

## 📄 License
MIT License - see [LICENSE](LICENSE) file for details

## 🤝 Support
For issues and questions, please use GitHub Issues or contact support@yaico.nl
EOF

# Create prettier configuration
cat > .prettierrc.json << 'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"]
}
EOF

# Create ESLint configuration
cat > .eslintrc.json << 'EOF'
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "react-hooks/exhaustive-deps": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
EOF

# Create Tailwind configuration
cat > tailwind.config.ts << 'EOF'
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        yaico: {
          mint: '#00CC99',
          'mint-dark': '#00AA80',
          'mint-light': '#00FFCC',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
EOF

print_status "Essential files created"

# Install dependencies
print_status "Installing dependencies..."
npm install

# Initialize Git
if [ ! -d ".git" ]; then
    print_status "Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit: Yaico project setup"
fi

# Firebase initialization reminder
print_warning "Don't forget to:"
echo "  1. Set up Firebase project at https://console.firebase.google.com"
echo "  2. Run 'firebase init' to connect your project"
echo "  3. Copy .env.example to .env.local and fill in your values"
echo "  4. Set up Google Cloud project for KMS and other services"

echo ""
print_status "Project initialization complete!"
echo ""
echo "Next steps:"
echo "  1. cd into the project directory"
echo "  2. Copy .env.example to .env.local and configure"
echo "  3. Run 'npm run dev' to start development"
echo "  4. Start your first Vibe Code session!"
echo ""
echo "============================================"
echo "🎉 Happy coding with Yaico!"
echo "============================================"
EOF

chmod +x init-project.sh
