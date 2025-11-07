import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Paper,
  Stack,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  Avatar,
  Divider,
  Container,
  CssBaseline,
  GlobalStyles,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import OpenAI from "openai";
import {
  Agent,
  run,
  fileSearchTool,
  webSearchTool,
  setDefaultOpenAIClient,
} from "@openai/agents";
import { z } from "zod";
import { API_KEY, VECTOR_STORE_ID } from "./config";
import { ThemeProvider, createTheme, responsiveFontSizes } from "@mui/material/styles";

const SapStepSchema = z.object({
  step_number: z.string(),
  action: z.string(),
  tcodes: z.string(),
  sap_tcode_description: z.string(),
  mandatory_fields: z.array(z.string()),
  output_fields: z.array(z.string()),
});

const SapResponseSchema = z.object({
  text: z.string().optional(),
  case: z.string().optional(),
  steps: z.array(SapStepSchema).optional(),
});

type SapResponse = z.infer<typeof SapResponseSchema>;

const client = new OpenAI({ apiKey: API_KEY, dangerouslyAllowBrowser: true });
setDefaultOpenAIClient(client);

const sapAgent = new Agent({
  name: "SAP Helper Agent",
  model: "gpt-4.1-mini",
  instructions: `Always return valid JSON as per schema`,
  tools: [fileSearchTool(VECTOR_STORE_ID), webSearchTool()],
  outputType: SapResponseSchema,
});

const SapAgentTool = sapAgent.asTool({
  toolName: "get_scenario_details",
  toolDescription: "Retrieve structured details about an SAP business scenario.",
});

const chatAgent = new Agent({
  name: "SAP Chatbot",
  model: "gpt-4.1-mini",
  instructions: `Always output valid JSON per schema`,
  tools: [SapAgentTool],
  outputType: SapResponseSchema,
});

function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatSteps(response: SapResponse): string {
  if (!response.steps?.length) return "<em>No steps found.</em>";
  const scenario = response.case ? `<div><strong>Scenario:</strong> ${escapeHtml(response.case)}</div>` : "";
  const stepsHtml = response.steps
    .map(
      (s) => `
        <details style=\"margin:8px 0;border:1px solid #ccc;background:#f9f9f9\">
          <summary style=\"padding:10px;font-weight:600\">Step ${escapeHtml(s.step_number)}: ${escapeHtml(s.action)}</summary>
          <div style=\"padding:10px\">
            <div><strong>T-Codes:</strong> ${escapeHtml(s.tcodes)}</div>
            <div><strong>Description:</strong> ${escapeHtml(s.sap_tcode_description)}</div>
            <div><strong>Mandatory Fields:</strong> ${(s.mandatory_fields || []).join(", ")}</div>
            <div><strong>Output Fields:</strong> ${(s.output_fields || []).join(", ")}</div>
          </div>
        </details>`
    )
    .join("");
  return scenario + stepsHtml;
}

let theme = createTheme({
  palette: { mode: "light", primary: { main: "#0b0b0c" }, background: { default: "#f7f7f7" } },
  shape: { borderRadius: 0 },
});
theme = responsiveFontSizes(theme);

const SapHelperChatbotM3Strict: React.FC = () => {
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string; isHTML?: boolean }[]
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function handleSend() {
    const value = input.trim();
    if (!value) return;
    setMessages((p) => [...p, { role: "user", content: input }]);
    setInput("");
    setLoading(true);
    try {
      const result = await run(chatAgent, value);
      const response: SapResponse = result.finalOutput ?? {};
      const parts: string[] = [];
      if (response.text) parts.push(`<pre>${escapeHtml(response.text)}</pre>`);
      if (response.steps) parts.push(formatSteps(response));
      const htmlContent = parts.join("\n") || "No valid content returned.";
      setMessages((p) => [...p, { role: "assistant", content: htmlContent, isHTML: true }]);
    } catch (err) {
      setMessages((p) => [...p, { role: "assistant", content: "Error: Unable to process request." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={{ body: { background: "#fff" } }} />
      <Container maxWidth="md" sx={{ py: 4, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Paper sx={{ width: "100%", height: "90vh", display: "flex", flexDirection: "column", borderRadius: 0 }}>
          <Typography variant="h5" align="center" sx={{ bgcolor: "#000", color: "#fff", py: 1 }}>Lsoft AI</Typography>
          <Divider />
          <Box sx={{ flexGrow: 1, overflowY: "auto", p: 2 }}>
            {messages.map((msg, i) => (
              <Stack key={i} direction={msg.role === "user" ? "row-reverse" : "row"} spacing={1} sx={{ mb: 2 }}>
                <Avatar sx={{ bgcolor: msg.role === "user" ? "#000" : "#fff", color: msg.role === "user" ? "#fff" : "#000", border: "1px solid #ccc" }}>{msg.role === "user" ? "U" : "A"}</Avatar>
                <Paper sx={{ p: 1, bgcolor: msg.role === "user" ? "#000" : "#fff", color: msg.role === "user" ? "#fff" : "#000", border: "1px solid #ccc", borderRadius: 0 }}>
                  {msg.isHTML ? <div dangerouslySetInnerHTML={{ __html: msg.content }} /> : msg.content}
                </Paper>
              </Stack>
            ))}
            <div ref={endRef} />
          </Box>
          <Stack direction="row" spacing={1} sx={{ p: 2 }}>
            <TextField fullWidth multiline minRows={2} maxRows={6} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask ..." onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
            <IconButton onClick={handleSend} disabled={loading}>{loading ? <CircularProgress size={24} /> : <SendIcon />}</IconButton>
          </Stack>
        </Paper>
      </Container>
    </ThemeProvider>
  );
};

export default SapHelperChatbotM3Strict;