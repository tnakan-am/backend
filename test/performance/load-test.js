import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const successRate = new Rate('success');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },  // Ramp up to 10 users
    { duration: '5m', target: 10 },  // Stay at 10 users
    { duration: '2m', target: 50 },  // Ramp up to 50 users
    { duration: '5m', target: 50 },  // Stay at 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '5m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate must be below 10%
    errors: ['rate<0.1'],              // Custom error rate must be below 10%
    success: ['rate>0.9'],             // Success rate must be above 90%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

export function setup() {
  // Setup code - login and get auth token
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: 'test@example.com',
    password: 'testpassword123',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  const authToken = loginRes.json('access_token');
  return { authToken };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.authToken}`,
  };

  // Scenario 1: Health check (30% of traffic)
  if (Math.random() < 0.3) {
    const healthRes = http.get(`${BASE_URL}/health`);
    const healthCheck = check(healthRes, {
      'health check status is 200': (r) => r.status === 200,
      'health check response time < 100ms': (r) => r.timings.duration < 100,
    });
    errorRate.add(!healthCheck);
    successRate.add(healthCheck);
  }

  // Scenario 2: Get user profile (40% of traffic)
  if (Math.random() < 0.4) {
    const profileRes = http.get(`${BASE_URL}/auth/profile`, { headers });
    const profileCheck = check(profileRes, {
      'profile status is 200': (r) => r.status === 200,
      'profile has email': (r) => r.json('email') !== undefined,
      'profile response time < 200ms': (r) => r.timings.duration < 200,
    });
    errorRate.add(!profileCheck);
    successRate.add(profileCheck);
  }

  // Scenario 3: List users (20% of traffic)
  if (Math.random() < 0.2) {
    const usersRes = http.get(`${BASE_URL}/users`, { headers });
    const usersCheck = check(usersRes, {
      'users list status is 200': (r) => r.status === 200,
      'users list is array': (r) => Array.isArray(r.json()),
      'users list response time < 300ms': (r) => r.timings.duration < 300,
    });
    errorRate.add(!usersCheck);
    successRate.add(usersCheck);
  }

  // Scenario 4: Create and delete user (10% of traffic)
  if (Math.random() < 0.1) {
    const newUser = {
      fullName: `Load Test User ${Date.now()}`,
      email: `loadtest${Date.now()}@example.com`,
      password: 'testpass123',
      type: 'customer',
      phone: '+37491234567',
      address: {
        street: '123 Test St',
        city: 'Test City',
        region: 'TC',
        house: '1',
        zip: '12345',
      },
    };

    const createRes = http.post(
      `${BASE_URL}/users`,
      JSON.stringify(newUser),
      { headers }
    );

    const createCheck = check(createRes, {
      'create user status is 201 or 200': (r) => r.status === 201 || r.status === 200,
      'create user response time < 500ms': (r) => r.timings.duration < 500,
    });
    errorRate.add(!createCheck);
    successRate.add(createCheck);

    // Clean up - delete the created user
    if (createRes.status === 201 || createRes.status === 200) {
      const userId = createRes.json('id');
      if (userId) {
        http.del(`${BASE_URL}/users/${userId}`, null, { headers });
      }
    }
  }

  sleep(1); // Think time between requests
}

export function teardown(data) {
  // Cleanup code if needed
  console.log('Load test completed');
}