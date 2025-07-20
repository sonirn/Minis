#!/usr/bin/env python3
"""
Test database connection and user signup issue
"""

import requests
import json
import uuid
import random

BASE_URL = "http://localhost:3000/api"

def test_database_connection():
    """Test database connection and user signup issue"""
    print("🔍 Testing Database Connection and User Signup Issue...")
    
    # Test 1: Check if database tables exist
    print("\n1. Testing database status...")
    try:
        response = requests.get(f"{BASE_URL}/admin/db-status")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Database status: {json.dumps(data, indent=2)}")
        else:
            print(f"❌ Database status failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Database status error: {e}")
    
    # Test 2: Try to create a user with detailed error logging
    print("\n2. Testing user signup with detailed logging...")
    test_user = {
        'username': f'testuser_{random.randint(1000, 9999)}',
        'password': 'testpass123',
        'referralCode': ''
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/signup", json=test_user)
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        print(f"Response body: {response.text}")
        
        if response.status_code == 200:
            print("✅ User signup successful")
        else:
            print(f"❌ User signup failed with status {response.status_code}")
            
    except Exception as e:
        print(f"❌ User signup error: {e}")
    
    # Test 3: Test with minimal user data
    print("\n3. Testing with minimal user data...")
    minimal_user = {
        'username': f'minimal_{random.randint(1000, 9999)}',
        'password': 'pass123'
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/signup", json=minimal_user)
        print(f"Minimal user response: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Minimal user error: {e}")
    
    # Test 4: Test signin with existing user (should fail gracefully)
    print("\n4. Testing signin with non-existent user...")
    try:
        response = requests.post(f"{BASE_URL}/auth/signin", json={
            'username': 'nonexistent',
            'password': 'password'
        })
        print(f"Signin response: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Signin test error: {e}")

if __name__ == "__main__":
    test_database_connection()