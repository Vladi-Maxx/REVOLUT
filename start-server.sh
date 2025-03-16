#!/bin/bash

# Проверка дали Python е инсталиран
if command -v python3 &>/dev/null; then
    echo "Стартиране на сървър с Python 3..."
    python3 -m http.server
elif command -v python &>/dev/null; then
    echo "Стартиране на сървър с Python..."
    python -m SimpleHTTPServer
else
    echo "Python не е намерен. Моля, инсталирайте Python или използвайте друг метод за стартиране на локален сървър."
    exit 1
fi
