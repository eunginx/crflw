import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// Job Matching
router.post('/job-matching', async (req, res) => {
  try {
    const { resumeId, userId, preferences } = req.body;
    
    if (!resumeId || !userId) {
      return res.status(400).json({ error: 'Resume ID and User ID are required' });
    }

    // Get resume analysis data
    const resumeResult = await pool.query(
      `SELECT d.original_filename, rpa.skills, rpa.contact_info, rpa.quality_score
       FROM documents d
       LEFT JOIN resume_analysis rpa ON d.id = rpa.document_id
       WHERE d.id = $1 AND d.user_id = $2`,
      [resumeId, userId]
    );

    if (resumeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const resume = resumeResult.rows[0];
    
    // Mock job matching algorithm (in production, this would use real job APIs)
    const mockJobs = [
      {
        id: 'job-1',
        title: 'Senior Software Engineer',
        company: 'Tech Corp',
        location: 'San Francisco, CA',
        salary: '$150k-$200k',
        matchScore: 92,
        matchReasons: [
          'Strong technical skills match',
          'Experience level aligns with senior role',
          'Location preference matches'
        ],
        requirements: ['5+ years experience', 'React/Node.js', 'Team leadership'],
        postedDate: new Date().toISOString(),
        applicationUrl: 'https://example.com/apply/job-1'
      },
      {
        id: 'job-2',
        title: 'Full Stack Developer',
        company: 'StartupXYZ',
        location: 'Remote',
        salary: '$120k-$160k',
        matchScore: 87,
        matchReasons: [
          'Full stack experience matches',
          'Remote work preference',
          'Startup culture fit'
        ],
        requirements: ['3+ years experience', 'React, Node.js, MongoDB', 'Agile'],
        postedDate: new Date().toISOString(),
        applicationUrl: 'https://example.com/apply/job-2'
      },
      {
        id: 'job-3',
        title: 'Frontend Developer',
        company: 'Design Agency',
        location: 'New York, NY',
        salary: '$100k-$130k',
        matchScore: 78,
        matchReasons: [
          'Frontend specialization matches',
          'Design-focused background',
          'NYC location preference'
        ],
        requirements: ['2+ years experience', 'React, Vue.js', 'UI/UX knowledge'],
        postedDate: new Date().toISOString(),
        applicationUrl: 'https://example.com/apply/job-3'
      }
    ];

    // Store matching results
    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO ai_apply_job_matches 
         (user_id, resume_id, job_data, match_scores, created_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
        [
          userId,
          resumeId,
          JSON.stringify(mockJobs),
          JSON.stringify(mockJobs.reduce((acc, job) => {
            acc[job.id] = job.matchScore;
            return acc;
          }, {}))
        ]
      );
    } finally {
      client.release();
    }

    res.json({
      success: true,
      data: {
        jobs: mockJobs,
        totalMatches: mockJobs.length,
        averageMatchScore: Math.round(mockJobs.reduce((sum, job) => sum + job.matchScore, 0) / mockJobs.length),
        processedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Job matching error:', error);
    res.status(500).json({
      error: 'Failed to match jobs',
      details: error.message
    });
  }
});

// Cover Letter Generation
router.post('/generate-cover-letter', async (req, res) => {
  try {
    const { resumeId, userId, jobId, jobDetails } = req.body;
    
    if (!resumeId || !userId || !jobId) {
      return res.status(400).json({ error: 'Resume ID, User ID, and Job ID are required' });
    }

    // Get resume data
    const resumeResult = await pool.query(
      `SELECT d.original_filename, dpr.extracted_text, rpa.skills, rpa.contact_info
       FROM documents d
       LEFT JOIN document_processing_results dpr ON d.id = dpr.document_id
       LEFT JOIN resume_analysis rpa ON d.id = rpa.document_id
       WHERE d.id = $1 AND d.user_id = $2`,
      [resumeId, userId]
    );

    if (resumeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const resume = resumeResult.rows[0];
    
    // Mock cover letter generation (in production, this would use Ollama)
    const mockCoverLetter = {
      content: `Dear Hiring Manager,

I am excited to apply for the ${jobDetails?.title || 'position'} at ${jobDetails?.company || 'your company'}. With my strong background in software development and passion for creating innovative solutions, I believe I would be a valuable addition to your team.

My experience in ${resume.skills?.technical?.join(', ') || 'various technologies'} aligns perfectly with the requirements of this role. I have consistently demonstrated the ability to deliver high-quality code and collaborate effectively with cross-functional teams.

What sets me apart is my commitment to continuous learning and my proactive approach to problem-solving. I thrive in environments where I can contribute to both technical excellence and business growth.

I would welcome the opportunity to discuss how my skills and experience can benefit your organization. Thank you for considering my application.

Sincerely,
${resume.contact_info?.name || 'Applicant'}`,
      tone: 'Professional',
      length: 'Medium',
      customization: 'High',
      generatedAt: new Date().toISOString()
    };

    // Store cover letter
    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO ai_apply_cover_letters 
         (user_id, resume_id, job_id, content, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
        [
          userId,
          resumeId,
          jobId,
          mockCoverLetter.content,
          JSON.stringify({
            tone: mockCoverLetter.tone,
            length: mockCoverLetter.length,
            customization: mockCoverLetter.customization
          })
        ]
      );
    } finally {
      client.release();
    }

    res.json({
      success: true,
      data: mockCoverLetter
    });

  } catch (error) {
    console.error('Cover letter generation error:', error);
    res.status(500).json({
      error: 'Failed to generate cover letter',
      details: error.message
    });
  }
});

// Auto-fill Application Data
router.post('/auto-fill-application', async (req, res) => {
  try {
    const { resumeId, userId, jobId, applicationForm } = req.body;
    
    if (!resumeId || !userId || !jobId) {
      return res.status(400).json({ error: 'Resume ID, User ID, and Job ID are required' });
    }

    // Get resume analysis data
    const resumeResult = await pool.query(
      `SELECT d.original_filename, rpa.contact_info, rpa.skills, dpr.extracted_text
       FROM documents d
       LEFT JOIN resume_analysis rpa ON d.id = rpa.document_id
       LEFT JOIN document_processing_results dpr ON d.id = dpr.document_id
       WHERE d.id = $1 AND d.user_id = $2`,
      [resumeId, userId]
    );

    if (resumeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const resume = resumeResult.rows[0];
    
    // Mock auto-fill data extraction
    const autoFillData = {
      personalInfo: {
        firstName: resume.contact_info?.name?.split(' ')[0] || '',
        lastName: resume.contact_info?.name?.split(' ').slice(1).join(' ') || '',
        email: resume.contact_info?.email || '',
        phone: resume.contact_info?.phone || '',
        linkedIn: resume.contact_info?.linkedin || '',
        github: resume.contact_info?.github || ''
      },
      experience: {
        totalYears: '5+', // Would be calculated from resume text
        currentTitle: 'Senior Software Engineer',
        currentCompany: 'Previous Company'
      },
      skills: {
        technical: resume.skills?.technical || [],
        soft: resume.skills?.soft || [],
        tools: resume.skills?.tools || []
      },
      education: {
        highestDegree: 'Bachelor of Science',
        field: 'Computer Science',
        university: 'University Name'
      },
      availability: 'Immediate',
      salaryExpectation: 'Competitive',
      workAuthorization: 'US Citizen'
    };

    res.json({
      success: true,
      data: {
        autoFillData,
        confidence: 0.85,
        missingFields: [],
        requiresReview: ['salaryExpectation', 'availability'],
        processedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Auto-fill error:', error);
    res.status(500).json({
      error: 'Failed to auto-fill application',
      details: error.message
    });
  }
});

// Submit Application
router.post('/submit-application', async (req, res) => {
  try {
    const { resumeId, userId, jobId, applicationData, coverLetterId } = req.body;
    
    if (!resumeId || !userId || !jobId) {
      return res.status(400).json({ error: 'Resume ID, User ID, and Job ID are required' });
    }

    // Create application record
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const applicationResult = await client.query(
        `INSERT INTO ai_apply_applications 
         (user_id, resume_id, job_id, cover_letter_id, application_data, status, submitted_at, created_at)
         VALUES ($1, $2, $3, $4, $5, 'submitted', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          userId,
          resumeId,
          jobId,
          coverLetterId || null,
          JSON.stringify(applicationData)
        ]
      );

      // Update application statistics
      await client.query(
        `INSERT INTO ai_apply_statistics 
         (user_id, total_applications, successful_submissions, last_activity)
         VALUES ($1, 1, 1, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) DO UPDATE SET
         total_applications = ai_apply_statistics.total_applications + 1,
         successful_submissions = ai_apply_statistics.successful_submissions + 1,
         last_activity = CURRENT_TIMESTAMP`,
        [userId]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        data: {
          applicationId: applicationResult.rows[0].id,
          status: 'submitted',
          submittedAt: applicationResult.rows[0].submitted_at,
          nextSteps: [
            'Application submitted successfully',
            'You will receive email confirmation',
            'Track status in your applications dashboard'
          ]
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Application submission error:', error);
    res.status(500).json({
      error: 'Failed to submit application',
      details: error.message
    });
  }
});

// Get Application Status
router.get('/application-status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const applicationsResult = await pool.query(
      `SELECT aaa.*, ajm.job_data->>'title' as job_title, ajm.job_data->>'company' as company
       FROM ai_apply_applications aaa
       LEFT JOIN ai_apply_job_matches ajm ON aaa.job_id = ajm.job_id
       WHERE aaa.user_id = $1
       ORDER BY aaa.submitted_at DESC`,
      [userId]
    );

    const statisticsResult = await pool.query(
      `SELECT * FROM ai_apply_statistics WHERE user_id = $1`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        applications: applicationsResult.rows,
        statistics: statisticsResult.rows[0] || {
          total_applications: 0,
          successful_submissions: 0,
          last_activity: null
        }
      }
    });

  } catch (error) {
    console.error('Application status error:', error);
    res.status(500).json({
      error: 'Failed to get application status',
      details: error.message
    });
  }
});

export default router;
