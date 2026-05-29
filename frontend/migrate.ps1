$paths = @("d:\Project\Test-App\frontend\app\api", "d:\Project\Test-App\frontend\lib")
foreach ($path in $paths) {
    Get-ChildItem -LiteralPath $path -Recurse -Filter "*.ts" | ForEach-Object {
        $content = [IO.File]::ReadAllText($_.FullName)
        $newContent = $content -replace "import \{ neon \} from '@neondatabase/serverless'", "import postgres from 'postgres'"
        $newContent = $newContent -replace "return neon\(databaseUrl\)", "return postgres(databaseUrl)"
        $newContent = $newContent -replace "let sql: ReturnType<typeof neon> \| null = null", "let sql: ReturnType<typeof postgres> | null = null"
        $newContent = $newContent -replace "sql = neon\(databaseUrl\)", "sql = postgres(databaseUrl)"
        
        if ($content -cne $newContent) {
            Write-Host "Updated $($_.FullName)"
            [IO.File]::WriteAllText($_.FullName, $newContent)
        }
    }
}
