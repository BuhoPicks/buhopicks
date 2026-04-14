$ws = New-Object -ComObject WScript.Shell
$desktop = [Environment]::GetFolderPath('Desktop')
$s = $ws.CreateShortcut("$desktop\BH Analysis.lnk")
$s.TargetPath = 'C:\Users\brand\.gemini\antigravity\scratch\sports-picks\Iniciar BH Analysis.bat'
$s.WorkingDirectory = 'C:\Users\brand\.gemini\antigravity\scratch\sports-picks'
$s.Description = 'Iniciar BH Analysis'
$s.Save()
Write-Host "Acceso directo creado en el escritorio!"
