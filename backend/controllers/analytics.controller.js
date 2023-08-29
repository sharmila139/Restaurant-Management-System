const path = require("path");
const url = require("url");
const db = require( path.resolve( __dirname, "./index.js" ) );

module.exports = {
    popularItemsByDayOfWeek: function(req, res, next) {
        day = req.query.day;
        limit = req.query.limit;
        query = `with 
        item_day as (select item_id, item_name, item_quantity,  extract(dow from order_date)
                     as day from order_ natural join order_items natural join item ), 
        item_day_2 as (select item_id, item_name, day, sum(item_quantity) as total_quantity 
                       from item_day group by item_id, item_name, day),
        item_day_3 as (select item_id, item_name, day, rank() over(partition by day order
                        by total_quantity desc, item_id asc) as dish_rank from item_day_2)
        select item_id, item_name, day, dish_rank from item_day_3 where dish_rank <= $1
        order by day, dish_rank;`;
        db.any(query, [limit]).then(result => {
            l = []
            result.forEach(element => {
                if(element.day == day){
                    l.push(element);
                }
            });
            res.send(l);
        }).catch((err) => {
            console.log(err);
            return next(err);
        });
    },

    rushHours: function(req, res, next) {
        query = `with
        all_orders as (select order_id, extract(hour from placing_time) as order_hour, 
                       extract(dow from order_date) as day from order_),
        orders_hourly as (select day, order_hour, count(order_id) as hourly_orders 
        from all_orders group by day, order_hour order by day, order_hour),
        ranked_hours as (select day, order_hour, rank() over 
                         (partition by day order by hourly_orders desc, order_hour) as ranking
                         from orders_hourly)
        select day, order_hour as peak_hour from ranked_hours where ranking = 1 order by day;`;
        db.any(query, []).then(result => {
            res.send(result);
        }).catch((err) => {
            console.log(err);
            return next(err);
        });
    },

    popularItemsByIngredients: function(req, res, next){
        query = `with 
        item_popularity as (select item_id, sum(item_quantity) as ordered_quantity 
                            from order_items group by item_id )
        select item_id, item_name, ordered_quantity from item_popularity natural join required_ natural join item
        where ingredient_id  = $1 order by ordered_quantity desc limit $2;`;
        db.any(query, [req.query.ingredient_id, req.query.limit]).then(result => {
            res.send(result);
        }).catch((err) => {
            console.log(err);
            return next(err);
        });
    },

    // mostCoOrderedDishes: function(req, res, next){
    //     query = `select item_name, order_id from order_items natural join item;`;
    //     db.any(query, [req.query.ingredient_id, req.query.limit]).then(result => {
    //         console.log(result);
    //     }).catch((err) => {
    //         console.log(err);
    //         return next(err);
    //     });

    // }

};