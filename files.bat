@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo Génération de la liste des fichiers et dossiers...
echo.

REM Définir le chemin source
set "chemin_source=C:\Users\Rodul\Desktop\rdgestion\rdgestion-beta"

REM Définir le fichier de sortie
set "fichier_sortie=liste_fichiers_%date:~6,4%%date:~3,2%%date:~0,2%.txt"

REM Vérifier si le chemin existe
if not exist "%chemin_source%" (
    echo ERREUR: Le chemin source n'existe pas!
    echo Chemin: %chemin_source%
    pause
    exit /b 1
)

echo Chemin analysé: %chemin_source%
echo Fichier de sortie: %fichier_sortie%
echo.

REM Créer l'en-tête du fichier
echo =========================================== > "%fichier_sortie%"
echo LISTE DES FICHIERS ET DOSSIERS >> "%fichier_sortie%"
echo =========================================== >> "%fichier_sortie%"
echo Chemin: %chemin_source% >> "%fichier_sortie%"
echo Date: %date% %time% >> "%fichier_sortie%"
echo. >> "%fichier_sortie%"

REM Générer la liste avec tree
echo Génération de l'arborescence...
echo ARBORESCENCE COMPLETE: >> "%fichier_sortie%"
echo ---------------------- >> "%fichier_sortie%"
tree "%chemin_source%" /F /A >> "%fichier_sortie%"
echo. >> "%fichier_sortie%"

REM Générer la liste plate avec dir
echo LISTE PLATE DES FICHIERS: >> "%fichier_sortie%"
echo ------------------------- >> "%fichier_sortie%"
dir "%chemin_source%" /B /S /A-D >> "%fichier_sortie%"
echo. >> "%fichier_sortie%"

REM Compter les fichiers et dossiers
echo COMPTAGE: >> "%fichier_sortie%"
echo --------- >> "%fichier_sortie%"

REM Compter les dossiers
set "nb_dossiers=0"
for /f "delims=" %%d in ('dir "%chemin_source%" /AD /B /S 2^>nul') do (
    set /a nb_dossiers+=1
)

REM Compter les fichiers
set "nb_fichiers=0"
for /f "delims=" %%f in ('dir "%chemin_source%" /A-D /B /S 2^>nul') do (
    set /a nb_fichiers+=1
)

echo Dossiers: !nb_dossiers! >> "%fichier_sortie%"
echo Fichiers: !nb_fichiers! >> "%fichier_sortie%"
echo Total: !nb_dossiers! dossiers + !nb_fichiers! fichiers >> "%fichier_sortie%"
echo. >> "%fichier_sortie%"

REM Lister les types de fichiers
echo EXTENSIONS DE FICHIERS: >> "%fichier_sortie%"
echo ---------------------- >> "%fichier_sortie%"
for /f "tokens=*" %%f in ('dir "%chemin_source%" /A-D /B /S 2^>nul') do (
    for %%e in ("%%f") do (
        if not "%%~xf"=="" (
            echo %%~xf
        )
    )
) | sort | uniq -c | sort /R >> "%fichier_sortie%" 2>nul

if errorlevel 1 (
    echo (Fonction de tri non disponible, liste brute:) >> "%fichier_sortie%"
    echo. >> "%fichier_sortie%"
    for /f "tokens=*" %%f in ('dir "%chemin_source%" /A-D /B /S 2^>nul') do (
        for %%e in ("%%f") do (
            if not "%%~xf"=="" (
                echo %%~xf >> "%fichier_sortie%"
            )
        )
    )
)

echo. >> "%fichier_sortie%"
echo =========================================== >> "%fichier_sortie%"
echo Génération terminée à %time% >> "%fichier_sortie%"
echo =========================================== >> "%fichier_sortie%"

echo.
echo Liste générée avec succès!
echo Fichier créé: %fichier_sortie%
echo.
echo Contenu du fichier:
echo -------------------
type "%fichier_sortie%"

echo.
echo Appuyez sur une touche pour ouvrir le fichier...
pause > nul

REM Ouvrir le fichier avec l'éditeur par défaut
start "" "%fichier_sortie%"

endlocal