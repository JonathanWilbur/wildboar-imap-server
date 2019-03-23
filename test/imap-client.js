const ImapClient = require("emailjs-imap-client").default;
const client = new ImapClient("localhost", 143, {
    logLevel: "info",
    ignoreTLS: true,
    auth: {
        user: "jonathan",
        pass: "bigboi"
    }
});

client.connect()
.then(() => {
    // client.listMailboxes().then((mailboxes) => {
    //     console.log(mailboxes);
    // });

    // client.createMailbox("bigboi")
    // .then(() => {
    //     console.log("Done!");
    // });

    client.selectMailbox('Bigboi').then((mailbox) => {
        console.log(mailbox);
    });

    // client.listMessages('INBOX', '1:10', ['uid', 'flags', 'body[]']).then((messages) => {
    //     messages.forEach((message) => console.log('Flags for ' + message.uid + ': ' + message.flags.join(', ')));
    // });

    // client.search('INBOX', {unseen: true}, {byUid: true}).then((result) => {
    //     result.forEach((uid) => console.log('Message ' + uid + ' is unread'));
    // });

    // client.setFlags('INBOX', '1:10', {set: ['\\Seen']}).then((messages) => {
    //     console.log(messages);
    // });

    // client.store('INBOX', '1:*', '+X-GM-LABELS', ['\\Sent']).then((messages) => {
    //     console.log(messages);
    // });

    // client.deleteMessages('INBOX', '1:5').then(() => {
    //     console.log("YEETUS DELETUS");
    // });

    // client.copyMessages('INBOX', '1:5', '[Gmail]/Trash').then(() => {
    //     console.log("INTELLECTUAL PROPERTY: VIOLATED.");
    // });

    // client.moveMessages('INBOX', '1:5', '[Gmail]/Trash').then(() => {
    //     console.log("Moved messages.");
    // });
});