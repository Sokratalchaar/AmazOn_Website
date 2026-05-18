# Amazeon E-Commerce Application

A premium, full-stack e-commerce mock platform styled with a high-end, responsive dark and amber aesthetic inspired by Amazon. Built with **React 19**, **Vite**, **Express**, and **Supabase**.

---

## 🚀 Key Features

*   **Secure Authentication**: Fully hardened sign-in flow supporting both Google OAuth and standard Email/Password authentication.
*   **Dynamic Product Catalog**: Responsive catalog containing pricing, detailed descriptions, categories, reviews, real-time average ratings, and live stock statuses.
*   **Intuitive Cart & Checkout**: Fully interactive state-managed cart with dynamic quantity editing and safe database-backed order placement.
*   **Admin Dashboard**: Manage inventory, create/update/delete products, and review global user orders.
*   **Hardened Navigation Stack**: Wipes transient OAuth tokens from the browser URL address bar synchronously on boot, completely protecting the history stack against stale back-button actions.
*   **Modern Vanilla CSS**: Designed from the ground up using pure vanilla CSS tokens, ensuring smooth micro-animations, premium layouts, and fluid mobile/tablet responsiveness.

---

## 🛠️ Technology Stack

*   **Frontend**: React (v19), React Router (v7), Vite (v8), Lucide Icons
*   **Backend**: Node.js, Express API
*   **Database & Auth**: Supabase (PostgreSQL, Row Level Security, Custom Pl/pgSQL procedures)
*   **Hosting Configuration**: Render blueprint (`render.yaml`) supporting Single Page Application (SPA) routing rewrites

---

## 📂 Project Structure

```text
├── backend/                   # Node/Express backend API for product catalog
│   ├── products.json          # Persistent mock products database
│   ├── server.js              # Express app initialization and product routes
│   └── package.json           # Backend dependencies and metadata
├── src/                       # Frontend React application
│   ├── components/            # Reusable UI elements (Navbar, ProductCard)
│   ├── context/               # Global state contexts (AuthContext, CartContext)
│   ├── lib/                   # Supabase client instantiation
│   ├── pages/                 # Route-level views (Home, Login, Admin, Checkout, Orders)
│   └── App.jsx                # Router declaration and history callback guards
├── supabase_schema.sql        # Database initialization & RLS policies
├── migrations.sql             # DB migrations and initial products seeding
├── render.yaml                # Infrastructure-as-code blueprint for Render
└── README.md                  # Project documentation
```

---

## 💻 Getting Started

### Prerequisites

Ensure you have **Node.js** (v18+) and **npm** installed on your system.

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Sokratalchaar/AmazOn_Website.git
    cd AmazOn_Website
    ```

2.  **Install Frontend dependencies** (Root Directory):
    ```bash
    npm install
    ```

3.  **Install Backend dependencies**:
    ```bash
    cd backend
    ```

---

## ⚙️ Environment Configuration

Set up your local environment file:
1.  Copy the environment template:
    ```bash
    cp .env.example .env
    ```
2.  Open `.env` and fill in your Supabase details (a default working fallback is built-in for local execution).

| Variable Name | Description | Default / Example Value |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Base endpoint of your Supabase project | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY`| Public anonymous publishable key | `your-anon-api-key` |
| `VITE_SUPABASE_REDIRECT_URL` | Google OAuth callback redirect URL | `http://localhost:5173` |

---

## 🏃 Running Locally

To run the application, start both the backend API and the frontend dev server.

1.  **Start the Backend Server**:
    ```bash
    cd backend
    node server.js
    ```
    *The API will start running on [http://localhost:5000](http://localhost:5000).*

2.  **Start the Frontend Dev Server**:
    In a separate terminal, run from the root folder:
    ```bash
    npm run dev
    ```
    *The frontend will start running on [http://localhost:5173/](http://localhost:5173/).*

---

## 🗄️ Database Setup (Supabase)

If setting up your own Supabase instance:
1.  Apply the base schema from `supabase_schema.sql` to initialize tables, constraints, and Row Level Security (RLS).
2.  Run `migrations.sql` to register SQL functions (e.g. the transaction-safe `place_order` procedure) and seed products data.
