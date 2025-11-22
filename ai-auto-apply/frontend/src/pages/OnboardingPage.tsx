import { Link, useNavigate } from 'react-router-dom';
import { useOnboarding } from '../context/OnboardingContext';
import OnboardingWizard from '../components/OnboardingWizard';

export default function OnboardingPage() {
  const { isOnboardingComplete } = useOnboarding();
  const navigate = useNavigate();

  // Comment out the redirect to allow access to onboarding page even after completion
  // if (isOnboardingComplete) {
  //   navigate('/');
  //   return null;
  // }

  return <OnboardingWizard />;
}
