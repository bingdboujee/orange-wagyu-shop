function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Orders");

    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Orders");
      sheet.appendRow([
        "orderId",
        "createdAt",
        "nickname",
        "phone",
        "note",
        "itemCount",
        "subtotal",
        "discount",
        "total",
        "itemsJson",
      ]);
    }

    var payload = JSON.parse(e.postData.contents);

    sheet.appendRow([
      payload.orderId,
      payload.createdAt,
      payload.nickname,
      payload.phone,
      payload.note,
      payload.itemCount,
      payload.subtotal,
      payload.discount,
      payload.total,
      JSON.stringify(payload.items),
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({
        ok: true,
        message: "saved",
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        ok: false,
        message: String(error),
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
