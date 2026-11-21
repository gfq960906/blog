# 一键发布学习笔记。在博客目录中运行 .\deploy.ps1，或双击 deploy.cmd。
$ErrorActionPreference = 'Stop'

function Confirm-CommandSuccess([string] $operation) {
    if ($LASTEXITCODE -ne 0) {
        throw "$operation 失败（退出码 $LASTEXITCODE）。"
    }
}

Push-Location -LiteralPath $PSScriptRoot
$originalGhConfig = $env:GH_CONFIG_DIR
try {
    $branch = git symbolic-ref --quiet --short HEAD
    Confirm-CommandSuccess '读取当前分支'
    if ($branch -ne 'main') {
        throw "当前分支为 $branch。请先将要发布的笔记合入 main，再从 main 运行此脚本。"
    }

    Write-Host '1/3 构建网站…' -ForegroundColor Cyan
    node build.mjs
    Confirm-CommandSuccess '构建网站'

    Write-Host '2/3 提交改动…' -ForegroundColor Cyan
    git add -A
    Confirm-CommandSuccess '暂存改动'
    $changes = git status --porcelain
    Confirm-CommandSuccess '检查改动'
    if ($changes) {
        $message = '更新站点 ' + (Get-Date -Format 'yyyy-MM-dd HH:mm')
        git -c user.name=blog -c user.email=blog@local commit -m $message
        Confirm-CommandSuccess '提交改动'
    } else {
        Write-Host '工作区已是最新，跳过提交。' -ForegroundColor DarkGray
    }

    Write-Host '3/3 推送到 origin/main…' -ForegroundColor Cyan
    $gitOptions = @()
    $parentDirectory = Split-Path -Parent $PSScriptRoot
    $ghExecutable = Join-Path $parentDirectory 'tools\gh\bin\gh.exe'
    $ghConfig = Join-Path $parentDirectory '.gh'
    if ((Test-Path -LiteralPath $ghExecutable -PathType Leaf) -and
        (Test-Path -LiteralPath $ghConfig -PathType Container)) {
        # Git 在 shell 中调用 helper；为可能带空格或单引号的路径加引号。
        $helperPath = $ghExecutable.Replace('\', '/').Replace("'", "'\''")
        $gitOptions = @(
            '-c', 'credential.https://github.com.helper=',
            '-c', "credential.https://github.com.helper=!'$helperPath' auth git-credential"
        )
        $env:GH_CONFIG_DIR = $ghConfig
    }

    git @gitOptions push origin main
    Confirm-CommandSuccess '推送到 origin/main'
    Write-Host '已推送到 origin/main。可在 GitHub 查看 Pages 部署进度。' -ForegroundColor Green
} catch {
    [Console]::Error.WriteLine($_.Exception.Message)
    exit 1
} finally {
    $env:GH_CONFIG_DIR = $originalGhConfig
    Pop-Location
}
exit 0
