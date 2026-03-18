# 🔗 Complete Dropbox Integration Guide

This guide walks through integrating Dropbox file picker into your Xvert application. Follow each step carefully.

---

## Table of Contents

1. [Step 1: Create Dropbox App](#step-1-create-dropbox-app)
2. [Step 2: Get Your App Key](#step-2-get-your-app-key)
3. [Step 3: Configure .env File](#step-3-configure-env-file)
4. [Step 4: Restart Dev Server](#step-4-restart-dev-server)
5. [Step 5: Test the Integration](#step-5-test-the-integration)
6. [Understanding the Code](#understanding-the-code)
7. [Troubleshooting](#troubleshooting)

---

## STEP 1: Create Dropbox App

### What You're Doing
Creating a Dropbox application that will allow users to pick files from their Dropbox account.

### Instructions

1. **Go to Dropbox Developer Console**
   - Open your browser
   - Visit: https://www.dropbox.com/developers/apps
   - Sign in with your Dropbox account (create one if needed)

2. **Click "Create app"**
   - Look for the blue button that says "Create app"
   - Click it

3. **Choose Your App Settings**

   You'll see a form with options. Fill it like this:

   **Question 1: Choose an API**
   - Select: **Scoped API** ✅
   - (This is the modern, recommended option)

   **Question 2: Choose the type of access you need**
   - Select: **App folder** ✅
   - (This restricts access to a specific folder in Dropbox)

   **Question 3: Name your app**
   - Enter: `Xvert File Converter` (or any name you like)
   - Example: `Xvert`, `MyConverter`, `FileConverter`

4. **Accept Terms**
   - Check the checkbox: "I agree to the Dropbox API Terms and Conditions"
   - ✅ Click **"Create app"**

5. **Wait for Confirmation**
   - You should see a success message
   - You'll be taken to your app's settings page

---

## STEP 2: Get Your App Key

### What You're Doing
Copying the unique identifier that proves your app is authorized to use Dropbox.

### Instructions

1. **You're now in App Settings**
   - You should see your app name at the top
   - Look for tabs: "Settings", "Permissions", "Security"

2. **Find the "App key" (also called "Client ID")**
   
   In the **Settings** tab, look for:
   ```
   App key: (a long string of characters)
   ```
   
   Example of what it looks like:
   ```
   a1b2c3d4e5f6g7h8i9j0
   ```

3. **Copy the App Key**
   - Click the **Copy** button next to the App key
   - Or select the text and copy it (Ctrl+C)

4. **Save It Temporarily**
   - Paste it into a notepad or text editor
   - Keep this window open for now
   - You'll use this in the next step

### Important Permissions

Still in your app settings:

1. **Go to the "Permissions" tab**
2. **Look for "files.content.read"**
3. **Make sure it's checked/enabled** ✅
4. **Click "Submit"** if there's a button

This permission allows users to share file URLs from their Dropbox.

---

## STEP 3: Configure .env File

### What You're Doing
Storing your Dropbox App Key securely in your project's environment variables.

### Instructions

1. **Open Your Project Root Folder**
   - This is where `package.json` is located
   - Open it in VS Code or your code editor

2. **Find or Create .env File**

   **If .env exists:**
   - Open it

   **If .env does NOT exist:**
   - Right-click in the project root
   - Select "New File"
   - Name it: `.env` (with the dot)
   - Open it

   > **Tip**: If you don't see .env file, enable hidden files:
   > - VS Code: Press `Ctrl+H`
   > - Windows: View → Show hidden files
   > - Mac: Cmd+Shift+.

3. **Add Your Dropbox App Key**

   Type (or paste) this line into your .env file:
   ```
   VITE_DROPBOX_APP_KEY=your_app_key_here
   ```

   Replace `your_app_key_here` with the actual key you copied in Step 2.

   **Example:**
   ```
   VITE_DROPBOX_APP_KEY=a1b2c3d4e5f6g7h8i9j0
   ```

4. **Make Sure the Format is Correct**

   ✅ **Correct:**
   ```
   VITE_DROPBOX_APP_KEY=a1b2c3d4e5f6g7h8i9j0
   ```

   ❌ **Wrong (with quotes):**
   ```
   VITE_DROPBOX_APP_KEY="a1b2c3d4e5f6g7h8i9j0"
   ```

   ❌ **Wrong (with spaces):**
   ```
   VITE_DROPBOX_APP_KEY = a1b2c3d4e5f6g7h8i9j0
   ```

5. **Save the File**
   - Press **Ctrl+S** (Windows) or **Cmd+S** (Mac)
   - Make sure there's no unsaved indicator

### Security: Add .env to .gitignore

**Important**: Your .env file contains your secret key. Never commit it to GitHub.

1. **Open .gitignore file** in your project root
2. **Look for the line:** `.env`
3. **If it's NOT there, add it:**
   ```
   .env
   .env.local
   ```
4. **Save .gitignore**

---

## STEP 4: Restart Dev Server

### What You're Doing
Restarting your application so it loads the new environment variables.

### Instructions

1. **Stop the Current Server**
   - Look at your terminal where the dev server is running
   - Press **Ctrl+C** to stop it
   - You should see it stop running

2. **Start the Server Again**
   - In the terminal, type: `npm run dev`
   - Press Enter
   - Wait for the message: "Local: http://localhost:5173"

3. **Open Your Browser**
   - Go to: http://localhost:5173
   - Your app should load

---

## STEP 5: Test the Integration

### What You're Doing
Verifying that Dropbox integration works correctly.

### Instructions

1. **Navigate to File Upload Page**
   - Click on a conversion tool (e.g., "Image to PDF")
   - Look for the upload area with:
     - A large dashed box
     - "Select File" button
     - Three cloud icons at the bottom: Dropbox, Google Drive, OneDrive

2. **Click the Dropbox Icon**
   - It's the first icon (blue with white diamonds)
   - A Dropbox file picker window should open
   - If nothing happens → See Troubleshooting section

3. **Sign In to Dropbox (if needed)**
   - If you're not logged in, you'll see a login screen
   - Enter your Dropbox credentials
   - Click "Allow" to give permission

4. **Select a File**
   - Browse your Dropbox files
   - Click on a file you want to convert
   - Click "Choose"

5. **File Should Appear in Upload Area**
   - The file name should appear in the upload section
   - You should see: "📄 filename.pdf" (or whatever file you selected)
   - Below it: "Click to change file"

6. **Convert the File**
   - Click the "Convert" button
   - The file should process
   - Download link should appear

### Success! ✅

If you can:
- Click the Dropbox icon
- See the file picker
- Select a file
- See it appear in the upload area
- Convert it successfully

Then Dropbox integration is working! 🎉

---

## Understanding the Code

This section explains how Dropbox integration works in your app.

### File Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── DropboxPicker.jsx      ← Dropbox button component
│   ├── pages/
│   │   ├── Home.jsx               ← Uses DropboxPicker
│   │   └── Dashboard.jsx          ← Uses DropboxPicker
│   └── main.jsx
├── index.html                      ← Loads Dropbox script
└── .env                            ← Your API key
```

### How It Works (Simplified)

**Step 1: Load Dropbox Script**
```javascript
// In index.html
<script src="https://www.dropbox.com/static/api/2/dropins.js" 
        id="dropboxjs" 
        data-app-key="%VITE_DROPBOX_APP_KEY%">
</script>
```
This loads the official Dropbox SDK when your page loads.

**Step 2: User Clicks Button**
```javascript
// In DropboxPicker.jsx
<button onClick={handleOpenDropbox}>
  {/* Dropbox icon */}
</button>
```

**Step 3: Open File Picker**
```javascript
const handleOpenDropbox = () => {
  window.Dropbox.choose({
    success: function(files) {
      // User selected files → send to parent component
      onFileSelected(files[0]);
    },
    cancel: function() {
      console.log("User cancelled");
    },
    linkType: "direct",      // Get download URL
    multiselect: multiselect, // Allow multiple files
  });
};
```

**Step 4: File Appears in Upload Area**
```javascript
// In Home.jsx
const handleDropboxSelect = (fileInfo) => {
  setFile({
    name: fileInfo.name,
    url: fileInfo.url,        // Direct download URL
    isCloudUrl: true          // Mark as cloud file
  });
};
```

The file object is now ready for conversion!

### Key Variables Explained

| Variable | What it Does | Example |
|----------|-------------|---------|
| `fileInfo.name` | File name | `"document.pdf"` |
| `fileInfo.url` | Direct download URL | `"https://dl.dropbox.com/..."` |
| `isCloudUrl` | Marks it as cloud file | `true` |

---

## Troubleshooting

### Problem 1: Dropbox Icon Doesn't Respond

**Symptom**: Click the Dropbox icon, nothing happens.

**Solutions**:

**A) Check if .env is loaded**
1. Open your browser's Developer Tools (F12)
2. Go to Console tab
3. Type: `console.log(import.meta.env.VITE_DROPBOX_APP_KEY)`
4. Press Enter
5. If it shows your key → ✅ Correct
6. If it shows `undefined` → Problem with .env

**B) Restart dev server**
1. Stop the server: Ctrl+C
2. Start again: `npm run dev`
3. Try again

**C) Check ad blocker**
- Dropbox script might be blocked by ad blocker
- Disable it temporarily and try again

**D) Check browser console for errors**
1. Open F12 (Developer Tools)
2. Go to Console tab
3. Look for red error messages
4. Take a screenshot and share it

---

### Problem 2: "Dropbox script not loaded" Error

**Symptom**: You see an alert saying "Dropbox Chooser script not loaded"

**Cause**: The Dropbox SDK script failed to load from the internet.

**Solutions**:

1. **Check your internet connection**
   - Make sure you're connected to internet
   - Try refreshing the page

2. **Check if ad blocker is blocking it**
   - Disable ad blocker
   - Try again

3. **Check index.html**
   - Open `frontend/index.html`
   - Look for this line:
   ```html
   <script src="https://www.dropbox.com/static/api/2/dropins.js" 
           id="dropboxjs" 
           data-app-key="%VITE_DROPBOX_APP_KEY%">
   </script>
   ```
   - Make sure it's there
   - Make sure `data-app-key="%VITE_DROPBOX_APP_KEY%"` is present

---

### Problem 3: File Picker Opens But File Selection Doesn't Work

**Symptom**: Picker opens, you select a file, but nothing happens.

**Solutions**:

1. **Make sure you're logged into Dropbox**
   - Sign in to your Dropbox account in the picker

2. **Check file permissions**
   - Your app should have "files.content.read" permission
   - Go back to [Dropbox Developer Console](https://www.dropbox.com/developers/apps)
   - Click your app
   - Go to "Permissions" tab
   - Enable "files.content.read" if not already enabled

3. **Check browser console for errors**
   - Press F12
   - Go to Console tab
   - Look for error messages

---

### Problem 4: File Appears But Conversion Fails

**Symptom**: File shows in upload area but conversion returns an error.

**Possible Causes**:
- File format not supported
- File too large (>50MB)
- Backend API issue

**Solutions**:

1. **Try a different file**
   - Try a smaller file or different format
   - See if that works

2. **Check backend logs**
   - Look at terminal where Python backend is running
   - Look for error messages

3. **Check file size**
   - Dropbox files should be under 50MB
   - Check your file size

4. **Check supported formats**
   - For Image to PDF: JPG, PNG, GIF
   - For PDF to Image: PDF files
   - For Merge PDF: Multiple PDF files

---

### Problem 5: "App key missing" Warning in Console

**Symptom**: You see warning in browser console: "Dropbox script loaded but app key missing"

**Cause**: App key not properly loaded from environment variables.

**Solutions**:

1. **Verify .env file exists**
   - Check that .env file is in project root
   - Check it has the correct line

2. **Verify .env format**
   - No quotes around value
   - No spaces around =
   - Example: `VITE_DROPBOX_APP_KEY=abc123xyz456`

3. **Restart dev server**
   - Stop: Ctrl+C
   - Start: `npm run dev`

4. **Check if app key is correct**
   - Go to [Dropbox Developer Console](https://www.dropbox.com/developers/apps)
   - Copy the app key again
   - Update .env with new value
   - Restart server

---

### Problem 6: Multiple Files Selected But Only One Uploads

**Symptom**: You select multiple files from Dropbox, but only one uploads.

**Cause**: The app is configured for single-file mode by default.

**Solution**: This depends on your conversion tool:
- **Single file tools** (Image to PDF): Only one file accepted ✅ Correct
- **Merge PDF**: Should accept multiple files
  - Check that "multiselect: true" is enabled
  - Contact support if this isn't working

---

### Problem 7: Can't Find .env File

**Symptom**: You can't see the .env file you created.

**Cause**: .env is a "hidden file" - it starts with a dot.

**Solutions**:

**VS Code:**
- Press `Ctrl+H` to show hidden files
- .env should now appear

**Windows Explorer:**
- View menu → Options
- Check "Show hidden files, folders, and drives"

**Mac Finder:**
- Press `Cmd+Shift+.` (period)
- Hidden files will appear

---

## Complete Integration Checklist

Before considering Dropbox integration complete, verify ALL of these:

- [ ] Created Dropbox app in Developer Console
- [ ] Copied Dropbox App Key
- [ ] Created .env file in project root
- [ ] Added correct line: `VITE_DROPBOX_APP_KEY=your_key`
- [ ] .env is in .gitignore file
- [ ] Saved .env file
- [ ] Restarted dev server (`npm run dev`)
- [ ] Opened app in browser (http://localhost:5173)
- [ ] Clicked Dropbox icon → File picker opened
- [ ] Selected file from Dropbox → File appeared in upload area
- [ ] Converted file successfully → Download worked
- [ ] Tested with multiple file types → All worked

---

## Next Steps

### If Dropbox is Working:
✅ Set up Google Drive integration (optional)
✅ Set up OneDrive integration (optional)
✅ Deploy to production

### If You Need Help:

1. **Check Dropbox Official Docs**
   - https://www.dropbox.com/developers/chooser
   - https://www.dropbox.com/developers/documentation

2. **Check Browser Console**
   - Press F12
   - Go to Console tab
   - Look for error messages
   - Screenshot and share the error

3. **Check Network Tab**
   - Press F12
   - Go to Network tab
   - Click Dropbox icon
   - Look for failed requests (red X)
   - Check if Dropbox SDK loaded properly

4. **Check Backend Logs**
   - Look at Python terminal
   - Check for API errors
   - Verify backend is running

---

## Summary

You've successfully integrated Dropbox when:

✅ Users can click the Dropbox icon
✅ File picker opens and shows their Dropbox files
✅ They can select a file
✅ Selected file appears in the upload area
✅ File converts successfully to desired format
✅ User can download the converted file

**Congratulations! Dropbox integration is complete!** 🎉

---

**Last Updated**: March 18, 2026
**Questions?** Check troubleshooting section above or contact support.
