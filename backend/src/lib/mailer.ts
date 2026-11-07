import nodemailer from "nodemailer";
import { config } from "../config.js";

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 15_000,
});

interface TemporaryPasswordEmail {
  to: string;
  name: string;
  organizationName: string;
  temporaryPassword: string;
}

export async function sendTemporaryPasswordEmail(input: TemporaryPasswordEmail): Promise<void> {
  const org = input.organizationName.replace(/\s+/g, " ");
  await transporter.sendMail({
    from: config.mailFrom,
    to: input.to,
    subject: `Your SliqDesk account for ${org}`,
    text: [
      `Hi ${input.name},`,
      "",
      `An administrator has set up a SliqDesk account for you in ${org}.`,
      "",
      `Log in at: ${config.appUrl}/login`,
      `Email: ${input.to}`,
      `Temporary password: ${input.temporaryPassword}`,
      "",
      "You will be asked to choose a new password right after you log in.",
    ].join("\n"),
  });
}
