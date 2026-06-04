const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            
            if (content.includes("!user.role === 'admin'")) {
                content = content.replace(/!user\.role === 'admin'/g, "user.role !== 'admin'");
                modified = true;
            }
            if (content.includes("Only teachers can create exams")) {
                content = content.replace(/Only teachers can create exams/g, "Only admins can manage exams");
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed syntax error in: ' + fullPath);
            }
        }
    }
}
replaceInDir('d:/Project/Test-App/frontend/app/api');
