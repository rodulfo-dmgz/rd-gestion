@echo off
chcp 65001 > nul
echo Création de l'arborescence CRM Pédagogique...
echo.

:: Créer les dossiers principaux
mkdir crm-pedagogique
cd crm-pedagogique

mkdir modules
mkdir css
mkdir js
mkdir data
mkdir assets

:: Créer les fichiers HTML racine
type nul > index.html
type nul > dashboard.html

:: Créer les fichiers HTML dans modules
cd modules
type nul > clients.html
type nul > produits.html
type nul > ventes.html
type nul > planning.html
cd ..

:: Créer les fichiers CSS
cd css
type nul > main.css
type nul > theme.css
cd ..

:: Créer les fichiers JavaScript
cd js
type nul > app.js
type nul > auth.js
type nul > data.js
type nul > kpi.js
type nul > ui.js
cd ..

:: Créer les fichiers de données
cd data
type nul > db.json
type nul > utilisateurs.json
cd ..

:: Message de confirmation
echo.
echo Arborescence créée avec succès !
echo.
echo Structure créée :
echo crm-pedagogique/
echo ├── index.html
echo ├── dashboard.html
echo ├── modules/
echo │   ├── clients.html
echo │   ├── produits.html
echo │   ├── ventes.html
echo │   └── planning.html
echo ├── css/
echo │   ├── main.css
echo │   └── theme.css
echo ├── js/
echo │   ├── app.js
echo │   ├── auth.js
echo │   ├── data.js
echo │   ├── kpi.js
echo │   └── ui.js
echo ├── data/
echo │   ├── db.json
echo │   └── utilisateurs.json
echo └── assets/
echo.
echo Tous les fichiers ont été créés avec succès !
pause