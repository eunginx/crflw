# Onboarding Module -- AI Instruction Document

## 1. Purpose of Onboarding

The onboarding module collects all core user data required for: -
Profile construction - Resume parsing - Job preference understanding -
Auto-apply decision rules - Personalization of AI behavior

The AI assistant must treat onboarding as a guided, multi-step wizard
where missing fields must be explicitly requested.

## 2. General AI Rules

1.  Ask for missing data.
2.  Output structured JSON after every onboarding step.
3.  Use static placeholder values where allowed.
4.  Never continue to next step until required fields are collected.
5.  All user-facing text must be concise and simple.
6.  Never generate resume content unless asked.
7.  Output schema MUST be strictly followed.

## 3. Onboarding Steps Overview

1.  Welcome -- explain onboarding
2.  Basic Profile Setup
3.  Job Preferences Setup
4.  Skill Extraction (Resume Parsing)
5.  Auto-Apply Safety & Behavior Settings
6.  Completion Summary

## 4. Step-by-Step Specification

### 4.1 Step 1 --- Welcome

Output:

``` json
{ "step": "welcome", "continue": true }
```

### 4.2 Step 2 --- Basic Profile Setup

Required fields: - full_name - email - location - job_search_stage -
experience_level - desired_roles

Allowed static values:

``` json
{ "timezone": "UTC", "work_authorization": "Not Provided" }
```

### 4.3 Step 3 --- Job Preferences Setup

Required fields: - target_job_titles - employment_type -
remote_preference

Allowed static values:

``` json
{
  "keywords": [],
  "excluded_keywords": [],
  "industries": ["General"],
  "salary_expectation": "Not Provided"
}
```

### 4.4 Step 4 --- Skill Extraction

If no resume provided:

``` json
{
  "skills_detected": [],
  "experience_summary": "Experience information not provided.",
  "education_summary": "Education information not provided."
}
```

### 4.5 Step 5 --- Auto-Apply Safety Settings

Allowed static values:

``` json
{
  "daily_auto_apply_limit": 10,
  "match_threshold": 70,
  "blacklisted_companies": [],
  "require_confirmation": false
}
```

### 4.6 Step 6 --- Completion Summary

Return full compiled onboarding structure.

## 5. Firestore Storage Contract

    users/{userId}/profile
    users/{userId}/preferences
    users/{userId}/resume_analysis
    users/{userId}/auto_apply_settings
    users/{userId}/onboarding_status

## 6. Safe Assumptions

Static values allowed: - timezone = "UTC" - keywords = \[\] - industries
= \["General"\] - daily_auto_apply_limit = 10 - match_threshold = 70 -
require_confirmation = false

## 7. Universal Output Schema

``` json
{
  "step": "string",
  "profile": {},
  "preferences": {},
  "resume_analysis": {},
  "auto_apply": {},
  "completed": false
}
```
