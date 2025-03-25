import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { router as apiRouter, errorHandler } from "../api";
import * as contractService from "../api/contract";
import cors from "cors";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply CORS middleware
  app.use(cors());

  // Initialize contract when server starts
  try {
    await contractService.initializeContract();
    console.log("Smart contract initialized successfully");
  } catch (error) {
    console.error("Failed to initialize smart contract:", error);
  }

  // Serve API documentation
  const docsPath = path.join(process.cwd(), "docs");
  app.use("/docs", (req, res, next) => {
    // Check if this is the docs root and redirect to api-reference.html
    if (req.path === '/' || req.path === '') {
      return res.redirect("/docs/api-reference.html");
    }
    next();
  }, express.static(docsPath));

  // Register API routes
  app.use("/api", apiRouter);

  // Apply API error handler after all routes
  app.use(errorHandler);

  const httpServer = createServer(app);

  return httpServer;
}
