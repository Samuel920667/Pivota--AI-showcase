Pivota: Secure Fintech Demo 🇳🇬
Pivota is a high-fidelity mobile banking prototype built to address the "Trust Gap" in Nigerian digital payments. This project showcases advanced fraud prevention UI/UX, including real-time risk scoring and geographical fraud visualization.

🛡️ Demo Highlights
1. Real-Time Fraud Risk Intelligence
When Alicia selects a recipient, the app dynamically calculates a Trust Score.

Visual Risk Badges: Immediate feedback using "Low", "Medium", or "High" markers.

The 70% Marker: Contextual percentage scores displayed alongside risk levels to provide data-driven confidence before sending money.

2. Regional Fraud Heatmap (Ikeja Focus)
A specialized security overlay that connects transaction destinations to known fraud hotspots.

Zoomed-In Visualization: A dedicated modal showing street-level maps of high-risk areas like Ikeja Computer Village.

Live Stats: Displays real-time fraud incidence rises (e.g., "12% Increase") and specific regional threats like SIM-swap clusters.

3. Secure Authorisation
Integrated PIN-gate for transaction finality, ensuring that security remains paramount even in a fast-paced mobile environment.

🚀 Get Started
Install dependencies

Bash

npm install

Start the app

Bash

npx expo start~
Scan the QR code with Expo Go (Android) or your Camera app (iOS) to view the demo live.

🛠️ Technical Implementation
Navigation: File-based routing via expo-router.

State Management: React Context API (BankingContext.tsx) managing balances and beneficiary risk profiles.

UI Components: Custom animated Modal for heatmaps and ScrollView for smooth quick-select beneficiary interactions.

Map Visualization: Integration of static mapping URLs to simulate live GPS fraud tracking.

📂 Project Structure
app/send.tsx: The core logic for the "Send Money" flow, risk card, and Heatmap Modal.

contexts/BankingContext.tsx: The "brain" of the app, storing user balances and pre-defined risk scores.

app/(tabs): Main dashboard and navigation layout.

Note for Demo Observers
This is a Frontend-Focused Prototype. While it simulates real-time data fetching and geographical risk analysis, the logic is self-contained to ensure 100% uptime during live presentations without backend dependency.