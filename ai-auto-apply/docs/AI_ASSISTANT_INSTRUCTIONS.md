# AI Resume System — Dynamic DB-Aware Assistant Rules

## 1. Understand the Full Resume Data Workflow

Always assume the resume system uses:
- **PostgreSQL** for documents
- **Backend orchestrator** with REST endpoints  
- **Unified resume processing pipeline**
- **Services**: DocumentManagementService, PDFProcessingService, ResumeAnalysisService

**Golden Rule**: *All resume state must be driven from database values, not from hardcoded UI values.*

### Core Architecture
```
Frontend (React) → ResumeOrchestratorService → Backend API → PostgreSQL
                    ↓
                UnifiedResumeProcessor → Multiple Processing Methods
                    ↓
                useResumeManager Hook → UI Components
```

## 2. Always Separate UI From Logic

When generating code:
❌ **DO NOT** insert fetch/upload/DB logic inside JSX
✔ **DO** create hooks and services

### Required Separation Pattern
```typescript
// ❌ WRONG - Logic in JSX
const MyComponent = () => {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    fetch('/api/data').then(r => setData(r.data)); // BAD!
  }, []);
  
  return <div>{data.map(...)}</div>;
};

// ✅ RIGHT - Logic separated
const MyComponent = () => {
  const { data, loading } = useDataManager(); // GOOD!
  
  if (loading) return <Loading />;
  return <div>{data.map(...)}</div>;
};
```

## 3. Use These Required Abstractions

### Resume Data Layer
```typescript
interface ResumeDocument {
  id: string;
  user_id: string;
  original_filename: string;
  uploaded_at: string;
  is_active: boolean;
  status?: "processed" | "pending" | "error";
}
```

### Resume Unified Processing Result
```typescript
interface UnifiedResumeResult {
  text: string;
  metadata: PdfMetadata;
  previewImage: string;
  stats: ResumeStats;
  extractedInfo: ResumeExtractedInfo;
  success: boolean;
  error?: string;
}
```

**When writing code, always assume these exist.**

## 4. Resume Manager Hook Required Methods

The `useResumeManager` hook **must** provide these methods:
- `loadResumes()` - Load all user documents
- `uploadResume(file, userEmail?, options?)` - Upload and process
- `setResumeActive(id)` - Set active document
- `deleteResume(id)` - Delete document
- `processResume(id?)` - Process document (CLI method)
- `processResumePDFv2(file)` - Process using PDF v2 API

**All UI components must call these functions.**

## 5. AI Apply Logic Rules

When building AI apply logic:
1. **Read active resume** from DB via `resumeManager.activeResume`
2. **Extract profile** using `resumeManager.unifiedResult.extractedInfo`
3. **Fetch job matches** using search service
4. **Generate cover letter** using AI service
5. **Store application log** in DB
6. **DO NOT hardcode data** unless user explicitly asks for placeholders

### AI Apply Implementation Pattern
```typescript
const handleAIApply = async () => {
  // 1. Get active resume from hook
  const activeResume = resumeManager.activeResume;
  const profile = resumeManager.unifiedResult?.extractedInfo;
  
  if (!activeResume || !profile) {
    throw new Error('No active resume found');
  }
  
  // 2. Generate application using profile data
  const application = await AIApplyService.generateApplication({
    resumeText: resumeManager.unifiedResult.text,
    profile: profile,
    // ... other dynamic data
  });
  
  // 3. Store in database
  await ApplicationService.logApplication(application);
};
```

## 6. When Modifying Code

The assistant must:
✔ **Make code modular** - Use small, focused components
✔ **Use TypeScript types** - Leverage the defined interfaces
✔ **Consume backend-generated data** - Never hardcode responses
✔ **Avoid duplicating logic** - Use existing services and hooks
✔ **Never process PDF directly inside React UI** - Use services

### Code Modification Checklist
- [ ] Is the logic in a hook or service?
- [ ] Are TypeScript interfaces used?
- [ ] Is data coming from the backend?
- [ ] Are components small and focused?
- [ ] Is there separation of concerns?

## 7. All DB Reads Must Be Dynamic

**Instead of:**
```typescript
const [resumes, setResumes] = useState([]);
```

**Use:**
```typescript
const { resumes, loading } = useResumeManager(userId);
```

### Dynamic Data Pattern
```typescript
// ✅ CORRECT - Dynamic data flow
const ResumeComponent = ({ userId }) => {
  const { 
    resumes, 
    activeResume, 
    loading, 
    uploadResume,
    setResumeActive 
  } = useResumeManager(userId);
  
  // Component logic only, no data fetching
  return (
    <div>
      {loading ? <Loading /> : (
        <ResumeList 
          resumes={resumes}
          activeResume={activeResume}
          onSetActive={setResumeActive}
        />
      )}
    </div>
  );
};
```

## 8. Always Produce Clean, Separated Files

**Never give one large file unless requested.**

### File Structure Requirements
```
src/
├── types/
│   └── resume.ts              # All resume-related interfaces
├── hooks/
│   └── useResumeManager.ts    # Resume state management
├── services/
│   ├── resumeOrchestratorService.ts  # Backend orchestration
│   └── unifiedResumeProcessor.ts     # Processing pipeline
└── components/resume/
    ├── ResumeUploadBox.tsx    # Upload functionality
    ├── ResumeList.tsx         # List display
    ├── ActiveResumeCard.tsx   # Active resume display
    ├── ProcessResults.tsx     # Processing results
    └── AnalysisResults.tsx    # Analysis display
```

## 9. Service Layer Rules

### Backend Communication
- **All API calls** go through `ResumeOrchestratorService`
- **Never call fetch()** directly from components
- **Use unified interfaces** for all processing methods

### Processing Methods
- **CLI Processing**: `ResumeOrchestratorService.processDocumentUnified()`
- **PDF v2 Processing**: `ResumeOrchestratorService.processResumePDFv2()`
- **Hybrid Processing**: `UnifiedResumeProcessor.process(..., 'hybrid')`

## 10. Error Handling Patterns

### Standard Error Flow
```typescript
const handleOperation = async () => {
  try {
    await resumeManager.someOperation();
    // Success handling
  } catch (error) {
    console.error('Operation failed:', error);
    // User-friendly error message
    alert(`Failed to ${operation}: ${error.message}`);
  }
};
```

## 11. Port Management Rules

**Always use correct ports based on environment:**
- **Local**: Backend on `8000`, Frontend on `3000`
- **Docker**: Backend on `8100`, Frontend on `3100`

### API URL Pattern
```typescript
const API_BASE_URL = process.env.REACT_APP_ENV === "docker" 
  ? "http://localhost:8100" 
  : "http://localhost:8000";
```

## 12. Testing Requirements

When creating new features:
1. **Unit test** hooks and services
2. **Integration test** API calls
3. **Component test** UI interactions
4. **E2E test** complete workflows

## 13. Performance Guidelines

- **Lazy load** heavy components
- **Cache** processing results
- **Debounce** search operations
- **Optimize** PDF processing with web workers when possible

## 14. Security Considerations

- **Validate** file uploads on client and server
- **Sanitize** extracted text before display
- **Use** secure API endpoints
- **Never** expose sensitive data in URLs

---

## Quick Reference

### Essential Imports
```typescript
import { useResumeManager } from '../hooks/useResumeManager';
import { ResumeDocument, UnifiedResumeResult } from '../types/resume';
import { ResumeOrchestratorService } from '../services/resumeOrchestratorService';
```

### Component Pattern
```typescript
const Component = ({ userId }) => {
  const resumeManager = useResumeManager(userId);
  
  return (
    <div>
      {/* Use resumeManager state and methods */}
    </div>
  );
};
```

### Service Pattern
```typescript
const result = await ResumeOrchestratorService.someMethod(params);
// Handle result with proper error checking
```

---

**Remember**: The goal is to make the code maintainable, testable, and AI-assistant friendly through clear separation of concerns and consistent patterns.
