module.exports = function (tokens) {
    var func = (req, res, next) => {
       if (req.headers.authorization) {
           const token = req.headers.authorization.split(' ')[1];
           if (tokens.verify(token)) {
              next(); 
               return;
           } else {
               res.status(401).send('Invalid token');
               return;
           }
       } else {
           res.status(401).send('Authorization required');
       }
    }
    func.unless = require('express-unless');

    return func;
}
