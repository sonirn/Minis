#!/usr/bin/env python3
"""
Internal Authentication Testing - using localhost to test if API works internally
"""

import requests
import json
import uuid
from datetime import datetime

BASE_URL = "http://localhost:3000/api"

def test_internal_api():
    print("🔍 Testing internal API access...")
    print(f"Base URL: {BASE_URL}")
    
    # Test basic connectivity
    try:
        response = requests.get(f"{BASE_URL}/nodes", timeout=10)
        print(f"GET /nodes - Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
        else:
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error accessing /nodes: {str(e)}")
    
    # Test signup
    test_username = f"internal_test_{uuid.uuid4().hex[:6]}"
    signup_data = {
        "username": test_username,
        "password": "password123"
    }
    
    print(f"\n🔍 Testing signup with internal URL...")
    print(f"Username: {test_username}")
    
    try:
        response = requests.post(f"{BASE_URL}/auth/signup", json=signup_data, timeout=10)
        print(f"POST /auth/signup - Status: {response.status_code}")
        if response.headers.get('content-type', '').startswith('application/json'):
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
        else:
            print(f"Response (raw): {response.text}")
    except Exception as e:
        print(f"Error accessing /auth/signup: {str(e)}")
    
    # Test signin
    signin_data = {
        "username": test_username,
        "password": "password123"
    }
    
    print(f"\n🔍 Testing signin with internal URL...")
    
    try:
        response = requests.post(f"{BASE_URL}/auth/signin", json=signin_data, timeout=10)
        print(f"POST /auth/signin - Status: {response.status_code}")
        if response.headers.get('content-type', '').startswith('application/json'):
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
        else:
            print(f"Response (raw): {response.text}")
    except Exception as e:
        print(f"Error accessing /auth/signin: {str(e)}")

if __name__ == "__main__":
    test_internal_api()