import { vi } from 'vitest';

// Mock before any other imports
vi.mock('@sparticuz/chromium', () => ({ default: {} }));
vi.mock('puppeteer-core', () => ({ default: {} }));

import { describe, it, expect } from 'vitest';
import app from '../../setup.js';

describe.concurrent('routes/authentication/index.js', () => {
    it('Login with invalid email', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/auth/login',
            payload: { email: 'invalid', password: 'password' },
        });
        expect(response.statusCode).toBe(401);
        expect(response.json()).toEqual({ error: 'Invalid email or password' });
    });

    it('Login with invalid password', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/auth/login',
            payload: { email: 'powerhr@test.com', password: 'invalid' },
        });
        expect(response.statusCode).toBe(401);
        expect(response.json()).toEqual({ error: 'Invalid email or password' });
    });
});
