import sys
import os
import unittest
from datetime import timedelta

# Resolve import paths absolutely
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.auth import get_password_hash, verify_password, create_access_token
from app.config import settings
from jose import jwt

class TestAuth(unittest.TestCase):
    def test_password_hashing(self):
        password = "testpassword123"
        hashed = get_password_hash(password)
        self.assertNotEqual(password, hashed)
        self.assertTrue(verify_password(password, hashed))
        self.assertFalse(verify_password("wrongpassword", hashed))

    def test_jwt_token_creation_and_decoding(self):
        data = {"sub": "test@swats.com", "role": "admin"}
        token = create_access_token(data, expires_delta=timedelta(minutes=10))
        self.assertTrue(isinstance(token, str))
        
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        self.assertEqual(payload.get("sub"), "test@swats.com")
        self.assertEqual(payload.get("role"), "admin")

if __name__ == '__main__':
    unittest.main()
