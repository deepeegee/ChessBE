const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { google } = require("googleapis");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

// Setup Google Auth
const auth = new google.auth.GoogleAuth({
  keyFile: "./credentials.json", // Ensure this is in .gitignore
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// Your spreadsheet ID
const SPREADSHEET_ID = "1h_Gxj7vLK22MraGGik7NCTQ0O53cDVATSBf0PJQ_Eaw";

// API endpoint
app.post("/submit", async (req, res) => {
  const { email, type } = req.body;

  if (!email || !type) {
    return res.status(400).json({ message: "Email and type are required." });
  }

  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    const timestamp = new Date().toISOString();

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A:C",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[timestamp, type, email]],
      },
    });

    res.status(200).json({ message: "Submitted successfully" });
  } catch (error) {
    console.error("❌ Google Sheets Error:", error);
    res.status(500).json({ message: "Submission failed" });
  }
});

// Server start
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
