# E-Commerce Backend

This is a minimal Express backend for the e-commerce React application. It uses a local `products.json` file for persistent in-memory storage, meaning no external database setup is required.

## Endpoints

- `GET /api/products` - Returns a list of all available products.
- `GET /api/products/:id` - Returns details of a specific product by its ID.
- `POST /api/products` - Admin: Creates a new product. Expects JSON body with `title`, `price`, `description`, `image`, and `category`.
- `PUT /api/products/:id` - Admin: Updates an existing product's details.
- `DELETE /api/products/:id` - Admin: Deletes a product from the database.

## How to Run

1. Open a new terminal.
2. Navigate to the backend directory:
   ```bash
   cd "backend"
   ```
3. Run the server:
   ```bash
   node server.js
   ```
4. The backend will start on `http://localhost:5000`.

To run the full stack, keep the backend terminal running, open a **second terminal** in the root directory (`Test web`), and start the React frontend:
```bash
npm run dev
```
