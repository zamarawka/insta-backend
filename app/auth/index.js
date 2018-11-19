const passport = require('koa-passport');
const LocalStrategy = require('passport-local');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');

const User = require('../database/User');
const config = require('../config');

const localStrategy = new LocalStrategy({
  usernameField: 'nickname',
  passwordField: 'password',
  session: false
}, async function (nickname, password, done) {
  try {
    const user = await User.find({ nickname });

    if (!user.checkPassword(password)) {
      return done(null, false);
    }

    done(null, user);
  } catch (err) {
    done(err);
  }
});

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.appSecret
};

const jwtStrategy = new JwtStrategy(jwtOptions, function (payload, done) {
  User.findById(payload['_id'])
    .then((user) => {
      if (user) {
        done(null, user);
      } else {
        done(null, false);
      }
    })
    .catch((err) => {
      return done(err);
    });
});

passport.use(localStrategy);
passport.use(jwtStrategy);

module.exports = passport;
