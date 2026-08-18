# ⚡ CodePulse

> A lightweight, real-time dashboard to monitor your GitHub team's activity, commit history, and code quality[cite: 5, 7].

---

### 🚀 Key Features
* **GitHub Integration:** Secure OAuth login to fetch and visualize repository activity instantly[cite: 5, 7].
* **Team Analytics:** Track contributors, recent commits, and pull requests across multiple repositories[cite: 4, 7].
* **Quality Indicators:** Health badges and code quality analysis to spot issues early[cite: 5].
* **Real-Time Updates:** Dashboard syncs automatically with GitHub to provide the latest activity metrics[cite: 5].
* **Privacy Focused:** Only reads public data; no code is stored locally[cite: 5].

---

### 🛠️ Tech Stack & Deployment
* **Frontend:** HTML5, CSS3 (Custom Styles), Vanilla JavaScript[cite: 4, 5].
* **Backend/API:** Serverless functions deployed via Vercel for GitHub OAuth routing.
* **Infrastructure:** Vercel (Hosting & Deployment)[cite: 6, 7].

---

### ⚙️ Quickstart (Local Development)

#### 1. Configure GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers) and create a "New OAuth App".
2. Set **Homepage URL** to your local or deployed domain[cite: 7].
3. Set **Authorization callback URL** to `http://localhost:3000/api/auth/callback` (or your domain for production)[cite: 7].

#### 2. Environment Setup
Clone the repository and configure your environment variables:
```bash
git clone [https://github.com/hes0o/codepulse.git](https://github.com/hes0o/codepulse.git)
cd codepulse

# Create the environment file
cp .env.example .env.local
