$dateStr = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = "D:\001. Yosafat\Project Iseng\Website Absen\backups"
$targetZip = Join-Path $backupDir "project_full_backup_$dateStr.zip"
$latestZip = Join-Path $backupDir "full_project_code_backup_latest.zip"

$exclude = @('node_modules', '.next', '.git', 'backups')
$items = Get-ChildItem -Path "D:\001. Yosafat\Project Iseng\Website Absen" | Where-Object { $exclude -notcontains $_.Name } | Select-Object -ExpandProperty FullName

Compress-Archive -Path $items -DestinationPath $targetZip -Force
Copy-Item -Path $targetZip -Destination $latestZip -Force

$sizeMb = [math]::Round(((Get-Item $targetZip).Length / 1MB), 2)
Write-Host "SUCCESS: $targetZip ($sizeMb MB)"
