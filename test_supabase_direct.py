#!/usr/bin/env python3
"""
Test Supabase connection directly to understand the schema issue
"""

import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

def test_supabase_direct():
    """Test Supabase connection directly"""
    print("🔍 Testing Supabase Connection Directly...")
    
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ Missing Supabase environment variables")
        return
    
    print(f"Supabase URL: {supabase_url}")
    print(f"Service Key: {supabase_key[:20]}...")
    
    # Test 1: Try to query users table to see its structure
    print("\n1. Testing users table structure...")
    try:
        headers = {
            'apikey': supabase_key,
            'Authorization': f'Bearer {supabase_key}',
            'Content-Type': 'application/json'
        }
        
        # Try to get table info
        response = requests.get(
            f"{supabase_url}/rest/v1/users?limit=1",
            headers=headers
        )
        
        print(f"Users table query status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        print(f"Response body: {response.text}")
        
    except Exception as e:
        print(f"❌ Users table query error: {e}")
    
    # Test 2: Try to insert a minimal user record
    print("\n2. Testing minimal user insert...")
    try:
        test_user = {
            'username': 'test_direct_123',
            'password': 'testpass',
            'email': 'test@example.com',
            'referral_code': 'TEST123'
        }
        
        response = requests.post(
            f"{supabase_url}/rest/v1/users",
            headers=headers,
            json=test_user
        )
        
        print(f"Insert status: {response.status_code}")
        print(f"Insert response: {response.text}")
        
    except Exception as e:
        print(f"❌ Insert error: {e}")

if __name__ == "__main__":
    test_supabase_direct()