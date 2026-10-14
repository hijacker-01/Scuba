param(
    [ValidateSet('dev', 'build', 'start', 'typecheck', 'lint', 'test', 'test:e2e')]
    [string]$Task = 'dev'
)

$ErrorActionPreference = 'Stop'
$runtime = Join-Path $env:USERPROFILE '.codex/runtimes/node-v22.23.3-win-x64'
if (!(Test-Path -LiteralPath (Join-Path $runtime 'npm.cmd'))) {
    throw 'The Node.js 22 runtime is missing. Install Node.js 22 or update this launcher runtime path.'
}
$env:PATH = "$runtime;$env:PATH"
Set-Location -LiteralPath $PSScriptRoot
if ($Task -eq 'dev' -and (Test-Path -LiteralPath '.codex/local/connection.json') -and (Get-Content -Raw -LiteralPath '.env.local') -match 'MONGODB_URI=mongodb://127.0.0.1:27019/') {
    $dbConnection = [System.Net.Sockets.TcpClient]::new()
    try { $dbConnection.Connect('127.0.0.1', 27019); $localDatabaseReady = $true } catch { $localDatabaseReady = $false } finally { $dbConnection.Dispose() }
    if (!$localDatabaseReady) {
        Start-Process -FilePath (Join-Path $runtime 'node.exe') -ArgumentList 'scripts/start-local-db.mjs' -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $PSScriptRoot '.codex/local/database.log') -RedirectStandardError (Join-Path $PSScriptRoot '.codex/local/database-error.log')
        for ($attempt = 0; $attempt -lt 20; $attempt++) {
            Start-Sleep -Milliseconds 500
            $probe = [System.Net.Sockets.TcpClient]::new()
            try { $probe.Connect('127.0.0.1', 27019); $localDatabaseReady = $true } catch { } finally { $probe.Dispose() }
            if ($localDatabaseReady) { break }
        }
        if (!$localDatabaseReady) { throw 'Local database did not start. Check .codex/local/database-error.log.' }
    }
}
& (Join-Path $runtime 'npm.cmd') run $Task
exit $LASTEXITCODE
