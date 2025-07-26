#!/usr/bin/env python3
"""
Focused Authentication Testing for TRX Mining Node Website
Tests specifically the signup and signin endpoints to identify internal server errors.
"""

import requests
import json
import uuid
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Use external URL from environment
NEXT_PUBLIC_BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://f4a9632f-16dc-46ff-b6a7-a54012bf7833.preview.emergentagent.com')
BASE_URL = f"{NEXT_PUBLIC_BASE_URL}/api"

class AuthTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name, success, message, response_data=None, status_code=None):
        """Log test results with detailed information"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'status_code': status_code,
            'response_data': response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}: {message}")
        if status_code:
            print(f"   Status Code: {status_code}")
        if response_data and not success:
            print(f"   Response: {json.dumps(response_data, indent=2)}")
    
    def test_signup_detailed(self):
        """Test user registration endpoint with detailed error reporting"""
        print("\n=== DETAILED AUTHENTICATION SIGNUP TESTING ===")
        print(f"Testing URL: {self.base_url}/auth/signup")
        
        # Test 1: Basic signup without referral code
        test_username = f"testuser001_{uuid.uuid4().hex[:6]}"
        signup_data = {
            "username": test_username,
            "password": "password123"
        }
        
        print(f"\n🔍 Test 1: Basic signup with username '{test_username}'")
        print(f"Request data: {json.dumps(signup_data, indent=2)}")
        
        try:
            response = self.session.post(f"{self.base_url}/auth/signup", json=signup_data, timeout=30)
            
            print(f"Response status: {response.status_code}")
            print(f"Response headers: {dict(response.headers)}")
            
            try:
                response_data = response.json()
                print(f"Response body: {json.dumps(response_data, indent=2)}")
            except:
                print(f"Response body (raw): {response.text}")
                response_data = {"raw_response": response.text}
            
            if response.status_code == 200:
                if 'user' in response_data and response_data['user']['username'] == test_username:
                    self.log_test("Signup Basic - Success", True, "User registration successful", response_data, response.status_code)
                    return test_username, "password123"  # Return credentials for signin test
                else:
                    self.log_test("Signup Basic - Success", False, "Invalid response structure", response_data, response.status_code)
            else:
                self.log_test("Signup Basic - Success", False, f"HTTP {response.status_code} - {response_data.get('error', 'Unknown error')}", response_data, response.status_code)
                
        except requests.exceptions.Timeout:
            self.log_test("Signup Basic - Success", False, "Request timeout after 30 seconds")
        except requests.exceptions.ConnectionError as e:
            self.log_test("Signup Basic - Success", False, f"Connection error: {str(e)}")
        except Exception as e:
            self.log_test("Signup Basic - Success", False, f"Request failed: {str(e)}")
        
        # Test 2: Signup with referral code
        test_username_2 = f"testuser002_{uuid.uuid4().hex[:6]}"
        signup_data_with_referral = {
            "username": test_username_2,
            "password": "password123",
            "referralCode": "TESTREF1"
        }
        
        print(f"\n🔍 Test 2: Signup with referral code")
        print(f"Request data: {json.dumps(signup_data_with_referral, indent=2)}")
        
        try:
            response = self.session.post(f"{self.base_url}/auth/signup", json=signup_data_with_referral, timeout=30)
            
            print(f"Response status: {response.status_code}")
            
            try:
                response_data = response.json()
                print(f"Response body: {json.dumps(response_data, indent=2)}")
            except:
                print(f"Response body (raw): {response.text}")
                response_data = {"raw_response": response.text}
            
            if response.status_code == 200:
                if 'user' in response_data and response_data['user']['username'] == test_username_2:
                    self.log_test("Signup With Referral - Success", True, "User registration with referral successful", response_data, response.status_code)
                else:
                    self.log_test("Signup With Referral - Success", False, "Invalid response structure", response_data, response.status_code)
            else:
                self.log_test("Signup With Referral - Success", False, f"HTTP {response.status_code} - {response_data.get('error', 'Unknown error')}", response_data, response.status_code)
                
        except requests.exceptions.Timeout:
            self.log_test("Signup With Referral - Success", False, "Request timeout after 30 seconds")
        except requests.exceptions.ConnectionError as e:
            self.log_test("Signup With Referral - Success", False, f"Connection error: {str(e)}")
        except Exception as e:
            self.log_test("Signup With Referral - Success", False, f"Request failed: {str(e)}")
        
        # Test 3: Error handling - missing fields
        print(f"\n🔍 Test 3: Error handling - missing password")
        incomplete_data = {
            "username": "testuser003"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/auth/signup", json=incomplete_data, timeout=30)
            
            print(f"Response status: {response.status_code}")
            
            try:
                response_data = response.json()
                print(f"Response body: {json.dumps(response_data, indent=2)}")
            except:
                print(f"Response body (raw): {response.text}")
                response_data = {"raw_response": response.text}
            
            if response.status_code == 400:
                if 'error' in response_data and 'required' in response_data['error'].lower():
                    self.log_test("Signup Error Handling - Missing Fields", True, "Correctly rejected missing fields", response_data, response.status_code)
                else:
                    self.log_test("Signup Error Handling - Missing Fields", False, "Wrong error message", response_data, response.status_code)
            else:
                self.log_test("Signup Error Handling - Missing Fields", False, f"Expected 400, got {response.status_code}", response_data, response.status_code)
                
        except Exception as e:
            self.log_test("Signup Error Handling - Missing Fields", False, f"Request failed: {str(e)}")
        
        return None, None
    
    def test_signin_detailed(self, username=None, password=None):
        """Test user signin endpoint with detailed error reporting"""
        print("\n=== DETAILED AUTHENTICATION SIGNIN TESTING ===")
        print(f"Testing URL: {self.base_url}/auth/signin")
        
        # If no credentials provided from signup test, create a new user
        if not username:
            print("\n🔧 Creating test user for signin test...")
            test_username = f"signintest_{uuid.uuid4().hex[:6]}"
            signup_data = {
                "username": test_username,
                "password": "password123"
            }
            
            try:
                response = self.session.post(f"{self.base_url}/auth/signup", json=signup_data, timeout=30)
                if response.status_code == 200:
                    username = test_username
                    password = "password123"
                    print(f"✅ Test user created: {username}")
                else:
                    print(f"❌ Failed to create test user: {response.status_code}")
                    response_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {"raw": response.text}
                    print(f"Response: {json.dumps(response_data, indent=2)}")
                    username = test_username  # Try anyway
                    password = "password123"
            except Exception as e:
                print(f"❌ Error creating test user: {str(e)}")
                username = "fallback_user"
                password = "password123"
        
        # Test 1: Successful signin
        signin_data = {
            "username": username,
            "password": password
        }
        
        print(f"\n🔍 Test 1: Successful signin with username '{username}'")
        print(f"Request data: {json.dumps(signin_data, indent=2)}")
        
        try:
            response = self.session.post(f"{self.base_url}/auth/signin", json=signin_data, timeout=30)
            
            print(f"Response status: {response.status_code}")
            print(f"Response headers: {dict(response.headers)}")
            
            try:
                response_data = response.json()
                print(f"Response body: {json.dumps(response_data, indent=2)}")
            except:
                print(f"Response body (raw): {response.text}")
                response_data = {"raw_response": response.text}
            
            if response.status_code == 200:
                if 'user' in response_data and response_data['user']['username'] == username:
                    self.log_test("Signin - Success", True, "User signin successful", response_data, response.status_code)
                else:
                    self.log_test("Signin - Success", False, "Invalid response structure", response_data, response.status_code)
            else:
                self.log_test("Signin - Success", False, f"HTTP {response.status_code} - {response_data.get('error', 'Unknown error')}", response_data, response.status_code)
                
        except requests.exceptions.Timeout:
            self.log_test("Signin - Success", False, "Request timeout after 30 seconds")
        except requests.exceptions.ConnectionError as e:
            self.log_test("Signin - Success", False, f"Connection error: {str(e)}")
        except Exception as e:
            self.log_test("Signin - Success", False, f"Request failed: {str(e)}")
        
        # Test 2: Invalid credentials
        invalid_signin_data = {
            "username": username,
            "password": "wrongpassword"
        }
        
        print(f"\n🔍 Test 2: Invalid credentials test")
        print(f"Request data: {json.dumps(invalid_signin_data, indent=2)}")
        
        try:
            response = self.session.post(f"{self.base_url}/auth/signin", json=invalid_signin_data, timeout=30)
            
            print(f"Response status: {response.status_code}")
            
            try:
                response_data = response.json()
                print(f"Response body: {json.dumps(response_data, indent=2)}")
            except:
                print(f"Response body (raw): {response.text}")
                response_data = {"raw_response": response.text}
            
            if response.status_code == 401:
                if 'error' in response_data and 'invalid credentials' in response_data['error'].lower():
                    self.log_test("Signin - Invalid Credentials", True, "Correctly rejected invalid credentials", response_data, response.status_code)
                else:
                    self.log_test("Signin - Invalid Credentials", False, "Wrong error message", response_data, response.status_code)
            else:
                self.log_test("Signin - Invalid Credentials", False, f"Expected 401, got {response.status_code}", response_data, response.status_code)
                
        except Exception as e:
            self.log_test("Signin - Invalid Credentials", False, f"Request failed: {str(e)}")
        
        # Test 3: Missing fields
        print(f"\n🔍 Test 3: Error handling - missing password")
        incomplete_signin_data = {
            "username": username
        }
        
        try:
            response = self.session.post(f"{self.base_url}/auth/signin", json=incomplete_signin_data, timeout=30)
            
            print(f"Response status: {response.status_code}")
            
            try:
                response_data = response.json()
                print(f"Response body: {json.dumps(response_data, indent=2)}")
            except:
                print(f"Response body (raw): {response.text}")
                response_data = {"raw_response": response.text}
            
            if response.status_code == 400:
                if 'error' in response_data and 'required' in response_data['error'].lower():
                    self.log_test("Signin Error Handling - Missing Fields", True, "Correctly rejected missing fields", response_data, response.status_code)
                else:
                    self.log_test("Signin Error Handling - Missing Fields", False, "Wrong error message", response_data, response.status_code)
            else:
                self.log_test("Signin Error Handling - Missing Fields", False, f"Expected 400, got {response.status_code}", response_data, response.status_code)
                
        except Exception as e:
            self.log_test("Signin Error Handling - Missing Fields", False, f"Request failed: {str(e)}")
    
    def run_auth_tests(self):
        """Run focused authentication tests"""
        print("🚀 Starting Focused Authentication Testing")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 80)
        
        # Test signup first
        username, password = self.test_signup_detailed()
        
        # Test signin with the created user (if successful) or fallback
        self.test_signin_detailed(username, password)
        
        # Print summary
        print("\n" + "=" * 80)
        print("📊 AUTHENTICATION TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['success']])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   ❌ {result['test']}: {result['message']}")
                    if result.get('status_code'):
                        print(f"      Status Code: {result['status_code']}")
        
        print("\n" + "=" * 80)
        return passed_tests, failed_tests

if __name__ == "__main__":
    tester = AuthTester()
    passed, failed = tester.run_auth_tests()
    
    # Exit with appropriate code
    exit(0 if failed == 0 else 1)