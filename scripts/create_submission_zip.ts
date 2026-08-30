import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

console.log('📦 Packaging Skylark Drones BI Agent Submission Zip...');

const projectRoot = path.resolve(__dirname, '..');
const zipFileName = 'skylark-monday-bi-agent.zip';
const zipFilePath = path.join(projectRoot, zipFileName);

// Remove existing zip if present
if (fs.existsSync(zipFilePath)) {
  fs.unlinkSync(zipFilePath);
  console.log(`Deleted existing ${zipFileName}`);
}

try {
  // PowerShell Compress-Archive excluding node_modules, .next, .git
  const excludePatterns = ['node_modules', '.next', '.git', zipFileName];
  
  console.log('Gathering project files...');
  const filesToInclude: string[] = [];
  const entries = fs.readdirSync(projectRoot);
  
  for (const entry of entries) {
    if (!excludePatterns.includes(entry)) {
      filesToInclude.push(entry);
    }
  }

  const fileListString = filesToInclude.map(f => `'${f}'`).join(', ');
  const psCommand = `powershell -Command "Compress-Archive -Path ${fileListString} -DestinationPath '${zipFileName}' -Force"`;
  
  console.log(`Executing compression for: ${filesToInclude.join(', ')}`);
  execSync(psCommand, { cwd: projectRoot, stdio: 'inherit' });
  
  const stats = fs.statSync(zipFilePath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`\n✅ Successfully generated: ${zipFileName} (${sizeMB} MB)`);
  console.log(`Location: ${zipFilePath}`);
} catch (err: any) {
  console.error('Error creating submission zip:', err.message);
  process.exit(1);
}
