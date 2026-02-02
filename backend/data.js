/**
 * Helpers para leitura/escrita de JSON no backend
 */

const fs = require('fs');
const path = require('path');

function readJson(filePath, defaultValue = null) {
    return new Promise((resolve) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) return resolve(defaultValue);
            try {
                resolve(JSON.parse(data || '{}'));
            } catch (e) {
                resolve(defaultValue);
            }
        });
    });
}

function readJsonSync(filePath, defaultValue = null) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data || '{}');
    } catch (e) {
        return defaultValue;
    }
}

function writeJson(filePath, obj) {
    return new Promise((resolve, reject) => {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            try { fs.mkdirSync(dir, { recursive: true }); } catch (e) { return reject(e); }
        }
        fs.writeFile(filePath, JSON.stringify(obj, null, 2), 'utf8', (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

module.exports = { readJson, readJsonSync, writeJson };
