#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const args = new Set(process.argv.slice(2));
const stagedOnly = args.has("--staged");
const root = process.cwd();

const ignoreDirs = [".git", "node_modules", ".next", "dist", "out"];
const maxBytes = 1024 * 1024; // 1MB

const secretPatterns = [
  {
    id: "private_key",
    regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    message: "Private key block detected",
  },
  {
    id: "stripe_live_key",
    regex: /sk_live_[0-9a-zA-Z]{16,}/,
    message: "Stripe live secret key detected",
  },
  {
    id: "stripe_test_key",
    regex: /sk_test_[0-9a-zA-Z]{16,}/,
    message: "Stripe test secret key detected",
  },
  {
    id: "supabase_service_role_assignment",
    regex: /^\s*SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^\s#][^\r\n]*$/m,
    message: "SUPABASE_SERVICE_ROLE_KEY has a concrete value",
  },
  {
    id: "stripe_secret_assignment",
    regex: /^\s*STRIPE_SECRET_KEY\s*=\s*[^\s#][^\r\n]*$/m,
    message: "STRIPE_SECRET_KEY has a concrete value",
  },
  {
    id: "resend_assignment",
    regex: /^\s*RESEND_API_KEY\s*=\s*[^\s#][^\r\n]*$/m,
    message: "RESEND_API_KEY has a concrete value",
  },
  {
    id: "github_pat",
    regex: /ghp_[0-9A-Za-z]{20,}/,
    message: "GitHub personal access token detected",
  },
  {
    id: "google_api_key",
    regex: /AIza[0-9A-Za-z\-_]{35}/,
    message: "Google API key detected",
  },
];

function getFiles() {
  if (stagedOnly) {
    const out = execSync("git diff --cached --name-only --diff-filter=ACMR", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return out.split(/\r?\n/).map((f) => f.trim()).filter(Boolean);
  }

  const out = execSync("git ls-files", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });

  return out.split(/\r?\n/).map((f) => f.trim()).filter(Boolean);
}

function isIgnored(file) {
  const normalized = file.replace(/\\/g, "/");
  return ignoreDirs.some((dir) => normalized === dir || normalized.startsWith(`${dir}/`));
}

function isText(content) {
  return !content.includes("\u0000");
}

function scanFile(file) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) return [];

  const stat = fs.statSync(fullPath);
  if (!stat.isFile() || stat.size > maxBytes) return [];

  const raw = fs.readFileSync(fullPath, "utf8");
  if (!isText(raw)) return [];

  const findings = [];

  for (const pattern of secretPatterns) {
    if (pattern.regex.test(raw)) {
      findings.push({
        file,
        pattern: pattern.id,
        message: pattern.message,
      });
    }
  }

  return findings;
}

const files = getFiles().filter((f) => !isIgnored(f));
let findings = [];

for (const file of files) {
  findings = findings.concat(scanFile(file));
}

if (findings.length > 0) {
  console.error("\nSecret scan failed. Potential credentials detected:\n");
  for (const finding of findings) {
    console.error(`- ${finding.file}: ${finding.message} (${finding.pattern})`);
  }
  console.error("\nRemove secrets from code/history and use environment variables.");
  process.exit(1);
}

console.log(`Secret scan passed (${files.length} files checked${stagedOnly ? ", staged only" : ""}).`);
