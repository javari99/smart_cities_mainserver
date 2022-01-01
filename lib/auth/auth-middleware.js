module.exports = {
    RequiresLogin: (req, res, next) => {
        if(req.user) return next();
        req.session.flash = {
            type:'danger',
            message:'You need to log in to view this page.'
        };
        res.redirect('/auth/login');
    },

    RequiresAdmin: (req, res, next) => {
        if(req.user && req.user.isAdmin) return next();
        res.render('404');
    },

    RequiresNotLogin: (req, res, next) => {
        if(!req.user) return next();
        req.session.flash = {
            type:'danger',
            message:'You are already logged in'
        };
        res.redirect('/');
    },
};