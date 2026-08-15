const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetDirs = [
  path.join(__dirname, 'src', 'emails')
];

const classesToRemove = [
  /\b(?:hover|focus|active|group-hover|peer-hover):[a-zA-Z0-9_-]+\b/g,
  /\b(?:transition|duration|ease|scale|rotate|translate|animate)(?:-[a-zA-Z0-9_-]+)?\b/g
];

targetDirs.forEach(dir => {
  walkDir(dir, filePath => {
    if (filePath.endsWith('.tsx')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;
      
      // Remove specific classes
      classesToRemove.forEach(regex => {
        content = content.replace(regex, '');
      });
      
      // Clean up extra spaces left by removal in classNames
      content = content.replace(/className=(["'`])\s+/g, 'className=$1');
      content = content.replace(/\s+(["'`])/g, '$1');
      content = content.replace(/\s{2,}/g, ' ');

      // Also ensure the structure is exactly:
      // <Html> \n <Head /> \n <Preview>...</Preview> \n <Tailwind> \n <Body>
      // We will look for <Tailwind> enclosing <Head /> and move <Head /> outside.
      // Wait, earlier I discovered that <Head> MUST be inside <Tailwind> for React Email to work if you use responsive classes.
      // However, the user EXPLICITLY requested it outside. 
      // AND we are removing all classes that would require <style> injection anyway.
      // So let's normalize the structure.
      // First, remove <Head /> wherever it is.
      // Then insert <Head /> right before <Preview>
      
      if (content.includes('<Tailwind>')) {
          content = content.replace(/<Head\s*\/>/g, '');
          content = content.replace(/<Preview>/, '<Head />\n      <Preview>');
      }

      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed:', filePath);
      }
    }
  });
});
