import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const homeDir = os.homedir();
const downloadsDir = path.join(homeDir, 'Downloads');
const targetDir = path.resolve('public/audio');

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// Substrings to search for in Downloads folder
const searchTerms = ['Alexander Nakarada', 'FROST', 'BreakingCopyright'];

async function run() {
    console.log(`Searching for user audio file in downloads: ${downloadsDir}`);
    if (!fs.existsSync(downloadsDir)) {
        console.error('Downloads directory does not exist at:', downloadsDir);
        return;
    }

    const files = fs.readdirSync(downloadsDir);
    const matchedFiles = files.filter(f => {
        const lower = f.toLowerCase();
        return searchTerms.some(term => lower.includes(term.toLowerCase()));
    });

    if (matchedFiles.length === 0) {
        console.log('No matching audio/video files found in Downloads folder of the user.');
        return;
    }

    console.log(`Found matching files in Downloads:\n`, matchedFiles);

    // Take the first matching file (usually the .mp4 or .mp3)
    const sourceFile = path.join(downloadsDir, matchedFiles[0]);

    // Copy to each scene's BGM file
    const targets = ['menu.mp3', 'explore.mp3', 'battle.mp3', 'gameover.mp3'];
    for (const targetName of targets) {
        const destPath = path.join(targetDir, targetName);
        console.log(`Copying ${matchedFiles[0]} -> ${destPath}`);
        fs.copyFileSync(sourceFile, destPath);
    }

    console.log('Successfully copied user music files to public/audio!');
}

run().catch(console.error);
