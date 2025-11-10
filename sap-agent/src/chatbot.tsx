"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Stack,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  Avatar,
  Container,
  CssBaseline,
  AppBar,
  Toolbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ThemeProvider,
  createTheme,
  responsiveFontSizes,
  Fade,
  Zoom,
  Skeleton,
} from "@mui/material";

import SendIcon from "@mui/icons-material/Send";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DescriptionIcon from "@mui/icons-material/Description";
import InputIcon from "@mui/icons-material/Input";
import OutputIcon from "@mui/icons-material/Output";
import CodeIcon from "@mui/icons-material/Code";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";

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

// --- Types & Schemas ---
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
type Message = { role: "user" | "assistant"; data: string | SapResponse };

// --- OpenAI Agent Setup ---
const client = new OpenAI({ apiKey: API_KEY, dangerouslyAllowBrowser: true });
setDefaultOpenAIClient(client);

const sapAgent = new Agent({
  name: "SAP Expert",
  model: "gpt-4.1-mini",
  instructions: `You are a precise SAP consultant. Always return valid JSON matching the schema. Use tools when needed.`,
  tools: [fileSearchTool(VECTOR_STORE_ID), webSearchTool()],
  outputType: SapResponseSchema,
});

const chatAgent = new Agent({
  name: "Lsoft AI",
  model: "gpt-4.1-mini",
  instructions: `You are Lsoft AI — a world-class SAP assistant. Always return valid JSON. Be concise, accurate, and professional.`,
  tools: [
    sapAgent.asTool({
      toolName: "get_sap_scenario",
      toolDescription: "Fetch structured SAP process details from knowledge base.",
    }),
  ],
  outputType: SapResponseSchema,
});

// --- Theme ---
const theme = responsiveFontSizes(
  createTheme({
    palette: {
      mode: "light",
      primary: { main: "#000000", contrastText: "#ffffff" },
      background: { default: "#f4f6f8", paper: "#ffffff" },
      text: { primary: "#172b4d", secondary: "#5e6c84" },
      divider: "rgba(0, 0, 0, 0.12)",
    },
    shape: { borderRadius: 8 },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h5: { fontWeight: 700 },
      body1: { letterSpacing: "0.2px" },
    },
  })
);

// --- Typing Indicator ---
const TypingIndicator: React.FC = () => (
  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ ml: 6, mt: 2 }}>
    <Avatar sx={{ width: 36, height: 36, bgcolor: "#eeeeee", color: "#333" }}>
      <SmartToyIcon fontSize="small" />
    </Avatar>
    <Paper
      sx={{
        p: 2,
        bgcolor: "#eeeeee",
        borderRadius: "12px 12px 12px 4px",
        maxWidth: 120,
        border: "none",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      <Stack direction="row" spacing={0.5}>
        <Skeleton variant="circular" width={8} height={8} />
        <Skeleton variant="circular" width={8} height={8} animation="wave" />
        <Skeleton variant="circular" width={8} height={8} />
      </Stack>
    </Paper>
  </Stack>
);

// --- SAP Response Renderer ---
const SapResponseRenderer: React.FC<{ response: SapResponse }> = ({ response }) => (
  <Fade in timeout={600}>
    <Stack spacing={3}>
      {response.case && (
        <Typography variant="h6" fontWeight={700}>
          {response.case}
        </Typography>
      )}
      {response.text && (
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: "#f5f5f5",
            border: (theme) => `1px dashed ${theme.palette.divider}`,
            fontFamily: "monospace",
            fontSize: "0.875rem",
            whiteSpace: "pre-wrap",
          }}
        >
          {response.text}
        </Box>
      )}
      {response.steps?.map((step, i) => (
        <Accordion key={i} disableGutters elevation={0}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={600}>
              Step {step.step_number}: {step.action}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense disablePadding>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 36, color: "#0288d1" }}>
                  <CodeIcon />
                </ListItemIcon>
                <ListItemText
                  primary="T-Code"
                  secondary={step.tcodes || "—"}
                  secondaryTypographyProps={{ color: "text.secondary" }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 36, color: "#388e3c" }}>
                  <DescriptionIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Description"
                  secondary={step.sap_tcode_description || "—"}
                  secondaryTypographyProps={{ color: "text.secondary" }}
                />
              </ListItem>

              <ListItem>
                <ListItemIcon sx={{ minWidth: 36, color: "#f57c00" }}>
                  <InputIcon />
                </ListItemIcon>
                <ListItemText primary="Mandatory Fields" />
              </ListItem>
              <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ pl: 5, pb: 1 }}>
                {step.mandatory_fields?.length
                  ? step.mandatory_fields.map((f, i) => <Chip key={i} label={f} />)
                  : <Chip label="None" variant="outlined" />}
              </Stack>

              <ListItem>
                <ListItemIcon sx={{ minWidth: 36, color: "#7b1fa2" }}>
                  <OutputIcon />
                </ListItemIcon>
                <ListItemText primary="Output Fields" />
              </ListItem>
              <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ pl: 5 }}>
                {step.output_fields?.length
                  ? step.output_fields.map((f, i) => <Chip key={i} label={f} />)
                  : <Chip label="None" variant="outlined" />}
              </Stack>
            </List>
          </AccordionDetails>
        </Accordion>
      ))}
    </Stack>
  </Fade>
);

// --- Chat Message ---
const ChatMessage: React.FC<{ message: Message; index: number }> = ({ message, index }) => {
  const isUser = message.role === "user";
  return (
    <Fade in timeout={400 + index * 150}>
      <Stack
        direction={isUser ? "row-reverse" : "row"}
        spacing={2}
        sx={{
          alignItems: "flex-start",
          maxWidth: "80%",
          alignSelf: isUser ? "flex-end" : "flex-start",
        }}
      >
        <Zoom in timeout={500}>
          <Avatar
            sx={{
              bgcolor: isUser ? "primary.main" : "#eeeeee",
              color: isUser ? "primary.contrastText" : "#333333",
              width: 40,
              height: 40,
            }}
          >
            {isUser ? <PersonIcon /> : <SmartToyIcon />}
          </Avatar>
        </Zoom>

        <Paper
          elevation={isUser ? 3 : 1}
          sx={{
            p: 2,
            borderRadius: isUser ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
            bgcolor: isUser ? "primary.main" : "background.paper",
            color: isUser ? "primary.contrastText" : "text.primary",
            maxWidth: "100%",
            wordBreak: "break-word",
          }}
        >
          {typeof message.data === "string" ? (
            <Typography variant="body1">{message.data}</Typography>
          ) : (
            <SapResponseRenderer response={message.data} />
          )}
        </Paper>
      </Stack>
    </Fade>
  );
};

// --- Chat Window ---
const ChatWindow: React.FC<{ messages: Message[]; endRef: React.RefObject<HTMLDivElement>; isTyping: boolean }> = ({
  messages,
  endRef,
  isTyping,
}) => (
  <Box
    sx={{
      flex: 1,
      minWidth: "90%",
      maxWidth: "95%",
      maxHeight:"80vh",
      overflowY: "auto",
      p: { xs: 2, md: 3 },
      pb: 1,
      "&::-webkit-scrollbar": { width: 6 },
      "&::-webkit-scrollbar-thumb": { background: "#c1c1c1", borderRadius: 3 },
    }}
  >
    <Stack spacing={4} alignItems="flex-start">
      {messages.map((msg, i) => (
        <ChatMessage key={i} message={msg} index={i} />
      ))}
      {isTyping && <TypingIndicator />}
      <div ref={endRef} />
    </Stack>
  </Box>
);

// --- Chat Input ---
const ChatInput: React.FC<{
  input: string;
  setInput: (v: string) => void;
  handleSend: () => void;
  loading: boolean;
}> = ({ input, setInput, handleSend, loading }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        bgcolor: "background.paper",
        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        flexShrink: 0,
      }}
    >
      <Stack direction="row" spacing={2} alignItems="flex-end">
        <TextField
          inputRef={inputRef}
          fullWidth
          multiline
          minRows={1}
          maxRows={5}
          variant="outlined"
          placeholder="Ask about any SAP scenario..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !loading) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={loading}
        />
        <IconButton
          onClick={handleSend}
          disabled={loading || !input.trim()}
          sx={{
            width: 56,
            height: 56,
            bgcolor: input.trim() && !loading ? "primary.main" : "rgba(0,0,0,0.08)",
            color: input.trim() && !loading ? "primary.contrastText" : "rgba(0,0,0,0.3)",
            "&:hover": {
              bgcolor: input.trim() && !loading ? "#333" : "rgba(0,0,0,0.12)",
            },
          }}
        >
          {loading ? <CircularProgress size={28} color="inherit" /> : <SendIcon />}
        </IconButton>
      </Stack>
    </Box>
  );
};

// --- Main App ---
const SapHelperChatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null!);

  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const handleSend = async () => {
    const value = input.trim();
    if (!value || loading) return;
    const userMsg: Message = { role: "user", data: value };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setIsTyping(true);

    try {
      const result = await run(chatAgent, value);
      const response: SapResponse = result.finalOutput ?? {};
      const isValid = response.text || response.case || (response.steps?.length ?? 0) > 0;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          data: isValid
            ? response
            : "I couldn't find relevant SAP information. Try rephrasing your question.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", data: "Network error. Please check your connection and try again." },
      ]);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100dvh",
          bgcolor: "background.default",
          overflowY: "auto", // Fixed: allows vertical scroll
        }}
      >
        <AppBar
          elevation={0}
          sx={{
            bgcolor: "background.paper",
            color: "text.primary",
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <Toolbar>
            <SmartToyIcon sx={{ mr: 2, fontSize: 28, color: "primary.main" }} />
            <Typography variant="h6" fontWeight={700}>
              Lsoft AI Assistant
            </Typography>
          </Toolbar>
        </AppBar>

        <Container
          sx={{
            minWidth: "90%",
            maxWidth: "95%",
            flex: 1,
            p: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Paper
            elevation={3}
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              borderRadius: 3,
              m: { xs: 1, md: 2 },
            }}
          >
            <ChatWindow messages={messages} endRef={endRef} isTyping={isTyping} />
          </Paper>
          <ChatInput input={input} setInput={setInput} handleSend={handleSend} loading={loading} />
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default SapHelperChatbot;
