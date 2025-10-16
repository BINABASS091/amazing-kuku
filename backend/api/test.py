from fastapi import FastAPI
from mangum import Mangum

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Hello from Vercel!"}

@app.get("/health")
def health():
    return {"status": "healthy"}

# Vercel serverless handler
handler = Mangum(app)
