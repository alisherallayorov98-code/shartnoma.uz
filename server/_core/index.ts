import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "../routers/context";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// tRPC API
app.use(
    "/api/trpc",
    createExpressMiddleware({
          router: appRouter,
          createContext,
    })
  );

// Health check
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
});

// Serve static files in production
if (process.env.NODE_ENV === "production") {
    const distPath = path.resolve(__dirname, "../../dist/public");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
          res.sendFile(path.join(distPath, "index.html"));
    });
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
