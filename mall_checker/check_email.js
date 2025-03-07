const fs = require('fs');
const zlib = require('zlib');
const crypto = require('crypto');
const csv = require('csv-parser');

// Функция для генерации хеша SHA-256 из email
function genHash(email) {
    return crypto.createHash('sha256')
        .update(email.toLowerCase(), 'utf8')
        .digest('hex');
}

// Функция для чтения CSV-файла
function readCSV(csvFile) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(csvFile, 'utf8')
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
    });
}

// Функция для чтения хешей из сжатого файла
function readHashes(fileName) {
    return new Promise((resolve, reject) => {
        const hashes = new Set();
        const stream = fs.createReadStream(fileName)
            .pipe(zlib.createGunzip())
            .setEncoding('utf8');
        
        stream.on('data', (chunk) => {
            chunk.split('\n').forEach((hash) => {
                if (hash) {
                    hashes.add(hash);
                }
            });
        });

        stream.on('end', () => resolve(hashes));
        stream.on('error', reject);
    });
}

// Функция для проверки email в базе данных
async function checkEmail(email, emailHashes) {
    return emailHashes.has(genHash(email));
}

// Функция для вывода текста красным
function printRed(msg) {
    console.log("\x1b[31m%s\x1b[0m", msg);
}

// Функция для вывода текста зелёным
function printGreen(msg) {
    console.log("\x1b[32m%s\x1b[0m", msg);
}

// Главная функция для запуска проверки
async function launchChecking(email) {
    try {
        const emailHashes = await readHashes('mall_checker/email_hash_db.txt.gz');
        if (await checkEmail(email, emailHashes)) {
            printRed(`Warning: Your email (${email}), password, name and phone leaked!`);
        } else {
            printGreen(`Your email (${email}) was not found in the leaked data.`);
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

module.exports = launchChecking