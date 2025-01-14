import { Browser, BrowserType, chromium, Page } from "@playwright/test";

let browser: Browser;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let _mainWindow: Page;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let _keplrPopupWindow: Page;
let _keplrWindow: Page;
// let metamaskNotificationWindow;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let _activeTabName: string;

const extensionsData: Record<
  string,
  {
    version: string;
    id: string;
  }
> = {};

export function keplrWindow() {
  return _keplrWindow;
}

export async function init(playwrightInstance?: BrowserType) {
  const chromiumInstance = playwrightInstance ? playwrightInstance : chromium;
  const debuggerDetails = await fetch("http://127.0.0.1:9222/json/version");
  const debuggerDetailsConfig = await debuggerDetails.json();
  const webSocketDebuggerUrl = debuggerDetailsConfig.webSocketDebuggerUrl;
  if (process.env.SLOW_MODE) {
    if (!isNaN(parseInt(process.env.SLOW_MODE))) {
      browser = await chromiumInstance.connectOverCDP(webSocketDebuggerUrl, {
        slowMo: Number(parseInt(process.env.SLOW_MODE)),
      });
    } else {
      browser = await chromiumInstance.connectOverCDP(webSocketDebuggerUrl, {
        slowMo: 50,
      });
    }
  } else {
    browser = await chromiumInstance.connectOverCDP(webSocketDebuggerUrl);
  }
  return browser.isConnected();
}

export async function assignActiveTabName(tabName: string) {
  _activeTabName = tabName;
}

export async function assignWindows() {
  const extensionsData = await getExtensionsData();

  const keplrExtensionData = extensionsData.keplr;

  const pages = await browser.contexts()[0].pages();

  for (const page of pages) {
    if (page.url().includes("specs/runner")) {
      _mainWindow = page;
    } else if (page.url().includes(`chrome-extension://${keplrExtensionData.id}/register.html`)) {
      _keplrWindow = page;
    } else if (page.url().includes(`chrome-extension://${keplrExtensionData.id}/notification.html`)) {
      //     metamaskNotificationWindow = page;
    } else if (page.url().includes(`chrome-extension://${keplrExtensionData.id}/popup.html`)) {
      _keplrPopupWindow = page;
    }
  }
}

export async function getExtensionsData() {
  if (Object.keys(extensionsData).length > 0) {
    return extensionsData;
  }

  const context = await browser.contexts()[0];
  const page = await context.newPage();

  await page.goto("chrome://extensions");
  await page.waitForLoadState("load");
  await page.waitForLoadState("domcontentloaded");

  const devModeButton = page.locator("#devMode");
  await devModeButton.waitFor();
  await devModeButton.focus();
  await devModeButton.click();

  const extensionDataItems = await page.locator("extensions-item").all();

  for (const extensionData of extensionDataItems) {
    const extensionName = (
      (await extensionData.locator("#name-and-version").locator("#name").textContent()) as string
    ).toLowerCase();

    const extensionVersion = (
      (await extensionData.locator("#name-and-version").locator("#version").textContent()) as string
    ).replace(/(\n| )/g, "");

    const extensionId = ((await extensionData.locator("#extension-id").textContent()) as string).replace("ID: ", "");

    extensionsData[extensionName] = {
      version: extensionVersion,
      id: extensionId,
    };
  }

  await page.close();

  return extensionsData;
}
