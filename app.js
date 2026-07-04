import path from 'path';
import AutoLoad from '@fastify/autoload';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import Ajv from 'ajv';

dotenv.config();
const ENV = process.env.NODE_ENV;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Pass --options via CLI arguments in command to enable these options.
export const options = {};

export default async function (fastify, opts) {
    // Place here your custom code!

    const ajv = new Ajv({
        useDefaults: true,
        coerceTypes: true,
        $data: true,
        extendRefs: true,
    });

    ajv.addKeyword('isFile', {
        compile: (schema, parent) => {
            parent.type = 'file';
            delete parent.isFileType;
            return () => true;
        },
    });

    fastify.setValidatorCompiler(function (schemaDefinition) {
        const { schema } = schemaDefinition;
        return ajv.compile(schema);
    });

    if (ENV !== 'test') {
        //const { default: Firebase } = await import('./util/Firebase.js');
        //await Firebase.getInstance();

        const DB_URL = process.env.DB_URL;
        await mongoose
            .connect(DB_URL)
            .then(() => {
                console.log('Connected to MongoDB');
            })
            .catch((err) => {
                console.log('Failed to connect to MongoDB');
                console.error(err);
                throw err;
            });
    }

    // Do not touch the following lines

    // This loads all plugins defined in plugins
    // those should be support plugins that are reused
    // through your application

    fastify.register(AutoLoad, {
        dir: path.join(__dirname, 'plugins'),
        options: Object.assign({}, opts),
    });

    //Read bearer token from request header
    fastify.addHook('preHandler', async (request, reply) => {
        try {
            const { authorization } = request.headers;

            if (authorization) {
                const token = authorization.split(' ')[1];
                const data = await request.jwtVerify(token);
                request.user = data;
            }
        } catch (error) {
            request.log.error(error);
            reply.status(401).send({ error: 'Unauthorized' });
        }
    });

    // This loads all plugins defined in routes
    // define your routes in one of these
    fastify.register(AutoLoad, {
        dir: path.join(__dirname, 'routes'),
        options: Object.assign({}, opts),
    });
}
