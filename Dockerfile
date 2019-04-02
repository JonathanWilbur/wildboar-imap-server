FROM node:11.7.0-alpine
LABEL author "Jonathan M. Wilbur <jonathan@wilbur.space>"
COPY ./dist /srv
WORKDIR /srv
CMD [ "/usr/local/bin/node", "/srv/dist/index.js" ]