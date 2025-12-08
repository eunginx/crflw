import { useState, useEffect, useContext } from 'react';
import { useUnifiedResumeManager } from './useUnifiedResumeManager';
import ResumeIntelligenceService from '../services/resumeIntelligenceService';
import { ResumeSkills } from '../utils/jobMatchingUtils';

export const useResumeIntelligence = () => {
  const { activeResume, resumes } = useUnifiedResumeManager();
  const [resumeSkills, setResumeSkills] = useState<ResumeSkills | null>(null);
  const [resumeAnalysis, setResumeAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResumeIntelligence = async () => {
      if (!activeResume) {
        setResumeSkills(null);
        setResumeAnalysis(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get resume analysis from processing results
        // In a real implementation, this would come from the AI Apply processing results
        // For now, we'll simulate getting the analysis data
        const analysis = await getResumeAnalysis(activeResume.id);
        
        if (analysis) {
          setResumeAnalysis(analysis);
          const skills = ResumeIntelligenceService.convertToResumeSkills(analysis);
          setResumeSkills(skills);
        }
      } catch (error) {
        console.error('❌ Error loading resume intelligence:', error);
        setResumeSkills(null);
        setResumeAnalysis(null);
      } finally {
        setLoading(false);
      }
    };

    loadResumeIntelligence();
  }, [activeResume]);

  // Helper function to get resume analysis
  const getResumeAnalysis = async (resumeId: string) => {
    try {
      // This would typically come from the AI Apply manager's processing results
      // For now, we'll return a mock analysis that would come from the processed resume
      const mockAnalysis = {
        skills: ['React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'AWS', 'Docker', 'PostgreSQL'],
        sections: {
          experience: true,
          education: true,
          skills: true,
          projects: true
        },
        experienceLevel: 'mid',
        contactInfo: {
          certifications: ['AWS Certified Developer']
        }
      };
      
      return mockAnalysis;
    } catch (error) {
      console.error('❌ Error getting resume analysis:', error);
      return null;
    }
  };

  return {
    resumeSkills,
    resumeAnalysis,
    loading,
    hasResume: !!activeResume,
    resumeCount: resumes.length
  };
};
