stage=$1

case $stage in
  pre )
    pm2 stop greenbot
    ;;
  deploy )
    git pull
    rm -r node_modules
    npm install
    ;;
  post )
    pm2 start node_modules/greenbot/bin/greenbot.js --node-args "modacity.cson"
    ;;
esac
