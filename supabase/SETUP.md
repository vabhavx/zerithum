# Supabase Setup Instructions

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Name it "zerithum" (or your preferred name)
4. Set a strong database password (save this!)
5. Choose a region close to your users
6. Click "Create new project"

## Step 2: Get Your API Keys

After project creation:
1. Go to **Settings** → **API**
2. Copy these values:
   - `Project URL` → This is your `VITE_SUPABASE_URL`
   - `anon public` key → This is your `VITE_SUPABASE_ANON_KEY`

## Step 3: Run the Database Schema

1. Go to **SQL Editor** in Supabase dashboard
2. Copy the contents of `supabase/schema.sql`
3. Paste and click "Run"
4. Verify all tables are created in **Table Editor**

## Step 4: Configure Authentication

1. Go to **Authentication** → **Providers**
2. Enable providers you need:
   - Email (enabled by default)
   - Google (optional)
   - GitHub (optional)
3. Go to **Authentication** → **URL Configuration**
4. Add your site URL and redirect URLs:
   - Site URL: `https://zerithum.com`
   - Redirect URLs: `https://zerithum.com/auth/callback`

## Step 5: Set Up Storage (for receipts)

1. Go to **Storage**
2. Click "New bucket"
3. Name: `receipts`
4. Make it public (or configure RLS for private)

## Step 6: Update Environment Variables

Add to your `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 7: Install Supabase SDK

```bash
npm install @supabase/supabase-js
```

## Step 8: Switch from Base44 to Supabase

Replace in your code:
```javascript
// OLD
import { base44 } from '@/api/base44Client';

// NEW
import { base44Compatible as base44 } from '@/api/supabaseClient';
```

Or do a global find/replace in `src/`:
```
Find:    '@/api/base44Client'
Replace: '@/api/supabaseClient'

Find:    base44
Replace: base44Compatible
```

## Step 9: Deploy Edge Functions

Supabase Edge Functions replace Base44 serverless functions.
See `supabase/functions/` directory for implementations.

---

## Quick Verification

After setup, test in browser console:
```javascript
import { supabase } from './api/supabaseClient';
const { data } = await supabase.from('profiles').select('*');
console.log(data);
```
