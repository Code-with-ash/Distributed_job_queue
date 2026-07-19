# 🚀 Distributed Job Queue using Redis & Node.js

> A production-inspired distributed background job processing system built with **Node.js, Express, Redis, and Docker**.

This project demonstrates how modern applications process time-consuming tasks asynchronously using a distributed job queue. Instead of making users wait for expensive operations (emails, image processing, report generation, AI tasks, etc.), requests are placed into a queue and processed by background workers.

---

# Table of Contents

* Introduction
* Why Job Queues?
* Features
* System Architecture
* Tech Stack
* Folder Structure
* How It Works
* Request Lifecycle
* Redis Data Flow
* API Endpoints
* Queue Flow
* Worker Flow
* Scaling
* Failure Handling
* Retry Mechanism
* Future Improvements
* Running the Project
* Docker Setup
* Testing
* Performance
* Interview Questions
* Design Decisions
* Real World Applications
* Future Enhancements
* Learning Outcomes

---

# Introduction

Traditional APIs process every request immediately.

Example:

```
User
   |
   | POST /send-email
   |
Express
   |
Email Service
   |
SMTP
   |
Response
```

If sending an email takes **5 seconds**, the user waits 5 seconds.

This is inefficient.

Instead, production systems use **Background Job Queues.**

```
User
   |
POST /send-email
   |
Express
   |
Redis Queue
   |
202 Accepted
   |
Worker
   |
SMTP
```

Now the user gets an instant response while the worker completes the task in the background.

---

# Why Job Queues?

Without a queue:

* Slow API responses
* Thread blocking
* Poor scalability
* Bad user experience

With a queue:

* Fast responses
* Better throughput
* Horizontal scaling
* Reliable processing

---

# Features

✅ REST API

✅ Redis Queue

✅ Background Worker

✅ Docker Support

✅ Multiple Workers

✅ Retry Support

✅ Failed Job Handling

✅ Queue Monitoring

✅ Logging

✅ Production Inspired Architecture

---

# Tech Stack

* Node.js
* Express.js
* Redis
* Docker
* Docker Compose

---

# System Architecture

```
                Client
                   |
                   |
          POST /generate-report
                   |
            Express API Server
                   |
           Push Job into Redis
                   |
        --------------------------
        |                        |
      Worker 1               Worker 2
        |                        |
        --------------------------
                   |
             Process Job
                   |
             Database/API
```

---

# Folder Structure

```
project/

src/
│
├── app.js
├── routes/
├── controllers/
├── worker/
├── queue/
├── redis/
├── middleware/
├── utils/
│
docker-compose.yml
README.md
```

---

# Queue Flow

Step 1

User sends

```
POST /jobs
```

Body

```json
{
    "type":"email",
    "email":"john@gmail.com"
}
```

---

Step 2

Express validates the request.

---

Step 3

Instead of processing immediately

```
sendEmail()
```

it pushes the job

```
LPUSH jobs
```

Redis

```
jobs

[
 Job5
 Job4
 Job3
 Job2
 Job1
]
```

---

Step 4

API instantly responds

```
202 Accepted
```

User does not wait.

---

Step 5

Worker continuously waits.

```
BRPOP jobs
```

`BRPOP` blocks until a new job arrives.

No CPU is wasted.

---

Step 6

Worker receives

```
Job5
```

Processes it

```
Send Email

Generate PDF

Resize Image

AI Task

etc.
```

---

# Why BRPOP?

Instead of

```js
while(true){

checkQueue()

}
```

which wastes CPU,

Redis provides

```
BRPOP
```

The worker sleeps until a job arrives.

---

# Redis Data Flow

```
LPUSH jobs Job1

Queue

Job1
```

```
LPUSH jobs Job2

Queue

Job2
Job1
```

Worker

```
BRPOP jobs
```

Queue becomes

```
Job2
```

---

# Request Lifecycle

```
Client

↓

Express

↓

Validate

↓

Redis Queue

↓

202 Accepted

↓

Worker

↓

Business Logic

↓

Success
```

---

# API Endpoints

## Add Job

```
POST /jobs
```

Response

```json
{
    "message":"Job queued"
}
```

---

## Queue Length

```
GET /queue
```

---

## Worker Health

```
GET /health
```

---

## Retry Failed Jobs

```
POST /retry
```

---

# Horizontal Scaling

One worker

```
Queue

↓

Worker
```

100 jobs

One worker processes sequentially.

---

Three workers

```
Queue

↓

Worker A

Worker B

Worker C
```

Jobs are processed in parallel.

No application code changes.

Only add more workers.

This is horizontal scaling.

---

# Failure Handling

Suppose email service fails.

```
Worker

↓

SMTP Error
```

Instead of losing the job

Move it into

```
failed_jobs
```

Redis List

---

# Retry Mechanism

```
Job

↓

Attempt 1

↓

Fail

↓

Attempt 2

↓

Fail

↓

Attempt 3

↓

Move to Dead Letter Queue
```

---

# Dead Letter Queue

A Dead Letter Queue stores permanently failed jobs.

```
jobs

↓

worker

↓

failed_jobs
```

Engineers inspect them later.

---

# Performance

Without Queue

```
Request

↓

5 seconds
```

With Queue

```
Request

↓

40 ms
```

Heavy work happens later.

---

# Real World Use Cases

Sending Emails

Invoice Generation

PDF Generation

Image Compression

Video Encoding

AI Inference

Payment Webhooks

Push Notifications

Analytics Processing

Order Processing

SMS

Report Generation

---

# Why Redis?

Redis is

* In-memory
* Extremely fast
* Atomic
* Shared across servers
* Supports blocking operations

Commands used

```
LPUSH

BRPOP

LLEN

LRANGE
```

---

# Why Not Database?

Database polling

```
SELECT *

every second
```

is slow.

Redis supports

```
BRPOP
```

which blocks efficiently.

---

# Production Improvements

Redis Streams

BullMQ

RabbitMQ

Apache Kafka

Priority Queue

Delayed Jobs

Rate Limiting

Monitoring Dashboard

Distributed Locking

Job Scheduling

---

# Possible Future Features

Email Queue

Image Queue

Video Queue

Notification Queue

Priority Queue

Cron Jobs

Dead Letter Queue

Metrics Dashboard

WebSocket Updates

Prometheus

Grafana

OpenTelemetry

---

# Interview Questions

## Why use a Job Queue?

To move long-running tasks outside the request-response cycle and improve response time, scalability, and reliability.

---

## Why Redis?

Fast in-memory operations, atomic commands, blocking queue support, and shared state across multiple servers.

---

## Why LPUSH + BRPOP?

`LPUSH` inserts new jobs efficiently.

`BRPOP` lets workers sleep until work arrives, avoiding wasteful polling.

---

## Why not process jobs inside Express?

Express should return responses quickly. Heavy tasks increase latency and reduce throughput.

---

## What if multiple workers consume the queue?

Each job is delivered to only one worker because `BRPOP` removes it atomically.

---

## Can jobs be lost?

Yes, with a simple Redis List implementation. If a worker crashes after popping a job but before finishing it, that job can be lost. Production systems address this with acknowledgements, visibility timeouts, or more advanced tools such as Redis Streams, BullMQ, RabbitMQ, or Kafka.

---

## What is a Dead Letter Queue?

A queue that stores jobs which have permanently failed after the maximum retry limit.

---

## How do you scale?

Run more worker processes.

No API code changes are required.

---

## Why not Kafka?

Kafka is designed for durable event streaming and very high throughput.

For a lightweight background job system, Redis is simpler and faster to implement.

---

## Difference between Pub/Sub and Job Queue?

**Pub/Sub**

* Every subscriber receives the message.
* Best for notifications and event broadcasting.
* Messages are not retained for late subscribers.

**Job Queue**

* One worker processes each job.
* Best for background task processing.
* Jobs remain in the queue until a worker consumes them.

---

## Learning Outcomes

After completing this project you will understand:

* Distributed systems basics
* Producer–Consumer pattern
* Background processing
* Asynchronous architecture
* Redis Lists
* Blocking operations
* Horizontal scaling
* Worker processes
* Failure recovery concepts
* Retry strategies
* Dead Letter Queues
* Production queue design

---

# Final Thoughts

This project is intentionally built from first principles instead of relying on libraries like BullMQ. The goal is to understand **how distributed job queues work internally**, including producers, consumers, Redis data structures, worker scaling, and failure scenarios. Once these fundamentals are clear, migrating to production-grade tools such as BullMQ, RabbitMQ, or Kafka becomes much easier.
