const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log("WARNING: The password you type below will be displayed on screen.");
rl.question('What do you want your password to be? ', (answer) => {
    crypto.pbkdf2(answer, "PRESS_F_TO_PAY_RESPECCS", 100000, 64, 'sha512', (err, derivedKey) => {
        if (err) throw err;
        // I know this is ugly, but I do it so I do not have to worry about
        // newline differences between systems.
        console.log("Your salted and hashed password is:");
        console.log(derivedKey.toString('hex'));
        console.log("");
        rl.close();
    });
});


