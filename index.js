const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { google } = require("googleapis");
const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: ["https://project12-sable.vercel.app"], // Add any frontend domains here
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
}));
app.use(bodyParser.json());

// Google Sheets Auth
const auth = new google.auth.GoogleAuth({
  keyFile: "./credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

// ============ Volunteer / Partner Sign-up ============
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
    console.error("❌ Google Sheets error:", error);
    res.status(500).json({ message: "Failed to submit" });
  }
});

// ============ Manual Donation Verification ============
app.post("/paystack/verify", async (req, res) => {
  const { reference } = req.body;

  if (!reference) {
    return res.status(400).json({ status: "error", message: "Missing reference" });
  }

  try {
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const data = response.data.data;

    if (data.status === "success") {
      const client = await auth.getClient();
      const sheets = google.sheets({ version: "v4", auth: client });

      const now = new Date().toISOString();
      const name = data.metadata?.custom_fields?.find(f => f.variable_name === "donor_name")?.value || "";
      const projects = data.metadata?.custom_fields?.find(f => f.variable_name === "projects")?.value || "";
      const amount = data.amount / 100;
      const email = data.customer.email;

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: "Sheet1!A:E",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[now, name, email, projects, amount]],
        },
      });

      return res.status(200).json({
        status: "success",
        message: "Transaction verified and recorded.",
        data: { name, email, projects, amount, reference },
      });
    } else {
      return res.status(400).json({
        status: "error",
        message: "Transaction not successful.",
        data: response.data,
      });
    }
  } catch (error) {
    console.error("❌ Paystack Verify Error:", error?.response?.data || error.message);
    return res.status(500).json({
      status: "error",
      message: "Verification failed",
      error: error?.response?.data || error.message,
    });
  }
});

// ============ Webhook for Auto-Verification ============
app.post("/paystack/webhook", async (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;

  const hash = crypto
    .createHmac("sha512", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    console.warn("⚠️ Invalid webhook signature");
    return res.status(401).send("Invalid signature");
  }

  const event = req.body;

  if (event.event === "charge.success") {
    const ref = event.data.reference;

    try {
      const response = await axios.get(`https://api.paystack.co/transaction/verify/${ref}`, {
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
      });

      const data = response.data.data;

      if (data.status === "success") {
        const client = await auth.getClient();
        const sheets = google.sheets({ version: "v4", auth: client });

        const now = new Date().toISOString();
        const name = data.metadata?.custom_fields?.find(f => f.variable_name === "donor_name")?.value || "";
        const projects = data.metadata?.custom_fields?.find(f => f.variable_name === "projects")?.value || "";
        const amount = data.amount / 100;
        const email = data.customer.email;

        await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: "Sheet1!A:E",
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [[now, name, email, projects, amount]],
          },
        });

        console.log("✅ Donation recorded via webhook:", ref);
      }
    } catch (error) {
      console.error("❌ Webhook verification error:", error?.response?.data || error.message);
    }
  }

  res.sendStatus(200); // Acknowledge Paystack's webhook
});

// ============ Start Server ============
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
