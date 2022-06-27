const amqp = require("amqplib");
const mariadb = require("mariadb");

const pool = mariadb.createPool({
    host: "ec_price_comparison_mariadb",
    port: 3306,
    user: "root",
    password: "1qaz@WSX",
    database: "ec",
    connectTimeout: 50000,
});

async function connect() {
    let conn;

    try {
        const connection = await amqp.connect("amqp://ec_price_comparison_rabbitmq:5672");
        const channel = await connection.createChannel();
        conn = await pool.getConnection();

        await channel.assertQueue("db-service");

        channel.prefetch(1);

        channel.consume("db-service", async (message) => {
            const content = message.content.toString();

            console.log(`Recieved Job Message: ${content}`);

            const product = JSON.parse(content);

            if (product.price) {
                const res = await conn.query(`REPLACE INTO product (name, price, url, img_url) SELECT * FROM (SELECT '${product.name}' AS name, ${product.price} AS price, '${product.url}' AS url, '${product.imgUrl}' AS img_url) AS temp WHERE NOT EXISTS (SELECT url FROM product WHERE url = '${product.url}') LIMIT 1`);

                console.log(`Finished Saving Data: ${res}`);
            }

            channel.ack(message);
        });
    } catch (error) {
        console.error(error);
    } finally {
        if (conn) return conn.end();
    }
}

connect();