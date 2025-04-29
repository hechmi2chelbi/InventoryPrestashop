#!/bin/bash

# Script de construction du module PrestaShop PrestaSynch
# Ce script génère une archive ZIP du module prête à être installée dans PrestaShop

echo "Début de la création du module PrestaShop..."

# Variables
MODULE_NAME="prestasynch"
VERSION="1.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXPORT_DIR="${SCRIPT_DIR}/export"
OUTPUT_FILE="${EXPORT_DIR}/${MODULE_NAME}.zip"
TEMP_DIR="${EXPORT_DIR}/temp"

# Créer le répertoire d'export
mkdir -p "${EXPORT_DIR}"

echo "Répertoire de script: $SCRIPT_DIR"
echo "Répertoire d'export: $EXPORT_DIR"
echo "Fichier de sortie: $OUTPUT_FILE"

# Vérifier que le répertoire du module existe
if [ ! -d "${SCRIPT_DIR}/${MODULE_NAME}" ]; then
  echo "Erreur: Le répertoire du module '${SCRIPT_DIR}/${MODULE_NAME}' n'existe pas."
  exit 1
fi

# Nettoyer les fichiers existants
echo "Nettoyage des fichiers existants..."
rm -f "$OUTPUT_FILE" # Supprimer l'archive existante si elle existe
rm -rf "${TEMP_DIR}" # Supprimer le répertoire temporaire s'il existe
mkdir -p "${TEMP_DIR}/${MODULE_NAME}" # Recréer le répertoire temporaire

# Copier les fichiers du module dans le répertoire temporaire avec la structure de dossier correcte
echo "Copie des fichiers du module..."
cp -R "${SCRIPT_DIR}/${MODULE_NAME}/"* "${TEMP_DIR}/${MODULE_NAME}/"

# Créer l'archive ZIP
echo "Création de l'archive ZIP avec un dossier parent..."
cd "${TEMP_DIR}"
zip -r "$OUTPUT_FILE" "${MODULE_NAME}"

# Vérifier si la création de l'archive a réussi
if [ $? -eq 0 ]; then
  echo "Archive créée avec succès: $OUTPUT_FILE"
  # Créer également une version avec numéro de version
  cp "$OUTPUT_FILE" "${EXPORT_DIR}/${MODULE_NAME}-${VERSION}.zip"
  echo "Fichier final: ${EXPORT_DIR}/${MODULE_NAME}-${VERSION}.zip"
  # Créer un lien symbolique dans le répertoire parent (pour la retrocompatibilité)
  ln -sf "${OUTPUT_FILE}" "${SCRIPT_DIR}/${MODULE_NAME}.zip"
  ln -sf "${EXPORT_DIR}/${MODULE_NAME}-${VERSION}.zip" "${SCRIPT_DIR}/${MODULE_NAME}-${VERSION}.zip"
  # Afficher les fichiers créés
  ls -la "${EXPORT_DIR}"/*.zip
  # Nettoyage du répertoire temporaire
  rm -rf "${TEMP_DIR}"
else
  echo "Erreur lors de la création de l'archive."
  # Nettoyage du répertoire temporaire même en cas d'erreur
  rm -rf "${TEMP_DIR}"
  exit 1
fi

echo "Construction du module terminée."
exit 0