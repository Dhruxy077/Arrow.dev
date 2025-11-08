// client/src/utils/projectExport.js
import JSZip from 'jszip';

/**
 * Export project as ZIP file
 */
export async function exportProjectAsZip(files, projectName = 'project') {
  try {
    const zip = new JSZip();

    // Add all files to zip
    for (const [filePath, content] of Object.entries(files)) {
      zip.file(filePath, content);
    }

    // Generate zip file
    const blob = await zip.generateAsync({ type: 'blob' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}-${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true, error: null };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, error: error.message };
  }
}

