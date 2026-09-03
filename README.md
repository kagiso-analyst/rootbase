#  RootBase — Farm Management for African Farmers

> The all-in-one digital farm manager built for African farmers. Track finances, crops, livestock, weather, tasks, and more — beautifully, in one place.

## Live Demo

[![Vercel](https://img.shields.io/badge/Visit-RootBase-2D6A4F?style=for-the-badge&logo=vercel)](https://rootbase.vercel.app)

---

## ✨ Features

| Module | Description |
|--------|-------------|
|  **Dashboard** | Farm overview with weather, tasks, and finances |
|  **Analytics** | Farm performance insights with charts and reports |
|  **Cost Calculator** | Weekly cost estimation with vs actual comparison |
|  **Crops** | Track plantings, sprays, harvests, and yields |
|  **Livestock** | Animal records, vaccinations, and weight tracking |
|  **Finances** | Income, expenses, and reports with CSV export |
|  **Inventory** | Stock management with reorder alerts |
|  **Equipment** | Maintenance logs and service reminders |
|  **Tasks** | Task management with priorities and due dates |
|  **Journal** | Daily farm diary with tags and farm context |
|  **Weather** | Real-time weather with farming advice |
|  **Documents** | Store farm registrations and insurance |
|  **Suppliers** | Manage your farm suppliers |

###  📉 Analytics Features
-  **Income vs Expenses Chart** — Visualize your farm's financial health over 6 months
-  **Profit/Loss Trend** — Track profitability trends
-  **Category Breakdowns** — See income and expenses by category
-  **Profit Margin** — Know your farm's profitability at a glance
-  **Key Metrics** — Active crops, inventory items, livestock count, open tasks

### 🧮 Cost Calculator Features
-  **Weekly Cost Estimates** — Infrastructure and production costs
-  **vs Actual Comparison** — Compare estimates against actual expenses
-  **Historical Tracking** — Save and view past estimates
-  **Monthly & Annual Projections** — Plan ahead with accurate projections
-  **Detailed Breakdowns** — See exactly where your money goes

### Multi-Farm Support
- One account, multiple farms
- Complete data isolation per farm
- Switch farms instantly

---

## 🚀 Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill in the values in `.env.local` before using Supabase, weather, PayFast, or rate-limited API features. Never commit `.env`, `.env.local`, or other files containing real credentials.

### Validation Commands

```bash
npm run typecheck
npm run build
npm run lint
```

The production build requires valid environment configuration. Diagnostic pages such as `/test` and `/test-signup` render only during development.

## 🔐 Production Notes

- Supabase authentication and row-level data isolation protect farm data.
- Non-public routes and API routes require an authenticated session.
- Team role changes are restricted to `admin`, `manager`, and `viewer`; owner privileges cannot be assigned through team APIs.
- PayFast notifications are signature-checked, validated with PayFast, and matched to the verified user profile before activation.
- API rate limiting uses Upstash Redis. In production, missing Redis configuration fails closed.
- Security headers, Sentry error reporting, and generic user-facing error messages are enabled.
- Rotate all provider credentials before deployment and store them in the hosting provider's secret manager.

Local Supabase state, generated build files, environment files, and migration files are excluded by `.gitignore` in this workspace. If migrations are used for deployment, remove the migration ignore rule and commit them as versioned database source.

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework |
| **Tailwind CSS** | Styling |
| **Base UI** | UI components |
| **Supabase** | Database + Auth |
| **PayFast** | Payments |
| **OpenWeather** | Weather data |
| **Recharts** | Charts |
| **Vercel** | Hosting |

---

**Made with ❤️** 🌱
