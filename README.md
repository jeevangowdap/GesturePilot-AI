🖐️ GesturePilot AI

Intelligent Hands-Free Presentation Controller

Present Smarter. Control Freely. Impress Effortlessly.

GesturePilot AI is an intelligent, computer-vision-powered presentation controller that enables users to navigate and manage presentations through natural hand gestures — without touching a keyboard, mouse, or remote.

Built to make presentations more interactive, accessible, and seamless, GesturePilot AI transforms an ordinary webcam into a touch-free presentation control system.

Computer Vision • Real-Time Gesture Recognition • React • Python • FastAPI

---

🚀 Overview

Traditional presentations depend on keyboards, mice, or remote controllers, restricting movement and interrupting the natural flow of communication.

GesturePilot AI changes that.

Using real-time hand landmark detection and gesture recognition, presenters can navigate slides, start presentations, toggle a black screen, and lock gesture controls with simple hand movements.

✨ Key Features

- 🖐️ Hands-Free Slide Navigation — Navigate presentations using natural hand gestures.
- 🎯 Real-Time Gesture Recognition — Detect hand landmarks and interpret predefined gestures.
- 📷 Webcam-Based Interaction — Use a standard webcam without specialized hardware.
- 🔒 Gesture Lock/Unlock — Prevent unintended actions during presentations.
- ⚡ Gesture Stabilization — Require gestures to be held briefly before activation to reduce accidental commands.
- 🖥️ Interactive Presentation Workspace — Modern React-based interface for presentation control.
- 📄 Document Support — Presentation workflow with PDF rendering and PowerPoint processing.
- 🔐 Browser-Based Hand Tracking — Hand landmark processing runs locally in the browser without uploading webcam video.

🖐️ Gesture Controls

Gesture| Action
🖐️ Open Palm| Next Slide
✌️ Victory Sign| Previous Slide
👍 Thumbs Up| Start / Toggle Presentation
☝️ Index Finger| Toggle Black Screen
✊ Closed Fist| Lock / Unlock Gesture Controls

Safety mechanism: Hold a gesture for approximately 600 ms to activate it. Return the hand to a neutral position before triggering another action.

🛠️ Technology Stack

Layer| Technologies
Frontend| React, JavaScript, Vite
Backend| Python, FastAPI
Computer Vision| MediaPipe Hand Landmarker
Presentation Rendering| PDF.js
Styling| CSS
Version Control| Git & GitHub

🏗️ Project Architecture

GesturePilot-AI/
├── backend/
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── gestures/
│   │   │   └── gestureEngine.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md

⚙️ Installation & Setup

Prerequisites

- Python 3
- Node.js and npm
- Webcam
- Modern web browser
- Git

1. Clone the repository

git clone https://github.com/jeevangowdap/GesturePilot-AI.git
cd GesturePilot-AI

2. Start the backend

cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload

The backend runs at "http://localhost:8000" by default.

3. Start the frontend

Open another terminal:

cd frontend
npm install
npm run dev

Open the local URL displayed by Vite, typically "http://localhost:5173".

4. Start presenting

1. Open GesturePilot AI in your browser.
2. Allow webcam access when prompted.
3. Open or upload your presentation through the workspace.
4. Enable gesture recognition.
5. Control your presentation using hand gestures.

Note: PowerPoint conversion may require LibreOffice or Microsoft PowerPoint installed on the host system.

🧠 How It Works

1. Video Capture: The webcam captures live video frames.
2. Hand Detection: MediaPipe identifies hand landmarks.
3. Gesture Classification: The gesture engine analyzes finger positions.
4. Command Validation: Gesture stabilization and locking logic prevent unintended actions.
5. Presentation Control: Valid gestures trigger the corresponding presentation commands.

🌍 Real-World Applications

- 🎓 Smart classrooms and interactive teaching
- 💼 Business presentations and professional meetings
- 🎤 Conferences, seminars, and public speaking
- ♿ Touch-free and accessibility-oriented interfaces
- 🧪 Human–Computer Interaction research

🔮 Future Enhancements

- Customizable gesture mappings
- Voice-assisted presentation controls
- Presenter analytics and engagement insights
- Multi-hand gesture recognition
- Additional presentation platform integrations
- Expanded accessibility controls

🎯 Project Vision

GesturePilot AI explores the future of natural Human–Computer Interaction, where technology responds to intuitive human movements instead of requiring conventional input devices.

Our vision is to make presentation technology more natural, accessible, and engaging.

---

⭐ Support the Project

If you find GesturePilot AI interesting, consider starring the repository and sharing your feedback.

GesturePilot AI — Your Hands. Your Slides. Your Control.
