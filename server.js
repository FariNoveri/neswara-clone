import express from 'express';
import cors from 'cors';
import axios from 'axios'; // Tambah dependensi axios untuk HTTP request

const app = express();
app.use(express.json());
app.use(cors());

const SECRET_KEY = '6LdUQGorAAAAABPbq4UtcCQt_VsIgC2yoVVRX6zy'; // Secret key baru

async function verifyRecaptcha(token) {
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

    const data = response.data;
    if (data.success) {
      console.log('reCAPTCHA verified, score not applicable for v2');
      return { success: true };
    } else {
      console.log('reCAPTCHA verification failed:', data['error-codes']);
      return { success: false, message: data['error-codes'].join(', ') };
    }
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return { success: false, message: 'Server error' };
  }
}

app.post('/api/verify-recaptcha', async (req, res) => {
  const { token, action } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: 'No token provided' });
  }

  const result = await verifyRecaptcha(token);
  res.json(result);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});