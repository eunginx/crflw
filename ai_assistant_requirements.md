# AI Assistant Specification & Integration Guide

This document defines a complete, end-to-end specification for your **AI Assistant** used in the Careerflow Auto‑Apply system. It includes:
- Required AI capabilities
- Interaction models
- API instructions for Ollama Cloud
- Onboarding module instructions
- Functional & non-functional requirements
- Feature coverage checklist

This ensures the AI Assistant NEVER misses any required features.

---

# 1. Overview
The AI Assistant is responsible for powering all intelligent features inside the Auto‑Apply product, including resume parsing, job matching, skill extraction, autofill support, and job application decisions.

The assistant may run locally (via Ollama) or in the cloud (via **Ollama Cloud Models**).

The backend will communicate with Ollama via:
- **Local Ollama daemon** (dev)
- **Remote Ollama Cloud API** (prod)

---

# 2. Ollama Cloud API Integration

## 2.1 Authentication
Set the environment variable:
```
export OLLAMA_API_KEY=your_api_key
```

## 2.2 JavaScript Client Setup
Install:
```
npm i ollama
```

Initialize:
```ts
import { Ollama } from "ollama";

const ollama = new Ollama({
  host: "https://ollama.com",
  headers: {
    Authorization: "Bearer " + process.env.OLLAMA_API_KEY,
  },
});
```

## 2.3 Chat Request
```ts
const response = await ollama.chat({
  model: "gpt-oss:120b",
  messages: [{ role: "user", content: "Explain quantum computing" }],
  stream: true,
});
```

## 2.4 Supported Use Cases
Your assistant must support:
- Resume parsing
- Job description summarization
- Skill gap analysis
- Keyword extraction
- Score calculation
- Auto-apply decision-making
- Cover letter generation
- User preference interpretation

---

# 3. Onboarding Module Instructions

The assistant must support and understand all onboarding steps to power:
- Resume extraction
- User profile creation
- Skill mapping
- Auto-apply behavior setup

## 3.1 Welcome Flow
Explain platform benefits clearly.

## 3.2 Profile Setup Fields
- Full name
- Location
- Timezone
- Job seeking stage
- Resume upload
- Experience level
- Desired roles
- Work authorization

## 3.3 Job Preference Setup
- Keywords
- Job titles
- Industry
- Employment type
- Salary expectation
- Remote/on-site preferences

## 3.4 Skill Extraction
The AI Assistant must:
- Extract skills from resume
- Normalize skills
- Suggest missing ones
- Validate with user

## 3.5 Auto-Apply Safety Flags
- Daily limit
- Company blacklist
- Confirmation toggle
- Match threshold %

## 3.6 Completion Summary
- Summaries of collected data
- Quick edits

---

# 4. AI Assistant Responsibilities

The assistant must execute:

## 4.1 Resume Parsing
- Extract job titles
- Work history
- Skills
- Achievements
- Education
- Soft skills

## 4.2 Job Description Analysis
- Extract required skills
- Extract preferred skills
- Compare JD → Resume
- Compute match score (0-100)
- Explain reasoning

## 4.3 Job Matching Logic
```
match_score = (skill_overlap * weight1) +
               (keyword_match * weight2) +
               (role_similarity * weight3);
```

## 4.4 Auto Apply Decision Workflow
1. Check user preferences
2. Check blacklist
3. Check match threshold
4. Generate form answers
5. Generate cover letter
6. Approve for submission

## 4.5 Content Generation
- Tailored cover letter
- JS/React autofill response
- Email templates
- Summaries

## 4.6 Explanation + Transparency
The AI must always provide rationales for decisions.

---

# 5. AI Assistant Input/Output Standard

## 5.1 Required Inputs
- Resume text
- Job description text
- User preferences
- Onboarding profile data
- System flags

## 5.2 Output Schema (Strict)
```
{
  "matchScore": number,
  "skillsMatched": string[],
  "skillsMissing": string[],
  "apply": boolean,
  "reason": string,
  "coverLetter": string,
  "autofill": {
    "fullName": string,
    "email": string,
    "answers": {}
  }
}
```

---

# 6. Feature Checklist (AI Side)

### ✔ Resume Parsing
### ✔ Job Description Summaries
### ✔ Match Scoring
### ✔ User Preference Interpretation
### ✔ Skill Extraction
### ✔ Gap Analysis
### ✔ Auto‑Apply Decision Making
### ✔ Cover Letter Creation
### ✔ Application Autofill
### ✔ Transparent Reasoning
### ✔ Safety & Constraints

Every model output must follow these requirements.

---

# 7. Future-Proof Requirements
The assistant is expected to eventually support:
- Multi-resume A/B scoring
- Multiple job board integrations
- Customized apply strategies
- Interview preparation AI
- LinkedIn optimization

---

# 8. Usage Rules for the Assistant

1. Always request missing user preferences.
2. Never auto-apply when:
   - Company is blacklisted
   - Score < threshold
   - Daily limit exceeded
3. Must generate cover letter unless disabled.
4. Must explain every apply decision.
5. Must validate resume parse results.

---

# 9. API Summary (Copy-Paste Ready)
```
POST https://ollama.com/api/chat
Authorization: Bearer $OLLAMA_API_KEY
Body:
{
  "model": "gpt-oss:120b",
  "messages": [...]
}
```

---

# End of Document

