#!/bin/bash
printf "Google Client IDを入力してください (typing hidden): "
read -s client_id
if [ -n "$client_id" ]; then
  echo "VITE_GOOGLE_CLIENT_ID=$client_id" >> ~/.env
  echo "VITE_GOOGLE_CLIENT_ID=$client_id" >> .env
  echo "SUCCESS: Saved to .env"
else
  echo "Empty input."
fi
