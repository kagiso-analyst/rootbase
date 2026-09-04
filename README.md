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

## 👩🏾‍🌾 How To Use RootBase

Follow this order when setting up a farm:

1. Register at `/register`, confirm your email if Supabase requires it, and sign in at `/login`.
2. Open **Settings** and create or configure your first farm. Select the active farm before entering records.
3. Use **Dashboard** as your daily starting point. Review income, expenses, active crops, open tasks, weather, and alerts.
4. Add your operational records:
	- **Crops**: create a crop, assign its field, add planting and harvest dates, then log spraying, fertilising, irrigation, scouting, weeding, or pruning activities.
	- **Livestock**: add animals with tags and weights, then record vaccinations, treatments, vet visits, and other health events.
	- **Inventory**: add supplies with quantities, reorder levels, units, cost, storage location, and expiry dates. Record every stock movement as in or out.
	- **Equipment**: register machinery and add maintenance logs. Keep service dates and hour readings current.
	- **Tasks**: create work items with priority and due dates. Mark them complete when finished so overdue counts stay accurate.
	- **Journal**: record daily observations with a date, entry type, field or crop context, weather, and tags.
	- **Suppliers**: save supplier contacts and categorize them for faster searching.
	- **Documents**: upload important farm records and monitor expiry dates.
5. Record money in **Finances**. Add income and expenses promptly, then use budgets, recurring transactions, balance sheet, and reports to compare performance.
6. Review **Analytics** weekly for income versus expenses, profitability, category trends, and operational counts. Export reports when needed.
7. Check **Weather** before field work and use the forecast and farming advice when planning irrigation, spraying, and harvest activity.
8. Check **Notifications** daily for overdue tasks, low stock, expiring documents, and weather alerts.
9. Use **AI Assistant** for questions about your farm data, profitability, crops, tasks, inventory, or general farming decisions. Treat advice as guidance and verify important decisions locally.
10. For collaboration, use **Settings > Team** to invite members and assign `admin`, `manager`, or `viewer` access. Do not share passwords.
11. Review **Subscription** when you need more farms, advanced analytics, AI, PDF exports, weather alerts, or team access. PayFast payments are completed through the selected plan.

### Recommended Daily Routine

- Start on **Dashboard** and inspect alerts and weather.
- Complete or reschedule **Tasks**.
- Log field, livestock, inventory, and equipment activity immediately after it happens.
- Record all income and expenses before ending the day.
- Add important observations to **Journal**.

### Recommended Weekly Routine

- Review **Analytics** and **Finances**.
- Reconcile inventory quantities and reorder low-stock items.
- Check equipment service schedules and document expiry dates.
- Review crop and livestock records for missing activity or health entries.
- Export a report or back up important documents according to your farm's record-keeping policy.

### Data Rules That Matter

- Always select the correct active farm before creating or editing records.
- Use consistent names for crops, fields, suppliers, and categories so reports remain useful.
- Enter dates and quantities accurately; dashboards and alerts depend on them.
- Complete tasks instead of deleting them when work is finished so the activity history remains meaningful.
- Keep credentials private and use a separate test Supabase project for integration tests.

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
npm test
```

`npm test` runs deterministic unit tests. Tests that create Supabase users or modify database data should be added separately as opt-in integration tests against a dedicated test project.

The production build requires valid environment configuration. Diagnostic pages such as `/test` and `/test-signup` render only during development.

## 🔐 Production Notes

- Supabase authentication and row-level data isolation protect farm data.
- Non-public routes and API routes require an authenticated session.
- Team role changes are restricted to `admin`, `manager`, and `viewer`; owner privileges cannot be assigned through team APIs.
- PayFast notifications are signature-checked, validated with PayFast, and matched to the verified user profile before activation.
- API rate limiting uses Upstash Redis. In production, missing Redis configuration fails closed.
- Security headers, Sentry error reporting, and generic user-facing error messages are enabled.
- Rotate all provider credentials before deployment and store them in the hosting provider's secret manager.
- The automated suite currently covers deterministic PayFast and rate-limit helper behavior. Supabase RLS and payment endpoint tests require a separate test project and must never run against production.

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
