"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => ObsidianSharePlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian4 = require("obsidian");

// src/settings.ts
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  apiBaseUrl: "",
  apiToken: ""
};
var ShareSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Share  MD" });
    new import_obsidian.Setting(containerEl).setName("API Base URL").setDesc("\u4F8B\u5982 https://share.example.com").addText((text) => text.setPlaceholder("https://share.example.com").setValue(this.plugin.settings.apiBaseUrl).onChange(async (value) => {
      this.plugin.settings.apiBaseUrl = value.trim().replace(/\/$/, "");
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("API Token").setDesc("\u670D\u52A1\u7AEF\u751F\u6210\u7684\u4E2A\u4EBA Token\uFF0C\u4EC5\u4FDD\u5B58\u5728\u672C\u5730\u63D2\u4EF6\u8BBE\u7F6E\u4E2D\u3002").addText((text) => text.setPlaceholder("os_...").setValue(this.plugin.settings.apiToken).onChange(async (value) => {
      this.plugin.settings.apiToken = value.trim();
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Share MD \u5DE5\u4F5C\u53F0").setDesc("\u5728\u7F51\u9875\u7AEF\u7BA1\u7406 Token\u3001\u67E5\u770B\u548C\u4E0B\u7EBF\u5DF2\u53D1\u5E03\u7684\u5206\u4EAB\u3002").addButton((button) => button.setButtonText("\u6253\u5F00\u5DE5\u4F5C\u53F0").onClick(() => {
      window.open("https://sharemd.dawnclarity.press", "_blank");
    }));
  }
};

// src/mapping-store.ts
var MappingStore = class {
  constructor(plugin) {
    this.plugin = plugin;
    this.mappings = {};
  }
  async load() {
    this.mappings = (await this.plugin.loadData())?.mappings ?? {};
  }
  async save() {
    const data = await this.plugin.loadData();
    await this.plugin.saveData({ ...data, mappings: this.mappings });
  }
  get(path) {
    return this.mappings[path];
  }
  async set(path, mapping) {
    this.mappings[path] = mapping;
    await this.save();
  }
  async rename(oldPath, newPath) {
    const mapping = this.mappings[oldPath];
    if (!mapping) return;
    delete this.mappings[oldPath];
    this.mappings[newPath] = mapping;
    await this.save();
  }
};

// src/publish-controller.ts
var import_obsidian3 = require("obsidian");

// src/api-client.ts
var import_obsidian2 = require("obsidian");
function parseError(error) {
  const message = error?.message || "request_failed";
  if (message.includes("share_expired")) return new Error("share_expired");
  if (message.includes("invalid_token")) return new Error("invalid_token");
  return new Error(message);
}
function uint8ArrayToBase64(bytes) {
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}
function documentToJson(document2) {
  const data = {
    document_path: document2.documentPath,
    title: document2.title,
    markdown: document2.markdown,
    theme_css: document2.themeCss,
    css_variables: document2.cssVariables,
    color_scheme: document2.colorScheme,
    expires_in_days: 3,
    assets: document2.assets.map((a) => ({
      source_path: a.sourcePath,
      sha256: a.sha256,
      mime_type: a.mimeType,
      filename: a.filename,
      bytes: uint8ArrayToBase64(a.bytes)
    }))
  };
  return JSON.stringify(data);
}
var ShareApiClient = class {
  constructor(settings) {
    this.settings = settings;
  }
  ensureConfigured() {
    if (!this.settings.apiBaseUrl || !this.settings.apiToken) throw new Error("not_configured");
  }
  // requestUrl 走 Obsidian 的 Node 网络栈：不受浏览器 CORS/系统代理影响
  async request(method, url, body) {
    const response = await (0, import_obsidian2.requestUrl)({
      url,
      method,
      headers: {
        "Authorization": `Bearer ${this.settings.apiToken}`,
        "Content-Type": "application/json"
      },
      body,
      throw: false
    });
    if (response.status >= 400) {
      throw new Error(`HTTP ${response.status}: ${response.text}`);
    }
    return response.json;
  }
  async publish(document2) {
    this.ensureConfigured();
    const body = documentToJson(document2);
    try {
      return await this.request("POST", `${this.settings.apiBaseUrl}/api/v1/shares/json`, body);
    } catch (error) {
      throw parseError(error);
    }
  }
  async sync(document2, mapping) {
    this.ensureConfigured();
    const body = documentToJson(document2);
    try {
      return await this.request("PUT", `${this.settings.apiBaseUrl}/api/v1/shares/${encodeURIComponent(mapping.publicId)}`, body);
    } catch (error) {
      throw parseError(error);
    }
  }
};

// src/asset-resolver.ts
var import_node_crypto = require("node:crypto");
var imageExtensions = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", svg: "image/svg+xml" };
function normalizePath(path) {
  return decodeURIComponent(path.trim().replace(/^\//, "").split("|")[0]);
}
function extractAssetReferences(markdown) {
  const paths = /* @__PURE__ */ new Set();
  for (const match of markdown.matchAll(/!\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g)) paths.add(normalizePath(match[1]));
  for (const match of markdown.matchAll(/!\[[^\]]*\]\((<[^>]+>|[^)\s]+)\)/g)) {
    const destination = match[1].replace(/^<|>$/g, "").split(/[?#]/)[0];
    if (!/^(?:https?:|data:|#|\/\/)/i.test(destination)) paths.add(normalizePath(destination));
  }
  return [...paths];
}
async function digest(bytes) {
  if (globalThis.crypto?.subtle) {
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    const buffer = await globalThis.crypto.subtle.digest("SHA-256", copy.buffer);
    return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  return (0, import_node_crypto.createHash)("sha256").update(bytes).digest("hex");
}
async function resolveAssets(app, markdown, sourceFile) {
  const references = extractAssetReferences(markdown);
  console.log("[ShareMD] Asset references:", references);
  console.log("[ShareMD] Source file path:", sourceFile.path);
  const output = [];
  for (const reference of references) {
    let file = app.metadataCache.getFirstLinkpathDest(reference, sourceFile.path);
    if (!file) {
      const dir = sourceFile.parent?.path ?? "";
      const fullPath = dir ? `${dir}/${reference}` : reference;
      file = app.vault.getAbstractFileByPath(fullPath);
    }
    if (!file) {
      const dir = sourceFile.parent?.path ?? "";
      const baseName = sourceFile.basename;
      const assetPath = `${dir}/assets/${baseName}/${reference}`;
      file = app.vault.getAbstractFileByPath(assetPath);
    }
    if (!file) {
      file = app.vault.getAbstractFileByPath(reference);
    }
    if (!file || !("extension" in file) || !("path" in file)) {
      throw new Error(`\u65E0\u6CD5\u627E\u5230\u56FE\u7247\u8D44\u6E90\uFF1A${reference}`);
    }
    const imageFile = file;
    const mimeType = imageExtensions[imageFile.extension.toLowerCase()];
    if (!mimeType) throw new Error(`\u4E0D\u652F\u6301\u7684\u56FE\u7247\u7C7B\u578B\uFF1A${reference}`);
    const bytes = await app.vault.readBinary(imageFile);
    output.push({ sourcePath: imageFile.path, filename: imageFile.name, mimeType, bytes: new Uint8Array(bytes), sha256: await digest(new Uint8Array(bytes)) });
  }
  return output;
}

// src/theme-collector.ts
var BASE_CSS_VARIABLES = [
  "--background-primary",
  "--background-primary-alt",
  "--background-secondary",
  "--background-secondary-alt",
  "--background-modifier-border",
  "--background-modifier-border-hover",
  "--background-modifier-hover",
  "--background-modifier-form-field",
  "--text-normal",
  "--text-muted",
  "--text-faint",
  "--text-accent",
  "--text-accent-hover",
  "--text-on-accent",
  "--text-selection",
  "--interactive-normal",
  "--interactive-hover",
  "--interactive-accent",
  "--interactive-accent-hover",
  "--link-color",
  "--link-color-hover",
  "--link-unresolved-color",
  "--hr-color",
  "--blockquote-border-color",
  "--code-background",
  "--code-normal",
  "--tag-color",
  "--tag-background",
  "--table-header-background",
  "--table-header-color",
  "--table-row-even-background",
  "--table-row-odd-background",
  "--h1-color",
  "--h2-color",
  "--h3-color",
  "--h4-color",
  "--h5-color",
  "--h6-color",
  "--font-text",
  "--font-ui",
  "--font-monospace",
  "--font-text-size",
  "--line-height-normal"
];
function collectCssVariables(css) {
  const names = new Set(BASE_CSS_VARIABLES);
  for (const match of css.matchAll(/var\(\s*(--[\w-]+)/g)) names.add(match[1]);
  const computed = getComputedStyle(document.body);
  const variables = {};
  for (const name of names) {
    const value = computed.getPropertyValue(name).trim();
    if (value) variables[name] = value;
  }
  return variables;
}
async function collectThemeCss(app) {
  const adapter = app.vault.adapter;
  const configDir = app.vault.configDir ?? ".obsidian";
  const css = [];
  const customCss = app.customCss;
  const theme = customCss?.theme;
  if (theme) {
    const themeVariants = [theme, theme.replace(/-/g, " "), theme.replace(/\s+/g, "-")];
    const uniqueThemes = [...new Set(themeVariants)];
    outer:
      for (const themeName of uniqueThemes) {
        const paths = [
          `${configDir}/themes/${themeName}.css`,
          `${configDir}/themes/${themeName}/theme.css`
        ];
        for (const path of paths) {
          try {
            css.push(await adapter.read(path));
            break outer;
          } catch {
          }
        }
      }
  }
  try {
    const snippetsDir = `${configDir}/snippets`;
    const listed = await adapter.list(snippetsDir);
    const enabledSnippets = new Set((customCss?.enabledSnippets ?? []).map((name) => name.replace(/\.css$/i, "")));
    const snippetFiles = listed.files.filter((file) => {
      if (!file.toLowerCase().endsWith(".css")) return false;
      if (!enabledSnippets.size) return false;
      const name = file.split("/").pop()?.replace(/\.css$/i, "") ?? "";
      return enabledSnippets.has(name);
    });
    for (const path of snippetFiles) {
      try {
        css.push(await adapter.read(path));
      } catch {
      }
    }
  } catch {
  }
  const combined = css.join("\n");
  return { css: combined, cssVariables: collectCssVariables(combined) };
}

// src/vault-collector.ts
async function collectDocument(app, file) {
  const markdown = await app.vault.read(file);
  const metadata = app.metadataCache.getFileCache(file);
  const title = metadata?.frontmatter?.title ? String(metadata.frontmatter.title) : file.basename;
  const { css: themeCss, cssVariables } = await collectThemeCss(app);
  const colorScheme = document.body.classList.contains("theme-dark") ? "dark" : "light";
  const assets = await resolveAssets(app, markdown, file);
  return { file, documentPath: file.path, title, markdown, themeCss, cssVariables, colorScheme, assets };
}

// src/publish-controller.ts
var PublishController = class {
  constructor(app, plugin, settings, mappings) {
    this.app = app;
    this.plugin = plugin;
    this.settings = settings;
    this.mappings = mappings;
  }
  async publishCurrent() {
    const file = this.currentMarkdown();
    if (!file) return;
    return this.publishFile(file);
  }
  async publishFile(file) {
    const progress = new import_obsidian3.Notice("\u6B63\u5728\u53D1\u5E03\u2026");
    try {
      const document2 = await collectDocument(this.app, file);
      const config = this.settings();
      const result = await new ShareApiClient(config).publish(document2);
      await this.mappings.set(file.path, { publicId: result.publicId, url: result.url, expiresAt: result.expiresAt });
      progress.hide();
      await navigator.clipboard?.writeText(result.url).catch(() => void 0);
      new import_obsidian3.Notice(`\u53D1\u5E03\u6210\u529F\uFF0C\u94FE\u63A5\u5DF2\u590D\u5236\uFF1A
${result.url}`, 1e4);
    } catch (error) {
      progress.hide();
      this.notifyError(error);
    }
  }
  async syncCurrent() {
    const file = this.currentMarkdown();
    if (!file) return;
    return this.syncFile(file);
  }
  async syncFile(file) {
    const mapping = this.mappings.get(file.path);
    if (!mapping) {
      new import_obsidian3.Notice("\u6587\u6863\u5C1A\u672A\u53D1\u5E03\uFF0C\u8BF7\u5148\u53D1\u5E03\u3002");
      return;
    }
    if (new Date(mapping.expiresAt).getTime() <= Date.now()) {
      new import_obsidian3.Notice("\u5206\u4EAB\u5DF2\u8FC7\u671F\uFF0C\u8BF7\u91CD\u65B0\u53D1\u5E03\u3002");
      return;
    }
    const progress = new import_obsidian3.Notice("\u6B63\u5728\u540C\u6B65\u2026");
    try {
      const document2 = await collectDocument(this.app, file);
      const result = await new ShareApiClient(this.settings()).sync(document2, mapping);
      await this.mappings.set(file.path, { publicId: result.publicId, url: result.url, expiresAt: result.expiresAt });
      progress.hide();
      new import_obsidian3.Notice(`\u540C\u6B65\u6210\u529F\uFF1A${result.url}`, 8e3);
    } catch (error) {
      progress.hide();
      this.notifyError(error);
    }
  }
  async copyCurrent() {
    const file = this.currentMarkdown();
    if (!file) return;
    const mapping = this.mappings.get(file.path);
    if (!mapping) {
      new import_obsidian3.Notice("\u5F53\u524D\u6587\u6863\u5C1A\u672A\u53D1\u5E03\u3002");
      return;
    }
    await navigator.clipboard?.writeText(mapping.url);
    new import_obsidian3.Notice("\u5206\u4EAB\u94FE\u63A5\u5DF2\u590D\u5236\u3002");
  }
  currentMarkdown() {
    const file = this.app.workspace.getActiveFile();
    if (!file || file.extension !== "md") {
      new import_obsidian3.Notice("\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A Markdown \u6587\u6863\u3002");
      return null;
    }
    return file;
  }
  notifyError(error) {
    console.error("[ShareMD] Error:", error);
    const message = error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF";
    const map = { not_configured: "\u8BF7\u5148\u5728\u63D2\u4EF6\u8BBE\u7F6E\u4E2D\u914D\u7F6E API \u5730\u5740\u548C Token\u3002", invalid_token: "API Token \u65E0\u6548\uFF0C\u8BF7\u68C0\u67E5\u63D2\u4EF6\u8BBE\u7F6E\u3002", share_expired: "\u5206\u4EAB\u5DF2\u8FC7\u671F\uFF0C\u8BF7\u91CD\u65B0\u53D1\u5E03\u3002" };
    new import_obsidian3.Notice(map[message] ?? (message.startsWith("asset_not_found:") ? message.slice("asset_not_found:".length) : `\u64CD\u4F5C\u5931\u8D25\uFF1A${message}`));
  }
};

// src/main.ts
var ObsidianSharePlugin = class extends import_obsidian4.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
  }
  async onload() {
    console.log("[ShareMD] Plugin loading...");
    this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData())?.settings };
    console.log("[ShareMD] Settings:", this.settings);
    this.mappings = new MappingStore(this);
    await this.mappings.load();
    this.controller = new PublishController(this.app, this, () => this.settings, this.mappings);
    this.addSettingTab(new ShareSettingTab(this.app, this));
    this.addRibbonIcon("share", "\u53D1\u5E03\u5230\u5206\u4EAB\u9875", () => {
      console.log("[ShareMD] Ribbon button clicked");
      this.controller.publishCurrent();
    });
    this.registerEvent(this.app.workspace.on("file-menu", (menu, file) => {
      if (!(file instanceof import_obsidian4.TFile) || file.extension !== "md") return;
      menu.addItem((item) => {
        item.setTitle("\u5206\u4EAB\u6B64\u6587\u6863").setIcon("share").onClick(() => this.controller.publishFile(file));
      });
      const mapping = this.mappings.get(file.path);
      if (mapping) {
        menu.addItem((item) => {
          item.setTitle("\u540C\u6B65\u6B64\u6587\u6863").setIcon("refresh-cw").onClick(() => this.controller.syncFile(file));
        });
        menu.addItem((item) => {
          item.setTitle("\u590D\u5236\u5206\u4EAB\u94FE\u63A5").setIcon("link").onClick(async () => {
            await navigator.clipboard?.writeText(mapping.url);
            new import_obsidian4.Notice("\u5206\u4EAB\u94FE\u63A5\u5DF2\u590D\u5236");
          });
        });
      }
    }));
    this.addCommand({ id: "publish-current-note", name: "\u53D1\u5E03\u5F53\u524D\u6587\u6863", callback: () => this.controller.publishCurrent() });
    this.addCommand({ id: "sync-current-note", name: "\u540C\u6B65\u5F53\u524D\u6587\u6863", callback: () => this.controller.syncCurrent() });
    this.addCommand({ id: "copy-current-share-link", name: "\u590D\u5236\u5F53\u524D\u6587\u6863\u5206\u4EAB\u94FE\u63A5", callback: () => this.controller.copyCurrent() });
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => this.mappings.rename(oldPath, file.path)));
  }
  async saveSettings() {
    const data = await this.loadData();
    await this.saveData({ ...data, settings: this.settings });
  }
};
