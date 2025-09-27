// ================== Imports ==================
import express from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import dotenv from "dotenv";
import cors from "cors";


dotenv.config();

const app = express();
app.use(cors());
const upload = multer({ dest: "uploads/" });

const PORT = process.env.PORT || 5000;
const CLOUDCONVERT_API_KEY = process.env.CLOUDCONVERT_API_KEY;

// ================== In-Memory Limit Tracking ==================
const conversionLimits = {}; 
// Example: { "127.0.0.1": 2 } means this IP has used 2 conversions

function canConvert(ip) {
  if (!conversionLimits[ip]) {
    conversionLimits[ip] = 0;
  }
  return conversionLimits[ip] < 3;
}

function recordConversion(ip) {
  conversionLimits[ip] = (conversionLimits[ip] || 0) + 1;
}

// ================== Upload + Convert Route ==================
app.post("/convert", upload.single("file"), async (req, res) => {
  try {
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    // Enforce 3 free conversions
    if (!canConvert(clientIp)) {
      return res.status(403).json({ error: "Free limit reached. Please upgrade." });
    }

    const { format } = req.body;
    const filePath = req.file.path;
    const fileName = req.file.originalname;

    // Step 1: Create job
    const jobResponse = await axios.post(
      "https://api.cloudconvert.com/v2/jobs",
      {
        tasks: {
          "import-my-file": { operation: "import/upload" },
          "convert-my-file": { operation: "convert", input: "import-my-file", output_format: format },
          "export-my-file": { operation: "export/url", input: "convert-my-file" }
        }
      },
      { headers: { Authorization: `Bearer ${CLOUDCONVERT_API_KEY}` } }
    );

    const job = jobResponse.data.data;
    const uploadTask = job.tasks.find((t) => t.name === "import-my-file");

    // Step 2: Upload file
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath), fileName);
    await axios.post(uploadTask.result.form.url, form, { headers: form.getHeaders() });

    // Step 3: Poll until finished
    let convertedFileUrl = null;
    while (!convertedFileUrl) {
      const checkJob = await axios.get(
        `https://api.cloudconvert.com/v2/jobs/${job.id}`,
        { headers: { Authorization: `Bearer ${CLOUDCONVERT_API_KEY}` } }
      );

      const jobData = checkJob.data.data;
      const exportTask = jobData.tasks.find((t) => t.name === "export-my-file" && t.status === "finished");

      if (exportTask && exportTask.result?.files?.length > 0) {
        convertedFileUrl = exportTask.result.files[0].url;
      } else {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    // Step 4: Stream file back
    const fileResp = await axios.get(convertedFileUrl, { responseType: "stream" });
    res.setHeader("Content-Disposition", `attachment; filename=converted.${format}`);
    fileResp.data.pipe(res);

    // Record conversion
    recordConversion(clientIp);

    // Cleanup
    fs.unlinkSync(filePath);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Conversion failed" });
  }
});

// ================== Routes ==================
app.get("/ping", (req, res) => {
  const apiKey = process.env.CLOUDCONVERT_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not found in .env" });

  res.json({ message: "pong", apiKeyPreview: apiKey.substring(0, 6) + "..." });
});

// ================== Start Server ==================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
