from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import requests
import json

app = Flask(__name__)
# Configure Flask to handle larger requests
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100 MB
# Configure CORS with more options
CORS(app, resources={r"/*": {"origins": "*", "max_age": 86400}})

# Automatic1111 API URL
AUTOMATIC1111_URL = "http://localhost:7860"

@app.route('/')
def index():
    return jsonify({"message": "Proxy server for Automatic1111 is running"})

@app.route('/proxy/<path:path>', methods=['GET', 'POST', 'OPTIONS'])
def proxy(path):
    if request.method == 'OPTIONS':
        # Handle preflight request with more headers
        response = Response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Accept, X-Requested-With')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        response.headers.add('Access-Control-Max-Age', '86400')  # 24 hours
        return response

    # Forward the request to Automatic1111
    url = f"{AUTOMATIC1111_URL}/{path}"

    print(f"Forwarding request to: {url}")

    try:
        if request.method == 'GET':
            resp = requests.get(url, params=request.args, timeout=300)  # 5 minute timeout
        elif request.method == 'POST':
            # Get the JSON data from the request
            data = request.get_json()
            if data:
                print(f"Request data summary: prompt length={len(data.get('prompt', ''))}, width={data.get('width')}, height={data.get('height')}")

            # Forward the request to Automatic1111 with a longer timeout
            resp = requests.post(url, json=data, timeout=300)  # 5 minute timeout

            print(f"Response status: {resp.status_code}")
            if resp.status_code == 200:
                print("Response received successfully")
                if 'images' in resp.json():
                    print(f"Number of images in response: {len(resp.json()['images'])}")
            else:
                print(f"Error response: {resp.text[:200]}...")

        # Return the response from Automatic1111 with proper headers
        response = Response(resp.content)
        response.status_code = resp.status_code

        # Set content type from original response or default to JSON
        response.headers['Content-Type'] = resp.headers.get('Content-Type', 'application/json')

        # Add CORS headers
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Accept, X-Requested-With'

        return response

    except requests.exceptions.Timeout:
        print("Request to Automatic1111 timed out")
        return jsonify({"error": "Request to Automatic1111 timed out. The image generation may be taking too long."}), 504
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Use port 5050 to avoid conflicts with other services
    port = 5050
    print(f"Starting proxy server on port {port}...")
    print("Forwarding requests to Automatic1111 at:", AUTOMATIC1111_URL)
    app.run(host='0.0.0.0', port=port, debug=True)
