const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

// Secure Email Transporter (uses environment variables only)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify email transport on startup
transporter.verify((error) => {
  if (error) {
    console.error('❌ Email transporter error:', error);
  } else {
    console.log('✅ Email server ready to send messages (notifications)');
  }
});

// POST /notify/ai-workout
router.post('/ai-workout', async (req, res) => {
  try {
    const { email, name, aiWorkoutPlan } = req.body;
    if (!email || !name || !aiWorkoutPlan) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Build a styled HTML email (similar to biometricAuth.js)
    const planHtml = aiWorkoutPlan.map((workout, idx) => `
      <div style="margin-bottom:24px;padding:16px;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0;">
        <h3 style="margin:0 0 8px 0;color:#0f172a;">${workout.workoutName || workout.name || `Day ${idx+1}`}</h3>
        <div style="color:#64748b;font-size:14px;margin-bottom:8px;">${workout.day || ''} ${workout.description ? `- ${workout.description}` : ''}</div>
        <div style="font-size:13px;margin-bottom:8px;">Duration: <b>${workout.duration} min</b> | Calories: <b>${workout.calories}</b></div>
        ${workout.exercises ? `<ul style="padding-left:18px;">${workout.exercises.map(ex => `<li><b>${ex.name}</b>: ${ex.sets} sets × ${ex.reps} reps (${ex.calories} cal)</li>`).join('')}</ul>` : ''}
      </div>
    `).join('');

    const mailOptions = {
      from: `"NextGen Sports Club" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Personalized AI Workout Plan - NextGen Sports Club',
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI Workout Plan</title>
      </head>
      <body style="font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background:#f8fafc; color:#1a1a1a; margin:0; padding:0;">
        <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.08);border:1px solid #e2e8f0;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#334155 100%);padding:32px 24px;text-align:center;">
            <div style="font-size:28px;font-weight:700;color:#fff;letter-spacing:-0.5px;">NEXTGEN SPORTS CLUB</div>
            <div style="color:#94a3b8;font-size:14px;font-weight:400;text-transform:uppercase;letter-spacing:1px;">Your AI-Powered Workout Plan</div>
          </div>
          <div style="padding:32px 24px;">
            <div style="font-size:18px;font-weight:500;margin-bottom:12px;">Hello ${name},</div>
            <div style="font-size:15px;color:#64748b;margin-bottom:24px;">Here is your personalized 7-day AI-generated workout plan. Stay consistent and enjoy your fitness journey!</div>
            ${planHtml}
            <div style="margin-top:32px;font-size:13px;color:#64748b;">Need help or want to adjust your plan? Contact your coach or reply to this email.</div>
          </div>
          <div style="background:#f8fafc;padding:20px 24px;text-align:center;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
            © ${new Date().getFullYear()} NextGen Sports Club. Powered by <b>Momment X</b> AI.
          </div>
        </div>
      </body>
      </html>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'AI workout plan sent to user email!' });
  } catch (error) {
    console.error('❌ Error sending AI workout notification:', error);
    res.status(500).json({ message: 'Failed to send AI workout notification', error: error.message });
  }
});

// POST /notify/order-processing
router.post('/order-processing', async (req, res) => {
  try {
    const { email, orderId } = req.body;
    if (!email || !orderId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const mailOptions = {
      from: `"NextGen Sports Club" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Order is Processing - NextGen Sports Club',
      html: `
        <div style="font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background:#f8fafc; color:#1a1a1a; padding:32px; max-width:600px; margin:0 auto; border-radius:12px; box-shadow:0 8px 32px rgba(0,0,0,0.08); border:1px solid #e2e8f0;">
          <h2 style="color:#0f172a;">Order Processing</h2>
          <p style="font-size:16px;">Hello,</p>
          <p style="font-size:15px;">Your order <b>#{orderId}</b> is now <b>processing</b>.</p>
          <p style="font-size:15px;">Thank you for shopping with us at NextGen Sports Club!</p>
          <div style="margin-top:32px;font-size:13px;color:#64748b;">If you have any questions, reply to this email or contact support.</div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Order processing email sent!' });
  } catch (error) {
    console.error('❌ Error sending order processing notification:', error);
    res.status(500).json({ message: 'Failed to send order processing notification', error: error.message });
  }
});

module.exports = router; 