// Merged Test Suite - CareerFlow AI Auto-Apply System
// This file contains all individual test files merged into one comprehensive test suite

const fs = require('fs');
const path = require('path');

// Test configuration
const config = {
  apiUrl: 'http://localhost:6001/api',
  emailUrl: 'http://localhost:6001/api/email',
  testEmail: 'eunginx@key2vibe.com',
  testFirebaseUid: 'LXcGsu5WveeSwHMtOBo4dPCRAgx2'
};

// Utility functions
const log = (message, type = 'INFO') => {
  console.log(`[${new Date().toISOString()}] [${type}] ${message}`);
};

const makeRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    log(`Request failed: ${error.message}`, 'ERROR');
    return { status: 0, data: { error: error.message } };
  }
};

// Test Suite 1: API Connectivity Tests
async function testAPIConnectivity() {
  log('Starting API Connectivity Tests');
  
  const tests = [
    { name: 'Health Check', url: 'http://localhost:6001/health' },
    { name: 'Email User Data', url: `${config.emailUrl}/user-data/${config.testEmail}` },
    { name: 'Email Applications', url: `${config.emailUrl}/applications/${config.testEmail}` },
    { name: 'Application Stats', url: `${config.emailUrl}/applications/${config.testEmail}/stats` }
  ];
  
  for (const test of tests) {
    const result = await makeRequest(test.url);
    log(`${test.name}: ${result.status === 200 ? 'PASS' : 'FAIL'} (${result.status})`);
  }
}

// Test Suite 2: User Data Tests
async function testUserData() {
  log('Starting User Data Tests');
  
  // Test getting user data
  const userResult = await makeRequest(`${config.emailUrl}/user-data/${config.testEmail}`);
  log(`Get User Data: ${userResult.status === 200 ? 'PASS' : 'FAIL'}`);
  
  if (userResult.status === 200 && userResult.data.user) {
    log(`User found: ${userResult.data.user.email}`);
    
    // Test updating user data
    const updateResult = await makeRequest(`${config.emailUrl}/user-data/${config.testEmail}`, {
      method: 'PUT',
      body: JSON.stringify({
        settings: {
          keywords: 'Test Update',
          locations: 'Test Location',
          enable_auto_apply: true
        }
      })
    });
    log(`Update User Data: ${updateResult.status === 200 ? 'PASS' : 'FAIL'}`);
  }
}

// Test Suite 3: Application Management Tests
async function testApplicationManagement() {
  log('Starting Application Management Tests');
  
  // Test getting applications
  const appsResult = await makeRequest(`${config.emailUrl}/applications/${config.testEmail}`);
  log(`Get Applications: ${appsResult.status === 200 ? 'PASS' : 'FAIL'}`);
  
  // Test creating application
  const createResult = await makeRequest(`${config.emailUrl}/applications/${config.testEmail}`, {
    method: 'POST',
    body: JSON.stringify({
      title: 'Test Position',
      company: 'Test Company',
      status: 'saved',
      description: 'Test job description'
    })
  });
  log(`Create Application: ${createResult.status === 200 ? 'PASS' : 'FAIL'}`);
  
  if (createResult.status === 200 && createResult.data.id) {
    const appId = createResult.data.id;
    
    // Test updating application
    const updateResult = await makeRequest(`${config.emailUrl}/applications/${config.testEmail}/${appId}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'applied',
        applied_date: new Date().toISOString()
      })
    });
    log(`Update Application: ${updateResult.status === 200 ? 'PASS' : 'FAIL'}`);
    
    // Test deleting application
    const deleteResult = await makeRequest(`${config.emailUrl}/applications/${config.testEmail}/${appId}`, {
      method: 'DELETE'
    });
    log(`Delete Application: ${deleteResult.status === 200 ? 'PASS' : 'FAIL'}`);
  }
}

// Test Suite 4: Onboarding Tests
async function testOnboarding() {
  log('Starting Onboarding Tests');
  
  // Test getting onboarding data
  const onboardingResult = await makeRequest(`${config.emailUrl}/user-data/${config.testEmail}`);
  log(`Get Onboarding Data: ${onboardingResult.status === 200 ? 'PASS' : 'FAIL'}`);
  
  if (onboardingResult.status === 200 && onboardingResult.data.onboarding) {
    const onboarding = onboardingResult.data.onboarding;
    log(`Current onboarding step: ${onboarding.current_step}`);
    log(`Email verified: ${onboarding.email_verified}`);
    log(`Resume uploaded: ${onboarding.resume_uploaded}`);
    
    // Test updating onboarding progress
    const updateResult = await makeRequest(`${config.emailUrl}/user-data/${config.testEmail}`, {
      method: 'PUT',
      body: JSON.stringify({
        onboarding: {
          email_verified: true,
          resume_uploaded: true,
          profile_complete: true,
          settings_complete: true,
          current_step: 3
        }
      })
    });
    log(`Update Onboarding: ${updateResult.status === 200 ? 'PASS' : 'FAIL'}`);
  }
}

// Test Suite 5: Settings Tests
async function testSettings() {
  log('Starting Settings Tests');
  
  // Test getting settings
  const settingsResult = await makeRequest(`${config.emailUrl}/user-data/${config.testEmail}`);
  log(`Get Settings: ${settingsResult.status === 200 ? 'PASS' : 'FAIL'}`);
  
  if (settingsResult.status === 200 && settingsResult.data.settings) {
    const settings = settingsResult.data.settings;
    log(`Current keywords: ${settings.keywords}`);
    log(`Current locations: ${settings.locations}`);
    log(`Auto apply enabled: ${settings.enable_auto_apply}`);
    
    // Test updating settings
    const updateResult = await makeRequest(`${config.emailUrl}/user-data/${config.testEmail}`, {
      method: 'PUT',
      body: JSON.stringify({
        settings: {
          keywords: 'Full Stack Developer, React, Node.js, PostgreSQL',
          locations: 'San Francisco, New York, Remote',
          salary_min: 150000,
          salary_max: 250000,
          enable_auto_apply: true,
          generate_cover_letters: true,
          apply_remote_only: false,
          max_applications_per_day: 10
        }
      })
    });
    log(`Update Settings: ${updateResult.status === 200 ? 'PASS' : 'FAIL'}`);
  }
}

// Test Suite 6: Integration Tests
async function testIntegration() {
  log('Starting Integration Tests');
  
  // Test complete user flow
  try {
    // 1. Get user data
    const userResult = await makeRequest(`${config.emailUrl}/user-data/${config.testEmail}`);
    
    // 2. Create application
    const appResult = await makeRequest(`${config.emailUrl}/applications/${config.testEmail}`, {
      method: 'POST',
      body: JSON.stringify({
        title: 'Integration Test Position',
        company: 'Integration Test Company',
        status: 'saved'
      })
    });
    
    // 3. Update settings
    const settingsResult = await makeRequest(`${config.emailUrl}/user-data/${config.testEmail}`, {
      method: 'PUT',
      body: JSON.stringify({
        settings: {
          keywords: 'Integration Test Keywords',
          max_applications_per_day: 5
        }
      })
    });
    
    // 4. Get application stats
    const statsResult = await makeRequest(`${config.emailUrl}/applications/${config.testEmail}/stats`);
    
    const allPassed = [
      userResult.status === 200,
      appResult.status === 200,
      settingsResult.status === 200,
      statsResult.status === 200
    ].every(Boolean);
    
    log(`Integration Test: ${allPassed ? 'PASS' : 'FAIL'}`);
    
    // Cleanup test data
    if (appResult.status === 200 && appResult.data.id) {
      await makeRequest(`${config.emailUrl}/applications/${config.testEmail}/${appResult.data.id}`, {
        method: 'DELETE'
      });
    }
    
  } catch (error) {
    log(`Integration Test failed: ${error.message}`, 'ERROR');
  }
}

// Main test runner
async function runAllTests() {
  log('Starting Complete Test Suite');
  log('='.repeat(50));
  
  const testSuites = [
    { name: 'API Connectivity', fn: testAPIConnectivity },
    { name: 'User Data', fn: testUserData },
    { name: 'Application Management', fn: testApplicationManagement },
    { name: 'Onboarding', fn: testOnboarding },
    { name: 'Settings', fn: testSettings },
    { name: 'Integration', fn: testIntegration }
  ];
  
  const results = [];
  
  for (const suite of testSuites) {
    try {
      log(`\n--- ${suite.name} Tests ---`);
      await suite.fn();
      results.push({ suite: suite.name, status: 'COMPLETED' });
    } catch (error) {
      log(`${suite.name} Tests failed: ${error.message}`, 'ERROR');
      results.push({ suite: suite.name, status: 'FAILED', error: error.message });
    }
  }
  
  log('\n' + '='.repeat(50));
  log('Test Suite Summary:');
  results.forEach(result => {
    log(`${result.suite}: ${result.status}`);
  });
  
  const passedCount = results.filter(r => r.status === 'COMPLETED').length;
  const totalCount = results.length;
  log(`\nOverall: ${passedCount}/${totalCount} test suites completed`);
  
  if (passedCount === totalCount) {
    log('🎉 All tests completed successfully!');
  } else {
    log('⚠️  Some tests failed. Check the logs above.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    log(`Test runner failed: ${error.message}`, 'ERROR');
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testAPIConnectivity,
  testUserData,
  testApplicationManagement,
  testOnboarding,
  testSettings,
  testIntegration,
  config
};
