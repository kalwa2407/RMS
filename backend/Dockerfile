FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install dependencies required by reportlab and psycopg2
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend source code
COPY . .

# Expose port 8080 (Cloud Run requirement)
EXPOSE 8080

# Run the FastAPI server - use $PORT env variable (required by Cloud Run)
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT:-8080} --workers 1"]
