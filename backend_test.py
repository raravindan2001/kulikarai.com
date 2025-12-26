import requests
import sys
import json
from datetime import datetime, timedelta

class KulikariFamilyAPITester:
    def __init__(self, base_url="https://family-moments-11.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected: {expected_status}"
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"

            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_user = {
            "email": f"test_user_{timestamp}@kulikari.com",
            "password": "TestPass123!",
            "name": f"Test User {timestamp}"
        }
        
        response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user
        )
        
        if response and 'token' in response:
            self.token = response['token']
            self.user_id = response['user_id']
            return test_user
        return None

    def test_user_login(self, user_data):
        """Test user login"""
        login_data = {
            "email": user_data["email"],
            "password": user_data["password"]
        }
        
        response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if response and 'token' in response:
            self.token = response['token']
            return True
        return False

    def test_get_current_user(self):
        """Test getting current user profile"""
        response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return response is not None

    def test_update_profile(self):
        """Test updating user profile"""
        update_data = {
            "name": "Updated Test User",
            "bio": "This is a test bio for the family network",
            "birthday": "1990-01-01"
        }
        
        response = self.run_test(
            "Update Profile",
            "PUT",
            "users/me",
            200,
            data=update_data
        )
        return response is not None

    def test_create_post(self):
        """Test creating a post"""
        post_data = {
            "content": "This is a test post for the family network! 🎉",
            "media": []
        }
        
        response = self.run_test(
            "Create Post",
            "POST",
            "posts",
            200,
            data=post_data
        )
        
        if response and 'id' in response:
            return response['id']
        return None

    def test_get_posts(self):
        """Test getting posts feed"""
        response = self.run_test(
            "Get Posts Feed",
            "GET",
            "posts",
            200
        )
        return response is not None

    def test_like_post(self, post_id):
        """Test liking a post"""
        response = self.run_test(
            "Like Post",
            "POST",
            f"posts/{post_id}/like",
            200
        )
        return response is not None

    def test_upload_photo(self):
        """Test uploading a photo"""
        # Using a simple base64 encoded test image
        test_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        response = self.run_test(
            "Upload Photo",
            "POST",
            "photos",
            200,
            data={
                "image": test_image,
                "caption": "Test family photo"
            }
        )
        
        if response and 'id' in response:
            return response['id']
        return None

    def test_get_photos(self):
        """Test getting photos"""
        response = self.run_test(
            "Get Photos",
            "GET",
            "photos",
            200
        )
        return response is not None

    def test_like_photo(self, photo_id):
        """Test liking a photo"""
        response = self.run_test(
            "Like Photo",
            "POST",
            f"photos/{photo_id}/like",
            200
        )
        return response is not None

    def test_add_photo_comment(self, photo_id):
        """Test adding comment to photo"""
        comment_data = {
            "comment": "Beautiful family photo! 😍"
        }
        
        response = self.run_test(
            "Add Photo Comment",
            "POST",
            f"photos/{photo_id}/comments",
            200,
            data=comment_data
        )
        return response is not None

    def test_get_photo_comments(self, photo_id):
        """Test getting photo comments"""
        response = self.run_test(
            "Get Photo Comments",
            "GET",
            f"photos/{photo_id}/comments",
            200
        )
        return response is not None

    def test_create_event(self):
        """Test creating an event"""
        future_date = (datetime.now() + timedelta(days=7)).isoformat()
        event_data = {
            "title": "Family Reunion 2024",
            "description": "Annual family gathering with games and food",
            "date": future_date,
            "location": "Central Park, New York"
        }
        
        response = self.run_test(
            "Create Event",
            "POST",
            "events",
            200,
            data=event_data
        )
        
        if response and 'id' in response:
            return response['id']
        return None

    def test_get_events(self):
        """Test getting events"""
        response = self.run_test(
            "Get Events",
            "GET",
            "events",
            200
        )
        return response is not None

    def test_attend_event(self, event_id):
        """Test attending an event"""
        response = self.run_test(
            "Attend Event",
            "POST",
            f"events/{event_id}/attend",
            200
        )
        return response is not None

    def test_get_users(self):
        """Test getting users list"""
        response = self.run_test(
            "Get Users List",
            "GET",
            "users",
            200
        )
        return response is not None

    def test_get_family_tree(self):
        """Test getting family tree"""
        response = self.run_test(
            "Get Family Tree",
            "GET",
            "users/family-tree",
            200
        )
        return response is not None

    def test_send_message(self):
        """Test sending a message"""
        # First get users to find someone to message
        users_response = self.run_test(
            "Get Users for Messaging",
            "GET",
            "users",
            200
        )
        
        if not users_response or not users_response.get('users'):
            self.log_test("Send Message", False, "No users available to message")
            return None
        
        # Find another user (not current user)
        other_users = [u for u in users_response['users'] if u['id'] != self.user_id]
        if not other_users:
            self.log_test("Send Message", False, "No other users to message")
            return None
        
        receiver_id = other_users[0]['id']
        message_data = {
            "receiver_id": receiver_id,
            "message": "Hello! This is a test message from the family network."
        }
        
        response = self.run_test(
            "Send Message",
            "POST",
            "messages",
            200,
            data=message_data
        )
        return response is not None

    def test_get_conversations(self):
        """Test getting conversations"""
        response = self.run_test(
            "Get Conversations",
            "GET",
            "messages/conversations",
            200
        )
        return response is not None

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Kulikari Family Network API Tests")
        print("=" * 60)
        
        # Test user registration and authentication
        user_data = self.test_user_registration()
        if not user_data:
            print("❌ Registration failed, stopping tests")
            return False
        
        # Test login
        if not self.test_user_login(user_data):
            print("❌ Login failed, stopping tests")
            return False
        
        # Test user profile operations
        self.test_get_current_user()
        self.test_update_profile()
        
        # Test posts functionality
        post_id = self.test_create_post()
        self.test_get_posts()
        if post_id:
            self.test_like_post(post_id)
        
        # Test photos functionality
        photo_id = self.test_upload_photo()
        self.test_get_photos()
        if photo_id:
            self.test_like_photo(photo_id)
            self.test_add_photo_comment(photo_id)
            self.test_get_photo_comments(photo_id)
        
        # Test events functionality
        event_id = self.test_create_event()
        self.test_get_events()
        if event_id:
            self.test_attend_event(event_id)
        
        # Test family and messaging
        self.test_get_users()
        self.test_get_family_tree()
        self.test_send_message()
        self.test_get_conversations()
        
        # Print results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    tester = KulikariFamilyAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "total_tests": tester.tests_run,
            "passed_tests": tester.tests_passed,
            "success_rate": tester.tests_passed / tester.tests_run if tester.tests_run > 0 else 0,
            "results": tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())