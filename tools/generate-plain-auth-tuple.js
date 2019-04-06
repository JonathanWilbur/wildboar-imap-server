const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Username? ', (username) => {
    rl.question('Password? ', (password) => {
        console.log((Buffer.from(`${username}\x00${username}\x00${password}`)).toString("base64"));
        rl.close();
    });
});

