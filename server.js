import express from 'express';
import cors from 'cors';
import axios from 'axios';
import chalk from 'chalk';
import dotenv from 'dotenv';

dotenv.config();

console.clear();
console.log(chalk.greenBright('[Backend] Menjalankan server...'));

const app = express();
app.use(express.json());
app.use(cors());

const SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

async function verifyRecaptcha(token) {
  console.log('[Backend] Verifying reCAPTCHA with token:', token);
  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: SECRET_KEY,
          response: token,
        },
      }
    );
    console.log('[Backend] Google reCAPTCHA response:', response.data);
    const data = response.data;
    if (data.success) {
      return { success: true, message: 'reCAPTCHA verified' };
    } else {
      return { success: false, message: data['error-codes']?.join(', ') || 'Verification failed' };
    }
  } catch (error) {
    console.error('[Backend] reCAPTCHA error:', error.response?.data || error.message);
    return { success: false, message: 'Server error during reCAPTCHA verification' };
  }
}

app.post('/verify-recaptcha', async (req, res) => {
  console.log('[Backend] Request body:', req.body);
  const { token } = req.body;
  if (!token) return res.status(400).json({ success: false, message: 'No token provided' });

  const result = await verifyRecaptcha(token);
  res.status(result.success ? 200 : 400).json(result);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(chalk.greenBright(`[Backend] Server aktif di http://localhost:${PORT}`));
});

process.on('SIGINT', () => {
  console.clear();
  console.log(chalk.redBright('🛑 Backend dihentikan.\n'));
  process.exit();
});
