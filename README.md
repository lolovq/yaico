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
