# 🌿 EcoAudit — Community Waste Logger

A fraud-proof community waste tracking web app where users can 
log disposed waste with automatic GPS verification, view entries 
on an interactive dark map, and monitor live statistics on a 
real-time dashboard.

---

## 📌 What is this project?

EcoAudit allows community members, volunteers, and municipal 
workers to log waste disposal events from their exact location. 
The app automatically captures the user's real GPS coordinates 
using the browser's native Geolocation API — no manual location 
input is allowed, preventing fraudulent entries.

All logs are stored in a cloud database and displayed on a 
live dashboard with aggregated totals and an interactive map 
showing every waste entry as a color-coded pin.

---

## 🛠️ Tech Stack

| Layer          | Technology                        |
|----------------|-----------------------------------|
| Frontend       | React + Vite                      |
| Styling        | CSS3 + Custom Animations          |
| Map            | Leaflet.js + React-Leaflet        |
| Clustering     | react-leaflet-cluster             |
| Database       | Firebase Firestore                |
| Geolocation    | Browser Native Geolocation API    |
| Hosting        | Vercel                            |

---

## ⚙️ How to Run Locally

### Prerequisites
- Node.js (v18 or above)
- A Firebase account (free)

---

### Step 1 — Clone the repository
git clone https://github.com/yourusername/EcoAudit-Community-Waste-Logger.git
cd EcoAudit-Community-Waste-Logger

---

### Step 2 — Install dependencies
npm install

---

### Step 3 — Set up Firebase

1. Go to https://console.firebase.google.com
2. Create a new project
3. Click "Add App" → choose Web
4. Enable Firestore Database (in test mode is fine)
5. Copy your Firebase config

Then open this file in the project:
src/firebase/config.js

Replace the placeholder values with your actual config:

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

---

### Step 4 — Start the development server
npm run dev

The app will run at http://localhost:5173

---

## 📁 Project Structure

src/
├── components/
│   ├── WasteForm.jsx         # Form with auto GPS capture
│   ├── Dashboard.jsx         # Live logs table + totals
│   ├── ConfirmationMap.jsx   # Map shown after submission
│   └── DashboardMap.jsx      # Global map with all entries
├── firebase/
│   └── config.js             # Firebase configuration file
├── App.jsx
└── main.jsx

