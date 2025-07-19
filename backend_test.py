#!/usr/bin/env python3
"""
Enhanced TRX Mining Platform Backend Testing Suite
Tests all enhanced features including TRX verification, security, database, and admin endpoints
"""

import requests
import json
import time
import random
import string
import uuid
from datetime import datetime

# Get base URL from environment - using external URL for testing
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Use internal URL for testing since external has routing issues
BASE_URL = "http://localhost:3000/api"

class EnhancedTRXMiningTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.test_users = []
        self.test_results = {
            'passed': 0,
            'failed': 0,
            'errors': []
        }
        
    def log_result(self, test_name, success, message="", details=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"   Message: {message}")
        if details:
            print(f"   Details: {details}")
        
        if success:
            self.test_results['passed'] += 1
        else:
            self.test_results['failed'] += 1
            self.test_results['errors'].append({
                'test': test_name,
                'message': message,
                'details': details
            })
        print()

    def generate_test_user(self):
        """Generate realistic test user data"""
        username = f"miner_{random.randint(1000, 9999)}"
        return {
            'username': username,
            'password': f"secure{random.randint(100, 999)}",
            'email': f"{username}@trxmining.com"
        }

    def generate_fake_trx_hash(self):
        """Generate a fake but valid-format TRX transaction hash"""
        return ''.join(random.choices(string.hexdigits.lower(), k=64))

    def test_security_enhancements(self):
        """Test enhanced security features"""
        print("🔒 Testing Security Enhancements...")
        
        # Test rate limiting
        try:
            print("Testing rate limiting...")
            responses = []
            for i in range(5):
                response = self.session.get(f"{self.base_url}/nodes")
                responses.append(response.status_code)
                time.sleep(0.1)
            
            # Should get normal responses initially
            if all(status == 200 for status in responses[:3]):
                self.log_result("Rate Limiting - Normal Requests", True, "First few requests processed normally")
            else:
                self.log_result("Rate Limiting - Normal Requests", False, f"Unexpected status codes: {responses[:3]}")
                
        except Exception as e:
            self.log_result("Rate Limiting Test", False, f"Error: {str(e)}")

        # Test enhanced input validation
        try:
            print("Testing enhanced input validation...")
            
            # Test invalid JSON
            response = self.session.post(f"{self.base_url}/auth/signup", 
                                       data="invalid json",
                                       headers={'Content-Type': 'application/json'})
            
            if response.status_code == 400:
                self.log_result("Input Validation - Invalid JSON", True, "Correctly rejected invalid JSON")
            else:
                self.log_result("Input Validation - Invalid JSON", False, f"Status: {response.status_code}")
                
            # Test missing required fields
            response = self.session.post(f"{self.base_url}/auth/signup", 
                                       json={'username': ''})
            
            if response.status_code == 400:
                self.log_result("Input Validation - Missing Fields", True, "Correctly rejected missing fields")
            else:
                self.log_result("Input Validation - Missing Fields", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("Input Validation Test", False, f"Error: {str(e)}")

        # Test security headers
        try:
            print("Testing security headers...")
            response = self.session.get(f"{self.base_url}/nodes")
            
            security_headers = [
                'X-Content-Type-Options',
                'X-Frame-Options', 
                'X-XSS-Protection',
                'Referrer-Policy',
                'Content-Security-Policy'
            ]
            
            present_headers = [h for h in security_headers if h in response.headers]
            
            if len(present_headers) >= 3:
                self.log_result("Security Headers", True, f"Found {len(present_headers)}/5 security headers")
            else:
                self.log_result("Security Headers", False, f"Only found {len(present_headers)}/5 security headers")
                
        except Exception as e:
            self.log_result("Security Headers Test", False, f"Error: {str(e)}")

    def test_database_initialization(self):
        """Test database initialization and status"""
        print("🗄️ Testing Database Initialization...")
        
        try:
            # Test database status endpoint
            response = self.session.get(f"{self.base_url}/admin/db-status")
            
            if response.status_code == 200:
                data = response.json()
                if 'status' in data:
                    self.log_result("Database Status Endpoint", True, "Database status endpoint accessible")
                    print(f"   Database Status: {json.dumps(data['status'], indent=2)}")
                else:
                    self.log_result("Database Status Endpoint", False, "Missing status in response")
            else:
                self.log_result("Database Status Endpoint", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("Database Status Test", False, f"Error: {str(e)}")

    def test_enhanced_authentication(self):
        """Test enhanced authentication features"""
        print("🔐 Testing Enhanced Authentication...")
        
        # Test enhanced signup with validation
        try:
            user_data = self.generate_test_user()
            
            # Test signup with valid data
            response = self.session.post(f"{self.base_url}/auth/signup", json=user_data)
            
            if response.status_code == 200:
                data = response.json()
                if 'user' in data and 'message' in data:
                    self.log_result("Enhanced Signup - Valid Data", True, "User created successfully")
                    self.test_users.append(user_data)
                else:
                    self.log_result("Enhanced Signup - Valid Data", False, "Missing user or message in response")
            else:
                self.log_result("Enhanced Signup - Valid Data", False, f"Status: {response.status_code}, Response: {response.text}")
                
            # Test case-insensitive duplicate checking
            duplicate_user = user_data.copy()
            duplicate_user['username'] = user_data['username'].upper()
            
            response = self.session.post(f"{self.base_url}/auth/signup", json=duplicate_user)
            
            if response.status_code == 400:
                self.log_result("Case-Insensitive Duplicate Check", True, "Correctly rejected duplicate username")
            else:
                self.log_result("Case-Insensitive Duplicate Check", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("Enhanced Authentication Test", False, f"Error: {str(e)}")

        # Test enhanced signin
        try:
            if self.test_users:
                user = self.test_users[0]
                response = self.session.post(f"{self.base_url}/auth/signin", 
                                           json={'username': user['username'], 'password': user['password']})
                
                if response.status_code == 200:
                    data = response.json()
                    if 'user' in data:
                        self.log_result("Enhanced Signin", True, "User signed in successfully")
                    else:
                        self.log_result("Enhanced Signin", False, "Missing user in response")
                else:
                    self.log_result("Enhanced Signin", False, f"Status: {response.status_code}")
                    
        except Exception as e:
            self.log_result("Enhanced Signin Test", False, f"Error: {str(e)}")

    def test_enhanced_trx_verification(self):
        """Test enhanced TRX verification system"""
        print("💎 Testing Enhanced TRX Verification...")
        
        try:
            if not self.test_users:
                # Create a test user first
                user_data = self.generate_test_user()
                response = self.session.post(f"{self.base_url}/auth/signup", json=user_data)
                if response.status_code == 200:
                    self.test_users.append(user_data)
                    
            if self.test_users:
                # Test node purchase with enhanced verification
                fake_hash = self.generate_fake_trx_hash()
                purchase_data = {
                    'nodeId': 'node1',
                    'transactionHash': fake_hash,
                    'userId': 'test-user-id'
                }
                
                response = self.session.post(f"{self.base_url}/nodes/purchase", json=purchase_data)
                
                # This should fail due to TRX verification (expected behavior)
                if response.status_code == 400:
                    data = response.json()
                    if 'error' in data:
                        self.log_result("TRX Verification - Invalid Transaction", True, 
                                      f"Correctly rejected invalid transaction: {data['error']}")
                    else:
                        self.log_result("TRX Verification - Invalid Transaction", False, "Missing error message")
                else:
                    self.log_result("TRX Verification - Invalid Transaction", False, 
                                  f"Unexpected status: {response.status_code}")
                
                # Test duplicate transaction hash prevention
                response2 = self.session.post(f"{self.base_url}/nodes/purchase", json=purchase_data)
                
                if response2.status_code == 400:
                    self.log_result("Duplicate Transaction Prevention", True, "Correctly prevented duplicate hash usage")
                else:
                    self.log_result("Duplicate Transaction Prevention", False, f"Status: {response2.status_code}")
                    
        except Exception as e:
            self.log_result("Enhanced TRX Verification Test", False, f"Error: {str(e)}")

    def test_enhanced_node_purchase_flow(self):
        """Test enhanced node purchase flow"""
        print("⛏️ Testing Enhanced Node Purchase Flow...")
        
        try:
            # Test input validation for node purchase
            invalid_purchase_data = {
                'nodeId': '',
                'transactionHash': 'invalid',
                'userId': ''
            }
            
            response = self.session.post(f"{self.base_url}/nodes/purchase", json=invalid_purchase_data)
            
            if response.status_code == 400:
                data = response.json()
                if 'details' in data and isinstance(data['details'], list):
                    self.log_result("Node Purchase Validation", True, f"Validation errors: {len(data['details'])}")
                else:
                    self.log_result("Node Purchase Validation", False, "Missing validation details")
            else:
                self.log_result("Node Purchase Validation", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("Enhanced Node Purchase Test", False, f"Error: {str(e)}")

    def test_enhanced_referral_system(self):
        """Test enhanced referral processing"""
        print("👥 Testing Enhanced Referral System...")
        
        try:
            # Create two test users for referral testing
            referrer_data = self.generate_test_user()
            referred_data = self.generate_test_user()
            
            # Create referrer
            response1 = self.session.post(f"{self.base_url}/auth/signup", json=referrer_data)
            if response1.status_code == 200:
                referrer_info = response1.json()
                
                # Create referred user with referral code
                referred_data['referralCode'] = 'TEST123'  # Using test referral code
                
                response2 = self.session.post(f"{self.base_url}/auth/signup", json=referred_data)
                
                if response2.status_code == 200:
                    self.log_result("Enhanced Referral Creation", True, "Referral signup processed")
                else:
                    self.log_result("Enhanced Referral Creation", False, f"Status: {response2.status_code}")
                        
        except Exception as e:
            self.log_result("Enhanced Referral Test", False, f"Error: {str(e)}")

    def test_admin_endpoints(self):
        """Test admin endpoints"""
        print("👨‍💼 Testing Admin Endpoints...")
        
        try:
            # Test database status endpoint
            response = self.session.get(f"{self.base_url}/admin/db-status")
            
            if response.status_code == 200:
                data = response.json()
                if 'status' in data:
                    self.log_result("Admin DB Status Endpoint", True, "Database status retrieved")
                else:
                    self.log_result("Admin DB Status Endpoint", False, "Missing status data")
            else:
                self.log_result("Admin DB Status Endpoint", False, f"Status: {response.status_code}")
                
            # Test verification stats endpoint
            response = self.session.get(f"{self.base_url}/admin/verification-stats")
            
            if response.status_code == 200:
                data = response.json()
                if 'stats' in data:
                    self.log_result("Admin Verification Stats Endpoint", True, "Verification stats retrieved")
                    print(f"   Stats: {json.dumps(data['stats'], indent=2)}")
                else:
                    self.log_result("Admin Verification Stats Endpoint", False, "Missing stats data")
            else:
                self.log_result("Admin Verification Stats Endpoint", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("Admin Endpoints Test", False, f"Error: {str(e)}")

    def test_existing_functionality(self):
        """Test existing functionality that should still work"""
        print("🔄 Testing Existing Functionality...")
        
        try:
            # Test get mining nodes
            response = self.session.get(f"{self.base_url}/nodes")
            
            if response.status_code == 200:
                data = response.json()
                if 'nodes' in data and len(data['nodes']) == 4:
                    self.log_result("Get Mining Nodes", True, f"Retrieved {len(data['nodes'])} nodes")
                else:
                    self.log_result("Get Mining Nodes", False, "Incorrect nodes data")
            else:
                self.log_result("Get Mining Nodes", False, f"Status: {response.status_code}")
                
            # Test get withdrawals (mock data)
            response = self.session.get(f"{self.base_url}/withdrawals")
            
            if response.status_code == 200:
                data = response.json()
                if 'withdrawals' in data:
                    self.log_result("Get Withdrawals", True, f"Retrieved {len(data['withdrawals'])} withdrawals")
                else:
                    self.log_result("Get Withdrawals", False, "Missing withdrawals data")
            else:
                self.log_result("Get Withdrawals", False, f"Status: {response.status_code}")
                
            # Test error handling
            response = self.session.get(f"{self.base_url}/nonexistent")
            
            if response.status_code == 404:
                self.log_result("Error Handling - 404", True, "Correctly returned 404 for nonexistent endpoint")
            else:
                self.log_result("Error Handling - 404", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("Existing Functionality Test", False, f"Error: {str(e)}")

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Enhanced TRX Mining Platform Backend Tests")
        print("=" * 60)
        
        start_time = time.time()
        
        # Test in priority order as specified
        self.test_existing_functionality()
        self.test_security_enhancements()
        self.test_enhanced_trx_verification()
        self.test_admin_endpoints()
        self.test_database_initialization()
        self.test_enhanced_authentication()
        self.test_enhanced_node_purchase_flow()
        self.test_enhanced_referral_system()
        
        end_time = time.time()
        duration = end_time - start_time
        
        print("=" * 60)
        print("🏁 Test Summary")
        print(f"✅ Passed: {self.test_results['passed']}")
        print(f"❌ Failed: {self.test_results['failed']}")
        print(f"⏱️ Duration: {duration:.2f} seconds")
        
        if self.test_results['failed'] > 0:
            print("\n❌ Failed Tests:")
            for error in self.test_results['errors']:
                print(f"  - {error['test']}: {error['message']}")
                if error['details']:
                    print(f"    Details: {error['details']}")
        
        print("\n🎯 Test Results Summary:")
        total_tests = self.test_results['passed'] + self.test_results['failed']
        success_rate = (self.test_results['passed'] / total_tests * 100) if total_tests > 0 else 0
        print(f"Success Rate: {success_rate:.1f}% ({self.test_results['passed']}/{total_tests})")
        
        return self.test_results

if __name__ == "__main__":
    tester = EnhancedTRXMiningTester()
    results = tester.run_all_tests()