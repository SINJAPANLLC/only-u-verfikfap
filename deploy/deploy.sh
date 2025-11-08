#!/bin/bash
set -e

apt update -y
apt install -y nodejs npm nginx certbot python3-certbot-nginx
npm install -g pm2
npm install
npm run build
pm2 start npm --name "onlyu" -- start
cp ./deploy/onlyu.nginx.conf /etc/nginx/sites-available/onlyu
ln -sf /etc/nginx/sites-available/onlyu /etc/nginx/sites-enabled/onlyu
nginx -t && systemctl restart nginx
certbot --nginx -d onlyu.jp --non-interactive --agree-tos -m admin@onlyu.jp

echo "✅ Deployed: https://onlyu.jp"
