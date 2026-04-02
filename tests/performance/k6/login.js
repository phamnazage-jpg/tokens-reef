// K6 Performance Test - Login
// Run: k6 run login.js

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Warm up
    { duration: '1m', target: 50 },  // Load test
    { duration: '1m', target: 100 }, // Stress test
    { duration: '30s', target: 200 }, // Break test
    { duration: '30s', target: 0 },  // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% requests under 500ms
    http_req_failed: ['rate<0.01'],   // Error rate < 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const TEST_EMAIL = __ENV.TEST_EMAIL || 'lon22@qq.com';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'admin123';

export default function () {
  // Login
  const loginRes = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login has token': (r) => r.json('token') !== undefined,
  });

  if (loginRes.status === 200) {
    const token = loginRes.json('token');

    // Get user info
    const userRes = http.get(`${BASE_URL}/api/v1/user/info`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    check(userRes, {
      'user info status is 200': (r) => r.status === 200,
    });
  }

  sleep(1);
}
