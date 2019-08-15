# Blacklisting

Client blacklisting should be done by an external device. This IMAP server will
only disconnect clients, but not block their IP addresses. The errors will be
logged in such a way that an external application will be able to read them and
apply appropriate firewall rules.