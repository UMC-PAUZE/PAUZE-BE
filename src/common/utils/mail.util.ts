import { randomInt } from "node:crypto";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

const SMTP_CONNECTION_TIMEOUT_MS = 10_000;
const SMTP_SOCKET_TIMEOUT_MS = 10_000;

let transporter: Transporter | null = null;

function getSmtpPass(): string {
  // App passwords may include regular or NBSP spaces — normalize to ASCII spaces then strip
  return (process.env.SMTP_PASS ?? "").replace(/\s+/g, "");
}

function getTransporter(): Transporter {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST ?? "smtp.gmail.com";
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = getSmtpPass();

  if (!user || !pass) {
    throw new Error("SMTP_USER and SMTP_PASS must be set");
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: SMTP_CONNECTION_TIMEOUT_MS,
    socketTimeout: SMTP_SOCKET_TIMEOUT_MS,
  });

  return transporter;
}

export async function sendVerificationEmail(
  to: string,
  code: string
): Promise<void> {
  const from =
    process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "testpauze@gmail.com";
  const mailTransporter = getTransporter();

  await mailTransporter.sendMail({
    from,
    to,
    subject: "[PAUZE] 이메일 인증코드",
    text: `인증코드: ${code}\n\n5분 이내에 입력해주세요.`,
    html: `<p>인증코드: <strong>${code}</strong></p><p>5분 이내에 입력해주세요.</p>`,
  });
}

export function generateVerificationCode(): string {
  return String(randomInt(100000, 1000000));
}
