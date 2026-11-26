# Regenera las evidencias de docs/06-validacion-calidad en esta laptop (entorno de prueba).
# Requisito: Docker Desktop abierto y los contenedores levantados (cd tecnologia; docker compose up -d).
# Uso (desde la raiz del repositorio):  powershell -ExecutionPolicy Bypass -File tecnologia\pruebas-calidad\generar-evidencias.ps1

# La consola de Windows usa otra codificación: se fuerza UTF-8 para que tildes y símbolos se guarden bien.
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$env:FORCE_COLOR = '0'; $env:NO_COLOR = '1'

$raiz = (Resolve-Path "$PSScriptRoot\..\..").Path
$evid = Join-Path $raiz 'docs\06-validacion-calidad\evidencias'
$backend = Join-Path $raiz 'tecnologia\backend'
$inicio = Get-Date

function Paso($texto) { Write-Host "`n== $texto" -ForegroundColor Cyan }
function Resumen($archivo, $patron) {
  $linea = Select-String -Path $archivo -Pattern $patron | Select-Object -Last 1
  if ($linea) { Write-Host "   $($linea.Line.Trim())" -ForegroundColor Green } else { Write-Host "   Revisa $archivo" -ForegroundColor Yellow }
}

Paso '1/5 Base de datos de pruebas en el contenedor licencias-db'
docker exec licencias-db psql -U licencias -d licencias -c 'DROP DATABASE IF EXISTS licencias_test WITH (FORCE);' | Out-Null
docker exec licencias-db psql -U licencias -d licencias -c 'CREATE DATABASE licencias_test;' | Out-Null
$env:DB_HOST = 'localhost'; $env:DB_PUERTO = '5433'; $env:DB_USUARIO = 'licencias'; $env:DB_CLAVE = 'licencias'; $env:DB_NOMBRE_PRUEBAS = 'licencias_test'

Push-Location $backend
Paso '2/5 Pruebas unitarias con cobertura'
cmd /c "chcp 65001 >nul && npm run test:cov 2>&1" | Out-File -Encoding utf8 (Join-Path $evid '01-pruebas-unitarias-jest.txt')
Resumen (Join-Path $evid '01-pruebas-unitarias-jest.txt') '^Tests:'
Remove-Item -Recurse -Force (Join-Path $evid 'cobertura-jest') -ErrorAction SilentlyContinue
Copy-Item -Recurse (Join-Path $backend 'coverage\lcov-report') (Join-Path $evid 'cobertura-jest')

Paso '3/5 Pruebas de la API con PostgreSQL'
cmd /c "chcp 65001 >nul && npm run test:e2e 2>&1" | Out-File -Encoding utf8 (Join-Path $evid '02-pruebas-api-jest-supertest.txt')
Resumen (Join-Path $evid '02-pruebas-api-jest-supertest.txt') '^Tests:'

Paso '4/5 Reglas de arquitectura'
cmd /c "chcp 65001 >nul && npm run arquitectura 2>&1" | Out-File -Encoding utf8 (Join-Path $evid '03-reglas-arquitectura.txt')
Resumen (Join-Path $evid '03-reglas-arquitectura.txt') 'violations'
Pop-Location

Paso '5/5 Lucia con Gemini (promptfoo, EQ-08) contra la API de Docker'
Push-Location (Join-Path $raiz 'tecnologia\pruebas-calidad\promptfoo')
cmd /c "chcp 65001 >nul && node ejecutar.mjs 2>&1" | Out-File -Encoding utf8 (Join-Path $evid 'promptfoo\eq08-ejecucion.txt')
Resumen (Join-Path $evid 'promptfoo\eq08-ejecucion.txt') 'passed \('
Pop-Location

docker exec licencias-db psql -U licencias -d licencias -c 'DROP DATABASE IF EXISTS licencias_test WITH (FORCE);' | Out-Null
Write-Host "`nListo en $([int]((Get-Date) - $inicio).TotalSeconds) s. Evidencias en $evid" -ForegroundColor Cyan
