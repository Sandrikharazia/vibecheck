# VibeCheck

VibeCheck is a responsive, modern full-stack event discovery and localized route navigation platform. Built with a developer-focused, high-contrast visual style, it enables users to seamlessly discover local events, save their favorites, and calculate real-time directions from their precise location. The system enforces dynamic role-based access controls (RBAC) to separate administrator powers from standard customer experiences.

---

## 🚀 Key Features

### 1. Robust Authentication & Role-Based Access
*   **Secure Accounts**: Unified signup/login screens featuring real-time "Account not found" feedback prompting fresh registration on incorrect entries.
*   **Role-Based Access Control (RBAC)**:
    *   **Administrator**: Full rights to publish new events (by inputting event titles, coordinates, images, dates, and categories) and permanently delete outdated cards.
    *   **Customer**: Safe access to exploratory search, multi-category filtering, saved event tracking, and advanced map routing.

### 2. Live Map Routing & Custom Starting Points
*   **Personalized Directions**: Instantly request starting locations from customers inside the interactive map view.
*   **Dynamic Embedded Map**: Calculations run coordinates to map directions from the custom starting location directly to the selected event location on-page.
*   **Sidebar Interconnectivity**: Side-by-side interactive list of events and custom active route overlay menus displaying destination names and navigation states.

### 3. Highly Capitalized Front-End Aesthetic
*   **Smooth Motion & Transitions**: Elegant enter animations, card shifting, and slide effects powered cleanly using React and Motion.
*   **Responsive Fluid Layouts**: Responsive navigation bars, grid structures, bento-style explorer drawers, and detailed views.
*   **Category-Specific Indicators**: Custom visual color banners matching tech, sports, art, or food events seamlessly.

---

## 🛠️ Tech Stack

*   **Frontend**: React (Vite environment), Tailwind CSS for styling, Lucide-React for crisp icons, and Motion for animation handling.
*   **Backend**: Node.js & Express API services.
*   **Database**: SQLite via `Better-SQLite3` for atomic transactions, secure persistent tables, and lightweight local storage.
