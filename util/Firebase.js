import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

const ENV = process.env.NODE_ENV;

const serviceAccount = {
    type: process.env.SERVICE_ACCOUNT_TYPE,
    project_id: process.env.SERVICE_ACCOUNT_PROJECT_ID,
    private_key_id: process.env.SERVICE_ACCOUNT_PRIVATE_KEY_ID,
    private_key: process.env.SERVICE_ACCOUNT_PRIVATE_KEY,
    client_email: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
    client_id: process.env.SERVICE_ACCOUNT_CLIENT_ID,
    auth_uri: process.env.SERVICE_ACCOUNT_AUTH_URI,
    token_uri: process.env.SERVICE_ACCOUNT_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.SERVICE_ACCOUNT_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.SERVICE_ACCOUNT_CLIENT_X509_CERT_URL,
    universal_domain: process.env.SERVICE_ACCOUNT_UNIVERSAL_DOMAIN,
};

// Initialize Firebase

class Firebase {
    // Singleton

    static async getInstance() {
        if (!Firebase.instance) {
            Firebase.instance = new Firebase();
        }
        return Firebase.instance;
    }

    constructor() {
        //Edit this line to use Firebase in test environment
        if (ENV !== 'test') {
            const firebaseConfig = {
                credential: cert(serviceAccount),
                apiKey: process.env.FIREBASE_API_KEY,
                authDomain: process.env.FIREBASE_AUTH_DOMAIN,
                projectId: process.env.FIREBASE_PROJECT_ID,
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
                messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
                appId: process.env.FIREBASE_APP_ID,
                measurementId: process.env.FIREBASE_MEASUREMENT_ID,
            };

            initializeApp(firebaseConfig);
            this.bucket = getStorage().bucket();
        }
    }

    getBucket() {
        return this.bucket;
    }

    async uploadFile(fileName, fileBuffer, metadata) {
        const uniqueFileName = `${Date.now()}-${fileName}`;
        const file = this.bucket.file(uniqueFileName);
        await file.save(fileBuffer, {
            metadata,
        });

        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: '03-09-2491',
        });

        return url;
    }
}

export default Firebase;
