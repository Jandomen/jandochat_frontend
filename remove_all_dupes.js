const fs = require('fs');
let lines = fs.readFileSync('src/context/LanguageContext.js', 'utf8').split('\n');

let currentLang = null;
let seenKeys = new Set();
let newLines = [];

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Check if it's the start of a language block, e.g. "    es: {"
    let langMatch = line.match(/^ {4}(\w+):\s*\{/);
    if (langMatch) {
        currentLang = langMatch[1];
        seenKeys.clear();
        newLines.push(line);
        continue;
    }
    
    // Check if it's the end of a language block "    },"
    if (line.match(/^ {4}\},?/)) {
        currentLang = null;
        seenKeys.clear();
        newLines.push(line);
        continue;
    }
    
    // If inside a language block, check for key
    if (currentLang) {
        let keyMatch = line.match(/^\s*(\w+)\s*:/);
        if (keyMatch) {
            let key = keyMatch[1];
            if (seenKeys.has(key)) {
                // duplicate! skip it
                console.log(`Removing duplicate key ${key} in ${currentLang} at line ${i+1}`);
                continue; // don't push to newLines
            } else {
                seenKeys.add(key);
            }
        }
    }
    
    newLines.push(line);
}

fs.writeFileSync('src/context/LanguageContext.js', newLines.join('\n'), 'utf8');
console.log('Done deduplicating keys');
