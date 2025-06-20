import { sendContactEmail } from "../utils/email.js";

export const sendContactMessage = async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ error: "name, email and message are required" });
  }
  try {
    await sendContactEmail({ name, email, message });
    res
      .status(200)
      .json({ status: "ok", message: "Your message has been sent." });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ status: "error", message: "Failed to send message." });
  }
};
