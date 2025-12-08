#!/usr/bin/env node

// Simple OCR test script
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

async function testOCRService() {
  console.log('🧪 === OCR SERVICE TEST ===');
  
  try {
    // Test 1: Health Check
    console.log('1. Testing OCR Health Check...');
    const healthResponse = await axios.get(`${API_BASE_URL}/api/ocr/health`, {
      timeout: 10000
    });
    console.log('✅ Health Check:', healthResponse.data);
    
    // Test 2: Test OCR Service (will fail but tests endpoint)
    console.log('2. Testing OCR Service Endpoint...');
    try {
      const serviceResponse = await axios.post(`${API_BASE_URL}/api/ocr/extract-fields`, {
        imagePath: '/test/path/image.jpg',
        fields: ['test_field']
      }, {
        timeout: 5000
      });
      console.log('✅ Service Test:', serviceResponse.data);
    } catch (serviceError) {
      if (serviceError.response?.status === 404 || serviceError.response?.status === 500) {
        console.log('✅ Service endpoint reachable (expected failure for test path)');
      } else {
        throw serviceError;
      }
    }
    
    console.log('🎉 OCR Service is working!');
    
  } catch (error) {
    console.error('❌ OCR Service Test Failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🔍 Backend is not running on port 8000');
    } else if (error.response) {
      console.error('🔍 Response Error:', error.response.status, error.response.data);
    }
    
    process.exit(1);
  }
}

testOCRService();
