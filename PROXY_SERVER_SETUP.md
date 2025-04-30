# Using the Proxy Server with Automatic1111 and Narrative Painter

This guide explains how to use the proxy server to connect Narrative Painter with Automatic1111 Stable Diffusion Web UI.

## Overview

The proxy server acts as a middleman between your Narrative Painter frontend and Automatic1111:

1. Your frontend sends requests to the proxy server
2. The proxy server forwards these requests to Automatic1111
3. Automatic1111 processes the requests and returns the results
4. The proxy server adds CORS headers and sends the results back to your frontend

This approach solves the CORS issues that prevent direct communication between the frontend and Automatic1111.

## Setup Instructions

### Step 1: Start Automatic1111

1. Start Automatic1111 Stable Diffusion Web UI as you normally would
2. Make sure it's running on port 7860 (the default port)
3. Verify it's working by opening `http://localhost:7860` in your browser

### Step 2: Start the Proxy Server

1. Run the `start_proxy_server.bat` file by double-clicking it
2. This will install the required Python packages and start the proxy server on port 5050
3. You should see a message indicating that the proxy server is running
4. Verify it's working by opening `http://localhost:5050` in your browser - you should see a message saying "Proxy server for Automatic1111 is running"

### Step 3: Start the Narrative Painter Frontend

1. Start your frontend application as usual
2. The frontend will now send requests to the proxy server instead of directly to Automatic1111
3. The proxy server will forward these requests to Automatic1111 and return the results to your frontend

## Troubleshooting

### Proxy Server Issues

If you encounter issues with the proxy server:

1. Make sure Python is installed and in your PATH
2. Check that the required packages (flask, flask-cors, requests) are installed
3. Verify that the proxy server is running by opening `http://localhost:5000` in your browser
4. Check the console output of the proxy server for any error messages

### Automatic1111 Issues

If you encounter issues with Automatic1111:

1. Make sure Automatic1111 is running and accessible at `http://localhost:7860`
2. Check that the API is enabled (Automatic1111 should be started with the `--api` flag)
3. Verify that the txt2img endpoint is working by testing it directly in the Automatic1111 web interface

### Frontend Issues

If you encounter issues with the frontend:

1. Check the browser console for any error messages
2. Verify that the frontend is sending requests to the proxy server at `http://localhost:5050/proxy/sdapi/v1/txt2img`
3. Check the network tab in the browser developer tools to see if the requests are being sent and what responses are being received

## Advanced Configuration

If you need to change the ports or URLs:

1. To change the proxy server port, edit the `proxy_server.py` file and change the `port` variable
2. To change the Automatic1111 URL, edit the `proxy_server.py` file and change the `AUTOMATIC1111_URL` variable
3. If you change either of these, you'll also need to update the URLs in the frontend code
