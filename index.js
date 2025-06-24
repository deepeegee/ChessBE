// const express = require("express");
// const cors = require("cors");
// const bodyParser = require("body-parser");
// const { google } = require("googleapis");
// const nodemailer = require("nodemailer");

// const app = express();
// const PORT = process.env.PORT || 4000;

// app.use(cors());
// app.use(bodyParser.json());

// // ------------------------
// // Google Sheets Setup
// // ------------------------

// const auth = new google.auth.GoogleAuth({
//   keyFile: "./credentials.json",
//   scopes: ["https://www.googleapis.com/auth/spreadsheets"],
// });

// const VOLUNTEER_SPREADSHEET_ID = "1h_Gxj7vLK22MraGGik7NCTQ0O53cDVATSBf0PJQ_Eaw"; // Volunteer + Partner
// const DONATION_SPREADSHEET_ID = "PUT_YOUR_DONATION_SHEET_ID_HERE"; // Replace

// // ------------------------
// // Email Setup (Gmail Example)
// // ------------------------

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: "yourchessngo@gmail.com", // ✅ Replace
//     pass: "your_app_password_here", // 🔐 App password
//   },
// });

// // ------------------------
// // Routes
// // ------------------------

// // Volunteers & Partners
// app.post("/submit", async (req, res) => {
//   const { email, type } = req.body;
//   if (!email || !type) {
//     return res.status(400).json({ message: "Email and type are required." });
//   }

//   try {
//     const client = await auth.getClient();
//     const sheets = google.sheets({ version: "v4", auth: client });

//     const now = new Date().toISOString();
//     await sheets.spreadsheets.values.append({
//       spreadsheetId: VOLUNTEER_SPREADSHEET_ID,
//       range: "Sheet1!A:C",
//       valueInputOption: "USER_ENTERED",
//       requestBody: {
//         values: [[now, type, email]],
//       },
//     });

//     res.status(200).json({ message: "Submitted successfully" });
//   } catch (error) {
//     console.error("❌ Google Sheets Error (submit):", error);
//     res.status(500).json({ message: "Submission failed" });
//   }
// });

// // Donation webhook
// app.post("/donation-webhook", async (req, res) => {
//   const { name, email, amount, projects, ref } = req.body;

//   if (!name || !email || !amount || !projects || !ref) {
//     return res.status(400).json({ message: "Missing donation data" });
//   }

//   try {
//     const client = await auth.getClient();
//     const sheets = google.sheets({ version: "v4", auth: client });

//     const timestamp = new Date().toISOString();
//     await sheets.spreadsheets.values.append({
//       spreadsheetId: DONATION_SPREADSHEET_ID,
//       range: "Sheet1!A:E",
//       valueInputOption: "USER_ENTERED",
//       requestBody: {
//         values: [[timestamp, name, email, projects.join(", "), amount]],
//       },
//     });

//     await transporter.sendMail({
//       from: '"Chess NGO" <yourchessngo@gmail.com>',
//       to: email,
//       subject: "Thank you for your donation!",
//       html: `
//         <h2>Hi ${name},</h2>
//         <p>Thank you for your generous donation of ₦${amount}.</p>
//         <p>You supported: <strong>${projects.join(", ")}</strong></p>
//         <p>Ref ID: ${ref}</p>
//         <br />
//         <p>We truly appreciate your support 🙏</p>
//         <p>- Chess NGO Team</p>
//       `,
//     });

//     res.status(200).json({ message: "Donation recorded and email sent." });
//   } catch (error) {
//     console.error("❌ Donation Webhook Error:", error);
//     res.status(500).json({ message: "Error processing donation" });
//   }
// });

// app.listen(PORT, () =>
//   console.log(`🚀 Server running at http://localhost:${PORT}`)
// );