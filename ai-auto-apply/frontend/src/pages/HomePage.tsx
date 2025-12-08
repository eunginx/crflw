import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const { currentUser, signOut } = useAuth();
  const { profile, preferences, autoApplySettings, loading, isOnboardingComplete } = useUser();

  // Calculate profile completion percentage
  const getProfileCompletion = () => {
    if (!profile) return 0;
    const fields = [
      profile.firstName,
      profile.lastName,
      profile.phone,
      profile.location,
      profile.headline,
      profile.summary
    ];
    const completed = fields.filter(f => f && f.trim() !== '').length;
    return Math.round((completed / fields.length) * 100);
  };

  const profileCompletion = getProfileCompletion();
  const userName = profile?.firstName || currentUser?.email?.split('@')[0] || 'there';

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            AI Auto-Apply
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Automate your job search with AI-powered applications
          </p>

          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            {currentUser ? (
              <div className="space-y-4 w-full">
                {/* Personalized Greeting */}
                <p className="text-lg font-medium">
                  Welcome back, {userName}! 👋
                </p>

                {/* Profile Completion Card */}
                {profileCompletion < 100 && !loading && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-900">
                        Complete your profile
                      </span>
                      <span className="text-sm font-bold text-blue-700">
                        {profileCompletion}%
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${profileCompletion}%` }}
                      ></div>
                    </div>
                    <Link
                      to="/profile"
                      className="mt-2 text-sm text-blue-700 hover:text-blue-800 underline"
                    >
                      Complete now →
                    </Link>
                  </div>
                )}

                {/* Quick Stats */}
                {!loading && (preferences || autoApplySettings) && (
                  <div className="grid grid-cols-2 gap-3 text-left">
                    {preferences?.keywords && (
                      <div className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="text-xs text-gray-500">Target Roles</div>
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {preferences.keywords.split(',')[0]}
                        </div>
                      </div>
                    )}
                    {autoApplySettings?.maxApplicationsPerDay && (
                      <div className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="text-xs text-gray-500">Daily Limit</div>
                        <div className="text-sm font-medium text-gray-900">
                          {autoApplySettings.maxApplicationsPerDay} apps/day
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 justify-center">
                  <Link
                    to="/ai-apply"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    AI Apply
                  </Link>
                  <Link
                    to="/jobs"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                  >
                    View Jobs
                  </Link>
                  <button
                    onClick={signOut}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-x-4">
                <Link
                  to="/login"
                  className="btn-primary"
                >
                  Get Started
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                >
                  Log In
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
