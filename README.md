# Share MD

Share your Obsidian notes to a web page with one click.

## Features

- **One-click sharing** - Publish notes via toolbar button or right-click menu
- **Image support** - Automatically uploads images referenced in your notes
- **Dark mode** - Respects your Obsidian color scheme
- **Expiration** - Set 1-day or 7-day expiration for shared links
- **Update support** - Sync changes to existing shares without changing the URL

## Installation

### From Community Plugins

1. Open Settings → Community plugins
2. Click Browse and search for "Share MD"
3. Install and enable the plugin

### Manual Installation

1. Download `main.js` and `manifest.json` from the [latest release](https://github.com/gaozhengjie/Share-MD/releases/latest)
2. Create folder `.obsidian/plugins/share-md/` in your vault
3. Copy the files into the folder
4. Enable the plugin in Settings → Community plugins

## Setup

1. Open Settings → Share MD
2. Set **API URL** to: `https://sharemd.31ai.tech`
3. Enter your **API Token** (contact author to obtain)
4. Set your preferred **Default Expiry** (1 or 7 days)

### Get API Token

API Token is currently not available for public registration. Please contact the author to obtain your token:

- **WeChat**: 17761216291
- **Email**: gaozhengj@foxmail.com

## Usage

### Toolbar Button

Click the share icon in the left ribbon to publish the current note.

### Right-click Menu

Right-click any Markdown file in the file explorer:
- **Share this note** - Publish the note
- **Sync this note** - Update an existing share
- **Copy share link** - Copy the URL to clipboard

### Commands

Open the command palette (`Ctrl/Cmd + P`) and search for "Share MD":
- **Publish current note** - Share the active note
- **Sync current note** - Update an existing share
- **Copy share link** - Copy the URL

## Privacy

- Notes are only uploaded to the Share MD server
- API tokens are stored locally in Obsidian
- Shared links are private and not indexed by search engines

## Support

- [Report Issues](https://github.com/gaozhengjie/Share-MD/issues)

## License

[MIT](LICENSE)
