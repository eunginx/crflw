import { Router } from 'express';
import { JobController } from '../controllers/jobController';

const router = Router();
const jobController = new JobController();

// Get all jobs with optional filtering
router.get('/', jobController.getJobs);

// Get job by ID
router.get('/:id', jobController.getJobById);

// Apply for a job
router.post('/:id/apply', jobController.applyForJob);

// Get recommended jobs based on user profile
router.get('/recommended', jobController.getRecommendedJobs);

export default router;
