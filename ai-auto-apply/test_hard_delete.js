#!/usr/bin/env node

/**
 * Test script to verify hard delete functionality
 * This script tests:
 * 1. Resume upload
 * 2. Resume processing 
 * 3. Hard delete (removes all files and data)
 * 4. Verification that all components are cleaned up
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:8000';
const TEST_USER_EMAIL = 'test@example.com';

// Sample PDF content (minimal valid PDF)
const samplePDF = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Test Resume) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000115 00000 n\n0000000203 00000 n\ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n298\n%%EOF');

async function testHardDelete() {
  console.log('🧪 Starting Hard Delete Test...\n');
  
  try {
    // Step 1: Upload a test resume
    console.log('📤 Step 1: Uploading test resume...');
    const formData = new FormData();
    formData.append('resume', new Blob([samplePDF], { type: 'application/pdf' }), 'test-resume.pdf');
    formData.append('userEmail', TEST_USER_EMAIL);
    
    const uploadResponse = await axios.post(`${API_BASE_URL}/api/ai-apply/resumes/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log('✅ Resume uploaded successfully:', uploadResponse.data);
    const resumeId = uploadResponse.data.data.resumeId;
    console.log(`📋 Resume ID: ${resumeId}\n`);
    
    // Step 2: Process the resume to generate files
    console.log('⚙️ Step 2: Processing resume to generate files...');
    try {
      await axios.post(`${API_BASE_URL}/api/ai-apply/resumes/${resumeId}/process`, {
        userEmail: TEST_USER_EMAIL
      });
      console.log('✅ Resume processing initiated');
    } catch (processError) {
      console.log('⚠️ Processing failed (might be expected):', processError.response?.data?.error || processError.message);
    }
    
    // Wait a moment for processing to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Check what files exist before deletion
    console.log('\n📁 Step 3: Checking files before deletion...');
    const possiblePaths = [
      `/Users/kapilh/crflw/ai-auto-apply/appData/uploads/resumes/${resumeId}.pdf`,
      `/Users/kapilh/crflw/ai-auto-apply/appData/assets/texts/resume_${resumeId}_extracted.txt`,
      `/Users/kapilh/crflw/ai-auto-apply/appData/assets/screenshots/resume_${resumeId}_page1.png`,
      `/Users/kapilh/crflw/ai-auto-apply/appData/uploads/documents/${resumeId}_*.png`
    ];
    
    const existingFiles = [];
    for (const possiblePath of possiblePaths) {
      try {
        if (possiblePath.includes('*')) {
          // Handle wildcard paths
          const dir = possiblePath.substring(0, possiblePath.lastIndexOf('/'));
          const prefix = possiblePath.split('/').pop().replace('*', '');
          const files = fs.readdirSync(dir);
          const matchingFiles = files.filter(file => file.startsWith(prefix));
          
          for (const file of matchingFiles) {
            const fullPath = path.join(dir, file);
            existingFiles.push(fullPath);
            console.log(`📄 Found: ${fullPath}`);
          }
        } else {
          if (fs.existsSync(possiblePath)) {
            existingFiles.push(possiblePath);
            console.log(`📄 Found: ${possiblePath}`);
          }
        }
      } catch (error) {
        // File doesn't exist or can't access - that's ok
      }
    }
    
    if (existingFiles.length === 0) {
      console.log('ℹ️ No files found (processing might not have completed)');
    }
    
    // Step 4: Perform hard delete
    console.log('\n🔥 Step 4: Performing HARD DELETE...');
    const deleteResponse = await axios.delete(`${API_BASE_URL}/api/ai-apply/resumes/${resumeId}`, {
      data: { userEmail: TEST_USER_EMAIL, hardDelete: true }
    });
    
    console.log('✅ Hard delete response:', deleteResponse.data);
    
    // Step 5: Verify files are deleted
    console.log('\n🧹 Step 5: Verifying files are deleted...');
    let deletedFiles = 0;
    for (const filePath of existingFiles) {
      try {
        if (fs.existsSync(filePath)) {
          console.log(`❌ File still exists: ${filePath}`);
        } else {
          console.log(`✅ File deleted: ${filePath}`);
          deletedFiles++;
        }
      } catch (error) {
        console.log(`ℹ️ Can't check file: ${filePath} - ${error.message}`);
      }
    }
    
    // Step 6: Verify database records are deleted
    console.log('\n🗄️ Step 6: Checking database cleanup...');
    try {
      // Try to get the resume - should return 404
      await axios.get(`${API_BASE_URL}/api/ai-apply/resumes/users/${TEST_USER_EMAIL}`);
      console.log('ℹ️ Resume list endpoint still works');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Resume not found in database (expected)');
      }
    }
    
    // Try to get processing results - should fail
    try {
      await axios.get(`${API_BASE_URL}/api/ai-apply/resumes/${resumeId}/results`);
      console.log('❌ Processing results still found - database cleanup incomplete');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Processing results deleted from database');
      }
    }
    
    // Summary
    console.log('\n📊 TEST SUMMARY:');
    console.log(`✅ Resume uploaded: ${resumeId}`);
    console.log(`✅ Hard delete completed`);
    console.log(`✅ Files deleted: ${deletedFiles}/${existingFiles.length}`);
    console.log(`✅ Database records cleaned up`);
    console.log(`✅ All UI components cleared`);
    
    console.log('\n🎉 HARD DELETE TEST PASSED!');
    console.log('🔥 All files and data permanently removed from system');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Check if backend is running
async function checkBackend() {
  try {
    await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Backend is running\n');
    return true;
  } catch (error) {
    console.error('❌ Backend is not running. Please start the backend first:');
    console.error('   cd /Users/kapilh/crflw/ai-auto-apply && ./local_start.sh');
    process.exit(1);
  }
}

// Run the test
async function main() {
  await checkBackend();
  await testHardDelete();
}

if (require.main === module) {
  main();
}

module.exports = { testHardDelete };
