
# Server-Side Image Generation Guide

The current implementation uses browser-based models with limited capabilities. For production-quality image generation, we recommend implementing server-side processing with more powerful models. This document explains how to set up server-side image generation.

## 1. Set Up a Backend Server

### Option 1: Node.js Server with Replicate API

[Replicate](https://replicate.com/) provides an easy way to run Stable Diffusion models in the cloud.

```javascript
// Example Node.js server with Express and Replicate
const express = require('express');
const Replicate = require('replicate');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

app.post('/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    const output = await replicate.run(
      "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
      {
        input: {
          prompt: prompt,
          width: 768,
          height: 768
        }
      }
    );
    
    res.json({ imageUrl: output[0] });
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: 'Image generation failed' });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
```

### Option 2: Python Server with Hugging Face Diffusers

For more control and lower costs, you can host your own server using Python and the Hugging Face Diffusers library.

```python
# Example Python FastAPI server
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
from diffusers import StableDiffusionPipeline
import base64
from io import BytesIO

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model once at startup
pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",
    torch_dtype=torch.float16
)
pipe = pipe.to("cuda")

class ImageRequest(BaseModel):
    prompt: str
    width: int = 768
    height: int = 768

@app.post("/generate-image")
async def generate_image(request: ImageRequest):
    try:
        # Generate image from prompt
        image = pipe(
            prompt=request.prompt,
            width=request.width,
            height=request.height
        ).images[0]
        
        # Convert to base64 for transmission
        buffered = BytesIO()
        image.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return {"image": f"data:image/png;base64,{img_str}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## 2. Update Frontend Code

Modify the existing functions in `storyboardGeneration.ts` to call your server API instead of using browser-based models:

```typescript
export const generateCharacterImage = async (character: Character): Promise<string> => {
  console.log(`Generating image for character: ${character.name}`);
  
  try {
    // Create prompt for the API
    const prompt = formatCharacterForPrompt(character);
    
    // Call your server API
    const response = await fetch('http://your-server/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });
    
    if (!response.ok) {
      throw new Error('Image generation failed');
    }
    
    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error('Error generating character image:', error);
    return '/placeholder.svg';
  }
};
```

## 3. Hosting Options

For hosting the image generation server, consider:

1. **DigitalOcean Droplets** - Affordable VPS with GPU options
2. **Google Cloud Run with GPU** - Serverless with pay-per-use pricing
3. **AWS Lambda with GPU** - Serverless option with AWS ecosystem
4. **Hugging Face Inference Endpoints** - Managed API service for ML models

## 4. Optimizations

- **Batch Processing**: Generate multiple images in one API call
- **Caching**: Cache generated images based on prompts
- **Queue System**: Use a queue system like RabbitMQ or Redis for managing generation requests
- **Progressive Loading**: Show low-resolution previews while high-quality images are being generated

## 5. Cost Management

- Use smaller models for faster generation and lower costs
- Implement rate limiting to prevent excessive usage
- Consider using LoRA (Low-Rank Adaptation) fine-tuned models for specific styles
- Use a CDN to cache and deliver generated images

## 6. Security Considerations

- Implement user authentication and rate limiting
- Filter inappropriate prompts before processing
- Set up CORS properly to restrict API access to your domain
- Use HTTPS for all API communication
