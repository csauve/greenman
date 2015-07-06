stage=$1

case $stage in
  pre )
    pm2 greenbot stop
    ;;
  deploy )
    git pull
    npm install
    npm update
    ;;
  post )
    pm2 start node_modules/greenbot/bin/greenbot.js --node-args "modacity.cson"
    ;;
esac
