# USMart — Full-Stack E-Commerce Application
#USM the initials of Usman and Mart for the store

---

## 🛠️ Tech Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Backend** | Python 3 + Flask | RESTful API server with custom decorator-based route handling |
| **Database** | SQLite + SQLAlchemy | SQL database with relational schema definitions (User, Product, Order, Review) |
| **Authentication** | JWT (PyJWT) + Bcrypt | Secure session tokens & salted password hashing |
| **Frontend** | HTML5 + CSS3 + Vanilla JS | Single-page application (SPA) with custom theme support (No third-party CSS frameworks) |
| **Typography** | Cormorant Garamond + DM Sans | Elegant, highly curated fonts from Google Fonts |

---

## ✨ Features Implemented

### 🛒 E-Commerce & Customer Flow
* **Dynamic Product Catalog**: Seeds 12 high-quality starter products across 5 shopping categories (Electronics, Clothing, Accessories, Home, Sports) with real-time text searching and category filtering.
* **Product Detail Page**: Displays deep-dive descriptions, stock availability, ratings, and a custom quantity selector.
* **Interactive Shopping Cart**: A fully responsive sidebar cart that updates dynamically and persists items across sessions via `localStorage`.
* **Guest-to-User Cart Merging**: Guest items in the cart are automatically consolidated into the registered user's account upon successful sign-in.
* **Interactive Checkout**: Complete order processing flow collecting shipping addresses, card formatting, and calculating order totals.
* **Detailed Order History**: Customers can view past orders, item details, order status, and cancel pending orders directly if they are still in "Processing" status.
* **Dual Color Themes**: Obsidian Dark Mode and Imperial Light Mode switchable via navbar button, with state persistence.
* **Toast Notification Engine**: Custom, non-intrusive animated feedback messages for actions (success, info, errors).

### 💬 Interactive Reviews & Ratings Widget
* **Interactive Review Form**: Real-time hoverable star-rating selector (1 to 5 stars) and review description box.
* **Dynamic Analytics Panel**: Generates an overview of the average product rating, total review count, and a visual percentage bar distribution (5-star down to 1-star reviews).
* **Live Updates**: Submitting a review immediately updates the product average rating, count, and updates the review thread list.

### 💼 Powerful Merchant / Admin Console
I built a dedicated merchant management panel accessible with secure store credentials (`admin` / `admin@678`).
* **Sales Analytics Dashboard**: Aggregates vital business metrics in real-time, including:
  * *Total Revenue* (excluding cancelled checkouts).
  * *Total Orders processed*.
  * *Active Orders* (in transit/processing).
  * *Low Stock Alerts* (notifies when catalog units drop below 15).
* **Fulfillment Processing Console**: Tracks orders and features a dropdown to transition fulfillment states (`Processing` ➡️ `Dispatched` ➡️ `Shipped` ➡️ `Delivered` or `Cancelled`).
* **Inventory Catalog Manager**:
  * **Add & Edit Products**: Open a modal to manage product descriptions, price points, categories, and stock numbers.
  * **Local Image Upload**: Integrated an image upload system that saves local files to `public/images/` and outputs a usable application URL.
  * **Delete Products**: Securely wipes a product from the catalog, including cascading deletion of all associated customer reviews.
* **Visual Category Analytics**: Dynamically compiles stock share percentages per category and renders a beautiful SVG donut chart.

---

## 📁 Project Structure

```
ecommerce/
├── app.py                 # Flask server: API routes, schemas, and data seeds
├── package.json           # Node configuration file (Express developer dependencies)
├── package-lock.json      # Node dependency lock file
├── instance/
│   └── shopvault.db       # Persistent SQLite Database (auto-generated on first run)
├── public/                # Frontend static assets and views
│   ├── index.html         # Main SPA structure
│   ├── css/
│   │   └── style.css      # Custom stylesheet (vars, dark mode, widgets, keyframes)
│   ├── images/            # Product image uploads and catalog media
│   └── js/
│       └── app.js         # Client-side routing, state, and API requests
└── README.md              # My project documentation
```

---

## 🚀 Running Project Locally

### 1. Install Python Dependencies
USMart runs on a lightweight Python environment. Install Flask, SQLAlchemy, PyJWT, and CORS:
```bash
pip install flask flask-cors flask-sqlalchemy pyjwt werkzeug
```

### 2. Run the Flask Server
Simply execute `app.py` to start the backend:
```bash
python3 app.py
```
*(On first execution, Flask will automatically create `shopvault.db`, configure the SQL tables, and seed the core catalog items and reviews.)*

### 3. Visit USMart in Your Browser
Open your browser and navigate to:
👉 **http://localhost:5000**

---

## 🔑 Merchant Credentials
To experience the Merchant Console, sign in using my pre-configured store administrator account:
* **Username/Email**: `admin`
* **Password**: `admin@678`

---

## 📡 API Reference

### 🔐 Authentication Endpoints
* `POST /api/auth/register` (Public) — Registers user, hashes password, and returns a JWT.
* `POST /api/auth/login` (Public) — Authenticates credentials, returns user details, and issues session token.
* `GET /api/auth/me` (Auth Required) — Retrieves the currently logged-in user profile.

### 📦 Product & Review Endpoints
* `GET /api/products` (Public) — Lists all products. Supports query parameters `?category=Home` or `?search=headphones`.
* `GET /api/products/:id` (Public) — Retrieves detailed data for a specific product.
* `GET /api/products/:id/reviews` (Public) — Retrieves customer reviews for a specific product.
* `POST /api/products/:id/reviews` (Auth Required) — Submits a new review and triggers an average rating recalculation.

### 🧾 Ordering Endpoints
* `POST /api/orders` (Auth Required) — Places an order with product IDs, quantities, and shipping address.
* `GET /api/orders` (Auth Required) — Retrieves the order history for the logged-in user.
* `POST /api/orders/:id/cancel` (Auth Required) — Cancels a customer's order if it is still in "Processing" state.

### 🛡️ Merchant Console Endpoints
* `GET /api/admin/orders` (Merchant Auth Required) — Retrieves all orders processed on the platform with customer details.
* `PUT /api/orders/:id/status` (Merchant Auth Required) — Transitions the fulfillment status of an order.
* `POST /api/products` (Merchant Auth Required) — Appends a new product to the catalog.
* `PUT /api/products/:id` (Merchant Auth Required) — Updates attributes for an existing product.
* `DELETE /api/products/:id` (Merchant Auth Required) — Deletes a product, cascading to erase associated reviews and orders.
* `POST /api/admin/upload-image` (Merchant Auth Required) — Safely uploads a local product image file and returns its URL.

---

*Thank you for exploring USMart! If you have any questions or feedback about the implementation details, feel free to reach out.*
