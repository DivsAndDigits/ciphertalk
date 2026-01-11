# 🔐 Cipher-Talk Lite

### 🧠 Real-Time Call Verification Assistant

> **Cipher-Talk Lite** is a browser-based security tool that helps you detect **fraud calls, AI voices, and social-engineering attacks** in real time using camera gestures, audio timing, and behavioral analysis.

🚨 Built for the modern world where **deepfake voices & scam calls** are becoming more dangerous every day.

---

## 🌟 What This App Does

Cipher-Talk Lite verifies whether a caller is **really human** and **acting legitimately** by using:

| Layer         | What it checks                                        |
| ------------- | ----------------------------------------------------- |
| 📷 Camera     | Are they reacting live?                               |
| 🎤 Microphone | Is their voice natural?                               |
| ⏱ Timing      | Are responses what's expected from a real human?      |
| 🧠 Behavior   | Are they pressuring or asking for OTP/money?          |
| 🔐 Knowledge  | Do they know something only a real person would know? |

All these signals combine into a **Trust Score (%)** that tells you how safe the call is.

---

## 🛡️ Verification Flow

Cipher-Talk Lite runs through **5 powerful security layers**:

### 1️⃣ Gesture Challenge 🖐

The user performs a live gesture (like blinking or showing fingers).
⛔ Bots & replays fail here.

---

### 2️⃣ Voice Latency Check ⏱

You ask the caller to say a phrase (e.g. *“Ab phone ghumao”*).
The app checks if **audio timing matches real-time movement**.

---

### 3️⃣ AI Voice Detection 🎙

Uses **FFT (Fast Fourier Transform)** to analyze the voice pattern.
Detects **synthetic / AI-generated voices**.

---

### 4️⃣ Behavioral Analysis 🧠

You flag suspicious behavior like:

* Urgency
* Avoiding verification
* Asking for OTP or money

Each red flag reduces trust.

---

### 5️⃣ Knowledge Challenge 🔐

Ask a personal question only a real person would know.

---

## 📊 Final Trust Score

All results combine into a **percentage-based Trust Meter**:

| Score          | Meaning                  |
| -------------- | ------------------------ |
| 🟢 **80–100%** | Trusted Human            |
| 🟡 **50–79%**  | Human but be cautious    |
| 🔴 **0–49%**   | High fraud / Possible AI |

The app gives a **clear security verdict** at the end.

---

## 🧰 Tech Stack

Built entirely with **modern web technologies**:

* 🧩 **HTML5** – App structure
* 🎨 **CSS3** – UI design & responsive layout
* 🧠 **JavaScript (Vanilla)** – Logic & real-time processing
* 📷 **WebRTC (getUserMedia)** – Camera & mic access
* 🎧 **Web Audio API** – Voice & FFT analysis
* 📊 **Canvas API** – Audio waveform visualization

No external libraries. No server. Fully client-side.

---

## 🚀 How to Run

1. Download or clone the project
2. Open `index.html` in a modern browser (Chrome / Edge recommended)
3. Click **Start Verification**
4. Allow camera & microphone
5. Follow the on-screen steps

That’s it! 🎉

---

## ⚠️ Important Notes

* 🔒 Cipher-Talk Lite **does NOT intercept calls**
* 🎤 You run it **while on a call** (e.g. speaker mode)
* 🤖 Some features are **simulated** in this demo (for AI & latency testing)

---

## 💡 Why This Matters

Scammers now use:

* AI-generated voices
* Deepfake phone calls
* Pre-recorded responses

Cipher-Talk Lite turns your **browser into a fraud-detection shield** 🛡️

---

## 📌 Project Name

**Cipher-Talk Lite**
*“Verify the human. Protect the truth.”*

---
