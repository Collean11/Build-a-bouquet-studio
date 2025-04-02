import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, 'build-a-bouquet-studio-34ba3-firebase-adminsdk-2q8qg-0c0c0c0c0c.json'))
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const corsConfig = [
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": [
      "Content-Type",
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Methods",
      "Access-Control-Allow-Headers",
      "Access-Control-Max-Age",
      "Access-Control-Expose-Headers",
      "Content-Disposition",
      "Content-Length",
      "ETag",
      "Last-Modified"
    ]
  }
];

admin.storage().bucket().setCorsConfiguration(corsConfig)
  .then(() => {
    console.log('CORS configuration updated successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error updating CORS configuration:', error);
    process.exit(1);
  }); 