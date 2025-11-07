import React, { useState } from "react";
import * as XLSX from "xlsx";
import {
  Agent,
  run,
  fileSearchTool,
  webSearchTool,
  setDefaultOpenAIClient,
} from "@openai/agents";
import { z } from "zod";
import OpenAI from "openai";
import { API_KEY, VECTOR_STORE_ID } from "./config";
/* ---------- 1. Material UI ---------- */
import {
  Container,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Box,
  CircularProgress,
  Stack,
  Alert,
  Divider,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DownloadIcon from "@mui/icons-material/Download";

/* ---------- 2. Custom OpenAI Client ---------- */
const client = new OpenAI({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true, // ⚠️ Browser use allowed for local testing
});
setDefaultOpenAIClient(client);

/* ---------- 3. Zod Schema ---------- */
const SapStepSchema = z.object({
  step_number: z.string(),
  action: z.string(),
  tcodes: z.string(),
  sap_tcode_description: z.string(),
  mandatory_fields: z.array(z.string()),
  output_fields: z.array(z.string()),
});

const SapCaseSchema = z.object({
  Case: z.string(),
  Steps: z.array(SapStepSchema),
});
type SapCase = z.infer<typeof SapCaseSchema>;

/* ---------- 4. Agent Definition ---------- */
const sapAgent = new Agent({
  name: "SAP Helper Agent",
  model: "gpt-4.1-mini",
  instructions: `
You are an expert SAP assistant. Your task is to take an SAP test case and produce an enriched, structured JSON object.

### Rules
1. Use internal SAP knowledge first.
2. Verify or correct tcodes using the attached vector store.
3. Use web search only if the vector store lacks data.
4. Fill every field in the schema.
5. Output strictly valid JSON following this schema.

### Output Schema
{
  "Case": "string",
  "Steps": [
    {
      "step_number": "string",
      "action": "string",
      "tcodes": "string",
      "sap_tcode_description": "string",
      "mandatory_fields": ["list"],
      "output_fields": ["list"]
    }
  ]
}`,
  tools: [
    fileSearchTool(VECTOR_STORE_ID),
    webSearchTool(),
  ],
  outputType: SapCaseSchema,
});

/* ---------- 5. Main Component ---------- */
const SapHelperAgentMUI: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<SapCase[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---- File Parser ---- */
  async function parseFile(file: File): Promise<SapCase[]> {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as string[][];

    if (rows.length < 2) return [];

    const header = rows[0].map((h) => String(h).trim());
    const idx = {
      case: header.indexOf("Scenario Name"),
      step: header.indexOf("Step #"),
      desc: header.indexOf("Step Description"),
      tcode: header.indexOf("tcodes"),
      tdesc: header.indexOf("sap_tcode_description"),
    };

    const grouped: Record<string, any[]> = {};
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const c = String(row[idx.case]).trim();
      if (!c) continue;
      if (!grouped[c]) grouped[c] = [];
      grouped[c].push(row);
    }

    return Object.keys(grouped).map((c) => ({
      Case: c,
      Steps: grouped[c].map((r) => ({
        step_number: String(r[idx.step] || "").trim(),
        action: String(r[idx.desc] || "").trim(),
        tcodes: String(r[idx.tcode] || "").trim(),
        sap_tcode_description: String(r[idx.tdesc] || "").trim(),
        mandatory_fields: [],
        output_fields: [],
      })),
    }));
  }

  /* ---- Parallel Runner ---- */
  async function runParallel(cases: SapCase[]) {
    const concurrency = 4;
    const queue = [...cases.entries()];
    const results: SapCase[] = [];
    let done = 0;

    async function worker() {
      while (queue.length) {
        const [i, tc] = queue.shift()!;
        try {
          const res = await run(sapAgent, JSON.stringify(tc));
          results[i] = res.finalOutput ?? tc;
        } catch (err) {
          console.error(`❌ Error processing case ${tc.Case}:`, err);
          results[i] = tc;
        } finally {
          done++;
          setProgress({ done, total: cases.length });
        }
      }
    }

    await Promise.all(Array.from({ length: concurrency }, () => worker()));
    return results;
  }

  /* ---- CSV Generator ---- */
  function makeCsv(data: SapCase[]) {
    const headers = [
      "Scenario Name",
      "Step #",
      "Step Description",
      "Tcodes",
      "SAP Tcode Description",
      "Mandatory Fields",
      "Output Fields",
    ];
    const lines = [headers.join(",")];
    data.forEach((tc) =>
      tc.Steps.forEach((s) =>
        lines.push(
          [
            tc.Case,
            s.step_number,
            s.action,
            s.tcodes,
            s.sap_tcode_description,
            s.mandatory_fields.join("; "),
            s.output_fields.join("; "),
          ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(",")
        )
      )
    );
    return lines.join("\r\n");
  }

  /* ---- CSV Download ---- */
  function downloadCsv(csv: string) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sap_enriched_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ---- Main Handler ---- */
  async function handleProcess() {
    if (!file) {
      setMessage("Please upload a file first.");
      return;
    }

    setLoading(true);
    setMessage("Processing...");
    setProgress({ done: 0, total: 0 });

    try {
      const cases = await parseFile(file);
      setProgress({ done: 0, total: cases.length });
      const enriched = await runParallel(cases);
      setResults(enriched);
      setMessage("Processing complete! You can now download the results.");
    } catch (err: any) {
      console.error("❌ Error:", err);
      setMessage("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  /* ---- UI ---- */
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper
        elevation={4}
        sx={{ p: 4, borderRadius: 3, bgcolor: "#fafafa", border: "1px solid #e0e0e0" }}
      >
        <Typography variant="h4" fontWeight="bold" textAlign="center" gutterBottom>
          Upload SAP Test Scripts
        </Typography>

        <Typography variant="body1" textAlign="center" color="text.secondary" mb={3}>
          Upload your SAP test scripts (.csv / .xlsx) and let the AI enrich them.
        </Typography>

        <Stack direction="column" spacing={3} alignItems="center">
          <Button
            component="label"
            variant="contained"
            color="primary"
            startIcon={<CloudUploadIcon />}
            sx={{ borderRadius: 2, px: 3, py: 1 }}
          >
            {file ? file.name : "Upload File"}
            <input
              type="file"
              hidden
              accept=".csv,.xls,.xlsx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </Button>

          <Button
            variant="contained"
            color="secondary"
            onClick={handleProcess}
            disabled={!file || loading}
            sx={{ borderRadius: 2, px: 3, py: 1 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Run Enrichment"}
          </Button>
        </Stack>

        {progress.total > 0 && (
          <Box mt={3}>
            <Typography variant="body2" gutterBottom>
              Progress: {progress.done}/{progress.total}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(progress.done / progress.total) * 100}
            />
          </Box>
        )}

        {message && (
          <Box mt={3}>
            <Alert severity={message.startsWith("Error") ? "error" : "info"}>
              {message}
            </Alert>
          </Box>
        )}

        {results.length > 0 && (
          <Box mt={4}>
            <Divider sx={{ mb: 2 }} />
            
            <Button
              fullWidth
              variant="outlined"
              color="success"
              startIcon={<DownloadIcon />}
              sx={{ mt: 2, borderRadius: 2 }}
              onClick={() => downloadCsv(makeCsv(results))}
            >
              Download CSV
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default SapHelperAgentMUI;
