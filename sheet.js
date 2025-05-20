const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { google } = require("googleapis");
const app = express();

app.use(cors());
app.use(bodyParser.json());

const PORT = 4000;

// Google Auth
const auth = new google.auth.GoogleAuth({
  keyFile: "./credentials.json", // Path to your service account JSON
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// Spreadsheet ID from your sheet URL
const SPREADSHEET_ID = "1h_Gxj7vLK22MraGGik7NCTQ0O53cDVATSBf0PJQ_Eaw";

app.post("/submit", async (req, res) => {
  const { email, type } = req.body;

  if (!email || !type) {
    return res.status(400).json({ message: "Email and type are required." });
  }

  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    const now = new Date().toISOString();

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A:C",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[now, type, email]],
      },
    });

    res.status(200).json({ message: "Submitted successfully" });
  } catch (error) {
    console.error("Google Sheets error:", error);
    res.status(500).json({ message: "Failed to submit" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
