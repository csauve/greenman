# Greenman

![](greenman.png)

An IRC bot for the #modacity community on GameSurge. There's a variety of features currently implemented:

* Dice rolls
* Quotes DB and Halo quotes
* Get titles for posted links
* Link shortening
* Web search
* Activity-based and scheduled message delivery
* Execute sandboxed JS

Greenman builds upon [node-irc](https://github.com/martynsmith/node-irc) with a message-handling chain architecture inspired by [express's middleware pattern](http://expressjs.com/).

## Running the Bot
Before running, you will need to copy `example.config.toml` to `config.toml` and make adjustments, including IRC client configuration and API keys. The bot runs in a [Docker](https://www.docker.com/) container which sets up all required dependencies. Once you've installed the [Docker Engine](https://docs.docker.com/engine/installation/):

```sh
docker build -t greeenman .
docker run greenman
# to debug: docker run -it greenman /bin/bash
```

Alternatively, the bot can be run without docker in the following manner:
```sh
npm install --no-optional
node greenman.js
```

## Plugin development
Features are divided into plugins which are initialized in order and register callbacks into the handler chain. Plugins should be kept in the `plugins` directory and registered in `greenman.js`, where config and the bot API can be passed in.

Here's usage of the bot API in an example plugin:

```js
module.exports = (config, bot) => {
  //initialize any dependencies using `config`...
  const apiClient = new ExampleClient(config.apiKey);

  /* Registers usage information for this plugin under the name "myplugin".
   * This is used by the built-in command "!help". Various colours and
   * named styles can be found under `bot.style`.
   */
  bot.help("myplugin", `${bot.style.em("!cmd <arg>")}: usage...`);

  /* Registers a filter into the message-handling chain.
   * If false is returned, subsequent handlers (including
   * from other plugins) will not be called.
   */
  bot.filter((ctx) => {
    /* The `ctx` object contains fields and functions related to
     * the context of the received message, such as `nick`, `channel`,
     * `message`, `say()`, and `reply()`.
     */
    return ctx.message.length <= 100;
  });

  /* Adds a handler to the chain which is final for matching
   * messages. The regular expression can also be passed as a
   * string. Capture groups are passed as the second callback
   * argument, while `ctx` gives access to further APIs within
   * the context of this message.
   */
  bot.match(/^!cmd\s+(.+)$/i, (ctx, captures)) => {
    /* The `reply` function sends a response in the same context the
     * message was received in. For example, private messages will
     * receive responses privately. For channels, the sender's nick
     * is added as a prefix to the reply in order to highlight the
     * message in their client.
     */
    ctx.reply(`Do something with ${captures[0]} from ${ctx.nick}`);
  };

  /* Deliver a message at any time -- useful for scheduled
   * messaging or broadcasts. Only `text` is required, and
   * omitting the other parameters alters the delivery mode.
   * For example, omitting channel will result in a PM.
   */
  bot.deliver({
    nick: "name",
    channel: "#channel",
    text: "message"
  });
};
```

Check out `lib/bot.js` or other plugins for more details.

## Deployment
You'll need the AWS command line tool installed and IAM rights to push to the image repository. After that, it can be pushed to an ECS repo:

```sh
#!/bin/sh
$(aws ecr get-login --region us-east-1 --no-include-email)
docker build -t greenman .
docker tag greenman:latest example.ecr.us-east-1.amazonaws.com/greenman:latest
docker push example.ecr.us-east-1.amazonaws.com/greenman:latest
```

## Todo / plugin ideas

* Logger
* Image describer
* MUD text adventure game
* Nick impersonator (e.g. RNN, markov chain)
* Identity module for user locales and aliases

## License
[MIT](http://opensource.org/licenses/mit-license.php)
