const fs = require('fs');
const { google } = require('googleapis');
const { JSDOM } = require('jsdom');

const FILE_ID = '10Tylw81mhHU9lTCG9yZzXAZ0dMg3c_WRXxmkuXF_FvQ';

const auth = new google.auth.GoogleAuth({
    keyFile: './credentials.json',
    scopes: ['https://www.googleapis.com/auth/drive.readonly']
});

async function exportGoogleDocToHTML() {
    try {
        const drive = google.drive({ version: 'v3', auth });


        const res = await drive.files.export(
            {
                fileId: FILE_ID,
                mimeType: 'text/html',
            },
            { responseType: 'text' }
        );

        const cleanedHTML = cleanHTML(res.data);

        fs.writeFileSync('views/pages/exported-document.html', cleanedHTML);
        console.log('Document export complete and styles removed.');
    } catch (error) {
        console.error('Error during export:', error);
    }
}

function cleanHTML(html) {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const elementsWithStyle = document.querySelectorAll('[style]');
    elementsWithStyle.forEach(element => {
        element.removeAttribute('style');
    });

    const styleTags = document.querySelectorAll('style');
    styleTags.forEach(tag => tag.remove());

    return dom.serialize();
}

exportGoogleDocToHTML();
