const CONFIG = Object.freeze({
  SPREADSHEET_ID: '1F19-M0CQ-WVhPedSKDJrtC8GIjylN5W9b0ZcHOT-5mY',
  SHEET_NAME: 'Sheet1', // Change this to the exact existing tab name.
  HEADER_ROW: 1,
  COLUMNS: Object.freeze({ enrollment: 3, name: 2, fatherName: 4, gender: 5, dob: 6, category: 7 }),
  GENDERS: ['Male', 'Female', 'Other'],
  CATEGORIES: ['GEN', 'OBC-CL', 'OBC-NCL', 'SC', 'ST']
});

const API_URL = "https://script.google.com/macros/s/AKfycbzbdOYF0q5Z97Z9E8D6NhiUWzAsw7PXB8TazyRORIBwIQwhSccGCg5r-muHq01zk-Mn/exec";

function doGet(event) {
  try {
    const params = event && event.parameter ? event.parameter : {};
    if (params.action === 'submit') return submitStudent(params);
    if (params.action !== 'search') return jsonResponse({ success: false, code: 'VALIDATION_ERROR', message: 'Invalid request.' });
    const enrollment = validateEnrollment(params.enrollment);
    if (!enrollment) return jsonResponse({ success: false, code: 'VALIDATION_ERROR', message: 'Please enter a valid Enrollment Number.' });
    return jsonResponse(findStudent(enrollment));
  } catch (error) {
    return jsonResponse({ success: false, code: 'SERVER_ERROR', message: 'Unable to process the request.' });
  }
}

function doPost(event) {
  return submitStudent(event && event.parameter ? event.parameter : {});
}

function submitStudent(params) {
  let lock;
  try {
    const enrollment = validateEnrollment(params.enrollment);
    const gender = String(params.gender || '').trim();
    const dob = String(params.dob || '').trim();
    const category = String(params.category || '').trim();
    if (!enrollment || CONFIG.GENDERS.indexOf(gender) === -1 || CONFIG.CATEGORIES.indexOf(category) === -1 || !isValidPastOrTodayDate(dob)) {
      return jsonResponse({ success: false, code: 'VALIDATION_ERROR', message: 'Please fill all required details.' });
    }

    lock = LockService.getScriptLock();
    lock.waitLock(30000);
    const sheet = getSheet();
    const row = findEnrollmentRow(sheet, enrollment);
    if (!row) return jsonResponse({ success: false, code: 'NOT_FOUND', message: 'Student not found.' });
    if (isSubmitted(sheet, row)) return jsonResponse({ success: false, code: 'ALREADY_SUBMITTED', message: 'Details have already been submitted.' });

    const detailsRange = sheet.getRange(row, CONFIG.COLUMNS.gender, 1, 3);
    detailsRange.setNumberFormat('@');
    detailsRange.setValues([[gender, dob, category]]);
    SpreadsheetApp.flush();
    return jsonResponse({ success: true, message: 'Details submitted successfully.' });
  } catch (error) {
    return jsonResponse({ success: false, code: 'SERVER_ERROR', message: 'Unable to process the request.' });
  } finally {
    if (lock) lock.releaseLock();
  }
}

function findStudent(enrollment) {
  const sheet = getSheet();
  const row = findEnrollmentRow(sheet, enrollment);
  if (!row) return { success: true, found: false, submitted: false };
  if (isSubmitted(sheet, row)) return { success: true, found: true, submitted: true };
  const values = sheet.getRange(row, 1, 1, CONFIG.COLUMNS.category).getDisplayValues()[0];
  return { success: true, found: true, submitted: false, student: { name: values[CONFIG.COLUMNS.name - 1], fatherName: values[CONFIG.COLUMNS.fatherName - 1], enrollment: values[CONFIG.COLUMNS.enrollment - 1] } };
}

function getSheet() {
  const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error('Configured sheet was not found.');
  return sheet;
}

function findEnrollmentRow(sheet, enrollment) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= CONFIG.HEADER_ROW) return null;
  const values = sheet.getRange(CONFIG.HEADER_ROW + 1, CONFIG.COLUMNS.enrollment, lastRow - CONFIG.HEADER_ROW, 1).getDisplayValues();
  const target = enrollment.trim();
  for (let index = 0; index < values.length; index += 1) {
    if (String(values[index][0]).trim() === target) return CONFIG.HEADER_ROW + 1 + index;
  }
  return null;
}

function isSubmitted(sheet, row) {
  const values = sheet.getRange(row, CONFIG.COLUMNS.gender, 1, 3).getDisplayValues()[0];
  return values.some(value => String(value).trim() !== '');
}

function validateEnrollment(value) {
  const enrollment = String(value || '').trim();
  return enrollment && enrollment.length <= 80 && !/[\\r\\n<>]/.test(enrollment) ? enrollment : null;
}

function isValidPastOrTodayDate(value) {
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return false;
  const parts = value.split('-').map(Number);
  const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  return date.getUTCFullYear() === parts[0] && date.getUTCMonth() === parts[1] - 1 && date.getUTCDate() === parts[2] && date <= todayUtc;
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
