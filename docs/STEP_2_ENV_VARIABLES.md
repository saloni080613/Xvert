# Environment Variables Setup Guide

## Step 2: Update .env File

This step walks through configuring the environment variables required for cloud storage integrations (Dropbox, Google Drive, and OneDrive).

### Prerequisites

Before starting this step, ensure you have:
- Completed Step 1 (Obtaining API Keys from cloud providers)
- Your project folder open in your code editor

---

### Instructions

#### 1. Navigate to Project Root

Open your project root folder. You should see the following files/folders:
- `package.json`
- `vite.config.js`
- `src/` directory
- `public/` directory

#### 2. Locate or Create the .env File

**If the .env file already exists:**
- Open it in your text editor

**If the .env file does NOT exist:**
1. Right-click in your project root
2. Select **New File** (or use your editor's file creation)
3. Name it exactly: `.env`
4. Press Enter/Save

> **Note**: The `.env` file is a hidden configuration file. If you don't see it in your file browser, enable "Show Hidden Files" in your editor settings.

#### 3. Add Environment Variables

Copy and paste the following variables into your `.env` file:

```
VITE_DROPBOX_APP_KEY=your_dropbox_app_key_here
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_API_KEY=your_google_api_key_here
VITE_MICROSOFT_CLIENT_ID=your_microsoft_client_id_here
```

#### 4. Replace Placeholder Values

Replace each placeholder with your actual credentials:

| Variable | Replace With | Source |
|----------|-------------|--------|
| `your_dropbox_app_key_here` | Your Dropbox App Key | [Dropbox Developer Console](https://www.dropbox.com/developers/apps) |
| `your_google_client_id_here` | Your Google Client ID | [Google Cloud Console](https://console.cloud.google.com/) |
| `your_google_api_key_here` | Your Google API Key | [Google Cloud Console](https://console.cloud.google.com/) |
| `your_microsoft_client_id_here` | Your Microsoft Client ID | [Azure Portal](https://portal.azure.com/) |

**Example (with dummy values):**
```
VITE_DROPBOX_APP_KEY=a1b2c3d4e5f6g7h8i9j0
VITE_GOOGLE_CLIENT_ID=123456789-abc1d2e3f4g5h6i7j8k9.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=AIzaSyC1a2B3c4D5e6F7g8H9i0J1k2L3m4N5o6P
VITE_MICROSOFT_CLIENT_ID=a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6
```

#### 5. Save the File

- Press **Ctrl+S** (Windows) or **Cmd+S** (Mac)
- Ensure the file is saved with no unsaved indicator

---

### Verification

After saving, your `.env` file should contain four lines (or fewer if you're not using all services):

```
VITE_DROPBOX_APP_KEY=<actual_key>
VITE_GOOGLE_CLIENT_ID=<actual_client_id>
VITE_GOOGLE_API_KEY=<actual_api_key>
VITE_MICROSOFT_CLIENT_ID=<actual_client_id>
```

---

## ⚠️ Important Security Notes

### Formatting Rules

**DO:**
- ✅ Use the exact variable names as shown (case-sensitive)
- ✅ Add values directly after the `=` sign
- ✅ Keep the format: `VARIABLE_NAME=value`

**DON'T:**
- ❌ **Do NOT add quotes** around values
  - ❌ Wrong: `VITE_DROPBOX_APP_KEY="a1b2c3d4e5f6"`
  - ✅ Correct: `VITE_DROPBOX_APP_KEY=a1b2c3d4e5f6`

- ❌ **Do NOT add spaces** around the equals sign
  - ❌ Wrong: `VITE_DROPBOX_APP_KEY = a1b2c3d4e5f6`
  - ✅ Correct: `VITE_DROPBOX_APP_KEY=a1b2c3d4e5f6`

- ❌ **Do NOT add extra spaces** before or after values
  - ❌ Wrong: `VITE_DROPBOX_APP_KEY= a1b2c3d4e5f6 `
  - ✅ Correct: `VITE_DROPBOX_APP_KEY=a1b2c3d4e5f6`

### Security Best Practice: .gitignore

**Critical**: The `.env` file contains sensitive credentials and should NEVER be committed to version control.

#### Verify .env is in .gitignore

1. Open your `.gitignore` file in the project root
2. Look for the line: `.env`
3. If it's not there, add it:

```
# Environment variables
.env
.env.local
.env.*.local
```

#### Why This Matters

- 🔒 Prevents accidental exposure of API keys to GitHub/public repositories
- 🔒 Protects your cloud storage accounts from unauthorized access
- 🔒 Complies with security best practices

**Never commit or share your .env file with anyone.**

---

## Troubleshooting

### Variables Not Loading

**Problem**: Environment variables still showing as `undefined` in the app

**Solutions**:
1. **Restart the dev server**
   - Stop the running dev server (Ctrl+C)
   - Run `npm run dev` again
   - New environment variables only load on server restart

2. **Check variable names**
   - Ensure they start with `VITE_` (Vite requirement)
   - Variable names are case-sensitive
   - Compare with the exact names in this guide

3. **Verify file location**
   - Ensure `.env` is in the project root (same folder as `package.json`)
   - Not in `src/` or other subdirectories

4. **Check for typos**
   - Make sure there are no extra spaces or special characters
   - Use the exact format: `VITE_VARIABLE_NAME=value`

### File Not Showing in Editor

**Problem**: Can't find the `.env` file in your editor

**Solutions**:
1. **Enable hidden files**
   - VS Code: Press `Ctrl+H` to toggle hidden files
   - Other editors: Check settings for "Show Hidden Files"

2. **Look in file system**
   - Open file explorer/finder manually
   - Navigate to your project root
   - Look for `.env` file

3. **Create it manually**
   - If still not visible, create the file:
   - Open terminal in project root
   - Windows: `echo. > .env`
   - Mac/Linux: `touch .env`

### .env File Created but Variables Not Working

**Problem**: File exists but variables still undefined

**Verify with console logging:**
1. Open your browser's Developer Tools (F12)
2. Go to Console tab
3. Check for errors about missing API keys
4. Ensure your .env values are correct (no typos)

---

## Next Steps

After updating your `.env` file:

1. **Restart the development server**
   - Stop: Press `Ctrl+C` in the terminal
   - Start: Run `npm run dev`

2. **Test the integration**
   - Navigate to the file upload page
   - Click each cloud storage icon (Dropbox, Google Drive, OneDrive)
   - Verify the file picker opens

3. **Check browser console** for any error messages
   - Press F12 to open Developer Tools
   - Look for red error messages
   - Screenshot any errors for troubleshooting

---

## Reference

For detailed setup instructions for each cloud service, see:
- **Complete Guide**: [CLOUD_STORAGE_SETUP.md](../docs/CLOUD_STORAGE_SETUP.md)
- **Technical Summary**: [CLOUD_INTEGRATION_SUMMARY.md](../docs/CLOUD_INTEGRATION_SUMMARY.md)

---

## Quick Checklist

Before moving to the next step, verify:

- [ ] `.env` file exists in project root
- [ ] All four environment variables are added
- [ ] No quotes around values
- [ ] No spaces around `=` sign
- [ ] `.env` is in `.gitignore`
- [ ] File is saved
- [ ] Dev server has been restarted

---

**Last Updated**: March 18, 2026
