# Animal Crossing Amiibo Card Tracker

A simple browser-based tracker for **Animal Crossing amiibo cards**.

This tool lets you browse the full amiibo dataset, mark cards you own, filter cards by different attributes, and view the full card artwork.

## Live Site

👉 **Use the tracker here:**
https://nevar530.github.io/AC_AMIIBO/

## Features

* 📋 Full amiibo card table
* ✔ Mark cards you **own**
* 🔍 Filter by:

  * Series
  * Species
  * Gender
  * Personality
  * Hobby
  * Month
* 🔎 Search across multiple card fields
* 🖼 Click **Show Card** to view the full amiibo card artwork
* 📱 Mobile-friendly layout with collapsible filter panel
* 💾 Ownership saved locally using browser storage

## Layout

```
Sidebar
  Filters
  Search
  Clear Filters

Main Area
  Amiibo table
  Owned checkboxes
  Show Card button
```

Clicking **Show Card** opens a popup displaying the full amiibo card image and character details.

## Data Source

The site loads card data from:

```
accards.json
```

Each entry includes fields such as:

* ID
* Series
* Card Number
* English Name
* Species
* Gender
* Personality
* Hobby
* Birthday
* Favorite Song
* Catchphrase
* Image URL

## Tech

This project intentionally uses **simple static web tech** so it runs directly on GitHub Pages:

* HTML
* CSS
* Vanilla JavaScript
* JSON dataset

No frameworks required.

## Running Locally

Clone the repo and open `index.html`.

Example:

```
git clone https://github.com/nevar530/AC_AMIIBO.git
cd AC_AMIIBO
```

Then open:

```
index.html
```

Or run a simple local server.

## Storage

Owned cards are saved in **local browser storage**, so your collection persists on your device.

## Future Ideas

Possible improvements:

* Sorting columns
* Export/import owned collection
* Progress tracker by series
* Villager birthday calendar
* Card rarity indicators
* Duplicate tracking

## License

Personal project for tracking amiibo collections.
