# 🚀 FinMate — Personal Finance, Simplified

**Understand your money. Decide with confidence.**

**FinMate** is a personal finance management app that helps users monitor their financial health, stay on top of their budgets, and answer the critical question: *"Can I afford a big purchase without breaking my budget?"*

> **Note:** This project is a demo created for hackathon presentation purposes. All figures, names, and screens shown use test data.

---

## 🎬 Demo & Video
- ** Vimeo Demo Video:** https://vimeo.com/1234143311?share=copy&fl=sv&fe=ci

---

## ✨ Key Highlights
* **Clear Balance:** See your balance, income, expenses, and cash flow at a single glance.
* **Smart Budgeting:** Track spending by category and receive instant smart alerts before overspending.
* **Better Decisions:** Simulate major purchases and get tailored AI guidance before making a financial decision.

---

## 📌 Core Features

### 1. Dashboard
A comprehensive overview of your financial standing:
- **Financial Cards:** Real-time visibility into Balance, Income, Expenses, and Cash Flow.
- **Trend Charts:** Visual Representation of how your money changes over time.
- **Quick Navigation:** Fast switching between Income, Expenses, and Cash Flow metrics.

### 2. Budgeting & Smart Alerts
- **Progress Tracking:** Overall progress bar showing total budget usage (e.g., 72% used).
- **Category Breakdown:** Individual category limits (Food, Transport, Shopping) with progress indicators.
- **Smart Alerts:** Instant warnings for *Unusual Spending Detected* or *Limit Approaching*.

### 3. Purchase Simulator
Evaluate the financial impact of a purchase before spending money:
- Input item price and planned contribution.
- Fine-tune amounts using an interactive slider.
- Instantly view available post-purchase balance and a **Budget Impact Rating** (e.g., Low, Medium, High).
- Projected chart showing how the purchase affects long-term finances.

### 4. AI Assistant
Ask natural language questions (e.g., *"Should I buy this laptop right now?"*) and receive intelligent, personalized advice based on your balance, active budget limits, and spending trends.

---

## 🔄 Typical User Flow

1. **Dashboard Overview:** Open the app to review your balance and cash flow.
2. **Budget Check:** Monitor active category limits and spending alerts.
3. **Simulate Purchase:** Run a major planned purchase through the Purchase Simulator.
4. **AI Guidance:** Consult the AI Assistant for a tailored second opinion.
5. **Decide with Confidence:** Make informed financial choices without breaking the bank.

---

## 🛠️ Tech Stack

- **Frontend:** React, Vite, JavaScript, Tailwind CSS / CSS Modules
- **Backend:** FastAPI (Python), Uvicorn
- **AI / LLM Integration:** OpenRouter / OpenAI / Gemini API via Server-side Integration
- **Authentication & Security:** Custom `X-API-Key` middleware

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- Python 3.10+
- Node.js 18+

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run FastAPI backend server
uvicorn main:app --reload --port 8001
