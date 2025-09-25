#!/bin/bash

# Attendez que le fichier de configuration de Kafka soit généré par l'entrypoint par défaut du conteneur
until [ -f /etc/kafka/config/server.properties ]; do
  echo "En attente du fichier server.properties de Kafka..."
  sleep 1
done

# Formatez les répertoires de logs, en ignorant si déjà formatés
echo "Formatage des répertoires de logs de Kafka..."
kafka-storage format --ignore-formatted --cluster-id=$KAFKA_CLUSTER_ID --config /etc/kafka/config/server.properties

# Exécutez la commande d'entrée par défaut pour démarrer le serveur Kafka
exec /etc/confluent/docker/run
