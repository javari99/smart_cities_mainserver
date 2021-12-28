/**
 * Simple middleware that deletes flash messages once they have been already
 * rendered
 * 
 * @param {Express.Request} req
 * @param {Express.Response} res
 * @param {any} next
 * @returns {import("express").RequestHandler}
 */
module.exports = (req, res, next) => {
    res.locals.flash = req.session.flash;
    delete req.session.flash;
    next();
};