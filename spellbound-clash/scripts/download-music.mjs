import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const files = {
    'sound-game.mp3': 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/8bit%20Dungeon%20Level.mp3'
};

const outputDir = path.resolve('public/audio');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

function download(fileName, url) {
    return new Promise((resolve, reject) => {
        const dest = path.join(outputDir, fileName);
        const file = fs.createWriteStream(dest);

        const request = https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        }, (response) => {
            // Handle redirects if any
            if (response.statusCode === 301 || response.statusCode === 302) {
                download(fileName, response.headers.location).then(resolve).catch(reject);
                return;
            }

            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download ${fileName}: Server returned ${response.statusCode}`));
                return;
            }

            response.pipe(file);

            file.on('finish', () => {
                file.close(() => {
                    console.log(`Successfully downloaded: ${fileName}`);
                    resolve();
                });
            });
        });

        request.on('error', (err) => {
            fs.unlink(dest, () => { }); // delete partial file on error
            reject(err);
        });
    });
}

async function run() {
    console.log('Downloading background music files...');
    for (const [name, url] of Object.entries(files)) {
        try {
            await download(name, url);
        } catch (err) {
            console.error(`Error downloading ${name}:`, err.message);
        }
    }
    console.log('Done!');
}

run();
