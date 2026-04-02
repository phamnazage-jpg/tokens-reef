// K6 Performance Test - API Gateway
// Run: k6 run -e API_KEY=sk-xxx api-gateway.js

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Warm up
    { duration: '1m', target: 50 },  // Load test
    { duration: '1m', target: 100 }, // Stress test
    { duration: '1m', target: 200 }, // Break test
    { duration: '30s', target: 0 },  // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% requests under 1s
    http_req_failed: ['rate<0.05'],    // Error rate < 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const API_KEY = __ENV.API_KEY || 'sk-test-key-for-performance';

// Non-streaming Chat Completions
export function testNonStreaming() {
  const res = http.post(
    `${BASE_URL}/v1/chat/completions`,
    JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'user', content: 'Hello' }
      ],
      stream: false,
    }),
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  check(res, {
    'non-streaming status is 200': (r) => r.status === 200,
    'non-streaming has content': (r) => r.json('choices') !== undefined,
  });

  return res.timings.duration;
}

// Streaming Chat Completions
export function testStreaming() {
  const res = http.post(
    `${BASE_URL}/v1/chat/completions`,
    JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'user', content: 'Count to 5' }
      ],
      stream: true,
    }),
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  check(res, {
    'streaming status is 200': (r) => r.status === 200,
  });

  return res.timings.duration;
}

export default function () {
  // Mix of streaming and non-streaming
  if (__ITERATION % 4 === 0) {
    testNonStreaming();
  } else {
    testStreaming();
  }

  sleep(0.1);
}
