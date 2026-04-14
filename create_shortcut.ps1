$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [System.IO.Path]::Combine($env:USERPROFILE, "OneDrive", "Escritorio")
if (-not (Test-Path $DesktopPath)) { $DesktopPath = [System.IO.Path]::Combine($env:USERPROFILE, "Desktop") }

# Main Shortcut
$MainPath = [System.IO.Path]::Combine($DesktopPath, "BH Analysis.lnk")
$Main = $WshShell.CreateShortcut($MainPath)
$Main.TargetPath = "C:\Users\brand\.gemini\antigravity\scratch\sports-picks\Lanzar_BH_Analysis.bat"
$Main.IconLocation = "C:\Windows\System32\shell32.dll,14"
$Main.Save()

# Tennis Shortcut
$TennisPath = [System.IO.Path]::Combine($DesktopPath, "BH Tenis.lnk")
$Tennis = $WshShell.CreateShortcut($TennisPath)
$Tennis.TargetPath = "C:\Users\brand\.gemini\antigravity\scratch\sports-picks\Lanzar_BH_Analysis.bat"
$Tennis.IconLocation = "C:\Windows\System32\shell32.dll,41"
$Tennis.Save()

# Football Shortcut
$FootballPath = [System.IO.Path]::Combine($DesktopPath, "BH Futbol.lnk")
$Football = $WshShell.CreateShortcut($FootballPath)
$Football.TargetPath = "C:\Users\brand\.gemini\antigravity\scratch\sports-picks\Lanzar_BH_Analysis.bat"
$Football.IconLocation = "C:\Windows\System32\shell32.dll,273"
$Football.Save()

# Delete the old generic one
$OldPath = [System.IO.Path]::Combine($DesktopPath, "BH Analysis.lnk")
if (Test-Path $OldPath) { Remove-Item $OldPath }

Write-Host "✅ Accesos directos separados creados en el escritorio."
