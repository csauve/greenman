stage=$1

case $stage in
  pre )
    forever stop node_modules/greenbot/bin/greenbot.js
    ;;
  deploy )
    git pull
    rm -r node_modules
    npm install
    ;;
  post )
    forever start node_modules/greenbot/bin/greenbot.js modacity.cson
    ;;
esac
