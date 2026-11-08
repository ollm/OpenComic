import {fileURLToPath, pathToFileURL} from 'node:url';

declare const asarToAsarUnpacked: (path: string) => string;

const path = asarToAsarUnpacked(fileURLToPath(import.meta.resolve('7zip-native')));
const native7z: Promise<typeof import('7zip-native')> = import(pathToFileURL(path).href);

export default native7z;
