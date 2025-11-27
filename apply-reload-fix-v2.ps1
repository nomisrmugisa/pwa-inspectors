# PowerShell script to update FormPage.jsx - Fix reload logic with 3s delay

$filePath = "src\pages\FormPage.jsx"
$content = Get-Content $filePath -Raw

# Define the old code block to find and replace
# This matches the original code in the restored file
$oldCode = @"
        const savedEvent = await saveEvent(eventData, saveDraft);

        setIsDraft(saveDraft);

        // Always navigate to dashboard after successful save (both draft and final)
        navigate('/home');

      } catch (error) {

        console.error('Failed to save event:', error);

        showToast(`Failed to save: ${error.message}`, 'error');

        // Always navigate to dashboard even on failure (both draft and final)
        navigate('/home');

      } finally {
"@

# Define the new code block with correct logic
$newCode = @"
        const savedEvent = await saveEvent(eventData, saveDraft);

        setIsDraft(saveDraft);

        // Show success message before reload
        showToast(
          saveDraft ? 'Draft saved! Reloading...' : 'Inspection submitted! Reloading...', 
          'success'
        );
        
        // Reload the app with a fresh form after a brief delay to show the toast
        setTimeout(() => {
          window.location.href = '/form';
        }, 3000);

      } catch (error) {

        console.error('Failed to save event:', error);

        showToast(`Failed to save: ${error.message}`, 'error');

        // On error, navigate to dashboard to see existing records
        navigate('/home');

      } finally {
"@

# Perform the replacement
if ($content.Contains($oldCode)) {
    $content = $content.Replace($oldCode, $newCode)
    Set-Content $filePath -Value $content -NoNewline
    Write-Host "✅ Successfully updated FormPage.jsx with correct reload logic."
} else {
    Write-Error "❌ Could not find the target code block. The file might have changed or is different than expected."
    # Debug: Print a small chunk of where we expect the code to be
    $start = $content.IndexOf("const savedEvent = await saveEvent")
    if ($start -ge 0) {
        Write-Host "Found 'saveEvent' call at index $start. Context:"
        Write-Host $content.Substring($start, 500)
    }
}
