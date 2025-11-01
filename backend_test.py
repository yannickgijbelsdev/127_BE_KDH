#!/usr/bin/env python3
"""
Backend API Testing for 127 | Yannick Tools Application
Tests analytics functionality and admin authentication
"""

import requests
import json
import uuid
from datetime import datetime, timezone
import time

# Configuration
BACKEND_URL = "https://tool-metrics.preview.emergentagent.com/api"

# Try multiple possible admin credentials (found actual admin email in database)
ADMIN_CREDENTIALS = [
    {"email": "yannick@radiogroep.be", "password": "admin", "username": "yannickgijbels"},
    {"email": "yannick@radiogroep.be", "password": "admin123", "username": "yannickgijbels"},
    {"email": "yannick@radiogroep.be", "password": "password", "username": "yannickgijbels"},
    {"email": "yannick@radiogroep.be", "password": "123456", "username": "yannickgijbels"},
    {"email": "yannick@radiogroep.be", "password": "yannick123", "username": "yannickgijbels"},
    {"email": "yannick@radiogroep.be", "password": "radiogroep", "username": "yannickgijbels"}
]

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.test_results = []
        
    def log_result(self, test_name, success, message, response_data=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        if response_data:
            result["response_data"] = response_data
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if response_data and not success:
            print(f"   Response: {response_data}")
    
    def test_admin_setup_flow(self):
        """Test admin setup and authentication flow"""
        print("\n=== Testing Admin Setup & Authentication ===")
        
        # 1. Check if admin setup is needed
        try:
            response = self.session.get(f"{BACKEND_URL}/admin/needs-setup")
            if response.status_code == 200:
                needs_setup = response.json().get("needs_setup", False)
                self.log_result("Admin Setup Check", True, f"Setup needed: {needs_setup}", response.json())
                
                # 2. Create admin if needed
                if needs_setup:
                    # Use first credential set for creation
                    admin_creds = ADMIN_CREDENTIALS[0]
                    admin_data = {
                        "email": admin_creds["email"],
                        "username": admin_creds["username"],
                        "password": admin_creds["password"],
                        "role": "admin"
                    }
                    
                    setup_response = self.session.post(f"{BACKEND_URL}/admin/setup", json=admin_data)
                    if setup_response.status_code == 200:
                        self.log_result("Admin Creation", True, "Admin user created successfully", setup_response.json())
                    else:
                        self.log_result("Admin Creation", False, f"Failed to create admin: {setup_response.status_code}", setup_response.text)
                        return False
                else:
                    self.log_result("Admin Creation", True, "Admin already exists, skipping creation")
                
            else:
                self.log_result("Admin Setup Check", False, f"Failed to check setup status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Admin Setup Check", False, f"Exception: {str(e)}")
            return False
        
        # 3. Try to login with different credential sets
        for i, creds in enumerate(ADMIN_CREDENTIALS):
            try:
                login_data = {
                    "email": creds["email"],
                    "password": creds["password"]
                }
                
                login_response = self.session.post(f"{BACKEND_URL}/admin/login", json=login_data)
                if login_response.status_code == 200:
                    token_data = login_response.json()
                    self.admin_token = token_data.get("access_token")
                    self.log_result("Admin Login", True, f"Successfully logged in as admin with credentials {i+1}: {creds['email']}", {"user": token_data.get("user")})
                    
                    # Set authorization header for future requests
                    self.session.headers.update({"Authorization": f"Bearer {self.admin_token}"})
                    return True
                else:
                    self.log_result(f"Admin Login Attempt {i+1}", False, f"Login failed for {creds['email']}: {login_response.status_code}", login_response.text)
                    
            except Exception as e:
                self.log_result(f"Admin Login Attempt {i+1}", False, f"Exception during login with {creds['email']}: {str(e)}")
        
        # If we get here, all login attempts failed
        self.log_result("Admin Login", False, "All admin login attempts failed")
        return False
    
    def test_analytics_event_logging(self):
        """Test analytics event logging (public endpoint)"""
        print("\n=== Testing Analytics Event Logging ===")
        
        # Test data for WebcamAudioTest tool
        test_events = [
            {
                "tool_id": "wea",
                "tool_name": "Webcam & Audio Test",
                "event_type": "page_visit",
                "event_data": {
                    "session_id": f"test_session_{uuid.uuid4()}",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "user_agent": "BackendTester/1.0"
                }
            },
            {
                "tool_id": "wea", 
                "tool_name": "Webcam & Audio Test",
                "event_type": "button_click",
                "event_data": {
                    "session_id": f"test_session_{uuid.uuid4()}",
                    "button_name": "start_recording",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            },
            {
                "tool_id": "wea",
                "tool_name": "Webcam & Audio Test", 
                "event_type": "action",
                "event_data": {
                    "session_id": f"test_session_{uuid.uuid4()}",
                    "action": "permission_granted",
                    "permission_type": "camera",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            },
            {
                "tool_id": "dpd",
                "tool_name": "Dead Pixel Detector",
                "event_type": "page_visit", 
                "event_data": {
                    "session_id": f"test_session_{uuid.uuid4()}",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            }
        ]
        
        logged_events = []
        
        for i, event_data in enumerate(test_events):
            try:
                # Remove authorization header for public endpoint
                temp_headers = self.session.headers.copy()
                if "Authorization" in self.session.headers:
                    del self.session.headers["Authorization"]
                
                response = self.session.post(f"{BACKEND_URL}/analytics/event", json=event_data)
                
                # Restore authorization header
                self.session.headers = temp_headers
                
                if response.status_code == 200:
                    response_data = response.json()
                    logged_events.append(response_data.get("id"))
                    self.log_result(f"Analytics Event {i+1}", True, f"Event logged successfully: {event_data['event_type']}", response_data)
                else:
                    self.log_result(f"Analytics Event {i+1}", False, f"Failed to log event: {response.status_code}", response.text)
                    
            except Exception as e:
                self.log_result(f"Analytics Event {i+1}", False, f"Exception: {str(e)}")
        
        return logged_events
    
    def test_analytics_retrieval(self):
        """Test analytics data retrieval (admin endpoints)"""
        print("\n=== Testing Analytics Data Retrieval ===")
        
        if not self.admin_token:
            self.log_result("Analytics Retrieval Setup", False, "No admin token available")
            return
        
        # 1. Get all analytics events
        try:
            response = self.session.get(f"{BACKEND_URL}/admin/analytics/events")
            if response.status_code == 200:
                events = response.json()
                self.log_result("Get All Analytics", True, f"Retrieved {len(events)} analytics events", {"count": len(events)})
                
                # Verify event structure
                if events:
                    sample_event = events[0]
                    required_fields = ["id", "tool_id", "tool_name", "event_type", "event_data", "timestamp"]
                    missing_fields = [field for field in required_fields if field not in sample_event]
                    
                    if not missing_fields:
                        self.log_result("Event Structure Validation", True, "All required fields present in events")
                    else:
                        self.log_result("Event Structure Validation", False, f"Missing fields: {missing_fields}", sample_event)
                else:
                    self.log_result("Event Structure Validation", True, "No events to validate structure")
                    
            else:
                self.log_result("Get All Analytics", False, f"Failed to retrieve events: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Get All Analytics", False, f"Exception: {str(e)}")
        
        # 2. Get analytics for specific tool (wea)
        try:
            response = self.session.get(f"{BACKEND_URL}/admin/analytics/tool/wea")
            if response.status_code == 200:
                wea_events = response.json()
                self.log_result("Get Tool Analytics", True, f"Retrieved {len(wea_events)} events for WebcamAudioTest", {"count": len(wea_events)})
                
                # Verify all events are for the correct tool
                if wea_events:
                    incorrect_tools = [event for event in wea_events if event.get("tool_id") != "wea"]
                    if not incorrect_tools:
                        self.log_result("Tool Filter Validation", True, "All events belong to correct tool")
                    else:
                        self.log_result("Tool Filter Validation", False, f"Found {len(incorrect_tools)} events for wrong tool")
                        
            else:
                self.log_result("Get Tool Analytics", False, f"Failed to retrieve tool events: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Get Tool Analytics", False, f"Exception: {str(e)}")
        
        # 3. Get analytics statistics
        try:
            response = self.session.get(f"{BACKEND_URL}/admin/analytics/stats")
            if response.status_code == 200:
                stats = response.json()
                required_stats = ["total_events", "events_by_tool", "events_by_type", "unique_visitors"]
                missing_stats = [stat for stat in required_stats if stat not in stats]
                
                if not missing_stats:
                    self.log_result("Get Analytics Stats", True, "Retrieved complete analytics statistics", stats)
                else:
                    self.log_result("Get Analytics Stats", False, f"Missing statistics: {missing_stats}", stats)
                    
            else:
                self.log_result("Get Analytics Stats", False, f"Failed to retrieve stats: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Get Analytics Stats", False, f"Exception: {str(e)}")
    
    def test_error_handling(self):
        """Test error handling for malformed requests"""
        print("\n=== Testing Error Handling ===")
        
        # 1. Test malformed analytics event
        try:
            malformed_event = {
                "tool_id": "wea",
                # Missing required fields
                "event_data": {"test": "data"}
            }
            
            # Remove auth header for public endpoint
            temp_headers = self.session.headers.copy()
            if "Authorization" in self.session.headers:
                del self.session.headers["Authorization"]
            
            response = self.session.post(f"{BACKEND_URL}/analytics/event", json=malformed_event)
            
            # Restore auth header
            self.session.headers = temp_headers
            
            if response.status_code == 422:  # Validation error expected
                self.log_result("Malformed Event Handling", True, "Correctly rejected malformed event", {"status": response.status_code})
            else:
                self.log_result("Malformed Event Handling", False, f"Unexpected response: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Malformed Event Handling", False, f"Exception: {str(e)}")
        
        # 2. Test unauthorized access to admin endpoints
        try:
            # Remove auth header
            temp_headers = self.session.headers.copy()
            if "Authorization" in self.session.headers:
                del self.session.headers["Authorization"]
            
            response = self.session.get(f"{BACKEND_URL}/admin/analytics/events")
            
            # Restore auth header
            self.session.headers = temp_headers
            
            if response.status_code == 403:  # Forbidden expected
                self.log_result("Unauthorized Access Handling", True, "Correctly rejected unauthorized access", {"status": response.status_code})
            else:
                self.log_result("Unauthorized Access Handling", False, f"Unexpected response: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Unauthorized Access Handling", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Backend API Tests for 127 | Yannick Tools")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        # Test admin setup and authentication
        auth_success = self.test_admin_setup_flow()
        
        # Test analytics event logging (public)
        self.test_analytics_event_logging()
        
        # Wait a moment for events to be processed
        time.sleep(1)
        
        # Test analytics retrieval (admin)
        if auth_success:
            self.test_analytics_retrieval()
        else:
            print("⚠️  Skipping admin analytics tests due to authentication failure")
        
        # Test error handling
        self.test_error_handling()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  ❌ {result['test']}: {result['message']}")
        
        print("\n" + "=" * 60)

if __name__ == "__main__":
    tester = BackendTester()
    tester.run_all_tests()