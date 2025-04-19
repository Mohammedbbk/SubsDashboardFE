# Frontend - Subscription Management Dashboard

This directory contains the React frontend application for the Subscription Management Dashboard, built with Vite, TypeScript, Tailwind CSS, and Shadcn/ui.

## Features

* Displays subscription list with details and calculated costs.
* Highlights subscriptions renewing within 7 days.
* Allows adding new subscriptions via a form dialog.
* Allows deleting subscriptions with confirmation.
* Shows dashboard widgets: Total Monthly Spend, Upcoming Renewals, Cost Breakdown Chart, Annual Cost Comparison (on row select).
* Supports Dark Mode toggle.

## Tech Stack

* React (v19)
* TypeScript
* Vite
* Tailwind CSS (v4)
* Shadcn/ui
* Axios
* React Hook Form & Zod


## Setup & Running

1.  **Prerequisites:** Node.js and npm (or yarn/pnpm).
3.  **Install Dependencies:** `npm install`
4.  **Environment Variable:** Create a `.env` file in this (`FrontEnd`) directory:
    ```dotenv
    # URL where the backend API is running
    VITE_API_BASE_URL=[http://127.0.0.1:8000/api](http://127.0.0.1:8000/api)
    ```
    *(Update this URL if your backend runs elsewhere during development or for production).*
5.  **Run:** Ensure the backend server is running, then start the frontend dev server:
    ```bash
    npm run dev
    ```
    * Access the app at `http://localhost:5173` (or the port specified).

Hosting

* Vercel