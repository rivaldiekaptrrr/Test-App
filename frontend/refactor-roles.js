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
            
            // Replace role array checks
            if (content.includes("['admin', 'teacher', 'hr'].includes(user.role)")) {
                content = content.replace(/\['admin', 'teacher', 'hr'\].includes\(user.role\)/g, "user.role === 'admin'");
                modified = true;
            }
            if (content.includes("['admin', 'teacher'].includes(userRole)")) {
                content = content.replace(/\['admin', 'teacher'\].includes\(userRole\)/g, "userRole === 'admin'");
                modified = true;
            }
            
            // Fix dashboard query
            if (content.includes("role = 'student'")) {
                content = content.replace(/role = 'student'/g, "role = 'user'");
                modified = true;
            }
            
            // Fix signup validation
            if (content.includes("const validRoles = ['student', 'teacher']")) {
                content = content.replace(/const validRoles = \['student', 'teacher'\]/g, "const validRoles = ['user', 'admin']");
                content = content.replace(/validRoles\.includes\(role\) \? role : 'student'/g, "validRoles.includes(role) ? role : 'user'");
                content = content.replace(/only allow student\/teacher/g, "only allow user/admin");
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log('Modified: ' + fullPath);
            }
        }
    }
}
replaceInDir('d:/Project/Test-App/frontend/app/api');
replaceInDir('d:/Project/Test-App/frontend/app/exams');
