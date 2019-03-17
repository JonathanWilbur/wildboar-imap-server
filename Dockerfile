FROM node:11.7.0-alpine
LABEL author "Jonathan M. Wilbur <jonathan@wilbur.space>"
RUN mkdir -p /srv/imap-server
WORKDIR /srv/imap-server
COPY . /srv/imap-server/
RUN chmod +x /srv/imap-server/entrypoint.sh
ENTRYPOINT [ "/srv/imap-server/entrypoint.sh" ]