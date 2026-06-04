const fs = require('fs');

// Fix signup page select options
let signupFile = 'd:/Project/Test-App/frontend/app/signup/page.tsx';
let signupContent = fs.readFileSync(signupFile, 'utf8');
signupContent = signupContent.replace(/value="student">Student/g, 'value="user">User');
signupContent = signupContent.replace(/value="teacher">Teacher/g, 'value="admin">Admin');
fs.writeFileSync(signupFile, signupContent);

// Fix admin users page
let adminUsersFile = 'd:/Project/Test-App/frontend/app/admin/users/page.tsx';
let adminUsersContent = fs.readFileSync(adminUsersFile, 'utf8');
adminUsersContent = adminUsersContent.replace(/teachers/g, 'admins');
adminUsersContent = adminUsersContent.replace(/Teachers/g, 'Admins');
adminUsersContent = adminUsersContent.replace(/students/g, 'users');
adminUsersContent = adminUsersContent.replace(/Students/g, 'Users');
adminUsersContent = adminUsersContent.replace(/'teacher'/g, "'admin'");
adminUsersContent = adminUsersContent.replace(/'student'/g, "'user'");
adminUsersContent = adminUsersContent.replace(/teacher@demo\.com/g, 'creator@demo.com');
adminUsersContent = adminUsersContent.replace(/Teacher Demo/g, 'Creator Demo');
adminUsersContent = adminUsersContent.replace(/Student Demo/g, 'User Demo');
fs.writeFileSync(adminUsersFile, adminUsersContent);

// Fix dashboard page texts
let dashboardFile = 'd:/Project/Test-App/frontend/app/dashboard/page.tsx';
let dashboardContent = fs.readFileSync(dashboardFile, 'utf8');
dashboardContent = dashboardContent.replace(/Teacher Panel/g, 'Admin Panel');
fs.writeFileSync(dashboardFile, dashboardContent);

// Fix exams pages
let examsSubFile = 'd:/Project/Test-App/frontend/app/exams/[id]/submissions/page.tsx';
let examsSubContent = fs.readFileSync(examsSubFile, 'utf8');
examsSubContent = examsSubContent.replace(/teacher/ig, 'admin');
fs.writeFileSync(examsSubFile, examsSubContent);

let examsQFile = 'd:/Project/Test-App/frontend/app/exams/[id]/questions/page.tsx';
let examsQContent = fs.readFileSync(examsQFile, 'utf8');
examsQContent = examsQContent.replace(/Teacher will grade manually/g, 'Admin will grade manually');
fs.writeFileSync(examsQFile, examsQContent);

let examsPageFile = 'd:/Project/Test-App/frontend/app/exams/page.tsx';
let examsPageContent = fs.readFileSync(examsPageFile, 'utf8');
examsPageContent = examsPageContent.replace(/admin\/teacher/g, 'admin');
examsPageContent = examsPageContent.replace(/Admin\/Teacher/g, 'Admin');
fs.writeFileSync(examsPageFile, examsPageContent);

console.log('Fixed UI texts');
