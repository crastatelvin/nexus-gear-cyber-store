# Long-Term Memory

## Project Context: NEXUS GEAR E-Commerce Store
- **Conceptual Theme**: Futuristic cybernetic accessories (NEXUS GEAR).
- **Core Architecture**:
  - Express.js Backend serving API endpoints and static assets.
  - Client-side Single Page Application (Vanilla JavaScript & CSS Glassmorphism).
  - SQLite Relational Database (`database.sqlite`) tracking products, users, orders, and order items.
  - Multi-stage Docker packaging and compose volumes.
- **Critical Behaviors & Rules**:
  - The first registered user in the database is automatically granted `admin` privileges.
  - JWT session token is stored securely as an HTTP-only cookie.
  - Order checkouts perform database transaction verification and stock adjustments atomically.
  - CSS layout relies on custom neon theme variables, OutFit/Inter fonts, and Lucide icons.
