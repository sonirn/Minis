#!/usr/bin/env python3
"""
Backend API Testing Suite for TRX Mining Node Website
Tests all API endpoints including authentication, mining nodes, user profile, referrals, and withdrawals.
"""

import requests
import json
import time
import uuid
from datetime import datetime

# Get base URL from environment - using external URL for testing
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Use external URL from environment
NEXT_PUBLIC_BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://2406a39e-f207-4a5f-8909-57e8bdec9f7d.preview.emergentagent.com')
BASE_URL = f"{NEXT_PUBLIC_BASE_URL}/api"

class TRXMiningAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name, success, message, response_data=None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'response_data': response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}: {message}")
        if response_data and not success:
            print(f"   Response: {json.dumps(response_data, indent=2)}")
    
    def test_auth_signup(self):
        """Test user registration endpoint"""
        print("\n=== Testing Authentication - Signup ===")
        
        # Test successful signup
        test_username = f"testuser_{uuid.uuid4().hex[:8]}"
        signup_data = {
            "username": test_username,
            "password": "testpassword123",
            "referralCode": ""
        }
        
        try:
            response = self.session.post(f"{self.base_url}/auth/signup", json=signup_data)
            
            if response.status_code == 200:
                data = response.json()
                if 'user' in data and data['user']['username'] == test_username:
                    self.log_test("Auth Signup - Success", True, "User registration successful", data)
                else:
                    self.log_test("Auth Signup - Success", False, "Invalid response structure", data)
            else:
                self.log_test("Auth Signup - Success", False, f"HTTP {response.status_code}", response.json())
                
        except Exception as e:
            self.log_test("Auth Signup - Success", False, f"Request failed: {str(e)}")
        
        # Test duplicate username
        try:
            response = self.session.post(f"{self.base_url}/auth/signup", json=signup_data)
            
            if response.status_code == 400:
                data = response.json()
                if 'error' in data and 'already exists' in data['error']:
                    self.log_test("Auth Signup - Duplicate Username", True, "Correctly rejected duplicate username", data)
                else:
                    self.log_test("Auth Signup - Duplicate Username", False, "Wrong error message", data)
            else:
                self.log_test("Auth Signup - Duplicate Username", False, f"Expected 400, got {response.status_code}", response.json())
                
        except Exception as e:
            self.log_test("Auth Signup - Duplicate Username", False, f"Request failed: {str(e)}")
        
        # Test signup with referral code
        referral_username = f"referrer_{uuid.uuid4().hex[:8]}"
        referrer_data = {
            "username": referral_username,
            "password": "testpassword123"
        }
        
        try:
            # First create a referrer
            response = self.session.post(f"{self.base_url}/auth/signup", json=referrer_data)
            if response.status_code == 200:
                # Get referrer's profile to get referral code
                profile_response = self.session.get(f"{self.base_url}/user/profile")
                if profile_response.status_code == 200:
                    profile_data = profile_response.json()
                    referral_code = profile_data.get('user', {}).get('referralCode', '')
                    
                    # Now signup with referral code
                    referred_username = f"referred_{uuid.uuid4().hex[:8]}"
                    referred_data = {
                        "username": referred_username,
                        "password": "testpassword123",
                        "referralCode": referral_code
                    }
                    
                    response = self.session.post(f"{self.base_url}/auth/signup", json=referred_data)
                    if response.status_code == 200:
                        self.log_test("Auth Signup - With Referral", True, "Signup with referral code successful", response.json())
                    else:
                        self.log_test("Auth Signup - With Referral", False, f"HTTP {response.status_code}", response.json())
                else:
                    self.log_test("Auth Signup - With Referral", False, "Could not get referral code", profile_response.json())
            else:
                self.log_test("Auth Signup - With Referral", False, "Could not create referrer", response.json())
                
        except Exception as e:
            self.log_test("Auth Signup - With Referral", False, f"Request failed: {str(e)}")
    
    def test_auth_signin(self):
        """Test user login endpoint"""
        print("\n=== Testing Authentication - Signin ===")
        
        # First create a user to test login
        test_username = f"logintest_{uuid.uuid4().hex[:8]}"
        signup_data = {
            "username": test_username,
            "password": "testpassword123"
        }
        
        try:
            # Create user
            signup_response = self.session.post(f"{self.base_url}/auth/signup", json=signup_data)
            
            if signup_response.status_code == 200:
                # Test successful login
                login_data = {
                    "username": test_username,
                    "password": "testpassword123"
                }
                
                response = self.session.post(f"{self.base_url}/auth/signin", json=login_data)
                
                if response.status_code == 200:
                    data = response.json()
                    if 'user' in data and data['user']['username'] == test_username:
                        self.log_test("Auth Signin - Success", True, "User login successful", data)
                    else:
                        self.log_test("Auth Signin - Success", False, "Invalid response structure", data)
                else:
                    self.log_test("Auth Signin - Success", False, f"HTTP {response.status_code}", response.json())
                
                # Test invalid credentials
                invalid_login_data = {
                    "username": test_username,
                    "password": "wrongpassword"
                }
                
                response = self.session.post(f"{self.base_url}/auth/signin", json=invalid_login_data)
                
                if response.status_code == 401:
                    data = response.json()
                    if 'error' in data and 'Invalid credentials' in data['error']:
                        self.log_test("Auth Signin - Invalid Credentials", True, "Correctly rejected invalid credentials", data)
                    else:
                        self.log_test("Auth Signin - Invalid Credentials", False, "Wrong error message", data)
                else:
                    self.log_test("Auth Signin - Invalid Credentials", False, f"Expected 401, got {response.status_code}", response.json())
            else:
                self.log_test("Auth Signin - Success", False, "Could not create test user", signup_response.json())
                
        except Exception as e:
            self.log_test("Auth Signin - Success", False, f"Request failed: {str(e)}")
    
    def test_auth_user(self):
        """Test getting current user info"""
        print("\n=== Testing Authentication - Get User ===")
        
        try:
            response = self.session.get(f"{self.base_url}/auth/user")
            
            if response.status_code == 200:
                data = response.json()
                if 'user' in data and 'id' in data['user']:
                    self.log_test("Auth Get User", True, "Successfully retrieved user info", data)
                else:
                    self.log_test("Auth Get User", False, "Invalid response structure", data)
            else:
                self.log_test("Auth Get User", False, f"HTTP {response.status_code}", response.json())
                
        except Exception as e:
            self.log_test("Auth Get User", False, f"Request failed: {str(e)}")
    
    def test_nodes_get(self):
        """Test getting all mining nodes"""
        print("\n=== Testing Mining Nodes - Get All ===")
        
        try:
            response = self.session.get(f"{self.base_url}/nodes")
            
            if response.status_code == 200:
                data = response.json()
                if 'nodes' in data and isinstance(data['nodes'], list) and len(data['nodes']) > 0:
                    # Check if nodes have required fields
                    node = data['nodes'][0]
                    required_fields = ['id', 'name', 'price', 'storage', 'mining', 'duration']
                    if all(field in node for field in required_fields):
                        self.log_test("Get Mining Nodes", True, f"Successfully retrieved {len(data['nodes'])} mining nodes", data)
                    else:
                        self.log_test("Get Mining Nodes", False, "Nodes missing required fields", data)
                else:
                    self.log_test("Get Mining Nodes", False, "Invalid response structure", data)
            else:
                self.log_test("Get Mining Nodes", False, f"HTTP {response.status_code}", response.json())
                
        except Exception as e:
            self.log_test("Get Mining Nodes", False, f"Request failed: {str(e)}")
    
    def test_nodes_purchase(self):
        """Test purchasing a mining node"""
        print("\n=== Testing Mining Nodes - Purchase ===")
        
        # Test successful purchase
        purchase_data = {
            "nodeId": "node1",
            "transactionHash": f"0x{uuid.uuid4().hex}"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/nodes/purchase", json=purchase_data)
            
            if response.status_code == 200:
                data = response.json()
                if 'message' in data and 'node' in data:
                    self.log_test("Purchase Node - Success", True, "Node purchased successfully", data)
                else:
                    self.log_test("Purchase Node - Success", False, "Invalid response structure", data)
            else:
                self.log_test("Purchase Node - Success", False, f"HTTP {response.status_code}", response.json())
                
        except Exception as e:
            self.log_test("Purchase Node - Success", False, f"Request failed: {str(e)}")
        
        # Test invalid node ID
        invalid_purchase_data = {
            "nodeId": "invalid_node",
            "transactionHash": f"0x{uuid.uuid4().hex}"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/nodes/purchase", json=invalid_purchase_data)
            
            if response.status_code == 400:
                data = response.json()
                if 'error' in data and 'Invalid node' in data['error']:
                    self.log_test("Purchase Node - Invalid Node", True, "Correctly rejected invalid node", data)
                else:
                    self.log_test("Purchase Node - Invalid Node", False, "Wrong error message", data)
            else:
                self.log_test("Purchase Node - Invalid Node", False, f"Expected 400, got {response.status_code}", response.json())
                
        except Exception as e:
            self.log_test("Purchase Node - Invalid Node", False, f"Request failed: {str(e)}")
        
        # Test invalid transaction hash
        invalid_tx_data = {
            "nodeId": "node1",
            "transactionHash": "short"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/nodes/purchase", json=invalid_tx_data)
            
            if response.status_code == 400:
                data = response.json()
                if 'error' in data and 'Invalid transaction hash' in data['error']:
                    self.log_test("Purchase Node - Invalid TX Hash", True, "Correctly rejected invalid transaction hash", data)
                else:
                    self.log_test("Purchase Node - Invalid TX Hash", False, "Wrong error message", data)
            else:
                self.log_test("Purchase Node - Invalid TX Hash", False, f"Expected 400, got {response.status_code}", response.json())
                
        except Exception as e:
            self.log_test("Purchase Node - Invalid TX Hash", False, f"Request failed: {str(e)}")
    
    def test_user_nodes(self):
        """Test getting user's active mining nodes"""
        print("\n=== Testing User Nodes - Get Active ===")
        
        try:
            response = self.session.get(f"{self.base_url}/user/nodes")
            
            if response.status_code == 200:
                data = response.json()
                if 'nodes' in data and isinstance(data['nodes'], list):
                    self.log_test("Get User Nodes", True, f"Successfully retrieved {len(data['nodes'])} user nodes", data)
                else:
                    self.log_test("Get User Nodes", False, "Invalid response structure", data)
            else:
                self.log_test("Get User Nodes", False, f"HTTP {response.status_code}", response.json())
                
        except Exception as e:
            self.log_test("Get User Nodes", False, f"Request failed: {str(e)}")
    
    def test_user_profile(self):
        """Test getting user profile with balances"""
        print("\n=== Testing User Profile ===")
        
        try:
            response = self.session.get(f"{self.base_url}/user/profile")
            
            if response.status_code == 200:
                data = response.json()
                if 'user' in data:
                    user = data['user']
                    required_fields = ['id', 'username', 'mineBalance', 'referralBalance', 'referralCode']
                    if all(field in user for field in required_fields):
                        self.log_test("Get User Profile", True, "Successfully retrieved user profile", data)
                    else:
                        self.log_test("Get User Profile", False, "User profile missing required fields", data)
                else:
                    self.log_test("Get User Profile", False, "Invalid response structure", data)
            else:
                self.log_test("Get User Profile", False, f"HTTP {response.status_code}", response.json())
                
        except Exception as e:
            self.log_test("Get User Profile", False, f"Request failed: {str(e)}")
    
    def test_user_referrals(self):
        """Test getting user's referrals"""
        print("\n=== Testing User Referrals ===")
        
        try:
            response = self.session.get(f"{self.base_url}/user/referrals")
            
            if response.status_code == 200:
                data = response.json()
                if 'referrals' in data and isinstance(data['referrals'], list):
                    self.log_test("Get User Referrals", True, f"Successfully retrieved {len(data['referrals'])} referrals", data)
                else:
                    self.log_test("Get User Referrals", False, "Invalid response structure", data)
            else:
                self.log_test("Get User Referrals", False, f"HTTP {response.status_code}", response.json())
                
        except Exception as e:
            self.log_test("Get User Referrals", False, f"Request failed: {str(e)}")
    
    def test_withdraw(self):
        """Test withdrawal endpoints"""
        print("\n=== Testing Withdrawals ===")
        
        # Test mine balance withdrawal - insufficient balance
        mine_withdraw_data = {
            "type": "mine",
            "amount": 1000  # High amount to test insufficient balance
        }
        
        try:
            response = self.session.post(f"{self.base_url}/withdraw", json=mine_withdraw_data)
            
            if response.status_code == 400:
                data = response.json()
                if 'error' in data and ('Insufficient balance' in data['error'] or 'must buy a mining node' in data['error']):
                    self.log_test("Withdraw Mine - Insufficient Balance", True, "Correctly rejected insufficient balance", data)
                else:
                    self.log_test("Withdraw Mine - Insufficient Balance", False, "Wrong error message", data)
            else:
                self.log_test("Withdraw Mine - Insufficient Balance", False, f"Expected 400, got {response.status_code}", response.json())
                
        except Exception as e:
            self.log_test("Withdraw Mine - Insufficient Balance", False, f"Request failed: {str(e)}")
        
        # Test mine balance withdrawal - minimum amount
        mine_withdraw_small = {
            "type": "mine",
            "amount": 10  # Below minimum
        }
        
        try:
            response = self.session.post(f"{self.base_url}/withdraw", json=mine_withdraw_small)
            
            if response.status_code == 400:
                data = response.json()
                if 'error' in data and 'Minimum withdrawal is 25 TRX' in data['error']:
                    self.log_test("Withdraw Mine - Minimum Amount", True, "Correctly enforced minimum withdrawal", data)
                else:
                    self.log_test("Withdraw Mine - Minimum Amount", False, "Wrong error message", data)
            else:
                self.log_test("Withdraw Mine - Minimum Amount", False, f"Expected 400, got {response.status_code}", response.json())
                
        except Exception as e:
            self.log_test("Withdraw Mine - Minimum Amount", False, f"Request failed: {str(e)}")
        
        # Test referral balance withdrawal - insufficient balance
        referral_withdraw_data = {
            "type": "referral",
            "amount": 1000  # High amount to test insufficient balance
        }
        
        try:
            response = self.session.post(f"{self.base_url}/withdraw", json=referral_withdraw_data)
            
            if response.status_code == 400:
                data = response.json()
                if 'error' in data and ('Insufficient balance' in data['error'] or 'must buy Node 4' in data['error']):
                    self.log_test("Withdraw Referral - Insufficient Balance", True, "Correctly rejected insufficient balance", data)
                else:
                    self.log_test("Withdraw Referral - Insufficient Balance", False, "Wrong error message", data)
            else:
                self.log_test("Withdraw Referral - Insufficient Balance", False, f"Expected 400, got {response.status_code}", response.json())
                
        except Exception as e:
            self.log_test("Withdraw Referral - Insufficient Balance", False, f"Request failed: {str(e)}")
        
        # Test referral balance withdrawal - minimum amount
        referral_withdraw_small = {
            "type": "referral",
            "amount": 25  # Below minimum for referral
        }
        
        try:
            response = self.session.post(f"{self.base_url}/withdraw", json=referral_withdraw_small)
            
            if response.status_code == 400:
                data = response.json()
                if 'error' in data and 'Minimum withdrawal is 50 TRX' in data['error']:
                    self.log_test("Withdraw Referral - Minimum Amount", True, "Correctly enforced minimum withdrawal", data)
                else:
                    self.log_test("Withdraw Referral - Minimum Amount", False, "Wrong error message", data)
            else:
                self.log_test("Withdraw Referral - Minimum Amount", False, f"Expected 400, got {response.status_code}", response.json())
                
        except Exception as e:
            self.log_test("Withdraw Referral - Minimum Amount", False, f"Request failed: {str(e)}")
        
        # Test invalid withdrawal type
        invalid_withdraw_data = {
            "type": "invalid",
            "amount": 50
        }
        
        try:
            response = self.session.post(f"{self.base_url}/withdraw", json=invalid_withdraw_data)
            
            if response.status_code == 400:
                data = response.json()
                if 'error' in data and 'Invalid withdrawal type' in data['error']:
                    self.log_test("Withdraw - Invalid Type", True, "Correctly rejected invalid withdrawal type", data)
                else:
                    self.log_test("Withdraw - Invalid Type", False, "Wrong error message", data)
            else:
                self.log_test("Withdraw - Invalid Type", False, f"Expected 400, got {response.status_code}", response.json())
                
        except Exception as e:
            self.log_test("Withdraw - Invalid Type", False, f"Request failed: {str(e)}")
    
    def test_withdrawals_live_data(self):
        """Test getting mock live withdrawal data"""
        print("\n=== Testing Live Withdrawal Data ===")
        
        try:
            response = self.session.get(f"{self.base_url}/withdrawals")
            
            if response.status_code == 200:
                data = response.json()
                if 'withdrawals' in data and isinstance(data['withdrawals'], list):
                    if len(data['withdrawals']) > 0:
                        withdrawal = data['withdrawals'][0]
                        required_fields = ['username', 'amount', 'timestamp']
                        if all(field in withdrawal for field in required_fields):
                            self.log_test("Get Live Withdrawals", True, f"Successfully retrieved {len(data['withdrawals'])} withdrawal records", data)
                        else:
                            self.log_test("Get Live Withdrawals", False, "Withdrawal records missing required fields", data)
                    else:
                        self.log_test("Get Live Withdrawals", True, "Successfully retrieved empty withdrawal list", data)
                else:
                    self.log_test("Get Live Withdrawals", False, "Invalid response structure", data)
            else:
                self.log_test("Get Live Withdrawals", False, f"HTTP {response.status_code}", response.json())
                
        except Exception as e:
            self.log_test("Get Live Withdrawals", False, f"Request failed: {str(e)}")
    
    def test_error_handling(self):
        """Test general error handling"""
        print("\n=== Testing Error Handling ===")
        
        # Test non-existent endpoint
        try:
            response = self.session.get(f"{self.base_url}/nonexistent")
            
            if response.status_code == 404:
                data = response.json()
                if 'error' in data and 'Not found' in data['error']:
                    self.log_test("Error Handling - 404", True, "Correctly returned 404 for non-existent endpoint", data)
                else:
                    self.log_test("Error Handling - 404", False, "Wrong error message for 404", data)
            else:
                self.log_test("Error Handling - 404", False, f"Expected 404, got {response.status_code}", response.json())
                
        except Exception as e:
            self.log_test("Error Handling - 404", False, f"Request failed: {str(e)}")
        
        # Test malformed JSON
        try:
            response = self.session.post(f"{self.base_url}/auth/signup", data="invalid json")
            
            if response.status_code >= 400:
                self.log_test("Error Handling - Malformed JSON", True, f"Correctly handled malformed JSON with status {response.status_code}")
            else:
                self.log_test("Error Handling - Malformed JSON", False, f"Should have returned error for malformed JSON, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Error Handling - Malformed JSON", True, f"Request properly failed for malformed JSON: {str(e)}")
    
    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting TRX Mining Node API Testing Suite")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 80)
        
        # Run all test suites
        self.test_auth_signup()
        self.test_auth_signin()
        self.test_auth_user()
        self.test_nodes_get()
        self.test_nodes_purchase()
        self.test_user_nodes()
        self.test_user_profile()
        self.test_user_referrals()
        self.test_withdraw()
        self.test_withdrawals_live_data()
        self.test_error_handling()
        
        # Print summary
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
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
        
        print("\n" + "=" * 80)
        return passed_tests, failed_tests

if __name__ == "__main__":
    tester = TRXMiningAPITester()
    passed, failed = tester.run_all_tests()
    
    # Exit with appropriate code
    exit(0 if failed == 0 else 1)