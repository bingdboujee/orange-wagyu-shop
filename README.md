# Orange Wagyu Shop

Static storefront for a small orange-themed wagyu group-buy page. The site lets customers browse beef and lamb products, adjust quantities in a cart, enter WeChat contact details, and submit the order to a Google Sheet through Google Apps Script.

## What It Includes

- Responsive product landing page in Chinese
- Product cards with quantity controls
- Live cart summary with item count, subtotal, discount, and total
- Checkout form for WeChat nickname, WeChat ID, and order notes
- Google Apps Script handler that appends submitted orders to a Google Sheet

## Project Structure

```text
wagyu-group-buy/
  index.html              # Storefront markup and product data
  styles.css              # Visual design and responsive layout
  script.js               # Cart logic and order submission
  google-apps-script.gs   # Google Sheets order receiver
```

## Local Preview

Open this file in a browser:

```text
wagyu-group-buy/index.html
```

No build step is required. This is a plain HTML/CSS/JavaScript project.

## Configure Order Collection

1. Create a Google Sheet for orders.
2. Open **Extensions > Apps Script** in that sheet.
3. Paste the contents of `wagyu-group-buy/google-apps-script.gs`.
4. Deploy it as a **Web app**.
5. Set access to the audience that should be allowed to submit orders.
6. Copy the Web app URL into `GOOGLE_SCRIPT_URL` in `wagyu-group-buy/script.js`.

The Apps Script creates an `Orders` sheet automatically if one does not exist, then appends each order with:

- order ID
- timestamp
- WeChat nickname
- WeChat ID
- note
- item count
- subtotal
- discount
- total
- line items as JSON

## Deploy With GitHub Pages

Because the app lives in `wagyu-group-buy/`, enable GitHub Pages for the repository and open:

```text
https://<your-github-username>.github.io/orange-wagyu-shop/wagyu-group-buy/
```

If you want the shop to load from the repository root instead, move the four files inside `wagyu-group-buy/` to the root of the repo.

## Privacy And Safety Notes

The Google Apps Script Web App URL is a public write endpoint. Anyone who can see the URL can attempt to submit orders to your sheet. For real ordering, consider rotating exposed URLs, adding validation in Apps Script, limiting who can submit, or reviewing orders before fulfillment.

Do not commit private customer exports or order spreadsheets to this repository.
