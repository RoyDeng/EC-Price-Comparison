const CronJob = require("cron").CronJob;
const originalFetch = require("isomorphic-fetch");
const fetch = require("fetch-retry")(originalFetch);
const cheerio = require("cheerio");
const MessageQueueService = require("../models/messageQueue");

const FetchRetries = 2;
const FetchRetryDelay = 800;
const FetchDefaults = {
    retries: FetchRetries,
    retryDelay: FetchRetryDelay
};

async function getWebContent(product) {
    try {
        const content = fetch(`http://m.momoshop.com.tw/mosearch/${encodeURI(product)}.html`, {
            ...FetchDefaults,
            method: "GET"
        }).then(async (response) => {
            if (response.status == 200) {
                const text = await response.text();

                return Promise.resolve(text);
            } else {
                return Promise.reject(response.statusText);
            }
        }).catch((error) => {
            console.error(error);
        });

        return await content
            .then((response) => {
                return response;
            })
            .catch((error) => {
                return error;
            });
    } catch (error) {
        console.error(error);
    }
}

async function search(queries) {
    try {
        const result = [];

        for (let i = 0; i < queries.length; i++) {
            const product = queries[i];
            const content = await getWebContent(product);
            const $ = cheerio.load(content);

            $(".prdListArea ul li").each((i, elem) => {
                let itemName = $(elem).find('h3[class*="prdName"]').text();
                itemName = itemName.substring(itemName.indexOf("【"));
                const itemPrice = parseInt($(elem).find('b[class*="price "]').text());
                const itemUrl = `http://m.momoshop.com.tw/${$(elem).find("a").attr("href")}`;
                const itemImgUrl = $(elem).find("img").attr("src");

                const item = {
                    name: itemName,
                    price: itemPrice,
                    url: itemUrl,
                    imgUrl: itemImgUrl
                };

                result.push(item);
            });
        }

        return result;
    } catch (error) {
        console.error(error);
    }
}

new CronJob("0 * * * * *", async () => {
    try {
        const messageQueue = new MessageQueueService("amqp://ec_price_comparison_rabbitmq:5672");
        const queries = [
            "Apple iPhone 13 Pro Max",
            "Sony Xperia PRO",
            "SAMSUNG Galaxy S22 Ultra"
        ];
        const products = await search(queries);

        console.log(products);

        await messageQueue.connect();

        for (let i = 0; i < products.length; i++) {
            const product = products[i];

            messageQueue.publishToQueue("db-service", JSON.stringify(product));
        }
    } catch (error) {
        console.error(error);
    }
}, null, true, "Asia/Taipei");