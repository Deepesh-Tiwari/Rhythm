# /recommendation_service/Dockerfile

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y gcc

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# ✅ Make the start script executable
RUN chmod +x start.sh

EXPOSE 8000

# ✅ Use the script to start BOTH services
CMD ["./start.sh"]