// Ensures open-next.config.ts exists before OpenNext build (for CI where the file might not be in the repo)
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'open-next.config.ts');
const content = `// default open-next.config.ts file created by @opennextjs/cloudflare
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
});
`;

if (!fs.existsSync(configPath)) {
  fs.writeFileSync(configPath, content, 'utf8');
  console.log('Created open-next.config.ts');
} else {
  console.log('open-next.config.ts already exists');
}
