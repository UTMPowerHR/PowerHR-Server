import { vi } from 'vitest';

// Mock before any other imports
vi.mock('@sparticuz/chromium', () => ({ default: {} }));
vi.mock('puppeteer-core', () => ({ default: {} }));

import { describe, it, expect } from 'vitest';
import app from '../setup.js';

describe.concurrent('routes/root.js', () => {
    it('should return id', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/param/123',
        });
        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({ id: '123' });
    });

    it('should return root, env', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/',
        });
        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({ root: true, env: 'test' });
    });

    it('should return root', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/basic',
        });
        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({ root: true });
    });

    it('should return body', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/body',
            payload: { message: 'Hello' },
        });
        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({ message: 'Hello' });
    });
});
