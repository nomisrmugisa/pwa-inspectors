# Fix the FormPage.jsx to always generate new IDs instead of restoring drafts

$filePath = "src/pages/FormPage.jsx"
$content = Get-Content $filePath -Raw

# Replace the old logic with the new simplified logic
$oldCode = @"
    useEffect(() => {
      const initializeEventId = async () => {
        if (!eventId) {
          try {
            // Check for most recent draft form data
            const mostRecent = await indexedDBService.getMostRecentFormData();
            
            if (mostRecent && mostRecent.eventId) {
              console.log('📋 Found most recent draft, restoring eventId:', mostRecent.eventId);
              // Navigate to existing draft instead of creating new one
              navigate(`/form/${mostRecent.eventId}`, { replace: true });
            } else {
              // No existing draft found, generate new eventId
              const generatedId = generateDHIS2Id();
              console.log('🆕 No existing draft found, generating new eventId:', generatedId);
              navigate(`/form/${generatedId}`, { replace: true });
            }
          } catch (error) {
            console.error('❌ Error checking for existing drafts:', error);
            // On error, generate new eventId as fallback
            const generatedId = generateDHIS2Id();
            navigate(`/form/${generatedId}`, { replace: true });
          }
        }
      };

      initializeEventId();
    }, [eventId, navigate]);
"@

$newCode = @"
    useEffect(() => {
      const initializeEventId = async () => {
        if (!eventId) {
          // Always generate a new eventId for new forms
          // Users can continue old drafts by selecting them from the dashboard
          const generatedId = generateDHIS2Id();
          console.log('🆕 Generating new eventId for new form:', generatedId);
          navigate(`/form/${generatedId}`, { replace: true });
        }
      };

      initializeEventId();
    }, [eventId, navigate]);
"@

$newContent = $content.Replace($oldCode, $newCode)

if ($newContent -eq $content) {
    Write-Host "❌ No changes made - pattern not found!" -ForegroundColor Red
    Write-Host "The code may have already been modified or the pattern doesn't match exactly." -ForegroundColor Yellow
} else {
    Set-Content $filePath $newContent -NoNewline
    Write-Host "✅ Successfully updated FormPage.jsx!" -ForegroundColor Green
    Write-Host "The app will now always create fresh inspections instead of restoring drafts." -ForegroundColor Cyan
}
