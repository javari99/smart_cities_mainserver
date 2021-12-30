module.exports = {
    RequiresLogin: (req, res, next) => {
        if(req.user) return next();
        res.redirect('/auth/login');
    },

    RequiresAdmin: (req, res, next) => {
        if(req.user && req.user.isAdmin) return next();
        res.render('404');
    },
};