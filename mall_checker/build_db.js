const fs = require('fs');
const crypto = require('crypto');
const zlib = require('zlib');
const readline = require('readline');
const ProgressBar = require('progress');

// Генерация хеша для email
function genHash(email) {
    return crypto.createHash('sha256')
        .update(email.toLowerCase(), 'utf8')
        .digest('hex');
}

// Парсинг email из строки
function parseEmail(line) {
    line = line.split('#')[0];  // Удаляем комментарии
    const email = line.split(':')[0];  // Берем email до двоеточия
    return email ? email.trim() : null;
}

// Чтение списка клиентов из файла
function* readCustomerList(fn) {
    const fileStream = fs.createReadStream(fn, 'utf8');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        const email = parseEmail(line);
        if (email) {
            yield email;
        }
    }
}

// Основная логика
async function main() {
    const emailDb = new Set();

    // Считываем email-адреса из файла
    for (const email of readCustomerList('customers.txt')) {
        emailDb.add(email);
    }

    // Создаем бар для отслеживания прогресса
    const bar = new ProgressBar(':bar :percent', {
        total: emailDb.size,
        width: 40
    });

    // Открываем gzip файл для записи
    const writeStream = fs.createWriteStream('email_hash_db.txt.gz');
    const gzipStream = zlib.createGzip();
    writeStream.pipe(gzipStream);

    // Обрабатываем и записываем хеши email в сжатый файл
    for (const email of emailDb) {
        const emailHash = genHash(email);
        gzipStream.write(emailHash + '\n');
        bar.tick();
    }

    // Закрываем поток записи после завершения
    gzipStream.end();
}

main().catch(err => console.error('Error:', err));
