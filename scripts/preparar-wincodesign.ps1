# Prepara la cache de winCodeSign de electron-builder en Windows sin requerir
# privilegios de administrador ni Modo de desarrollador.
#
# Problema: electron-builder extrae winCodeSign-2.6.0.7z, que contiene enlaces
# simbolicos de macOS (carpeta darwin). Crear symlinks en Windows exige un
# privilegio especial; sin el, la extraccion falla y el empaquetado se detiene.
#
# Solucion: extraer el .7z excluyendo la carpeta darwin (solo se usa para firmar
# en macOS, innecesaria para construir el .exe de Windows) en la carpeta final
# que espera electron-builder, para que no intente re-extraerlo.
#
# Uso:
#   1) npm run build            (compila a out/)
#   2) npx electron-builder --win   (fallara extrayendo winCodeSign: es normal)
#   3) powershell -ExecutionPolicy Bypass -File scripts\preparar-wincodesign.ps1
#   4) npm run build:win        (ahora si empaqueta el .exe portable)

$ErrorActionPreference = 'Stop'
$cache = Join-Path $env:LOCALAPPDATA 'electron-builder\Cache\winCodeSign'
$dest = Join-Path $cache 'winCodeSign-2.6.0'
$z = Join-Path $PSScriptRoot '..\node_modules\7zip-bin\win\x64\7za.exe'

if (-not (Test-Path $z)) {
  Write-Error "No se encontro 7za.exe. Ejecute 'npm install' primero."
}

$src = Get-ChildItem (Join-Path $cache '*.7z') -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $src) {
  Write-Error "No hay winCodeSign .7z en cache. Ejecute 'npx electron-builder --win' una vez (fallara) y vuelva a intentar."
}

if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
& $z x "$($src.FullName)" "-o$dest" "-xr!darwin" -y | Out-Null

Write-Output "winCodeSign preparado en: $dest"
Write-Output "Ahora ejecute: npm run build:win"
