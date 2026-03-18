# Cloud Storage Integration Setup Guide

This guide walks through setting up Dropbox, Google Drive, and OneDrive file pickers in the Xvert application.

## Table of Contents
1. [Dropbox Setup](#dropbox-setup)
2. [Google Drive Setup](#google-drive-setup)
3. [OneDrive Setup](#onedrive-setup)
4. [Testing](#testing)
5. [Troubleshooting](#troubleshooting)

---

## Dropbox Setup

### 1. Create a Dropbox App

1. Go to [Dropbox Developer Console](https://www.dropbox.com/developers/apps)
2. Click "Create app"
3. Choose:
   - **API**: Scoped API
   - **Type**: Chooser
   - **Name**: Something descriptive (e.g., "Xvert Converter")
4. Accept the terms and create the app

### 2. Get Your App Key

1. In your app settings, find the **App key** (this is your `VITE_DROPBOX_APP_KEY`)
2. Copy and save it

### 3. Configure Your App

1. Go to the **Permissions** tab
2. Enable **files.content.read** (required for file access)
3. Save changes

### 4. Add Your Environment Variables

In your `.env` file:
```env
VITE_DROPBOX_APP_KEY=your_app_key_here
```

### 5. Add Redirect URIs (if needed)

- For production: Add your domain
- For local development: `http://localhost:5173` or `http://localhost:3000`

---

## Google Drive Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Name it "Xvert" or similar

### 2. Enable Required APIs

1. Go to **APIs & Services** > **Library**
2. Search for and enable:
   - **Google Drive API**
   - **Google Picker API** (search for "Picker")

### 3. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client ID**
3. Choose **Web application**
4. Add authorized JavaScript origins:
   - `http://localhost:5173` (development)
   - `http://localhost:3000` (alternative dev)
   - `https://yourdomain.com` (production)
5. Create the credential and copy the **Client ID**

### 4. Create an API Key (Public)

1. Click **Create Credentials** > **API Key**
2. Copy the **API Key** - this is publicly safe for the Picker API

### 5. Add Environment Variables

In your `.env` file:
```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here
VITE_GOOGLE_API_KEY=your_api_key_here
```

### 6. Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External**
3. Fill in:
   - **App name**: Xvert
   - **User support email**: your_email@example.com
   - **Developer contact**: your_email@example.com
4. Save and continue

**Note**: If you only add test users, the picker will work for those accounts only. For production, you'll need to go through the verification process.

---

## OneDrive Setup

### 1. Register an Application in Azure

1. Go to [Azure Portal](https://portal.azure.com/)
2. Search for **Azure Active Directory**
3. Go to **App registrations** > **New registration**
4. Configure:
   - **Name**: Xvert
   - **Supported account types**: Accounts in any organizational directory (Multi-tenant)
   - **Redirect URI**: Web - `http://localhost:5173`
5. Click **Register**

### 2. Get Your Client ID

On the app overview page, copy the **Application (client) ID** - this is your `VITE_MICROSOFT_CLIENT_ID`

### 3. Configure Permissions

1. Go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Choose **Delegated permissions**
5. Search for and add:
   - `Files.Read` - Read user files
   - `Files.Read.All` - Read all files user has access to
6. Grant admin consent

### 4. Add Redirect URIs

1. Go to **Authentication**
2. Under **Platform configurations**, click **Add a platform**
3. Select **Web**
4. Add redirect URIs:
   - `http://localhost:5173`
   - `http://localhost:3000`
   - `https://yourdomain.com` (production)
5. Save

### 5. Add Environment Variables

In your `.env` file:
```env
VITE_MICROSOFT_CLIENT_ID=your_client_id_here
```

---

## Testing

### Local Testing

1. Copy `.env.example` to `.env`
2. Fill in your credentials from steps above
3. Run your app: `npm run dev`
4. Navigate to the file upload page
5. Click each cloud storage icon to test

### Expected Behavior

**Dropbox:**
- Click icon → Dropbox file picker opens in modal
- Select file(s) → File appears in upload area
- File is ready to convert

**Google Drive:**
- Click icon → Google Drive picker loads (might take a moment)
- Sign in if needed → Browse Google Drive
- Select file(s) → File appears in upload area
- File is ready to convert

**OneDrive:**
- Click icon → OneDrive picker loads (might take a moment)
- Sign in if needed → Browse OneDrive files
- Select file(s) → File appears in upload area
- File is ready to convert

---

## Troubleshooting

### Dropbox Issues

**Error: "Dropbox Chooser script not loaded"**
- Check your app key in `.env`
- Ensure `.env` variable is loaded correctly
- Check browser console for errors
- Verify internet connection

**File selection not working**
- Ensure you're logged into Dropbox
- Check that the file type is not restricted by your app settings
- Clear browser cache and reload

### Google Drive Issues

**Error: "Google API credentials not configured"**
- Check that `VITE_GOOGLE_CLIENT_ID` and `VITE_GOOGLE_API_KEY` are set in `.env`
- Restart the dev server after changing `.env`

**Picker doesn't open or shows blank**
- Verify the OAuth credentials are correct
- Check that your localhost URL is in authorized origins
- Check browser console for specific errors
- Try in an incognito window

**"401 Unauthorized" error**
- The client ID or API key might be incorrect
- Try creating new credentials from the Google Cloud Console
- Ensure both OAuth 2.0 and API Key are configured

### OneDrive Issues

**Error: "OneDrive integration is not configured"**
- Check that `VITE_MICROSOFT_CLIENT_ID` is set in `.env`
- Restart the dev server after changing `.env`

**Picker doesn't appear or shows authentication error**
- Verify the Client ID is correct
- Ensure redirect URIs include your current localhost URL
- Try in an incognito window
- Check that permissions are properly configured in Azure AD

**"AADSTS..." error codes**
- These are Azure AD authentication errors
- Check the Azure portal for your app configuration
- Ensure permissions are granted
- Try creating a new app registration

### General Issues

**"CORS" or cross-origin errors**
- This might indicate incorrect configuration
- Check that your redirect URIs match your current URL exactly
- For development, use `http://localhost:5173` exactly

**Files don't upload after selection**
- The file object should appear in the upload area immediately
- If not, check browser console for JavaScript errors
- Verify the `onFileSelected` callback is working
- Check that `handleDropboxSelect` (or similar) is called

**Loading spinner never stops**
- The SDK might not have loaded
- Check network tab in browser DevTools
- Try refreshing the page
- Check browser console for specific error messages

---

## File Format Support

### Dropbox
Supports all file types by default. Use `acceptTypes` parameter to restrict.

### Google Drive
Auto-filters by MIME type based on `acceptTypes`:
- **PDF**: `application/pdf`
- **Images**: `image/jpeg`, `image/png`, `image/gif`
- **Documents**: `application/msword`, DOCX, XLSX, etc.

### OneDrive
Same MIME type filtering as Google Drive.

---

## Advanced Configuration

### Custom File Filtering

Each picker accepts an `acceptTypes` parameter:

```jsx
<DropboxPicker
  acceptTypes="pdf,docx,xlsx"  // Comma-separated file extensions
  onFileSelected={handleFileSelected}
  multiselect={true}
/>
```

### Multi-select

All pickers support multi-select:

```jsx
<GoogleDrivePicker
  multiselect={true}  // Allow selecting multiple files
  onFileSelected={handleFilesSelected}
/>
```

---

## Production Deployment

### Before Going Live

1. **Test thoroughly** with real accounts
2. **Update redirect URIs** in all three services
3. **Change app settings** to production mode (remove "test" users for Google)
4. **Set up HTTPS** - all cloud services require it in production
5. **Update `.env`** with production URLs
6. **Monitor errors** in production

### Environment Variables for Production

```env
VITE_DROPBOX_APP_KEY=prod_key_here
VITE_GOOGLE_CLIENT_ID=prod_client_id_here
VITE_GOOGLE_API_KEY=prod_api_key_here
VITE_MICROSOFT_CLIENT_ID=prod_microsoft_id_here
VITE_API_URL=https://api.yourdomain.com
```

---

## Support & Resources

- **Dropbox**: https://www.dropbox.com/developers/chooser
- **Google Drive**: https://developers.google.com/drive/picker
- **OneDrive**: https://learn.microsoft.com/en-us/onedrive/developer/controls/file-pickers

---

Last Updated: March 18, 2026
