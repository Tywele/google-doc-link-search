import { Plugin, MarkdownView } from "obsidian";
import { google } from "googleapis";

interface MyPluginSettings {
  hotkey: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  hotkey: "Mod-k",
};

export default class MyPlugin extends Plugin {
  private searchEngineId = "YOUR_CX_HERE";
  private apiKey = "YOUR_API_KEY_HERE";
  private settings: MyPluginSettings;

  async onload() {
    console.log("loading plugin");

    await this.loadSettings();

    this.addCommand({
      id: "search-google",
      name: "Search Google",
      callback: () => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view) {
          const text = view.editor.getSelection();
          if (text) {
            this.searchAndShowMenu(text);
          }
        }
      },
      hotkeys: [
        {
          modifiers: this.settings.hotkey.split("-"),
          key: this.settings.hotkey.split("-").pop(),
        },
      ],
    });

    this.addSettingTab(new MyPluginSettingsTab(this.app, this));
  }

  async searchAndShowMenu(text: string) {
    const results = await this.search(text);
    const menu = this.createMenu(results, text);
    this.app.workspace.showMenu(menu);
  }

  async search(text: string) {
    const customsearch = google.customsearch("v1");
    const res = await customsearch.cse.list({
      cx: this.searchEngineId,
      q: text,
      auth: this.apiKey,
    });
    return res.data.items;
  }

  createMenu(results: any[], text: string) {
    const menu = new Menu();
    for (const result of results) {
      menu.addItem(result.title, () => {
        const url = result.link;
        const link = `[${text}](${url})`;
        const editor = this.app.workspace.getActiveViewOfType(MarkdownView)
          ?.editor;
        if (editor) {
          editor.replaceSelection(link);
        }
      });
    }
    return menu;
  }

  async loadSettings() {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      await this.loadData()
    );
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class MyPluginSettingsTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;

    containerEl.empty();

	containerEl.createEl('h2', { text: 'Settings for my awesome plugin.' });

    new Setting(containerEl)
      .setName("Hotkey")
      .setDesc("The hotkey to trigger the search menu")
      .addText((text) =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.hotkey)
          .setValue(this.plugin.settings.hotkey)
          .onChange(async (value) => {
            this.plugin.settings.hotkey = value;
            await this.plugin.saveSettings();
            this.plugin.registerHotkeys();
          })
      );
  }
}