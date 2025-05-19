FROM python:3.12-alpine

EXPOSE 3010

WORKDIR /app

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY . /app

CMD python3 src/main.py
