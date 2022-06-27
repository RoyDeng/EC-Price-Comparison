# EC-Price-Comparison

## How To Build

```
docker network create ec-price-comparison

docker-compose up -d
```

## How To Test API

```
curl http://localhost:9001/api/products?query=iphone
```

## Architecture

![Architecture](./doc/architecture.png)

###### 標籤: `Node.js` `RabbitMQ` `Cron` `Crawler` `Python` `Flask` `SQL` `MariaDB` `Interview`