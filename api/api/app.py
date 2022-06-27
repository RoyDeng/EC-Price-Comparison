from flask import Flask, request
import mysql.connector as mariadb
import json
from decimal import *


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return str(obj)

        return json.JSONEncoder.default(self, obj)

app = Flask(__name__)

config = {
    "host": "ec_price_comparison_mariadb",
    "port": 3306,
    "user": "root",
    "password": "1qaz@WSX",
    "database": "ec"
}


@app.route("/api/products", methods=["GET"])
def get_products():
    try:
        query = request.args["query"]
        conn = mariadb.connect(**config)
        cur = conn.cursor()

        cur.execute("SELECT * FROM product WHERE name LIKE '%{}%'".format(query))

        row_headers = [x[0] for x in cur.description]

        rv = cur.fetchall()
        data = []

        for result in rv:
            data.append(dict(zip(row_headers, result)))

        return json.dumps(data, cls=DecimalEncoder)
    except Exception as e:
        return str(e)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
