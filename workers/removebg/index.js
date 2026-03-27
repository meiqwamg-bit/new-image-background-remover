/**
 * Cloudflare Worker - Remove.bg API Proxy
 * 
 * 功能：
 * 1. 接收前端上传的图片
 * 2. 转发给 Remove.bg API（隐藏 API Key）
 * 3. 返回处理结果
 * 
 * 环境变量：
 * REMOVE_BG_API_KEY - Remove.bg API Key
 */

const REMOVE_BG_API_URL = "https://api.remove.bg/v1.0/removebg";

// Rate limit: 10 requests per IP per day
const RATE_LIMIT = 10;
const RATE_LIMIT_EXPIRY = 60 * 60 * 24; // 24 hours in seconds

export default {
  async fetch(request, env, ctx) {
    // Only allow POST
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // Get client IP for rate limiting
    const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";

    // Check rate limit
    const rateLimitResult = await checkRateLimit(env, clientIP);
    if (rateLimitResult.limited) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded" }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        }
      );
    }

    try {
      // Parse multipart form data
      const formData = await request.formData();
      const imageFile = formData.get("image_file");

      if (!imageFile) {
        return new Response(
          JSON.stringify({ error: "No image file provided" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Get parameters
      const size = formData.get("size") || "auto";
      const format = formData.get("format") || "png";

      // Create new form data for Remove.bg API
      const removeBgFormData = new FormData();
      removeBgFormData.append("image_file", imageFile);
      removeBgFormData.append("size", size);
      removeBgFormData.append("format", format);

      // Call Remove.bg API
      const apiResponse = await fetch(REMOVE_BG_API_URL, {
        method: "POST",
        headers: {
          "X-Api-Key": env.REMOVE_BG_API_KEY,
        },
        body: removeBgFormData,
      });

      // Increment rate limit counter
      await incrementRateLimit(env, clientIP);

      // Handle API errors
      if (!apiResponse.ok) {
        const errorBody = await apiResponse.text();
        console.error("Remove.bg API Error:", apiResponse.status, errorBody);

        let errorMessage = "Failed to process image";
        if (apiResponse.status === 402) {
          errorMessage = "API credits exhausted";
        } else if (apiResponse.status === 403) {
          errorMessage = "Invalid API key";
        } else if (apiResponse.status === 422) {
          errorMessage = "Image could not be processed";
        }

        return new Response(
          JSON.stringify({ error: errorMessage }),
          { status: apiResponse.status, headers: { "Content-Type": "application/json" } }
        );
      }

      // Stream back the result
      const resultBlob = await apiResponse.blob();

      return new Response(resultBlob, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Content-Length": resultBlob.size.toString(),
          "X-RateLimit-Remaining": Math.max(0, RATE_LIMIT - rateLimitResult.count - 1).toString(),
        },
      });
    } catch (err) {
      console.error("Worker error:", err);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};

// ========== Rate Limiting (using Cloudflare KV) ==========
// Note: Requires a KV namespace bound to "RATE_LIMIT_KV"
async function checkRateLimit(env, ip) {
  const kvKey = `ratelimit:${ip}`;
  
  try {
    const data = await env.RATE_LIMIT_KV.get(kvKey, "json");
    if (!data) {
      return { limited: false, count: 0, reset: 0 };
    }

    const now = Math.floor(Date.now() / 1000);
    const reset = data.reset;

    if (now > reset) {
      // Expired, reset
      return { limited: false, count: 0, reset: 0 };
    }

    if (data.count >= RATE_LIMIT) {
      return { limited: true, count: data.count, reset };
    }

    return { limited: false, count: data.count, reset };
  } catch (err) {
    console.error("KV read error:", err);
    // Allow request if KV fails
    return { limited: false, count: 0, reset: 0 };
  }
}

async function incrementRateLimit(env, ip) {
  const kvKey = `ratelimit:${ip}`;

  try {
    const now = Math.floor(Date.now() / 1000);
    const data = await env.RATE_LIMIT_KV.get(kvKey, "json");

    if (!data || now > data.reset) {
      // New or expired record
      await env.RATE_LIMIT_KV.put(kvKey, JSON.stringify({
        count: 1,
        reset: now + RATE_LIMIT_EXPIRY,
      }), { expirationTtl: RATE_LIMIT_EXPIRY });
    } else {
      // Increment
      await env.RATE_LIMIT_KV.put(kvKey, JSON.stringify({
        count: data.count + 1,
        reset: data.reset,
      }), { expirationTtl: data.reset - now });
    }
  } catch (err) {
    console.error("KV write error:", err);
    // Don't fail the request if KV write fails
  }
}
