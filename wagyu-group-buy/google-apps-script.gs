var ORDER_SHEET_NAME = "Orders";
var ORDER_HEADERS = [
  "orderId",
  "createdAt",
  "nickname",
  "phone",
  "note",
  "itemName",
  "itemCount",
  "itemEstimatedAmount",
];

function doGet() {
  return jsonResponse_({
    ok: true,
    message: "Wagyu order endpoint is live. Send orders with POST.",
    version: "line-items-v3-2026-05-21",
    columns: ORDER_HEADERS,
  });
}

function doPost(e) {
  try {
    var payload = parsePayload_(e);
    validatePayload_(payload);
    var sheet = getOrdersSheet_();

    payload.items.forEach(function (item) {
      appendOrderItem_(sheet, payload, item);
    });

    return jsonResponse_({
      ok: true,
      message: "saved",
      orderId: payload.orderId,
    });
  } catch (error) {
    return jsonResponse_({
      ok: false,
      message: String(error),
    });
  }
}

function getOrdersSheet_() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(ORDER_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(ORDER_SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(ORDER_HEADERS);
  } else {
    syncOrderHeaders_(sheet);
  }

  return sheet;
}

function syncOrderHeaders_(sheet) {
  var extraColumnCount = sheet.getLastColumn() - ORDER_HEADERS.length;

  sheet.getRange(1, 1, 1, ORDER_HEADERS.length).setValues([ORDER_HEADERS]);

  if (extraColumnCount > 0) {
    sheet.getRange(1, ORDER_HEADERS.length + 1, 1, extraColumnCount).clearContent();
  }
}

function appendOrderItem_(sheet, payload, item) {
  sheet.appendRow([
    payload.orderId,
    payload.createdAt,
    payload.nickname,
    payload.phone,
    payload.note,
    item.name,
    item.quantity,
    item.subtotal,
  ]);
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("Missing request body.");
  }

  try {
    return JSON.parse(e.postData.contents);
  } catch (error) {
    throw new Error("Invalid JSON body: " + error.message);
  }
}

function validatePayload_(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload must be an object.");
  }

  if (!payload.orderId) {
    throw new Error("Missing orderId.");
  }

  if (!payload.nickname) {
    throw new Error("Missing nickname.");
  }

  if (!payload.phone) {
    throw new Error("Missing phone.");
  }

  if (!payload.items || !payload.items.length) {
    throw new Error("Missing order items.");
  }

  payload.items.forEach(function (item) {
    if (!item.name) {
      throw new Error("Missing item name.");
    }

    if (!item.quantity) {
      throw new Error("Missing item quantity.");
    }
  });
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
