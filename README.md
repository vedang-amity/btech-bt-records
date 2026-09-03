# Student Registration Details Portal

A lightweight, one-time student registration portal using a static GitHub Pages frontend, Google Apps Script, and the existing Google Sheet. No database, server, framework, credentials, or build step is required.

## Features

- Searches students by exact Enrollment Number, ignoring accidental surrounding spaces.
- Displays only the student's name, father's name, and enrollment number.
- Collects Gender, Date of Birth, and Category once.
- Treats any existing value in columns E, F, or G as submitted.
- Validates all data again in Apps Script and uses `LockService` for concurrent submissions.
- Responsive, keyboard-friendly, and accessible HTML/CSS/JavaScript.

## Architecture

`Student browser -> GitHub Pages -> Google Apps Script Web App -> Google Sheets`

The frontend has no Google credentials. The Apps Script project is the only component that accesses the spreadsheet.

## Google Sheet Structure

The spreadsheet ID is already configured in `google-apps-script/Code.gs`:

`1F19-M0CQ-WVhPedSKDJrtC8GIjylN5W9b0ZcHOT-5mY`

| Column | Field | Portal behavior |
| --- | --- | --- |
| A | Serial Number | Read-only |
| B | NAME OF STUDENT | Read-only |
| C | ENROLLMENT | Search key |
| D | NAME OF FATHER | Read-only |
| E | GENDER | Updated on successful submission |
| F | DATE OF BIRTH | Updated on successful submission |
| G | CATEGORY | Updated on successful submission |

Keep the header row at row 1. Do not rename or reorder the columns.

## Google Apps Script Setup

1. Open the spreadsheet.
2. Select **Extensions -> Apps Script**.
3. Copy the complete contents of `google-apps-script/Code.gs` into the editor.
4. Change `SHEET_NAME` to the exact name of the existing sheet tab. It is `Sheet1` by default in this template, but verify it.
5. Save the project.
6. Run a function once from the Apps Script editor and accept the Google authorization prompts.

### Deploy the Web App

1. Select **Deploy -> New deployment**.
2. Choose **Web app** as the deployment type.
3. Set **Execute as** to **Me**.
4. Set **Who has access** to **Anyone**.
5. Select **Deploy** and copy the Web app URL ending in `/exec`.
6. In `script.js`, replace the value of `API_URL` with that URL. This is the only frontend configuration value required.

Do not publish or commit any Apps Script project secrets. The web app URL is public by design, while spreadsheet access remains on the Apps Script side.

## GitHub Pages Deployment

1. Create a GitHub repository.
2. Upload `index.html`, `style.css`, `script.js`, `README.md`, `assets/favicon.svg`, and the `google-apps-script` folder.
3. Confirm `API_URL` is set in `script.js`.
4. In the repository, open **Settings -> Pages**.
5. Select **Deploy from a branch**, choose the default branch and root folder, then save.
6. Open the published GitHub Pages URL.

No npm install, build command, or Node.js server is needed. For local testing, open `index.html` in a browser after setting `API_URL`; a simple static server also works, for example `python -m http.server`.

## One-Time Submission Logic

The backend searches column C itself and never accepts a row number or cell address from the browser. During submission it acquires a script lock, searches again, and checks columns E-G again. If **any one** of those cells contains a non-whitespace value, it returns `ALREADY_SUBMITTED`. Otherwise it writes only E-G as `Gender`, ISO `YYYY-MM-DD` DOB, and `Category`.

This protects partial records too: a row containing only Gender, only DOB, or only Category is locked permanently for student submission.

## API Summary

Search: `GET ?action=search&enrollment=A20204126026`

Submit: the browser uses a simple `GET` request with `action=submit`, `enrollment`, `gender`, `dob`, and `category` so GitHub Pages can read the Apps Script response after its web-app redirect. The backend also supports the equivalent `POST` form request for direct/API clients.

The backend accepts only `Male`, `Female`, `Other`; only `GEN`, `OBC-CL`, `OBC-NCL`, `SC`, `ST`; and a real ISO date that is not in the future.

## Testing Checklist

- Existing blank record displays the read-only student details and form.
- Invalid or empty enrollment shows an appropriate message and no form.
- Missing Gender, DOB, or Category blocks submission.
- Valid data updates only E-G on the matching row.
- Searching again shows the locked status without stored values.
- Rows with any partial E-G data are locked.
- Direct invalid API values are rejected.
- Future or malformed dates are rejected.
- Two simultaneous submissions result in one success and one locked response.
- Test on a narrow mobile viewport and a desktop viewport.

## Troubleshooting

**Sheet not found:** Check `SHEET_NAME` character-for-character, including spaces.

**Authorization or access error:** Redeploy as **Execute as Me** with **Who has access: Anyone**, and authorize the script owner account.

**CORS or fetch error:** Use the deployed `/exec` URL, not the Apps Script editor URL or a `/dev` URL. Confirm the URL is quoted correctly in `script.js`.

**Student not found:** Check that the enrollment is in column C and that the requested value matches after trimming spaces.

**Date looks wrong in Sheets:** The script writes the ISO string with text formatting. Existing historical values in F do not affect the lock rule as long as they are populated.

## Credits

Made by Shivam Binadal and Vedang Soni
# btech-bt-records
# btech-bt-records
