# 📂 STEP 2: Update .env File

Please follow these steps carefully:

## Step-by-Step Instructions

### 1. Open Your Project Root Folder

Navigate to the main project folder where `package.json` is located. This is your **project root**.

You should see files/folders like:
- `package.json`
- `vite.config.js` (or `webpack.config.js`)
- `src/` folder
- `public/` folder
- `.gitignore`

### 2. Locate or Create the .env File

Look for a file named exactly **`.env`** (with a dot at the start, no extension)

**If the file EXISTS:**
- Open it in your code editor

**If the file DOES NOT EXIST:**
- Create a new file
- Name it exactly: `.env` (no other extension like `.txt` or `.local`)
- Open it in your code editor

> **Tip**: The `.env` file is a "hidden file" on some systems. If you don't see it in your file browser, try:
> - VS Code: Press `Ctrl+H` to show hidden files
> - File Explorer: Enable "Show hidden files" in View options

### 3. Add the Environment Variable

Copy and paste this exact line into your `.env` file:

```
VITE_DROPBOX_APP_KEY=your_actual_app_key_here
```

> **For Vite projects**: Use `VITE_` prefix  
> **For Create React App**: Use `REACT_APP_` prefix instead

### 4. Replace the Placeholder with Your Real Key

Replace `your_actual_app_key_here` with the **Dropbox App Key** you copied in Step 1.

**Example:**
```
VITE_DROPBOX_APP_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Your .env file should now contain:**
- Exactly one line
- Your Dropbox App Key (no quotes, no spaces)
- No other text or comments

### 5. Save the File

Press **Ctrl+S** (Windows) or **Cmd+S** (Mac) to save.

Confirm the file is saved (no unsaved indicator in editor).

---

## ⚠️ Common Mistakes to Avoid

### ❌ Mistake 1: Adding Quotes

**Wrong:**
```
VITE_DROPBOX_APP_KEY="a1b2c3d4e5f6"
```

**Correct:**
```
VITE_DROPBOX_APP_KEY=a1b2c3d4e5f6
```

### ❌ Mistake 2: Spaces Around the = Sign

**Wrong:**
```
VITE_DROPBOX_APP_KEY = a1b2c3d4e5f6
```

**Correct:**
```
VITE_DROPBOX_APP_KEY=a1b2c3d4e5f6
```

### ❌ Mistake 3: Wrong Filename

**Wrong filenames:**
- `.env.txt` ❌
- `env` ❌
- `.ENV` ❌
- `.env.local` ❌ (unless specifically needed)

**Correct filename:**
- `.env` ✅

### ❌ Mistake 4: Extra Spaces in the Value

**Wrong:**
```
VITE_DROPBOX_APP_KEY= a1b2c3d4e5f6 
```

**Correct:**
```
VITE_DROPBOX_APP_KEY=a1b2c3d4e5f6
```

---

## 🔒 Security: Add .env to .gitignore

**Critical Step**: Your `.env` file contains your secret API key. It should NEVER be committed to GitHub or shared publicly.

### Verify .env is in .gitignore

1. Open the `.gitignore` file in your project root
2. Look for this line:
   ```
   .env
   ```
3. If it's already there → ✅ Good, you're set
4. If it's NOT there → Add it and save:
   ```
   # Environment variables
   .env
   .env.local
   ```

### Why This Matters

- 🔐 Prevents accidental exposure of API keys to public repositories
- 🔐 Protects your Dropbox account from unauthorized access
- 🔐 Follows security best practices

**Never share your .env file with anyone.**

---

## ✅ Verification Checklist

Before proceeding to Step 3, verify ALL of these:

- [ ] The `.env` file is in the **project root** (same folder as `package.json`)
- [ ] The file is named exactly **`.env`** (with dot, no extension)
- [ ] The line inside contains your **actual Dropbox App Key** (not the placeholder text)
- [ ] **No quotes** around the value
- [ ] **No spaces** around the `=` sign
- [ ] **No extra spaces** before or after the key value
- [ ] The file is **saved** (no unsaved indicator)
- [ ] **`.env` is listed in `.gitignore`** file
- [ ] `.gitignore` is **saved**

---

## 🔄 After Saving: Restart Your Dev Server

After updating the `.env` file, you MUST restart your development server for the changes to take effect:

1. Stop the running dev server
   - Press `Ctrl+C` in the terminal where it's running

2. Start it again
   - Run: `npm run dev`
   - Or: `yarn dev`

3. Open your browser to `http://localhost:5173` (or port shown in terminal)

New environment variables only load when the dev server starts.

---

## 📝 For Multiple Cloud Services

If you're also setting up **Google Drive** and **OneDrive**, your `.env` file will look like this:

```
VITE_DROPBOX_APP_KEY=your_dropbox_key_here
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_API_KEY=your_google_api_key_here
VITE_MICROSOFT_CLIENT_ID=your_microsoft_client_id_here
```

Each on its own line, no quotes, no extra spaces.

---

## ❓ Troubleshooting

### "I still don't see my .env file"

**Solution 1**: Check if hidden files are shown
- VS Code: Press `Ctrl+H` to toggle hidden files
- Windows Explorer: View → Show → Hidden items
- Mac Finder: Cmd+Shift+. (period)

**Solution 2**: Create it via terminal
- Open terminal in your project root
- **Windows**: `echo. > .env`
- **Mac/Linux**: `touch .env`

### "I created the file but variables still aren't working"

**Solution**: Restart the dev server
- Stop: Press `Ctrl+C` in terminal
- Start: `npm run dev`
- Wait for it to fully start
- Refresh browser

### "I can't remember my Dropbox App Key"

**Solution**: Get it again
- Go to [Dropbox Developer Console](https://www.dropbox.com/developers/apps)
- Click your app
- Find "App key" in the Settings tab
- Copy it
- Paste into `.env` file
- Save and restart server

---

## ✨ You're Done with Step 2!

Once you've completed all items in the verification checklist above, you're ready to proceed to **Step 3**.

Your Dropbox integration is now configured and ready to use! 🚀

---

**Last Updated**: March 18, 2026
