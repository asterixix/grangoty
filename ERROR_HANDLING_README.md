# Error Handling & Monitoring System

This document describes the comprehensive error handling, debugging, and monitoring system implemented for the NGO Grants Aggregator web scraping application.

## Overview

The system provides production-grade error handling with circuit breakers, retry logic, rate limiting, and comprehensive monitoring capabilities. All scrapers use consistent error handling patterns to ensure reliability and maintainability.

## Error Handling Architecture

### Core Components

1. **ScraperError Class** (`app/server/utils/scraper-helpers.ts`)
   - Standardized error classification with 9 error types
   - Structured error information for debugging
   - Error recovery metadata

2. **Circuit Breaker Pattern**
   - Prevents cascading failures
   - Configurable failure thresholds and recovery timeouts
   - Automatic failure detection and recovery

3. **Retry Logic with Exponential Backoff**
   - Intelligent retry with jitter to prevent thundering herd
   - Configurable retry attempts and delays
   - Safe extraction utilities for DOM parsing

4. **Rate Limiting**
   - Token bucket algorithm implementation
   - Respectful of target site rate limits
   - Prevents IP blocking and service degradation

### Error Types

The system classifies errors into 9 distinct types:

- **Network**: Connection failures, DNS issues, timeouts
- **Rate Limit**: 429 responses, rate limiting detection
- **Timeout**: Request timeouts, slow responses
- **Parse**: DOM parsing failures, selector issues
- **Not Found**: 404 responses, missing pages
- **Server Error**: 5xx responses, server issues
- **Auth**: Authentication failures, access denied
- **Blocking**: IP blocking, CAPTCHA detection
- **Unknown**: Unclassified errors

## Debug & Monitoring APIs

### Health Dashboard (`/api/debug?action=health`)

Provides comprehensive scraper health monitoring:

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "overall": {
    "status": "healthy|warning|critical",
    "totalScrapers": 5,
    "activeScrapers": 4,
    "failingScrapers": 1,
    "lastUpdated": "2024-01-01T12:00:00.000Z"
  },
  "scrapers": [
    {
      "source": "fundusze-ngo.pl",
      "enabled": true,
      "status": "healthy|failing",
      "lastRun": "2024-01-01T11:30:00.000Z",
      "lastRunSuccess": true,
      "errorCount": 0,
      "grantsCount": 25,
      "isRecent": true,
      "lastError": null
    }
  ]
}
```

### Performance Metrics (`/api/debug?action=metrics`)

Detailed performance analytics:

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "totalGrants": 150,
  "grantsBySource": {
    "fundusze-ngo.pl": 45,
    "niw.gov.pl": 32
  },
  "grantsByCategory": {
    "education": 25,
    "healthcare": 18
  },
  "recentActivity": [
    {
      "id": "grant-123",
      "source": "fundusze-ngo.pl",
      "title": "Youth Education Grant",
      "scrapedAt": "2024-01-01T11:45:00.000Z"
    }
  ],
  "performanceStats": {
    "averageGrantsPerScraper": 30,
    "mostProductiveSource": "fundusze-ngo.pl",
    "leastProductiveSource": "regional-fund.pl",
    "totalSuccessfulRuns": 12,
    "totalFailedRuns": 2
  }
}
```

### Error Tracking (`/api/debug?action=errors`)

Error analysis and recommendations:

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "errorSummary": {
    "totalErrors": 3,
    "errorsBySource": {
      "problematic-site.pl": 2
    },
    "errorsByType": {
      "parse": 2,
      "network": 1
    },
    "recentErrors": [
      {
        "source": "problematic-site.pl",
        "error": "Selector not found: .grant-item",
        "timestamp": "2024-01-01T11:30:00.000Z",
        "type": "parse"
      }
    ]
  },
  "errorPatterns": [],
  "recommendations": [
    {
      "type": "parse",
      "priority": "medium",
      "message": "Multiple parsing errors. Website structure may have changed.",
      "action": "Update selectors and review scraping logic"
    }
  ]
}
```

### Performance Monitoring (`/api/debug/monitor?action=monitor`)

Real-time performance monitoring with alerts:

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "system": {
    "status": "healthy",
    "uptime": 3600,
    "memoryUsage": { "rss": 104857600, "heapUsed": 52428800 },
    "activeScrapers": 4,
    "failingScrapers": 1
  },
  "scrapers": [
    {
      "source": "fundusze-ngo.pl",
      "status": "healthy",
      "lastRun": "2024-01-01T11:30:00.000Z",
      "grantsCount": 25,
      "performance": {
        "avgResponseTime": 5000,
        "failureRate": 0
      },
      "alerts": []
    }
  ],
  "alerts": [
    {
      "level": "warning",
      "type": "slow_response",
      "message": "Slow response time: 45000ms",
      "threshold": 30000
    }
  ],
  "recommendations": [
    {
      "priority": "medium",
      "type": "optimize_performance",
      "message": "Some scrapers have slow response times.",
      "action": "Implement caching, reduce request frequency, or optimize selectors"
    }
  ]
}
```

### Active Alerts (`/api/debug/monitor?action=alerts`)

Prioritized alert system:

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "critical": [
    {
      "source": "failing-scraper.pl",
      "type": "scraper_down",
      "message": "failing-scraper.pl has 85% failure rate",
      "priority": "immediate"
    }
  ],
  "warning": [
    {
      "source": "slow-scraper.pl",
      "type": "performance_degraded",
      "message": "slow-scraper.pl response time is 65000ms",
      "priority": "medium"
    }
  ],
  "info": [],
  "summary": {
    "total": 2,
    "critical": 1,
    "warning": 1,
    "info": 0
  }
}
```

## Usage Examples

### Testing a Scraper

```bash
# Test individual scraper
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"source":"fundusze-ngo.pl","dryRun":false}'

# Check health status
curl "http://localhost:3000/api/debug?action=health"

# Monitor performance
curl "http://localhost:3000/api/debug/monitor?action=monitor"
```

### Error Scenarios

The system handles various error scenarios gracefully:

1. **Network failures**: Automatic retry with exponential backoff
2. **Rate limiting**: Circuit breaker activation, delayed retry
3. **Parse errors**: Safe extraction prevents crashes, error logging
4. **Server errors**: Circuit breaker prevents overwhelming failing services
5. **IP blocking**: Rate limiting and circuit breaker coordination

## Configuration

### Circuit Breaker Settings

```typescript
const circuitBreaker = new CircuitBreaker({
  failureThreshold: 5,    // Fail after 5 consecutive errors
  recoveryTimeout: 60000, // Try again after 1 minute
  monitoringPeriod: 10000 // Check every 10 seconds
})
```

### Retry Configuration

```typescript
const result = await withRetry(
  () => scraper.scrape(),
  { source: 'example.com', operation: 'scrape' },
  {
    maxRetries: 3,
    baseDelay: 2000,
    maxDelay: 30000
  }
)
```

### Rate Limiting

```typescript
const rateLimiter = new RateLimiter({
  tokensPerInterval: 10,
  intervalMs: 60000 // 10 requests per minute
})
```

## Best Practices

1. **Always use error classification**: Helps with monitoring and alerting
2. **Implement circuit breakers**: Prevents cascade failures
3. **Use safe extraction**: Prevents crashes from missing DOM elements
4. **Monitor regularly**: Use the debug APIs for proactive maintenance
5. **Log structured data**: Enables better error analysis and debugging

## Troubleshooting

### Common Issues

1. **Scraper consistently failing**
   - Check `/api/debug?action=errors` for error patterns
   - Review website changes that might affect selectors
   - Verify network connectivity and rate limiting

2. **Slow performance**
   - Monitor `/api/debug/monitor?action=monitor` for bottlenecks
   - Check rate limiting and circuit breaker status
   - Optimize selectors and reduce request frequency

3. **Memory issues**
   - Monitor system resources via debug API
   - Check for memory leaks in scraper implementations
   - Implement proper cleanup in scraper code

### Debug Commands

```bash
# Quick health check
curl "http://localhost:3000/api/debug?action=health" | jq '.overall.status'

# Check for critical alerts
curl "http://localhost:3000/api/debug/monitor?action=alerts" | jq '.summary.critical'

# Monitor specific scraper
curl "http://localhost:3000/api/debug?action=health" | jq '.scrapers[] | select(.source=="fundusze-ngo.pl")'
```

## Future Enhancements

1. **Historical metrics**: Track performance trends over time
2. **Automated alerting**: Email/SMS notifications for critical issues
3. **Advanced analytics**: ML-based anomaly detection
4. **Distributed tracing**: End-to-end request tracing
5. **Auto-healing**: Automatic scraper fixes for common issues