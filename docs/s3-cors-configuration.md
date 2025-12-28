# S3 CORS Configuration

This guide explains how to configure CORS (Cross-Origin Resource Sharing) on the S3 bucket to allow direct uploads from the frontend.

## Why is CORS needed?

The app uses **presigned URLs** to upload images directly from the browser to S3, bypassing the API server for faster uploads. For this to work, S3 must allow requests from your frontend domains.

## Prerequisites

### Install AWS CLI

```bash
# macOS
brew install awscli

# Or download from: https://aws.amazon.com/cli/
```

### Configure AWS CLI

```bash
aws configure
```

Enter your credentials when prompted:
- **AWS Access Key ID**: (from AWS IAM or your .env file)
- **AWS Secret Access Key**: (from AWS IAM or your .env file)
- **Default region**: us-east-1 (or your region)
- **Default output format**: json

You can find credentials in the Laravel API `.env` file:
```
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

## Adding a New Origin (Domain)

### Step 1: Get current CORS configuration

```bash
aws s3api get-bucket-cors --bucket inked-in-images
```

### Step 2: Create/update the CORS config file

Create a file called `cors.json` with your origins:

```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
      "AllowedOrigins": [
        "http://localhost:4000",
        "http://localhost:3000",
        "https://inkedin.dev",
        "https://www.inkedin.dev",
        "https://inkedin.com",
        "https://www.inkedin.com",
        "https://*.vercel.app"
      ],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

**To add a new production domain**, add it to the `AllowedOrigins` array.

### Step 3: Apply the configuration

```bash
aws s3api put-bucket-cors --bucket inked-in-images --cors-configuration file://cors.json
```

### Step 4: Verify

```bash
aws s3api get-bucket-cors --bucket inked-in-images
```

## Common Origins to Add

| Environment | Origin |
|-------------|--------|
| Local development | `http://localhost:3000`, `http://localhost:4000` |
| Vercel preview | `https://*.vercel.app` |
| Staging | `https://staging.inkedin.com` |
| Production | `https://inkedin.com`, `https://www.inkedin.com` |

## Troubleshooting

### "CORS policy: No 'Access-Control-Allow-Origin' header"

This error means the origin making the request is not in the `AllowedOrigins` list. Add it and re-apply the config.

### "Access Denied" when applying CORS

Make sure your AWS credentials have the `s3:PutBucketCors` permission on the bucket.

### Changes not taking effect

CORS changes are usually instant, but browsers cache preflight responses. Try:
1. Hard refresh (Cmd+Shift+R)
2. Open in incognito window
3. Clear browser cache

## Quick Reference

```bash
# View current CORS config
aws s3api get-bucket-cors --bucket inked-in-images

# Apply new CORS config
aws s3api put-bucket-cors --bucket inked-in-images --cors-configuration file://cors.json

# Delete CORS config (not recommended)
aws s3api delete-bucket-cors --bucket inked-in-images
```
