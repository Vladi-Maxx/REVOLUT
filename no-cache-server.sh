#!/bin/bash
echo "Стартиране на сървър с No-Cache заглавия..."
cd /Users/vladi/Documents/REVOLUT
python -m http.server 8000 &
echo "Сървърът е стартиран на порт 8000"
