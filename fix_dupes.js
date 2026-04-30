const fs = require('fs');

let content = fs.readFileSync('src/context/LanguageContext.js', 'utf8');

// The lines we want to remove from ar block (they are duplicated):
const arDupes = [
    '        opinions: "آراء",\n',
    '        me_late: "أعجبني",\n',
    '        account_settings: "إعدادات الحساب",\n',
    '        personal_info: "المعلومات الشخصية",\n',
    '        name: "الاسم",\n',
    '        username: "اسم المستخدم (@)",\n',
    '        bio: "نبذة",\n',
    '        location: "الموقع",\n',
    '        website: "الموقع الإلكتروني",\n',
    '        update_profile: "تحديث الملف الشخصي",\n',
    '        language: "اللغة",\n',
    '        change_password: "تغيير كلمة المرور",\n',
    '        delete_account: "حذف الحساب",\n',
    '        notifications_sound: "أصوات الإشعارات",\n',
    '        blocked_users: "المستخدمون المحظورون",\n',
    '        archive: "أرشيف القصص",\n',
    '        saved_treasures: "كنوزك المحفوظة",\n',
    '        duration_status: "مدة الحالة",\n'
];

let lines = content.split('\n');

// 1. Remove specific ar duplicates in lines 2680-2720
for (let i = 2680; i < 2730; i++) {
    if (lines[i]) {
        let lineWithNewline = lines[i] + '\n';
        if (arDupes.includes(lineWithNewline)) {
            lines[i] = 'DELETE_ME';
        }
    }
}

lines = lines.filter(l => l !== 'DELETE_ME');

// 2. Find duplicate ko block and remove it
let inKo2 = false;
for (let i = 0; i < lines.length; i++) {
    if (lines[i] === '    ko: {' && i > 2500) { // The second ko: block
        inKo2 = true;
    }
    if (inKo2) {
        let text = lines[i];
        lines[i] = 'DELETE_ME';
        if (text === '    },') {
            inKo2 = false;
        }
    }
}

lines = lines.filter(l => l !== 'DELETE_ME');

fs.writeFileSync('src/context/LanguageContext.js', lines.join('\n'), 'utf8');
console.log('Fixed LanguageContext.js');
