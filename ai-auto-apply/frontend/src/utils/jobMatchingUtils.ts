// AI Relevance Scoring and Matching Utilities

interface ResumeSkills {
  technical: string[];
  soft: string[];
  experience: string[];
  certifications: string[];
}

export interface MatchReason {
  type: 'skill' | 'location' | 'seniority' | 'certification';
  matched: boolean;
  text: string;
  importance: 'high' | 'medium' | 'low';
}

export interface JobMatchAnalysis {
  score: number;
  confidence: 'high' | 'medium' | 'low';
  reasons: MatchReason[];
  summary: string;
}

// Mock resume skills - in real app, this would come from user profile/resume parsing
const mockResumeSkills: ResumeSkills = {
  technical: ['React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'AWS', 'Docker', 'PostgreSQL', 'MongoDB'],
  soft: ['Leadership', 'Communication', 'Problem Solving', 'Team Work', 'Agile'],
  experience: ['5+ years', 'Full Stack', 'Backend', 'Frontend', 'System Design'],
  certifications: ['AWS Certified', 'Google Cloud', 'Scrum Master']
};

// Common seniority levels
const seniorityLevels = {
  junior: ['Junior', 'Entry Level', 'Associate', 'Graduate', 'Intern'],
  mid: ['Mid-Level', 'Senior', 'Lead', 'Principal', 'Engineer'],
  senior: ['Senior', 'Lead', 'Principal', 'Staff', 'Architect', 'Manager', 'Director', 'VP']
};

// Calculate text similarity score (simplified version of TF-IDF cosine similarity)
export const calculateTextSimilarity = (text1: string, text2: string): number => {
  const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  const commonWords = words1.filter(word => words2.includes(word));
  const totalWords = Array.from(new Set([...words1, ...words2])).length;
  
  return commonWords.length / totalWords;
};

// Extract skills from job description
export const extractSkillsFromJob = (jobDescription: string, jobTitle: string): string[] => {
  const allText = `${jobTitle} ${jobDescription}`.toLowerCase();
  const skills: string[] = [];
  
  // Check for technical skills
  mockResumeSkills.technical.forEach(skill => {
    if (allText.includes(skill.toLowerCase())) {
      skills.push(skill);
    }
  });
  
  return skills;
};

// Determine seniority match
export const getSeniorityMatch = (jobTitle: string, jobDescription: string): MatchReason => {
  const allText = `${jobTitle} ${jobDescription}`.toLowerCase();
  
  // Check user's assumed seniority (mock: mid-level)
  const userSeniority = 'mid';
  const userLevelText = seniorityLevels[userSeniority as keyof typeof seniorityLevels].join(' ').toLowerCase();
  
  let bestMatch = 0;
  let matchedLevel = '';
  
  Object.entries(seniorityLevels).forEach(([level, titles]) => {
    const levelText = titles.join(' ').toLowerCase();
    const matchCount = titles.filter(title => allText.includes(title.toLowerCase())).length;
    if (matchCount > bestMatch) {
      bestMatch = matchCount;
      matchedLevel = level;
    }
  });
  
  if (userSeniority === matchedLevel) {
    return {
      type: 'seniority',
      matched: true,
      text: `Matching seniority level: ${matchedLevel}`,
      importance: 'medium' as const
    };
  } else if (matchedLevel) {
    return {
      type: 'seniority',
      matched: false,
      text: `Seniority mismatch: Looking for ${matchedLevel} level`,
      importance: 'medium' as const
    };
  }
  
  return {
    type: 'seniority',
    matched: false,
    text: 'Seniority level not specified',
    importance: 'low' as const
  };
};

// Analyze job match
export const analyzeJobMatch = (job: {
  title: string;
  company: string;
  description?: string;
  location?: string;
}): JobMatchAnalysis => {
  const reasons: MatchReason[] = [];
  let totalScore = 0;
  let maxScore = 0;
  
  // Skills matching (40% weight)
  const jobSkills = extractSkillsFromJob(job.title, job.description || '');
  const matchingSkills = jobSkills.filter(skill => 
    mockResumeSkills.technical.includes(skill)
  );
  const skillsScore = jobSkills.length > 0 ? matchingSkills.length / jobSkills.length : 0.5;
  totalScore += skillsScore * 40;
  maxScore += 40;
  
  if (matchingSkills.length > 0) {
    reasons.push({
      type: 'skill',
      matched: true,
      text: `Matching skills: ${matchingSkills.slice(0, 3).join(', ')}`,
      importance: 'high' as const
    });
  }
  
  const missingSkills = jobSkills.filter(skill => 
    !mockResumeSkills.technical.includes(skill)
  );
  if (missingSkills.length > 0) {
    reasons.push({
      type: 'skill',
      matched: false,
      text: `Missing skills: ${missingSkills.slice(0, 3).join(', ')}`,
      importance: 'high' as const
    });
  }
  
  // Location matching (20% weight)
  if (job.location) {
    // Mock user location - in real app, this would come from user profile
    const userLocation = 'San Francisco';
    const locationMatch = job.location.toLowerCase().includes(userLocation.toLowerCase()) ||
                         job.location.toLowerCase().includes('remote');
    
    if (locationMatch) {
      totalScore += 20;
      reasons.push({
        type: 'location',
        matched: true,
        text: 'Location matches preference',
        importance: 'medium' as const
      });
    } else {
      reasons.push({
        type: 'location',
        matched: false,
        text: 'Location mismatch',
        importance: 'medium' as const
      });
    }
    maxScore += 20;
  } else {
    totalScore += 10; // Neutral score for no location
    maxScore += 20;
  }
  
  // Seniority matching (25% weight)
  const seniorityMatch = getSeniorityMatch(job.title, job.description || '');
  reasons.push(seniorityMatch);
  if (seniorityMatch.matched) {
    totalScore += 25;
  } else {
    totalScore += 10; // Partial score for mismatch
  }
  maxScore += 25;
  
  // Text similarity (15% weight)
  const resumeText = mockResumeSkills.technical.join(' ') + ' ' + mockResumeSkills.experience.join(' ');
  const similarityScore = calculateTextSimilarity(resumeText, job.description || '');
  totalScore += similarityScore * 15;
  maxScore += 15;
  
  const finalScore = Math.round((totalScore / maxScore) * 100);
  
  // Determine confidence
  let confidence: 'high' | 'medium' | 'low' = 'medium';
  if (finalScore >= 80) confidence = 'high';
  else if (finalScore < 50) confidence = 'low';
  
  return {
    score: finalScore,
    reasons: reasons.slice(0, 6), // Limit to top 6 reasons
    confidence,
    summary: `Overall match score: ${finalScore}% based on skills, location, and experience alignment`
  };
};

// Get score color based on percentage
export const getScoreColor = (score: number): string => {
  if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
  if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  if (score >= 40) return 'bg-orange-100 text-orange-800 border-orange-200';
  return 'bg-red-100 text-red-800 border-red-200';
};

// Get score icon
export const getScoreIcon = (score: number): string => {
  if (score >= 80) return '🔥';
  if (score >= 60) return '✨';
  if (score >= 40) return '👀';
  return '❓';
};
