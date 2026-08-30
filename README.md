# Storehouse
[![Windows](https://img.shields.io/badge/platform-Windows-0078D4?logo=windows&logoColor=white)](https://github.com/the-normandy/high-hold-inventory/releases)
[![Latest Release](https://img.shields.io/github/v/release/the-normandy/high-hold-inventory)](https://github.com/the-normandy/high-hold-inventory/releases)
[![License](https://img.shields.io/github/license/the-normandy/high-hold-inventory)](LICENSE)

This was initially made for personal use, then a single clan, and it grew a lot more than I expected.

Storehouse can manage your reports and ledgers for roleplaying fantasy servers, both for withdrawing and retrieving items from a shared clan storage as well as for your personal purchases and sales.

# Installation

1. Visit the [Releases](https://github.com/the-normandy/high-hold-inventory/releases) page.
2. Download the latest release's `.exe` file.
3. Run the `.exe` installer.

Make sure to grab `prices.json` from the your clan or otherwise make your own. The app will warn you if no `prices.json` is found and offer to create a blank one. Should you dismiss it, the warning will also display a helpful button to open the exact folder it should be at, making it a matter of drag-and-drop, and then a retry button.

# Updating

There's an auto updater that will warn you when there's a new version. You just need to click Update and go through the installer it'll open automatically after downloading it.

Alternatively, just download the latest `.exe` installer and run it. You don't need to manually uninstall anything, Windows will automatically detect the previous version and prompt you to uninstall it. The autoupdater doesn't prevent you from manually updating if you prefer it.

If prices change with `prices.json`, open the app folder (top right button, at the header), drag and drop, overwrite.

# Functionalities

## Reports

Intended for internal clan withdrawing and depositing from a shared clan storage. It'll output a report to your clipboard that you can post in a clan Discord.

Reports use the internal data located in `prices.json`, which is intended for internal prices: how much your clan measures the contribution of any one particular item. 

Crafted items have a similar value, as well as the `labor` field: this is the price of labor without the material contribution. Checking `labor only` is intended to mean that you took the clan's materials to craft something, so your contribution towards the clan's storage is your labor rather than the entire item.

## Commerce

Intended for personal commerce with others. This will not use `prices.json`, and instead the form will ask you for the price of each item that you're purchasing or selling.

It'll output a report, in case you need such a thing (e.g. a Merchant's Guild or a personal ledger you intend to keep), as well as create a record of it for analytics.

## Ledger

Ledgers are the analytics, and it's separated in ledger for Reports and ledger for Commerce. It displays your overall balance, weighing withdraws against deposits (for Reports) or purchases against sales (for Commerce), getting a sense of your overall balance/profits.

Ledgers give you a summary of how much you sold/purchased, deposited/withdrawn both in absolute currency value as well as in number of entries. A chart will show your activity over time, and a table will display each individual entry.

## Data management

This is more relevant for leadership or solo players. It's about manipulating `prices.json` via the application instead of manually opening the file, and exporting it somewhere if need be.

### Manage data

The `Manage data` button will lead you to a file explorer styled page that will essentially show the data structure of your `prices.json`, allowing you to create new categories (e.g. Alchemy, Mining, etc), new items, and set their internal value.

The values are most used in the `Reports` section, but the items themselves are also used in `Commerce` to determine which items are valid to be purchased or sold. The data is sorted alphabetically automatically for you.

Do note that the data in the screen is merely a snapshot. **Nothing is persisted until you explicitly hit Save**. This is intentional so that you can mess around with the system without botching data inadvertently.

There are some invariants to the data structure:

- The two root categories in `prices.json` are expected to be Craft and Materials. 
- The file name is explicitly expected to be `prices.json`. 
- A category cannot simultaneously have an item *and* another category. 
- Each item is expected to have its fields filled.

Breach of those invariants may make the functionalities behave unpredictably, but other than that, the structure is quite flexible.

### Webhook

The `Save and Export` button makes use of webhooks, which has to be set in the homepage via the `Webhook` button. Although any webhook could theoretically work, this was set up with the expectation of a Discord webhook.

Once you set up a Webhook in your Discord channel of preference, hitting `Save and Export` will persist the data locally (same as the `Save` button) and then send the `prices.json` exactly as you set up to the Discord channel via the Discord bot that you set up in the channel webhook.

### Setting up a Discord webhook

Right click on a server that you have privileges to in the sidebar, go to Server configuration > Integration. Click on `Webhooks` and `New webhook`.

Copy the webhook URL, go to the Storehouse and, from the Home screen, click on `Webhook`. A dialog window will open with the Webhook URL field. Paste it, save, and you're done.

**Don't share your webhook URL with anyone**. It has the secret required to post in your channel. Not catastrophic, but not great. You can revoke Discord webhooks at any time in the same screen used to create them, there's a very red button to delete a webhook.