$paths = @("d:\Project\Test-App\README.md", "d:\Project\Test-App\docs", "d:\Project\Test-App\database")

foreach ($path in $paths) {
    if (Test-Path -Path $path -PathType Leaf) {
        $files = @(Get-Item -LiteralPath $path)
    } else {
        $files = Get-ChildItem -LiteralPath $path -Recurse -Include *.md, *.sql
    }

    foreach ($file in $files) {
        if ($file.Extension -match "\.(md|sql)$") {
            $content = [IO.File]::ReadAllText($file.FullName)
            $newContent = $content -replace "(?i)Neon\.tech", "Supabase.com"
            $newContent = $newContent -replace "(?i)Neon Console", "Supabase Dashboard"
            $newContent = $newContent -replace "(?i)Neon SQL Editor", "Supabase SQL Editor"
            $newContent = $newContent -replace "(?i)Neon", "Supabase"
            $newContent = $newContent -replace "https://console\.neon\.tech", "https://supabase.com/dashboard"
            $newContent = $newContent -replace "neondb_owner", "postgres"
            $newContent = $newContent -replace "neondb", "postgres"
            $newContent = $newContent -replace "ep-green-rain-[a-z0-9]+-pooler\.us-east-2\.aws\.neon\.tech", "aws-0-REGION.pooler.supabase.com:6543"
            
            # Special shields.io badge replace
            $newContent = $newContent -replace "badge/Supabase-PostgreSQL-00E599", "badge/Supabase-PostgreSQL-3ECF8E"
            
            if ($content -cne $newContent) {
                Write-Host "Updated $($file.FullName)"
                [IO.File]::WriteAllText($file.FullName, $newContent)
            }
        }
    }
}
