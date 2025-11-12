#!/usr/bin/env python3
"""
Tool Disable/Enable Feature Testing for 127 | Yannick Tools Application
Tests the newly implemented tool disable/enable functionality
"""

import requests
import json
import uuid
from datetime import datetime, timezone
import time

# Configuration
BACKEND_URL = "https://autosoft-device.preview.emergentagent.com/api"

# Admin credentials as specified in the review request
ADMIN_CREDENTIALS = {
    "email": "yannick@radiogroep.be",
    "password": "admin"
}

# Test tool IDs as mentioned in the review request
TEST_TOOL_IDS = ["dpd", "printer", "sscreen", "wea", "password"]

class ToolDisableFeatureTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.test_results = []
        self.original_tool_states = {}
        
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
    
    def admin_login(self):
        """Login as admin to get authentication token"""
        print("\n=== Admin Authentication ===")
        
        try:
            login_data = {
                "email": ADMIN_CREDENTIALS["email"],
                "password": ADMIN_CREDENTIALS["password"]
            }
            
            response = self.session.post(f"{BACKEND_URL}/admin/login", json=login_data)
            if response.status_code == 200:
                token_data = response.json()
                self.admin_token = token_data.get("access_token")
                self.log_result("Admin Login", True, f"Successfully logged in as {ADMIN_CREDENTIALS['email']}", {"user": token_data.get("user")})
                
                # Set authorization header for future requests
                self.session.headers.update({"Authorization": f"Bearer {self.admin_token}"})
                return True
            else:
                self.log_result("Admin Login", False, f"Login failed: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Admin Login", False, f"Exception during login: {str(e)}")
            return False
    
    def test_public_tools_api(self):
        """Test GET /api/tools - should return only enabled tools"""
        print("\n=== Testing Public Tool Status API (GET /api/tools) ===")
        
        try:
            # Remove authorization header for public endpoint
            temp_headers = self.session.headers.copy()
            if "Authorization" in self.session.headers:
                del self.session.headers["Authorization"]
            
            response = self.session.get(f"{BACKEND_URL}/tools")
            
            # Restore authorization header
            self.session.headers = temp_headers
            
            if response.status_code == 200:
                tools = response.json()
                self.log_result("Public Tools API", True, f"Retrieved {len(tools)} enabled tools", {"count": len(tools), "tools": [t.get("id") for t in tools]})
                
                # Verify response structure
                if tools:
                    sample_tool = tools[0]
                    required_fields = ["id", "name", "path", "enabled"]
                    excluded_fields = ["code", "file_path"]
                    
                    # Check required fields are present
                    missing_fields = [field for field in required_fields if field not in sample_tool]
                    if missing_fields:
                        self.log_result("Tools API Structure - Required Fields", False, f"Missing required fields: {missing_fields}", sample_tool)
                    else:
                        self.log_result("Tools API Structure - Required Fields", True, "All required fields present")
                    
                    # Check excluded fields are not present
                    present_excluded = [field for field in excluded_fields if field in sample_tool]
                    if present_excluded:
                        self.log_result("Tools API Structure - Excluded Fields", False, f"Excluded fields present: {present_excluded}", sample_tool)
                    else:
                        self.log_result("Tools API Structure - Excluded Fields", True, "Code and file_path fields correctly excluded")
                    
                    # Verify all returned tools have enabled: true
                    disabled_tools = [tool for tool in tools if not tool.get("enabled", False)]
                    if disabled_tools:
                        self.log_result("Tools API Filtering", False, f"Found {len(disabled_tools)} disabled tools in response", disabled_tools)
                    else:
                        self.log_result("Tools API Filtering", True, "All returned tools have enabled: true")
                else:
                    self.log_result("Tools API Structure", True, "No tools to validate (empty response)")
                
                return tools
            else:
                self.log_result("Public Tools API", False, f"Failed to retrieve tools: {response.status_code}", response.text)
                return []
                
        except Exception as e:
            self.log_result("Public Tools API", False, f"Exception: {str(e)}")
            return []
    
    def test_tool_status_check_api(self):
        """Test GET /api/tools/{tool_id}/status for various tool IDs"""
        print("\n=== Testing Tool Status Check API (GET /api/tools/{tool_id}/status) ===")
        
        for tool_id in TEST_TOOL_IDS:
            try:
                # Remove authorization header for public endpoint
                temp_headers = self.session.headers.copy()
                if "Authorization" in self.session.headers:
                    del self.session.headers["Authorization"]
                
                response = self.session.get(f"{BACKEND_URL}/tools/{tool_id}/status")
                
                # Restore authorization header
                self.session.headers = temp_headers
                
                if response.status_code == 200:
                    status_data = response.json()
                    expected_fields = ["id", "enabled", "name"]
                    
                    # Verify response structure
                    missing_fields = [field for field in expected_fields if field not in status_data]
                    if missing_fields:
                        self.log_result(f"Tool Status Check - {tool_id}", False, f"Missing fields: {missing_fields}", status_data)
                    else:
                        # Verify ID matches
                        if status_data.get("id") == tool_id:
                            self.log_result(f"Tool Status Check - {tool_id}", True, f"Status: enabled={status_data.get('enabled')}, name='{status_data.get('name')}'", status_data)
                        else:
                            self.log_result(f"Tool Status Check - {tool_id}", False, f"ID mismatch: expected {tool_id}, got {status_data.get('id')}", status_data)
                    
                elif response.status_code == 404:
                    self.log_result(f"Tool Status Check - {tool_id}", False, f"Tool not found: {response.status_code}", response.text)
                else:
                    self.log_result(f"Tool Status Check - {tool_id}", False, f"Unexpected status: {response.status_code}", response.text)
                    
            except Exception as e:
                self.log_result(f"Tool Status Check - {tool_id}", False, f"Exception: {str(e)}")
    
    def get_admin_tools(self):
        """Get all tools via admin endpoint to store original states"""
        print("\n=== Getting Admin Tools List ===")
        
        if not self.admin_token:
            self.log_result("Get Admin Tools", False, "No admin token available")
            return []
        
        try:
            response = self.session.get(f"{BACKEND_URL}/admin/tools")
            if response.status_code == 200:
                tools = response.json()
                self.log_result("Get Admin Tools", True, f"Retrieved {len(tools)} tools from admin endpoint", {"count": len(tools)})
                
                # Store original states
                for tool in tools:
                    self.original_tool_states[tool["id"]] = tool.get("enabled", True)
                
                return tools
            else:
                self.log_result("Get Admin Tools", False, f"Failed to get admin tools: {response.status_code}", response.text)
                return []
                
        except Exception as e:
            self.log_result("Get Admin Tools", False, f"Exception: {str(e)}")
            return []
    
    def test_admin_tool_toggle(self):
        """Test admin tool toggle functionality"""
        print("\n=== Testing Admin Tool Toggle Functionality ===")
        
        if not self.admin_token:
            self.log_result("Admin Tool Toggle Setup", False, "No admin token available")
            return
        
        # Get admin tools first
        admin_tools = self.get_admin_tools()
        if not admin_tools:
            return
        
        # Pick the first tool for testing (dpd - Dead Pixel Detector)
        test_tool = None
        for tool in admin_tools:
            if tool["id"] == "dpd":
                test_tool = tool
                break
        
        if not test_tool:
            self.log_result("Admin Tool Toggle Setup", False, "Could not find 'dpd' tool for testing")
            return
        
        tool_id = test_tool["id"]
        original_enabled = test_tool.get("enabled", True)
        
        self.log_result("Admin Tool Toggle Setup", True, f"Testing with tool '{tool_id}', original state: enabled={original_enabled}")
        
        # Step 1: Disable the tool
        try:
            disable_data = {"enabled": False}
            response = self.session.put(f"{BACKEND_URL}/admin/tools/{tool_id}", json=disable_data)
            
            if response.status_code == 200:
                self.log_result("Admin Tool Disable", True, f"Successfully disabled tool {tool_id}")
                
                # Verify tool is not in public API
                time.sleep(0.5)  # Brief pause for consistency
                public_tools = self.test_public_tools_after_disable(tool_id)
                
                # Verify status check shows disabled
                self.test_status_check_after_disable(tool_id)
                
            else:
                self.log_result("Admin Tool Disable", False, f"Failed to disable tool: {response.status_code}", response.text)
                return
                
        except Exception as e:
            self.log_result("Admin Tool Disable", False, f"Exception: {str(e)}")
            return
        
        # Step 2: Re-enable the tool
        try:
            enable_data = {"enabled": True}
            response = self.session.put(f"{BACKEND_URL}/admin/tools/{tool_id}", json=enable_data)
            
            if response.status_code == 200:
                self.log_result("Admin Tool Enable", True, f"Successfully re-enabled tool {tool_id}")
                
                # Verify tool is back in public API
                time.sleep(0.5)  # Brief pause for consistency
                self.test_public_tools_after_enable(tool_id)
                
                # Verify status check shows enabled
                self.test_status_check_after_enable(tool_id)
                
            else:
                self.log_result("Admin Tool Enable", False, f"Failed to re-enable tool: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Admin Tool Enable", False, f"Exception: {str(e)}")
    
    def test_public_tools_after_disable(self, disabled_tool_id):
        """Verify disabled tool is not in public tools API"""
        try:
            # Remove authorization header for public endpoint
            temp_headers = self.session.headers.copy()
            if "Authorization" in self.session.headers:
                del self.session.headers["Authorization"]
            
            response = self.session.get(f"{BACKEND_URL}/tools")
            
            # Restore authorization header
            self.session.headers = temp_headers
            
            if response.status_code == 200:
                tools = response.json()
                disabled_tool_found = any(tool.get("id") == disabled_tool_id for tool in tools)
                
                if disabled_tool_found:
                    self.log_result("Public API After Disable", False, f"Disabled tool {disabled_tool_id} still appears in public API", {"tools": [t.get("id") for t in tools]})
                else:
                    self.log_result("Public API After Disable", True, f"Disabled tool {disabled_tool_id} correctly excluded from public API")
                
                return tools
            else:
                self.log_result("Public API After Disable", False, f"Failed to check public API: {response.status_code}", response.text)
                return []
                
        except Exception as e:
            self.log_result("Public API After Disable", False, f"Exception: {str(e)}")
            return []
    
    def test_status_check_after_disable(self, disabled_tool_id):
        """Verify status check shows tool as disabled"""
        try:
            # Remove authorization header for public endpoint
            temp_headers = self.session.headers.copy()
            if "Authorization" in self.session.headers:
                del self.session.headers["Authorization"]
            
            response = self.session.get(f"{BACKEND_URL}/tools/{disabled_tool_id}/status")
            
            # Restore authorization header
            self.session.headers = temp_headers
            
            if response.status_code == 200:
                status_data = response.json()
                if status_data.get("enabled") == False:
                    self.log_result("Status Check After Disable", True, f"Tool {disabled_tool_id} correctly shows enabled=false", status_data)
                else:
                    self.log_result("Status Check After Disable", False, f"Tool {disabled_tool_id} shows enabled={status_data.get('enabled')}, expected false", status_data)
            else:
                self.log_result("Status Check After Disable", False, f"Failed to check tool status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Status Check After Disable", False, f"Exception: {str(e)}")
    
    def test_public_tools_after_enable(self, enabled_tool_id):
        """Verify re-enabled tool appears in public tools API"""
        try:
            # Remove authorization header for public endpoint
            temp_headers = self.session.headers.copy()
            if "Authorization" in self.session.headers:
                del self.session.headers["Authorization"]
            
            response = self.session.get(f"{BACKEND_URL}/tools")
            
            # Restore authorization header
            self.session.headers = temp_headers
            
            if response.status_code == 200:
                tools = response.json()
                enabled_tool_found = any(tool.get("id") == enabled_tool_id for tool in tools)
                
                if enabled_tool_found:
                    self.log_result("Public API After Enable", True, f"Re-enabled tool {enabled_tool_id} correctly appears in public API")
                else:
                    self.log_result("Public API After Enable", False, f"Re-enabled tool {enabled_tool_id} missing from public API", {"tools": [t.get("id") for t in tools]})
                
                return tools
            else:
                self.log_result("Public API After Enable", False, f"Failed to check public API: {response.status_code}", response.text)
                return []
                
        except Exception as e:
            self.log_result("Public API After Enable", False, f"Exception: {str(e)}")
            return []
    
    def test_status_check_after_enable(self, enabled_tool_id):
        """Verify status check shows tool as enabled"""
        try:
            # Remove authorization header for public endpoint
            temp_headers = self.session.headers.copy()
            if "Authorization" in self.session.headers:
                del self.session.headers["Authorization"]
            
            response = self.session.get(f"{BACKEND_URL}/tools/{enabled_tool_id}/status")
            
            # Restore authorization header
            self.session.headers = temp_headers
            
            if response.status_code == 200:
                status_data = response.json()
                if status_data.get("enabled") == True:
                    self.log_result("Status Check After Enable", True, f"Tool {enabled_tool_id} correctly shows enabled=true", status_data)
                else:
                    self.log_result("Status Check After Enable", False, f"Tool {enabled_tool_id} shows enabled={status_data.get('enabled')}, expected true", status_data)
            else:
                self.log_result("Status Check After Enable", False, f"Failed to check tool status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Status Check After Enable", False, f"Exception: {str(e)}")
    
    def test_error_handling(self):
        """Test error handling for invalid requests"""
        print("\n=== Testing Error Handling ===")
        
        # Test 1: Invalid tool ID in status check
        try:
            # Remove authorization header for public endpoint
            temp_headers = self.session.headers.copy()
            if "Authorization" in self.session.headers:
                del self.session.headers["Authorization"]
            
            response = self.session.get(f"{BACKEND_URL}/tools/invalid_tool_id/status")
            
            # Restore authorization header
            self.session.headers = temp_headers
            
            if response.status_code == 404:
                self.log_result("Invalid Tool ID Error", True, "Correctly returned 404 for invalid tool ID")
            else:
                self.log_result("Invalid Tool ID Error", False, f"Expected 404, got {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Invalid Tool ID Error", False, f"Exception: {str(e)}")
        
        # Test 2: Unauthorized access to admin tool toggle
        try:
            # Remove authorization header
            temp_headers = self.session.headers.copy()
            if "Authorization" in self.session.headers:
                del self.session.headers["Authorization"]
            
            toggle_data = {"enabled": False}
            response = self.session.put(f"{BACKEND_URL}/admin/tools/dpd", json=toggle_data)
            
            # Restore authorization header
            self.session.headers = temp_headers
            
            if response.status_code in [401, 403]:  # Unauthorized or Forbidden
                self.log_result("Unauthorized Tool Toggle", True, f"Correctly rejected unauthorized access with status {response.status_code}")
            else:
                self.log_result("Unauthorized Tool Toggle", False, f"Expected 401/403, got {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Unauthorized Tool Toggle", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all tool disable/enable feature tests"""
        print("🚀 Starting Tool Disable/Enable Feature Tests for 127 | Yannick Tools")
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Admin Email: {ADMIN_CREDENTIALS['email']}")
        print("=" * 80)
        
        # Step 1: Admin authentication
        auth_success = self.admin_login()
        
        # Step 2: Test public tools API
        self.test_public_tools_api()
        
        # Step 3: Test tool status check API
        self.test_tool_status_check_api()
        
        # Step 4: Test admin tool toggle functionality
        if auth_success:
            self.test_admin_tool_toggle()
        else:
            print("⚠️  Skipping admin tool toggle tests due to authentication failure")
        
        # Step 5: Test error handling
        self.test_error_handling()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("📊 TOOL DISABLE/ENABLE FEATURE TEST SUMMARY")
        print("=" * 80)
        
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
        
        print("\n" + "=" * 80)

if __name__ == "__main__":
    tester = ToolDisableFeatureTester()
    tester.run_all_tests()