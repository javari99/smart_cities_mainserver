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
    RequiresAdminAPI: (req, res, next) => {
        if(req.user && req.user.isAdmin) return next();
        res.status(401).json({error: 'You dont have permission'});
    },

    RequiresNotLogin: (req, res, next) => {
        if(!req.user) return next();
        req.session.flash = {
            type:'warning',
            message:'You are already logged in'
        };
        res.redirect('/');
    },
};