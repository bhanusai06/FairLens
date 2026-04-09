# FairLens — AI Bias Detection Platform

> **Google Solution Challenge 2026** | [Unbiased AI Decision] Category
> 
> Audit, detect, and fix bias in AI decision systems using **Gemini 1.5 Pro**. Get a Fairness Score, root cause analysis, and mitigation roadmap in under 10 seconds.

![FairLens Dashboard](./public/preview.png)

---

## 🚀 Live Demo

**[fairlens.vercel.app](https://fairlens.vercel.app)** ← Try the live app

Demo datasets pre-loaded:
- 💼 **Hiring** — Female candidates rejected 23% more with identical qualifications
- 🏦 **Loans** — Minorities denied 31% more with identical financial profiles  
- 🏥 **Healthcare** — Women receive basic plans vs comprehensive for same symptoms

---

## 🧠 What FairLens Does

1. **Upload any decision dataset** (hiring, loans, healthcare, credit scoring)
2. **Gemini 1.5 Pro analyzes** bias across protected attributes (gender, race, age, etc.)
3. **Get a Fairness Score** (0–100) with severity rating
4. **See which decisions are biased** with exact explanations
5. **Follow a 3-step mitigation roadmap** with expected score improvements

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| AI Engine | **Gemini 1.5 Pro** via `@google/generative-ai` |
| Backend | Next.js API Routes (Edge-ready) |
| Auth | Firebase Authentication |
| Database | Firestore |
| Deployment | **Cloud Run** / Vercel |
| Charts | Recharts |
| Animations | Framer Motion, CSS |

---

## ⚡ Quick Start (3 commands)

```bash
# 1. Install dependencies
npm install

# 2. Add your Gemini API key
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY

# 3. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Getting Your Gemini API Key

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Create a new API key
3. Add it to `.env.local`:
   ```
   GEMINI_API_KEY=your_key_here
   ```

---

## 🚢 Deploy to Cloud Run

```bash
# Build Docker image
docker build -t fairlens .

# Push to Google Container Registry
docker tag fairlens gcr.io/YOUR_PROJECT_ID/fairlens
docker push gcr.io/YOUR_PROJECT_ID/fairlens

# Deploy to Cloud Run
gcloud run deploy fairlens \
  --image gcr.io/YOUR_PROJECT_ID/fairlens \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_key
```

---

## 📁 Project Structure

```
fairlens/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── upload/page.tsx       # Upload + demo selector
│   │   ├── dashboard/page.tsx    # Bias analysis results
│   │   └── api/analyze/route.ts  # Gemini API endpoint
│   ├── lib/
│   │   ├── gemini.ts             # Gemini integration + prompt
│   │   ├── firebase.ts           # Firebase config
│   │   └── rateLimit.ts          # API protection
│   └── data/
│       └── datasets.ts           # Demo datasets (hiring/loan/medical)
└── ...
```

---

## 🔒 Security Features

- **Rate limiting** — 10 requests/minute per IP
- **Input sanitization** — All CSV input sanitized before Gemini
- **Size limits** — Max 5MB files, 60KB CSV to API
- **Zod validation** — All API request bodies validated
- **No data stored** — Analysis results stay in sessionStorage only
- **HTTPS only** — All API calls encrypted

---

## 🏆 Google Solution Challenge Submission

- **Challenge**: [Unbiased AI Decision] Ensuring Fairness and Detecting Bias in Automated Decisions
- **Google AI Used**: Gemini 1.5 Pro, Firebase, (Cloud Run for deployment)
- **UN SDG**: Goal 10 (Reduced Inequalities), Goal 16 (Justice and Strong Institutions)

---

## 👥 Team

Built for Google Solution Challenge 2026 — [Unbiased AI Decision]

---

*Powered by Gemini 1.5 Pro · Google Solution Challenge 2026*
