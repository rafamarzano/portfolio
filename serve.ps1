$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8098/")
$listener.Start()
Write-Output "Servidor rodando em http://localhost:8098/"

$mimeMap = @{
  ".html" = "text/html; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".sql"  = "text/plain; charset=utf-8"
  ".md"   = "text/plain; charset=utf-8"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $path = $ctx.Request.Url.LocalPath.TrimStart('/')
  if ($path -eq "") { $path = "index.html" }
  $full = Join-Path $PSScriptRoot $path
  if (Test-Path $full -PathType Leaf) {
    $bytes = [System.IO.File]::ReadAllBytes($full)
    $ext = [System.IO.Path]::GetExtension($full)
    if ($mimeMap.ContainsKey($ext)) { $ctx.Response.ContentType = $mimeMap[$ext] }
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $ctx.Response.StatusCode = 404
  }
  $ctx.Response.OutputStream.Close()
}
