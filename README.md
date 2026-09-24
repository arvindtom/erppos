# ERPPOS - Enterprise ERP & Point of Sale System

A robust Node.js web application built directly from high-fidelity enterprise ERP mockups with responsive Tailwind CSS styling, Material Symbols, and interactive workflow capabilities.

## 🌟 Implemented Core Modules

1. **Technician Assignment (`/technician-assignment`)**
   - Interactive 3-column drag-and-drop Kanban board:
     - **Open Calls**: Draggable service tickets with device details and priority indicators.
     - **Technicians (Drop Zones)**: Real-time availability badges, live assigned & closed counters, hover highlight drop targets.
     - **Assigned Calls**: Real-time assignment tracking with workflow status transitions (*Assigned &rarr; In Progress &rarr; Closed*) and unassign rollback.
   - Click-to-assign fallback modal for accessibility & mobile screens.

2. **Stock Requests (`/stock-requests`)**
   - Multi-parameter filter toolbar: Date range, From Store, To Store, Transaction Type (*Transfer, Replenishment, Emergency Stock*), Transaction Status, Approval state, and Item code search.
   - Comprehensive request manifest table with approval badges and status indicators.
   - **Add New Request Modal** with automatic ID generation (`REQ-YYYY-XXXX`).
   - **Request Details & Approval Modal** allowing store managers to Approve, Reject, or mark requests as In Transit.

3. **Sales Returns (`/sales-returns`)**
   - Real-time client search and date/store/status filters.
   - **Process New Return Modal** with live automatic tax (12% GST) and Doc Total calculations.
   - One-click **Export to CSV** for return records.

4. **Check Item Price & Stock (`/check-item-price-and-stock`)**
   - Store warehouse selector, brand filtering, category filtering, and item search.
   - Interactive table with sortable columns (Price, Available, Item Code, Brand).
   - Available stock alerts (highlighted badges: Red when zero, Indigo when stocked).
   - Column visibility toggle modal.
   - **Export Excel / CSV** download.

5. **Customers Management (`/customers`)**
   - Real-time KPI summary metric cards: Total Customers, Active Customers, GST Registered.
   - Filter by status (*Active/Inactive*) and multi-field search (*Code, Name, Mobile, GST, City*).
   - Full **Customer CRUD**:
     - Add Customer modal.
     - Edit Customer modal with prefilled data.
     - Delete Customer with confirmation dialog.
   - Export customers directory to CSV.

6. **Payment Receipts (`/payment-receipts`)**
   - Search by Doc No., Customer, or Mobile.
   - Store & status filters (*Open / Cancelled*).
   - **Record New Receipt Modal** with payment mode (*Cash, UPI, Credit Card, Bank Transfer, Cheque*).
   - **Printable Payment Voucher Modal** formatted with tax invoice layout.
   - Export receipts to CSV.

7. **Global ERP Navigation & Utilities**
   - **Dashboard (`/dashboard`)**: Central operations hub with real-time KPI counts, module shortcuts, and activity feed.
   - **Service Calls (`/service-calls`)**: Comprehensive tabular listing of all calls with links to the assignment board.
   - **Global Search**: Cross-module autocomplete search across Customers, Service Calls, Stock Requests, Items, and Receipts.
   - **Quick Create Modal**: Instant creation shortcuts from any page.
   - **Unified Sidebar**: All 19 navigation routes with active state indicator and fallback views (zero 404s).

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
npm install
```

### Running the Application
```bash
npm start
```
Or for development:
```bash
node server.js
```

Open your browser at:
- **Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Technician Assignment**: [http://localhost:3000/technician-assignment](http://localhost:3000/technician-assignment)
- **Stock Requests**: [http://localhost:3000/stock-requests](http://localhost:3000/stock-requests)
- **Sales Returns**: [http://localhost:3000/sales-returns](http://localhost:3000/sales-returns)
- **Item Price & Stock**: [http://localhost:3000/check-item-price-and-stock](http://localhost:3000/check-item-price-and-stock)
- **Customers**: [http://localhost:3000/customers](http://localhost:3000/customers)
- **Payment Receipts**: [http://localhost:3000/payment-receipts](http://localhost:3000/payment-receipts)

---

## 📁 Project Architecture
```
c:\POS\
  ├── data/
  │   ├── initialData.js      # Seed dataset matching mockups
  │   ├── db.json             # Persistent JSON database
  │   └── store.js            # Store operations and query helpers
  ├── public/
  │   ├── js/
  │   │   ├── common.js       # Toast notifications, modals, global search
  │   │   ├── technician.js   # Drag-and-drop Kanban engine
  │   │   ├── stock.js        # Stock request filters & approval workflow
  │   │   ├── returns.js      # Sales returns & tax calculations
  │   │   ├── items.js        # Catalog search & column sorting
  │   │   ├── customers.js    # Customer CRUD handlers
  │   │   └── receipts.js     # Receipt voucher and filters
  ├── routes/
  │   └── api.js              # RESTful API endpoints for all modules
  ├── views/
  │   ├── partials/
  │   │   ├── head.ejs        # Tailwind CSS config & typography
  │   │   ├── sidebar.ejs     # 19 ERP navigation links with active state
  │   │   ├── header.ejs      # Top bar, search bar, profile & notifications
  │   │   └── modals.ejs      # Quick create and toast container
  │   ├── technician-assignment.ejs
  │   ├── stock-requests.ejs
  │   ├── sales-returns.ejs
  │   ├── check-item-price-and-stock.ejs
  │   ├── customers.ejs
  │   ├── payment-receipts.ejs
  │   ├── dashboard.ejs
  │   ├── service-calls.ejs
  │   └── generic-module.ejs
  ├── package.json
  └── server.js
```
