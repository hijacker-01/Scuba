# 🗄️ Advanced Setup Guide - Database & Email Integration

## Part 1: MongoDB Setup (Database)

### Why MongoDB?
- Cloud-hosted (no server management)
- Free tier available (500MB storage)
- Automatic backups
- Scalable
- Perfect for Node.js applications

### Step 1: Create MongoDB Account

1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Sign Up" (or "Sign In" if you have account)
3. Create free account
4. Complete email verification

### Step 2: Create a Cluster

1. Click "Create" to build a cluster
2. Choose **Free Tier** (M0 - always free)
3. Select your region (choose closest to Andaman - Asia)
4. Click "Create Cluster" and wait 2-3 minutes

### Step 3: Create Database User

1. Go to "Database Access"
2. Click "Add New Database User"
3. Create username (e.g., `havelock_admin`)
4. Choose "Password" authentication
5. Generate secure password (copy it!)
6. Add user with `readWriteAnyDatabase` role

### Step 4: Allow Network Access

1. Go to "Network Access"
2. Click "Add IP Address"
3. Select "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### Step 5: Get Connection String

1. Click "Connect" button
2. Choose "Connect your application"
3. Select "Node.js" driver
4. Copy the connection string
5. Replace `<username>` and `<password>` with your credentials
6. Replace `<database>` with `havelock-dive-club`

**Example:**
```
mongodb+srv://havelock_admin:MySecurePassword123@cluster0.abc123.mongodb.net/havelock-dive-club?retryWrites=true&w=majority
```

### Step 6: Add to Environment

```bash
# .env.local
MONGODB_URI=mongodb+srv://havelock_admin:MySecurePassword123@cluster0.abc123.mongodb.net/havelock-dive-club?retryWrites=true&w=majority
```

### Step 7: Install Mongoose

```bash
npm install mongoose
```

### Step 8: Test Connection

Create a test file to verify connection:

```typescript
// lib/db.ts
import mongoose from 'mongoose';

export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}
```

---

## Part 2: Email Service Setup

### Option A: Gmail (RECOMMENDED for Testing)

Gmail is free and works great for small applications. Perfect for Havelock Dive Club!

#### Step 1: Enable 2-Factor Authentication

1. Go to https://myaccount.google.com
2. Click "Security" in left menu
3. Under "Signing in to Google", enable "2-Step Verification"
4. Follow the prompts

#### Step 2: Generate App Password

1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer"
3. Google generates a 16-character password
4. **Copy this password** (never share it!)

#### Step 3: Add to Environment

```bash
# .env.local
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx  (your 16-char password)
SMTP_FROM=noreply@havelockdiveclub.com
```

#### Step 4: Install Nodemailer

```bash
npm install nodemailer
npm install -D @types/nodemailer
```

#### Step 5: Test Email

Create test file:

```typescript
// lib/test-email.ts
import { sendEmail } from './email';

export async function testEmail() {
  await sendEmail({
    to: 'your-email@gmail.com',
    subject: 'Test Email',
    html: '<h1>✅ Email working!</h1>',
  });
}
```

---

### Option B: SendGrid (Professional)

For production, SendGrid is more reliable.

#### Step 1: Create SendGrid Account

1. Go to https://sendgrid.com
2. Sign up for free account
3. Verify email
4. Complete account setup

#### Step 2: Get API Key

1. Go to "Settings" → "API Keys"
2. Click "Create API Key"
3. Choose "Full Access"
4. Copy the key

#### Step 3: Configure

```bash
# .env.local
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxx
```

#### Step 4: Verify Sender Email

1. Go to "Settings" → "Sender Authentication"
2. Add your email: `info@havelockdiveclub.com`
3. Follow verification steps

---

### Option C: AWS SES (Enterprise)

For high-volume sending (1000+ emails/day).

#### Step 1: Create AWS Account

1. Go to https://aws.amazon.com
2. Sign up or login
3. Complete account setup

#### Step 2: Setup SES

1. Go to "Simple Email Service"
2. Add verified email address
3. Request production access (takes 24-48 hours)

#### Step 3: Create SMTP Credentials

1. Go to "Account Dashboard"
2. Create SMTP credentials
3. Copy username and password

#### Step 4: Configure

```bash
# .env.local
SMTP_HOST=email-smtp.region.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
```

---

## Part 3: Sending Emails

### Automatic Booking Confirmation

Emails are sent automatically when booking is created:

```typescript
// app/api/bookings/route.ts
await sendBookingConfirmation(email, {
  name,
  activity,
  date,
  participants,
  totalPrice,
});
```

### Manual Email Sending

```typescript
import { sendEmail } from '@/lib/email';

// Send custom email
await sendEmail({
  to: 'customer@example.com',
  subject: 'Your Booking Details',
  html: '<h1>Welcome!</h1><p>Your booking is confirmed.</p>',
});
```

### Email Templates

Pre-built templates included:

1. **Booking Confirmation** - Sent after booking
2. **Payment Receipt** - Sent after payment
3. **Cancellation** - Sent when booking cancelled
4. **Reminder** - Sent 24 hours before activity

---

## Part 4: Testing Everything

### Test Database Connection

```bash
# In app/page.tsx or test file
import { connectDB } from '@/lib/db';

async function test() {
  try {
    await connectDB();
    console.log('✅ Database connected!');
  } catch (error) {
    console.error('❌ Database failed:', error);
  }
}
```

### Test Email Service

```bash
# In app/api/test/email/route.ts
import { testEmailConnection } from '@/lib/email';

export async function GET() {
  const connected = await testEmailConnection();
  return Response.json({ connected });
}

# Then visit: http://localhost:3000/api/test/email
```

### Test Full Booking Flow

1. Fill booking form
2. Check database for booking created
3. Check email for confirmation sent
4. Verify payment processing

---

## Part 5: Troubleshooting

### MongoDB Issues

**"Cannot connect to database"**
- Check MONGODB_URI is correct
- Verify IP address is whitelisted
- Check username/password
- Ensure cluster is running

**"Connection timeout"**
- Check internet connection
- Verify IP in Network Access
- Try from different location
- Check MongoDB Atlas status

### Email Issues

**"SMTP authentication failed"**
- Check SMTP_USER and SMTP_PASSWORD are correct
- For Gmail: use 16-character app password (not regular password)
- For SendGrid: ensure API key is correct
- Check SMTP_HOST matches provider

**"Email not arriving"**
- Check spam folder
- Verify recipient email address
- Check sender address is verified
- Wait 1-2 minutes (sometimes delayed)

**"TLS/SSL errors"**
- Ensure SMTP_SECURE matches your provider
- Gmail: SMTP_SECURE=false
- Other providers: check documentation

---

## Part 6: Production Considerations

### Database Security

✅ Use strong passwords (20+ characters)
✅ Enable IP whitelisting (not 0.0.0.0/0)
✅ Use MongoDB backups
✅ Monitor database usage
✅ Set up alerts for unusual activity

### Email Security

✅ Use dedicated email address (noreply@)
✅ Configure SPF, DKIM, DMARC records
✅ Never share API keys
✅ Rotate keys monthly
✅ Monitor email delivery rates

### Monitoring

Set up monitoring for:
- Database uptime
- Email delivery failures
- Query performance
- Disk space usage

Recommended services:
- **MongoDB Atlas**: Built-in monitoring
- **SendGrid/SES**: Email analytics
- **Sentry**: Error tracking
- **UptimeRobot**: Service monitoring

---

## Part 7: Scaling

### Database Scaling

MongoDB automatically scales. When you need more:
1. Upgrade from Free (M0) to Shared (M2, M5)
2. Then to Dedicated (M10+)
3. Costs start at $57/month for M2

### Email Scaling

- **Gmail**: Limit ~1500 emails/day
- **SendGrid**: 100,000 free emails/month
- **AWS SES**: 62,000 emails/month free

For Havelock Dive Club (starting out), Gmail or SendGrid is perfect!

---

## Quick Reference

### Environment Variables Needed

```bash
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx

# Admin
ADMIN_API_KEY=your-secure-key

# Optional
NEXT_PUBLIC_GA_ID=G-XXXXXX
```

### Commands to Run

```bash
# Install dependencies
npm install mongoose nodemailer

# Add types
npm install -D @types/nodemailer

# Test database
curl http://localhost:3000/api/health

# View bookings (admin)
curl -H "Authorization: Bearer YOUR_ADMIN_KEY" \
  http://localhost:3000/api/bookings
```

---

## Support

**MongoDB Help**
- Docs: https://docs.mongodb.com
- Support: https://support.mongodb.com

**Email Help**
- Gmail: https://support.google.com
- SendGrid: https://sendgrid.com/docs
- AWS SES: https://docs.aws.amazon.com/ses

**General Help**
- Nodemailer: https://nodemailer.com
- Mongoose: https://mongoosejs.com

---

**You're all set!** Your Havelock Dive Club website now has:
✅ Professional database (MongoDB)
✅ Email notifications
✅ Booking management
✅ Admin dashboard

Happy coding! 🌊
