#!/bin/sh

set -e

host="$1"
port="$2"
password="$3"

echo "Waiting for Redis to be fully healthy on $host:$port..."

# Le script attend que le client redis-cli réussisse à se connecter et à s'authentifier
until redis-cli -h "$host" -p "$port" -a "$password" ping 2>/dev/null; do
  >&2 echo "Redis is unavailable - sleeping"
  sleep 2
done

>&2 echo "Redis is up and running! Starting application..."

# LANCER L'APPLICATION SPRING BOOT
# Utiliser exec pour transférer le PID et les signaux au processus Java
exec java -jar /app/app.jar # <-- This line will start the Spring Boot app
