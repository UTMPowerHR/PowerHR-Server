import { vi, beforeAll, afterAll, afterEach } from 'vitest';

// IMPORTANT: Hoist mocks to the very top, before any other imports
vi.mock('@sparticuz/chromium', () => ({
    default: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1280, height: 720 },
        executablePath: vi.fn().mockResolvedValue('/usr/bin/chromium-browser'),
        headless: true,
    },
}));

vi.mock('puppeteer-core', () => ({
    default: {
        launch: vi.fn().mockResolvedValue({
            newPage: vi.fn().mockResolvedValue({
                setContent: vi.fn().mockResolvedValue(),
                pdf: vi.fn().mockResolvedValue(Buffer.from('fake pdf content')),
                setDefaultTimeout: vi.fn(),
            }),
            close: vi.fn().mockResolvedValue(),
        }),
    },
}));

// Now import everything else
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fastify from 'fastify';
import ajvFormats from 'ajv-formats';

dotenv.config({ path: './test/.env.test' });

const app = fastify({
    ajv: {
        plugins: [
            (ajv) => {
                ajvFormats(ajv, ['binary']);
            },
        ],
    },
});

// Register the routes from your Fastify application
app.register(import('../app.js'));

let mongod;

// Set up database connection before tests
beforeAll(async () => {
    mongod = new MongoMemoryServer();
    await mongod.start();
    await mongoose.connect(mongod.getUri());
    await app.ready();
});

afterEach(async () => {
    await mongoose.connection.db.dropDatabase();
});

// Clean up database after tests
afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod.stop();
    await app.close();
});

export default app;
