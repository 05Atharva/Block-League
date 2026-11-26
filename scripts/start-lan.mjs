// Explicit LAN-only convenience for testing two phones on your own network.
import {spawn} from 'node:child_process';
const child=spawn(process.execPath,['--experimental-strip-types','server/index.ts'],{stdio:'inherit',env:{...process.env,HOST:'0.0.0.0'}});child.on('exit',code=>process.exit(code||0));
