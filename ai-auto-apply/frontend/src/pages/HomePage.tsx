import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const { currentUser, signOut } = useAuth();

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
              <div className="space-y-4">
                <p className="text-lg">Welcome, {currentUser.email}!</p>
                <button
                  onClick={signOut}
                  className="btn-primary"
                >
                  Sign Out
                </button>
                <Link
                  to="/jobs"
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                >
                  View Jobs
                </Link>
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
