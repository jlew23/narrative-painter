# Setting Up Automatic1111 Stable Diffusion Web UI for Narrative Painter

This guide will help you set up Automatic1111 Stable Diffusion Web UI to work with the Narrative Painter application.

## Prerequisites

1. Install Automatic1111 Stable Diffusion Web UI from [GitHub](https://github.com/AUTOMATIC1111/stable-diffusion-webui)
2. Make sure you have a working installation of Stable Diffusion Web UI

## Starting Automatic1111 with CORS Enabled

### Option 1: Use the provided batch file

1. Edit the `start_automatic1111_with_cors.bat` file and set the correct path to your Automatic1111 installation
2. Run the batch file by double-clicking it

### Option 2: Start Automatic1111 manually with CORS flags

1. Open a command prompt
2. Navigate to your Automatic1111 installation directory
3. Run the following command:

```
webui.bat --api --cors-allow-origins=http://localhost:8080,http://localhost:8081,http://localhost:3000
```

## Verifying the Setup

1. After starting Automatic1111 with CORS enabled, open a web browser
2. Navigate to `http://localhost:7860`
3. You should see the Automatic1111 Web UI
4. Start the Narrative Painter application
5. Try generating an image - if CORS is properly configured, the request should succeed

## Troubleshooting

### CORS Errors

If you still see CORS errors in the browser console:

1. Make sure Automatic1111 is running with the correct CORS flags
2. Check that the frontend is running on one of the allowed origins (8080, 8081, or 3000)
3. Try restarting both the frontend and Automatic1111

### API Errors

If you see API errors:

1. Make sure Automatic1111 is running with the `--api` flag
2. Check that the API is accessible by navigating to `http://localhost:7860/docs` in your browser
3. Verify that the txt2img endpoint is available at `http://localhost:7860/sdapi/v1/txt2img`

## Additional Configuration

You can customize the Automatic1111 startup with additional flags:

- `--listen` - Make the Web UI listen on all network interfaces
- `--port 7860` - Specify the port (default is 7860)
- `--enable-insecure-extension-access` - Allow installing extensions from URLs

For a complete list of command-line arguments, see the [Automatic1111 documentation](https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/Command-Line-Arguments-and-Settings).
