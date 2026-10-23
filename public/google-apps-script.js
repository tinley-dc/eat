/**
 * =========================================================================
 * 「今天吃什麼？」Google 試算表與 Google 雲端硬碟 雲端資料庫後端腳本
 * =========================================================================
 * 
 * 📖 如何使用（只需 3 分鐘）：
 * 1. 在 Google 雲端硬碟中新建一個「Google 試算表」，可自訂名稱（例如：今天吃什麼名單）。
 * 2. 點選試算表上方選單的【擴充功能】->【Apps Script】。
 * 3. 把本檔案內的所有程式碼完整複製並覆蓋貼到 Apps Script 編輯器中。
 * 4. 點擊右上角【部署】按鈕 -> 選擇【新增部署】。
 * 5. 點擊齒輪圖示 ⚙️ 選擇【網頁應用程式 (Web App)】：
 *    - 說明：今天吃什麼 API
 *    - 誰可以存取：選擇【任何人 (Anyone)】（這樣你的手機和電腦才能免登入直接讀寫）。
 * 6. 點擊【部署】，若跳出 Google 授權確認，請依序點選「進階」->「前往 (不安全)」以授權存取你的試算表與雲端硬碟。
 * 7. 複製產生的「網頁應用程式網址 (Web App URL)」，貼回「今天吃什麼？」網頁設定中的「Google 試算表網址」即可！
 * =========================================================================
 */

var FOLDER_NAME = "今天吃什麼_店家相片";
var SHEET_RESTAURANTS = "店家名單";
var SHEET_DISHES = "餐點評價";

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'get_all';
  var result = {};

  try {
    if (action === 'ping') {
      result = { status: 'success', message: '連線成功！Google 試算表正常運作中' };
    } else if (action === 'get_all') {
      result = getAllData();
    } else {
      result = { status: 'error', message: '未知的 action 指令' };
    }
  } catch (err) {
    result = { status: 'error', message: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var result = {};
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }
    
    var action = data.action || (e && e.parameter && e.parameter.action);

    if (action === 'save_all') {
      // 批次同步所有店家與餐點
      result = saveAllData(data.restaurants || []);
    } else if (action === 'upload_image') {
      // 上傳圖片至使用者的 Google 雲端硬碟
      result = uploadImageToDrive(data.base64, data.fileName || 'food.jpg');
    } else {
      result = { status: 'error', message: '未知的 action' };
    }
  } catch (err) {
    result = { status: 'error', message: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// 取得或建立工作表
function getOrCreateSheet(sheetName, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error("找不到關聯的 Google 試算表！請確認這份指令碼是在 Google 試算表內的【擴充功能】->【Apps Script】建立的（非獨立專案）。");
  }
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#FFD166");
      headerRange.setFontWeight("bold");
    }
  }
  return sheet;
}

// 讀取所有資料
function getAllData() {
  var restSheet = getOrCreateSheet(SHEET_RESTAURANTS, ["店家ID", "店家名稱", "分類", "照片網址清單", "封面索引", "地址備忘", "店家備註", "更新時間"]);
  var dishSheet = getOrCreateSheet(SHEET_DISHES, ["餐點ID", "店家ID", "餐點名稱", "推薦等級", "備註說明"]);

  var restRows = restSheet.getDataRange().getValues();
  var dishRows = dishSheet.getDataRange().getValues();

  var restaurantsMap = {};
  var restaurantsList = [];

  // 讀取店家 (跳過第一行標題)
  for (var i = 1; i < restRows.length; i++) {
    var row = restRows[i];
    if (!row[0]) continue;
    var id = String(row[0]);
    var categories = [];
    try {
      categories = row[2] ? JSON.parse(row[2]) : [];
    } catch(e) {
      categories = row[2] ? String(row[2]).split(',') : [];
    }
    var images = [];
    try {
      images = row[3] ? JSON.parse(row[3]) : [];
    } catch(e) {
      images = row[3] ? [String(row[3])] : [];
    }

    var rest = {
      id: id,
      name: String(row[1] || ''),
      categories: categories,
      images: images,
      coverIndex: Number(row[4]) || 0,
      address: String(row[5] || ''),
      note: String(row[6] || ''),
      updatedAt: Number(row[7]) || Date.now(),
      dishes: []
    };
    restaurantsMap[id] = rest;
    restaurantsList.push(rest);
  }

  // 讀取餐點
  for (var j = 1; j < dishRows.length; j++) {
    var dRow = dishRows[j];
    if (!dRow[0] || !dRow[1]) continue;
    var dishId = String(dRow[0]);
    var restId = String(dRow[1]);
    var dish = {
      id: dishId,
      name: String(dRow[2] || ''),
      opinion: String(dRow[3] || 'neutral'),
      note: String(dRow[4] || '')
    };

    if (restaurantsMap[restId]) {
      restaurantsMap[restId].dishes.push(dish);
    }
  }

  return {
    status: 'success',
    data: restaurantsList,
    count: restaurantsList.length
  };
}

// 批次覆蓋儲存資料
function saveAllData(restaurants) {
  var restSheet = getOrCreateSheet(SHEET_RESTAURANTS, ["店家ID", "店家名稱", "分類", "照片網址清單", "封面索引", "地址備忘", "店家備註", "更新時間"]);
  var dishSheet = getOrCreateSheet(SHEET_DISHES, ["餐點ID", "店家ID", "餐點名稱", "推薦等級", "備註說明"]);

  // 清除舊內容保留標題
  if (restSheet.getLastRow() > 1) {
    restSheet.getRange(2, 1, restSheet.getLastRow() - 1, restSheet.getLastColumn()).clearContent();
  }
  if (dishSheet.getLastRow() > 1) {
    dishSheet.getRange(2, 1, dishSheet.getLastRow() - 1, dishSheet.getLastColumn()).clearContent();
  }

  var restDataToInsert = [];
  var dishDataToInsert = [];

  for (var i = 0; i < restaurants.length; i++) {
    var r = restaurants[i];
    var imagesList = r.images || [];
    var imagesStr = JSON.stringify(imagesList);

    // 試算表單一儲存格上限 50,000 字元，若含有巨大 Base64 圖片字串先行過濾避免寫入崩潰
    if (imagesStr.length > 45000) {
      imagesStr = JSON.stringify(imagesList.filter(function(img) {
        return typeof img === 'string' && !img.startsWith('data:');
      }));
    }

    restDataToInsert.push([
      r.id,
      r.name,
      JSON.stringify(r.categories || []),
      imagesStr,
      r.coverIndex || 0,
      r.address || '',
      r.note || '',
      r.updatedAt || Date.now()
    ]);

    if (r.dishes && r.dishes.length > 0) {
      for (var d = 0; d < r.dishes.length; d++) {
        var dish = r.dishes[d];
        dishDataToInsert.push([
          dish.id,
          r.id,
          dish.name,
          dish.opinion,
          dish.note || ''
        ]);
      }
    }
  }

  if (restDataToInsert.length > 0) {
    restSheet.getRange(2, 1, restDataToInsert.length, 8).setValues(restDataToInsert);
  }
  if (dishDataToInsert.length > 0) {
    dishSheet.getRange(2, 1, dishDataToInsert.length, 5).setValues(dishDataToInsert);
  }

  return { status: 'success', message: '已同步 ' + restaurants.length + ' 間店家至 Google 試算表！' };
}

// 上傳照片至 Google Drive 並設定公開檢視權限
function uploadImageToDrive(base64Data, fileName) {
  if (!base64Data) {
    return { status: 'error', message: '缺少照片 base64 內容' };
  }

  // 取得或建立雲端資料夾
  var folders = DriveApp.getFoldersByName(FOLDER_NAME);
  var targetFolder;
  if (folders.hasNext()) {
    targetFolder = folders.next();
  } else {
    targetFolder = DriveApp.createFolder(FOLDER_NAME);
    targetFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  }

  var pureBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
  var decoded = Utilities.base64Decode(pureBase64);
  var blob = Utilities.newBlob(decoded, "image/jpeg", fileName);

  var file = targetFolder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // 取得公開下載/直接瀏覽網址 (支援直接嵌於網頁與試算表 IMAGE 函數)
  var fileId = file.getId();
  var directViewUrl = "https://lh3.googleusercontent.com/d/" + fileId;

  return {
    status: 'success',
    url: directViewUrl,
    fileId: fileId
  };
}
