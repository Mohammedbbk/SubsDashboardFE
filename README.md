# Frontend - Subscription Management Dashboard

This directory contains the React frontend application for the Subscription Management Dashboard, built with Vite, TypeScript, Tailwind CSS, and Shadcn/ui.

## Features

*   **Subscription Management:** Displays a table of subscriptions (`SubscriptionTable`) with sorting, filtering, and highlighting for renewals within 7 days. Allows adding new subscriptions via a modal (`AddSubscriptionForm`) and deleting subscriptions with confirmation.
*   **Dashboard Widgets:**
    *   Total Monthly Spend card.
    *   Upcoming Renewals list (next 5).
    *   Interactive Renewal Calendar (`react-day-picker`).
    *   Monthly Cost Breakdown Bar Chart (`recharts`).
    *   Annual Cost Comparison card (updates on table row selection).
*   **Dark Mode:** Theme toggling (`ModeToggle`).
*   **API Integration:** Fetches data from a backend API (`/subscriptions/`, `/dashboard-summary/`).

## Tech Stack & Key Libraries

*   React (v19) & TypeScript
*   Vite (Build Tool)
*   Tailwind CSS (v4) & Shadcn/ui (Component Library)
*   Axios (`apiClient` wrapper) for API calls
*   React Hook Form & Zod (Form handling & validation in `AddSubscriptionForm`)
*   `date-fns` (Date manipulation)
*   `recharts` (Charting)
*   `react-day-picker` (Calendar component used via Shadcn/ui)
*   State Management: Primarily handled with React's built-in hooks (`useState`, `useEffect`, `useCallback`, `useMemo`).
*   Code Splitting: `AddSubscriptionForm` and `ModeToggle` are lazy-loaded using `React.lazy` for better initial load performance.

## Project Structure (`src/`)

```
src/
├── App.css                # Global styles (primarily legacy/base styles)
├── App.tsx                # Main application component (state, layout, data fetching)
├── assets/                # Static assets (e.g., icons)
├── components/            # Reusable React components
│   ├── SubscriptionTable.tsx # Main data table
│   ├── AddSubscriptionForm.tsx # Form for adding subscriptions (lazy-loaded)
│   ├── mode-toggle.tsx       # Dark mode toggle (lazy-loaded)
│   └── ui/                  # Shadcn/ui components
├── index.css              # Tailwind base styles/directives
├── lib/                   # Utility functions and helpers
│   └── apiClient.ts       # Axios wrapper for API calls
│   └── utils.ts           # Shadcn utility functions
├── main.tsx               # Application entry point
├── types/                 # TypeScript type definitions (e.g., Subscription)
└── vite-env.d.ts          # Vite TypeScript environment types
```

## Setup & Running

1.  **Prerequisites:** Node.js and npm (or yarn/pnpm).
2.  **Install Dependencies:** Navigate to the `Frontend` directory and run:
    ```bash
    npm install
    ```
3.  **Environment Variable:** Create a `.env` file in the `Frontend` directory:
    ```dotenv
    # URL where the backend API is running
    VITE_API_BASE_URL=http://127.0.0.1:8000/api
    ```
    *(Update this URL if your backend runs elsewhere).*
4.  **Run Backend:** Ensure the backend server is running.
5.  **Run Frontend:** Start the frontend development server:
    ```bash
    npm run dev
    ```
    *   Access the app at `http://localhost:5173` (or the port specified by Vite).

## Hosting

*   Ready for deployment on platforms like Vercel. Static build output is in the `dist/` directory after running `npm run build`.