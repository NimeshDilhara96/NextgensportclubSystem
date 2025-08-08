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

// POST /notify/order-summary
router.post('/order-summary', async (req, res) => {
  try {
    const { email, order } = req.body;
    if (!email || !order) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Build products HTML
    const productsHtml = order.products.map(item => `
      <li style="margin-bottom:8px;">
        <b>${item.name || item.product?.name || item.product}</b> x${item.quantity}
        ${item.price ? `- $${item.price}` : (item.product?.price ? `- $${item.product.price}` : '')}
      </li>
    `).join('');

    const mailOptions = {
      from: `"NextGen Sports Club" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Order Summary - Order #${order._id} - NextGen Sports Club`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Summary - NextGen Sports Club</title>
  <style>
    body {
      font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f8fafc;
      color: #1a1a1a;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.08);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
      padding: 32px 24px;
      text-align: center;
      color: #fff;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }
    .tagline {
      color: #94a3b8;
      font-size: 14px;
      font-weight: 400;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .main-content {
      padding: 32px 24px;
    }
    .order-info {
      font-size: 16px;
      margin-bottom: 16px;
    }
    .products-list {
      padding-left: 18px;
      margin-bottom: 16px;
    }
    .total {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 24px;
    }
    .footer {
      background: #f8fafc;
      padding: 20px 24px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #94a3b8;
    }
    @media (max-width: 600px) {
      .container { margin: 0; border-radius: 0; }
      .header, .main-content, .footer { padding: 16px !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">NEXTGEN SPORTS CLUB</div>
      <div class="tagline">Order Confirmation</div>
    </div>
    <div class="main-content">
      <h2 style="color:#0f172a;">Order Summary</h2>
      <div class="order-info"><b>Order ID:</b> ${order._id}</div>
      <div class="order-info"><b>Address:</b> ${order.address}</div>
      <div class="order-info"><b>Phone:</b> ${order.phone}</div>
      <div class="order-info"><b>Email:</b> ${order.email}</div>
      <div class="order-info"><b>Status:</b> ${order.status}</div>
      <h4 style="margin-top:24px;margin-bottom:8px;">Products</h4>
      <ul class="products-list">
        ${productsHtml}
      </ul>
      <div class="total"><b>Total:</b> $${order.total}</div>
      <div style="margin-top:32px;font-size:13px;color:#64748b;">
        Thank you for shopping with NextGen Sports Club!
      </div>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} NextGen Sports Club. Powered by <b>Momment X</b>.
    </div>
  </div>
</body>
</html>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Order summary email sent!' });
  } catch (error) {
    console.error('❌ Error sending order summary email:', error);
    res.status(500).json({ message: 'Failed to send order summary email', error: error.message });
  }
});

// POST /notify/booking
router.post('/booking', async (req, res) => {
  try {
    const { email, name, facilityName, startTime, endTime } = req.body;
    if (!email || !name || !facilityName || !startTime || !endTime) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const mailOptions = {
      from: `"NextGen Sports Club" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Facility Booking Confirmation - ${facilityName} - NextGen Sports Club`,
      html: `
        <div style="font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background:#f8fafc; color:#1a1a1a; padding:32px; max-width:600px; margin:0 auto; border-radius:12px; box-shadow:0 8px 32px rgba(0,0,0,0.08); border:1px solid #e2e8f0;">
          <h2 style="color:#0f172a;">Booking Confirmed!</h2>
          <p style="font-size:16px;">Hello <b>${name}</b>,</p>
          <p style="font-size:15px;">Your booking for <b>${facilityName}</b> is confirmed.</p>
          <div style="margin:18px 0 24px 0; padding:16px; background:#e0f2fe; border-radius:8px;">
            <div><b>Start:</b> ${new Date(startTime).toLocaleString()}</div>
            <div><b>End:</b> ${new Date(endTime).toLocaleString()}</div>
          </div>
          <div style="margin-top:32px;font-size:13px;color:#64748b;">If you have any questions or need to cancel, please reply to this email or contact support.</div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Booking confirmation email sent!' });
  } catch (error) {
    console.error('❌ Error sending booking confirmation email:', error);
    res.status(500).json({ message: 'Failed to send booking confirmation email', error: error.message });
  }
});

// POST /notify/ai-meal-plan
router.post('/ai-meal-plan', async (req, res) => {
  try {
    const { email, name, mealPlan } = req.body;
    
    if (!email || !name || !mealPlan) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    console.log(`Sending meal plan to ${email} for user ${name}`);

    // Generate HTML for meal plan
    const mealPlanHtml = mealPlan.map((day, index) => {
      const dayMeals = Object.entries(day.meals).map(([type, meal]) => `
        <div style="margin:16px 0;padding:16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
          <h4 style="margin:0 0 8px 0;color:#334155;">${type.charAt(0).toUpperCase() + type.slice(1)}</h4>
          <p style="font-weight:600;color:#0f172a;margin:4px 0;">${meal.recipe.label}</p>
          <div style="margin-top:8px;color:#475569;">
            <div><b>Calories:</b> ${Math.round(meal.recipe.calories)}</div>
            <div><b>Protein:</b> ${Math.round(meal.recipe.totalNutrients.PROCNT.quantity)}g</div>
            <div><b>Fat:</b> ${Math.round(meal.recipe.totalNutrients.FAT.quantity)}g</div>
            <div><b>Carbs:</b> ${Math.round(meal.recipe.totalNutrients.CHOCDF.quantity)}g</div>
          </div>
        </div>
      `).join('');

      return `
        <div style="margin-bottom:24px;">
          <h3 style="color:#0f172a;margin-bottom:16px;border-bottom:1px solid #e2e8f0;padding-bottom:8px;">Day ${day.day + 1}</h3>
          ${dayMeals}
        </div>
      `;
    }).join('');

    const mailOptions = {
      from: `"NextGen Sports Club" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Personalized Meal Plan - NextGen Sports Club',
      html: `
        <div style="font-family:'Inter','Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
          <h2 style="color:#0f172a;margin-bottom:24px;">Your Personalized Meal Plan</h2>
          <p style="font-size:16px;margin-bottom:24px;">Hello <b>${name}</b>,</p>
          <p style="font-size:15px;margin-bottom:32px;">Here's your AI-generated 7-day Sri Lankan meal plan, designed to meet your nutritional needs.</p>
          
          ${mealPlanHtml}
          
          <div style="margin-top:40px;padding-top:24px;border-top:1px solid #e2e8f0;color:#64748b;font-size:14px;">
            <p>If you have any questions about your meal plan, please contact our nutrition experts.</p>
            <p>Stay healthy!</p>
            <p style="margin-top:24px;font-size:12px;">© ${new Date().getFullYear()} NextGen Sports Club</p>
          </div>
        </div>
      `
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log(`Meal plan sent successfully to ${email}`);
    
    res.status(200).json({ message: 'Meal plan sent successfully' });
  } catch (error) {
    console.error('Error sending meal plan email:', error);
    res.status(500).json({ message: 'Failed to send meal plan email', error: error.message });
  }
});














module.exports = router;