# gb-plugins-modacity
This repo implements the #modacity greenman bot, built on the [node-greenman](https://github.com/csauve/node-greenman) library.

## Running the Bot
Before running, you will need to copy `example.config.cson` to `config.cson` and make adjustments, including IRC client configuration and API keys. The bot runs in a [Docker](https://www.docker.com/) container which sets up all required dependencies. Once you've installed the [Docker Engine](https://docs.docker.com/engine/installation/):

```sh
docker build -t greeenman .
docker run greenman
# to debug: docker run -it greenman /bin/bash
```

Alternatively, the bot can be run without docker in the following manner:
```sh
npm install
npm install -g coffee-script
coffee bot.coffee
```

## Plugin development
Plugins should be kept in the `plugins` directory and registered in `plugins/index.coffee`. They can be implemented in either JavaScript or CoffeeScript, but will need to export the following object:

```js
module.exports = {
  // The plugin name that will be used for the !help <plugin> command
  name: "",
  // The text shown to users who call !help <plugin>
  help: function(config) {
    return "Usage: ...";
  },
  init: function(bot, config) {
    // Add listeners to the bot...
    //bot.msg(pattern, handler);
  }
}
```

Documentation for the `bot` can be found at [node-greenman](https://github.com/csauve/node-greenman). Any NPM dependencies required for plugins must be added to the project `package.json`:

```sh
npm install --save <dependency>
```

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
* Shared S3 code
* Logger
* Image describer
* MUD text adventure game
* Nick impersonator (e.g. RNN, markov chain)
* Identity module for user locales

## License
[MIT](http://opensource.org/licenses/mit-license.php)