# Email Verification Guide

## Why Email Verification?

For security reasons, buyers must verify their email address before they can view farmer contact information. This prevents spam and abuse of the platform.

## How Email Verification Works

### Development Mode (Current Setup)
In development mode, verification links are **printed to the server console** instead of being sent via email.

### Step-by-Step Process for Buyers

#### 1. Register with an Email
When you register as a buyer with an email address:
```
Name: John Buyer
Email: john@example.com
Phone: 9876543210
Role: buyer
Password: YourPassword123!
```

#### 2. Check the Server Console
After registration, look at your **terminal/PowerShell window** where the server is running. You'll see a line like:
```
Verification link: http://localhost:4000/api/auth/verify/abc123def456...
```

#### 3. Click or Copy the Verification Link
- **Option A**: Hold Ctrl (Windows/Linux) or Cmd (Mac) and click the link in the terminal
- **Option B**: Copy the entire URL and paste it into your browser

#### 4. Verify Your Email
When you visit the verification link, you'll see:
```
✅ Email verified successfully!
You can now access all features.
[Login]
```

#### 5. Login Again (if needed)
If you were already logged in:
- The system might need you to **logout and login again** to refresh your session with the verified status
- Simply go to `/login.html` and login with your email/phone and password

#### 6. Now You Can View Contact Info
After verification, when you click "Contact Farmer" on any crop listing, you'll see:
```
Demo Farmer
Phone: 9999XXXX
Email: farmer@example.com
Location: DemoVillage
```

---

## Alternative: Register WITHOUT an Email

If you register as a buyer **without providing an email**, you'll be considered automatically verified and can view contact information immediately:

```
Name: Jane Buyer
Email: [leave empty]
Phone: 9876543210
Role: buyer
Password: YourPassword123!
```

---

## Resend Verification Link

If you lost the verification link or it expired (24-hour validity):

1. Login as the buyer
2. Go to `/buyer.html`
3. You'll see a **yellow warning banner** at the top
4. Click the **"Resend Verification Email"** button
5. Check the server console again for the new verification link

---

## Troubleshooting

### "Please verify your email before viewing contact information"
**Solution**: Follow steps 2-5 above to complete verification.

### "Invalid or expired verification link"
**Solution**: The link is only valid for 24 hours. Use the "Resend Verification Email" button on the buyer dashboard.

### "Email already verified"
**Solution**: You're already verified! If you still can't view contact info:
1. Logout from `/login.html`
2. Login again to refresh your session
3. The verification status should now be recognized

### Can't see the verification link in console
**Solution**: Make sure:
1. Your server is running (`npm run dev`)
2. You're looking at the **correct terminal window**
3. The link appears immediately after registration
4. You can scroll up in the terminal to find older verification links

---

## Production Setup (Future)

In production, you would:
1. Configure an SMTP email service (Gmail, SendGrid, AWS SES, etc.)
2. Install nodemailer: `npm install nodemailer`
3. Update `src/routes/auth.js` and `src/routes/settings.js` to send actual emails
4. Users receive verification links in their inbox instead of the console

---

## Quick Test Flow

### Test with Verification (Email)
```powershell
# 1. Register a buyer with email
POST http://localhost:4000/api/auth/register
Body: {"name":"Test Buyer","email":"test@example.com","phone":"9999999999","role":"buyer","password":"Pass123!"}

# 2. Check console for verification link
# Look for: Verification link: http://localhost:4000/api/auth/verify/...

# 3. Visit the verification link in browser

# 4. Login and view crops
```

### Test without Verification (No Email)
```powershell
# 1. Register a buyer without email
POST http://localhost:4000/api/auth/register
Body: {"name":"Quick Buyer","phone":"8888888888","role":"buyer","password":"Pass123!"}

# 2. Login and view crops immediately (no verification needed)
```

---

## Summary

- ✅ **With Email**: Register → Check console → Click verification link → Login → View contacts
- ✅ **Without Email**: Register → View contacts immediately
- ⚠️ Verification links expire after 24 hours
- 🔄 Use "Resend Verification Email" button if needed
- 🚀 In production, emails would be sent automatically (not console-based)
