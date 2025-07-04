import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fastify from 'fastify';
import ajvFormats from 'ajv-formats';
import { afterAll, beforeAll, afterEach } from 'vitest';

dotenv.config({ path: './test/.env.test' });

const app = fastify({
    ajv: {
        plugins: [
            // Add support for additional formats like 'binary'
            (ajv) => {
                ajvFormats(ajv, ['binary']);
            },
        ],
    },
});
// Register the routes from your Fastify application
app.register(import('../app.js'));

let mongod;

//Set up database connection before tests
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
