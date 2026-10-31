# ============================================================
#  一键更新：构建 → 提交 → 推送 → GitHub Pages 自动发布
#  用法：在 blog 目录里执行  .\deploy.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

# ---- 本机相关配置（换电脑改这两行） ----
$ghPath    = Join-Path (Split-Path $root -Parent) "tools\gh\bin\gh.exe"
$ghConfig  = Join-Path (Split-Path $root -Parent) ".gh"
$proxy     = "http://127.0.0.1:62131"
# --------------------------------------

Write-Host "1/3 构建 …" -ForegroundColor Cyan
node build.mjs

Write-Host "2/3 提交 …" -ForegroundColor Cyan
git add -A
$changed = git status --porcelain
if ($changed) {
    $msg = "更新站点 " + (Get-Date -Format "yyyy-MM-dd HH:mm")
    git -c user.name="blog" -c user.email="blog@local" commit -q -m $msg
    Write-Host "   已提交：$msg" -ForegroundColor DarkGray
} else {
    Write-Host "   没有变化，跳过提交" -ForegroundColor DarkGray
}

Write-Host "3/3 推送 …" -ForegroundColor Cyan
$env:GH_CONFIG_DIR = $ghConfig
$token = & $ghPath auth token
$basic = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("x-access-token:$token"))
git -c http.extraheader="AUTHORIZATION: basic $basic" `
    -c http.proxy=$proxy `
    -c http.sslBackend=openssl `
    push -q origin main

Write-Host "`n✓ 已推送。GitHub Pages 大约 30 秒后更新：" -ForegroundColor Green
Write-Host "  https://gfq960906.github.io/blog/" -ForegroundColor Green
exit 0
