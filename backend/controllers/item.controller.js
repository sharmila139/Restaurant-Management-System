const path = require("path");
const { listenerCount } = require("process");
const url = require("url");
const db = require( path.resolve( __dirname, "./index.js" ) );

module.exports = {

    getItems: function(req, res, next){

        const get_query = `with item_max_quantity(item_id, max_quantity) as 
        (select item_id, max(quantity) as max_quantity from required_ group by item_id),
        main_ingredient(item_id, ingredient_id) as 
        (select a. item_id, a.ingredient_id from required_ as a, item_max_quantity as b 
        where a.item_id = b.item_id and a.quantity=b.max_quantity) 
        select a.item_id, a.item_name, c.name, a.category, a.is_veg, a.cost, a.availability from item as a,
        main_ingredient as b , ingredient as c where a.item_id = b.item_id and b.ingredient_id=c.ingredient_id 
        order by a.category, a.item_name, c.name;`;
        
        db.any(get_query, []).then(result => {
            const processed_res = [];
            const item_cat = [];
            const check_dict = {};
            const category_wise = {};
            const li = [];
            for (let i = 0; i < result.length; i++) {
                const element = result[i];
                if (!(element.item_name in check_dict)) {
                    check_dict[element.item_name] = 1;
                    processed_res.push(element);
                }    
            }
            processed_res.forEach(element => {
                if(!(element.category in category_wise)){
                    item_cat.push(element.category);
                    category_wise[element.category] = [];
                }
                category_wise[element.category].push(element)
            });
            for (let i = 0; i < item_cat.length; i++){
                const x = {};
                x["category"]=item_cat[i];
                x["items"]=category_wise[item_cat[i]];
                li.push(x);
            }
            console.log(li)
            res.send(li);
        })
        .catch((err) => {
            console.log(err);
            return next(err);
        });
    },

    addItem: function(req, res, next) {
        const ingredients = req.body.item_ingredients
        insert_query_2 = ` insert into item(item_name, category, cost, availability, is_veg) 
        values ($1, $2, $3, $4, $5) returning item_id;`;

        const values_2 = [req.body.name, req.body.category, req.body.cost, 
                        req.body.availability, req.body.is_veg];
        
        db.one(insert_query_2, values_2).then(result => {
            ingredients.forEach(elem => {
                elem["item_id"] = result.item_id;
            });
            db.tx(t => {
                const queries = ingredients.map(l => {
                    return t.none(`insert into required_(item_id, ingredient_id, quantity) values (${l.item_id}, ${l.ingredient_id}, ${l.quantity});`, l);
                });
                return t.batch(queries);
            })
                .then(data => {
                    // SUCCESS
                    // data = array of "NULL"-s
                    res.send(result);
                })
                .catch(err => {
                    res.sendStatus(500);
                    console.log(err);
                    return next(err);
                    // ERROR
                });
        })
        .catch((err) => {
            console.log(err);
            return next(err);
        });

    }

    


};