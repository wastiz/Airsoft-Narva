const { google } = require('googleapis');

const docs = google.docs('v1');

async function getDocumentContent(documentId, auth) {
    const res = await docs.documents.get({
        documentId: documentId,
        auth: auth
    });

    return res.data.body.content;
}

const CREDENTIALS_PATH = './credentials.json';
const documentId = 'your-google-docs-file-id';
const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/drive.readonly']
});

getDocumentContent('10Tylw81mhHU9lTCG9yZzXAZ0dMg3c_WRXxmkuXF_FvQ', auth).then(content => {
    console.log(content);
}).catch(err => {
    console.error('Error retrieving document content:', err);
});