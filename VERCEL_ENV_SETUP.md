# Vercel Environment Variables Configuration - Quick Reference

## ⚠️ CRITICAL: Follow These Steps Exactly

This guide will take you through configuring the Vercel environment variables needed for the Techveons platform to work in production.

---

## Step-by-Step Instructions

### Step 1: Go to Vercel Project Settings
1. Open https://vercel.com/dashboard
2. Select your project: **Techveons** (or TC-Portal)
3. Click **Settings** (gear icon)

### Step 2: Navigate to Environment Variables
1. Click **Environment Variables** in the left sidebar
2. You should see a section: **Environment Variables**

### Step 3: Select Production Environment
**⚠️ IMPORTANT**: Make sure you're adding to **Production**, not Development
- Look for a dropdown that says **Production**, **Preview**, **Development**
- Select **Production** only

### Step 4: Copy and Paste Each Variable

For each variable below:
1. Click **Add New**
2. Copy the **Name** (left side of form)
3. Copy the **Value** (right side of form)
4. **Environment**: Must be **Production**
5. Click **Add**
6. Repeat for next variable

---

## Variables to Add (Copy Exactly)

### Variable 1: DATABASE_URL
**Name**:
```
DATABASE_URL
```

**Value**:
```
postgresql://postgres.czfkgqvewrouqwzxmxhi:tcportal@2026@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Environment**: Production

---

### Variable 2: DIRECT_URL
**Name**:
```
DIRECT_URL
```

**Value**:
```
postgresql://postgres.czfkgqvewrouqwzxmxhi:tcportal@2026@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres
```

**Environment**: Production

---

### Variable 3: JWT_SECRET
**Name**:
```
JWT_SECRET
```

**Value**:
```
dev-jwt-secret-key-1234567890-techveons
```

**Environment**: Production

⚠️ Note: Change this in production for security

---

### Variable 4: ADMIN_EMAIL
**Name**:
```
ADMIN_EMAIL
```

**Value**:
```
rishva448@gmail.com
```

**Environment**: Production

---

### Variable 5: ADMIN_PASSWORD
**Name**:
```
ADMIN_PASSWORD
```

**Value**:
```
Phoenixzz@2010
```

**Environment**: Production

---

### Variable 6: NEXT_PUBLIC_SUPABASE_URL
**Name**:
```
NEXT_PUBLIC_SUPABASE_URL
```

**Value**:
```
https://czfkgqvewrouqwzxmxhi.supabase.co
```

**Environment**: Production

---

### Variable 7: NEXT_PUBLIC_SUPABASE_ANON_KEY
**Name**:
```
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Value**:
```
sb_publishable_niSSixs5iML0jPEVBKJRqA_wxCJIX6t
```

**Environment**: Production

---

## After Adding All Variables

1. **Scroll to bottom** of Environment Variables page
2. **Verify** all 7 variables are listed with green checkmarks
3. **Redeploy**: Click **Deployments** tab → Click your latest deployment → Click **Redeploy**
4. **Wait** for deployment to complete (5-10 minutes)
5. **Check status**: Should show "✓ Ready"

---

## Verification Checklist

After deployment completes:

- [ ] Visit your Vercel URL (shown in Deployments)
- [ ] Page should load without errors
- [ ] Go to `/login` 
- [ ] Try login with email: `rishva448@gmail.com` and password: `Phoenixzz@2010`
- [ ] Should successfully login and see admin dashboard
- [ ] Dashboard should display real data from database
- [ ] No "Internal Server Error" messages

---

## If Login Fails

**Check #1**: Environment variables are in Production (not Development)
- Vercel Settings → Environment Variables → Check "Production" column has values

**Check #2**: Redeploy needed
- Just adding env vars to Vercel dashboard doesn't update running deployment
- Go to Deployments → Click your latest → Click "Redeploy"
- Wait for new deployment to finish

**Check #3**: Variable typos
- DATABASE_URL: Check password doesn't have typos
- JWT_SECRET: Must match exactly
- ADMIN_EMAIL: Exactly as shown

**Check #4**: Vercel logs
- Deployments → Click latest deployment
- Scroll down to "Runtime Logs"
- Look for database connection errors
- Look for environment variable undefined errors

---

## Common Mistakes

❌ **Mistake 1**: Adding to Development environment instead of Production
- **Fix**: Delete variables from Development, add to Production only

❌ **Mistake 2**: Not redeploying after adding variables
- **Fix**: Go to Deployments → Click latest deployment → Redeploy

❌ **Mistake 3**: Typos in variable names or values
- **Fix**: Copy exactly from above (spaces, punctuation matter)

❌ **Mistake 4**: Using .env.production file in Git
- **Fix**: .env files should never be committed
- **Correct way**: Use Vercel dashboard only

---

## If Everything is Correct and Still Fails

1. **Clear cache**: Vercel Deployments → Click latest → Re-build
2. **Check database**: Login to Supabase → Verify tables exist
3. **Test locally**: Run `npm run build && npm run start` on your machine
4. **Review logs**: Check Vercel runtime logs for specific error
5. **Contact support**: If still stuck, get Vercel support with deployment link

---

## Security Reminders

🔒 **These are Production Secrets**
- Do NOT share these values
- Do NOT commit to Git
- Do NOT post in Slack/Teams
- Only store in Vercel dashboard

🔒 **Before going to Production**
- Change JWT_SECRET to a secure random string
- Change ADMIN_PASSWORD to a strong password
- Use strong admin email (not demo email)

🔒 **Monitor Production**
- Check Vercel logs regularly
- Monitor database connections
- Look for unusual activity

---

## Summary

1. ✅ Go to Vercel Project Settings
2. ✅ Click Environment Variables
3. ✅ Select Production environment
4. ✅ Add 7 variables from above
5. ✅ Redeploy
6. ✅ Test login
7. ✅ Verify dashboard loads

**Time Required**: 5-10 minutes
**Difficulty**: Easy (copy/paste)
**Success Rate**: 100% if instructions followed exactly

---

**Ready to Deploy?** Follow steps above then test login. 🚀
