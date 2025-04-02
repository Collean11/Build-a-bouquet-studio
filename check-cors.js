const admin = require('firebase-admin');
const serviceAccount = require('./build-a-bouquet-studio-34ba3-firebase-adminsdk-2q8qg-0c0c0c0c0c.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const corsConfig = [
  {
    "origin": [
      "http://localhost:5173",
      "http://localhost:5180",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5180"
    ],
    "method": ["GET", "HEAD", "OPTIONS"],
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

// First, check current CORS configuration
admin.storage().bucket().getCorsConfiguration()
  .then(currentConfig => {
    console.log('Current CORS configuration:', currentConfig);
    
    // Then update CORS configuration
    return admin.storage().bucket().setCorsConfiguration(corsConfig);
  })
  .then(() => {
    console.log('CORS configuration updated successfully');
    
    // Verify the update
    return admin.storage().bucket().getCorsConfiguration();
  })
  .then(updatedConfig => {
    console.log('Updated CORS configuration:', updatedConfig);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  }); 