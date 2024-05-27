## CLI
```bash
npm run start -- -r
npm run start -- -m
npm run start -- -c
npm run start -- -b messages_payloads
npm run start -- "print 123"
npm run start -- "make a folder name hello"
npm run start -- -d ko hello
```

## Electron
```bash
npm run electron
```

## NPM publish
```bash
node cloneCLI.js && mv index.js index.js.electron && mv _temp.js index.js && npm publish && mv index.js.electron index.js
```

## Things needed to build windows version
```bash
brew install --cask xquartz
brew install --cask wine-stable
npm run build -- --win --x64 && cd dist && md5 *.exe && pwd
```

## Things needed to build macos version
```bash
npm run build
```
