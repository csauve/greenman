FROM node

RUN mkdir -p /usr/local/greenman
WORKDIR /usr/local/greenman
COPY . .
RUN npm ci

CMD ["node", "bot.js"]
