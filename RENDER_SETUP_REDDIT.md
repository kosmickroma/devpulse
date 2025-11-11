# How to Add Reddit Credentials to Render

## The Problem
Reddit spider needs 4 environment variables to work. They're in your local `.env` but NOT on Render server.

## The Solution - Add Environment Variables

### Step 1: Go to Render Dashboard
https://dashboard.render.com

### Step 2: Find Your API Service
Look for: `devpulse-api` or whatever your backend is called

### Step 3: Click "Environment" Tab

### Step 4: Add These 4 Variables

Click "Add Environment Variable" for each:

**Variable 1:**
- Key: `REDDIT_CLIENT_ID`
- Value: `gGb0KcUetoLVwZQEAHfDFg`

**Variable 2:**
- Key: `REDDIT_CLIENT_SECRET`
- Value: `61SotJGF8Zy5HMpYsn2VVZfkcrQINQ`

**Variable 3:**
- Key: `REDDIT_USERNAME`
- Value: `kosmickroma`

**Variable 4:**
- Key: `REDDIT_PASSWORD`
- Value: `P@nam2022`

### Step 5: Save Changes
Click "Save Changes" button at bottom

### Step 6: Wait for Redeploy
Render will automatically redeploy (takes ~2-3 minutes)

## Testing
After redeploy completes:
1. Go to your DevPulse site
2. Type `scan reddit` in terminal
3. Should now show Reddit posts!

---

## Why Stocks & Crypto Might Also Not Work

These DON'T need credentials, but might be failing for other reasons:
- API endpoint changes (Yahoo/CoinGecko changed their URLs)
- Rate limiting
- The spiders have bugs

We can debug those AFTER Reddit is working.
