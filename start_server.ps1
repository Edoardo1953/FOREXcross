$port = 8080
$folder = "C:\Users\Utilisateur\OneDrive\Desktop\Antigravity\FOREXcross_repo"
$url = "http://localhost:$port/"

# Ensure clean start
if ($null -ne $listener) {
    try { $listener.Stop() } catch {}
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)

try {
    $listener.Start()
} catch {
    Write-Host "Errore: Impossibile avviare il server. Forse la porta $port è occupata da un altro processo." -ForegroundColor Red
    Write-Host $_.Exception.Message
    Read-Host "Premi Invio per uscire..."
    exit
}

Write-Host "=========================================" -ForegroundColor Green
Write-Host "  SERVER LOCALE FOREXcross ATTIVO!      " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Indirizzo: http://localhost:$port/index.html" -ForegroundColor Cyan
Write-Host "Lascia questa finestra aperta mentre usi l'app."
Write-Host "Per chiudere il server, premi CTRL+C in questa finestra."
Write-Host "-----------------------------------------"

# Open browser automatically
Start-Process "http://localhost:$port/index.html"

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $rawPath = $request.Url.LocalPath
        if ($rawPath -eq "/") { $rawPath = "/index.html" }
        
        # Security check: resolve full path and prevent path traversal
        $filePath = [System.IO.Path]::GetFullPath((Join-Path $folder $rawPath.TrimStart('/')))
        if (-not $filePath.StartsWith($folder, [System.StringComparison]::OrdinalIgnoreCase)) {
            $response.StatusCode = 403
            $response.OutputStream.Close()
            continue
        }

        if (Test-Path $filePath -PathType Leaf) {
            try {
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                
                $contentType = switch ($ext) {
                    ".html" { "text/html; charset=utf-8" }
                    ".css" { "text/css" }
                    ".js" { "application/javascript" }
                    ".png" { "image/png" }
                    ".ico" { "image/x-icon" }
                    ".json" { "application/json" }
                    default { "application/octet-stream" }
                }
                
                $response.ContentType = $contentType
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } catch {
                $response.StatusCode = 500
            }
        } else {
            $response.StatusCode = 404
        }
        $response.OutputStream.Close()
    }
} finally {
    $listener.Stop()
}
