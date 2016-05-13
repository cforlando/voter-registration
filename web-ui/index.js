var Hapi = require('hapi');

const server = new Hapi.Server();
server.connection({
  // Heroku will fail if just 3000
  port: process.env.PORT || 3000
});

server.register(require('vision'), (err) => {
  require('hoek').assert(!err, err);

  server.views({
    engines: {
      html: require('handlebars')
    },
    relativeTo: __dirname,
    path: 'view'
  });
});

server.register(require('inert'), (err) => {
  if (err)
    throw err;

  server.route([{
    method: 'GET',
    path: '/',
    handler: function(request, reply) {
      reply.view('voter_register', 'Register')
    }
  }, {
    method: 'GET',
    path: '/node/{path*}',
    handler: {
      directory: {
        path: './node_modules'
      }
    }
  }, {
    method: 'GET',
    path: '/res/{path*}',
    handler: {
      directory: {
        path: './res'
      }
    }
  }])

  server.start((err) => {
    if (err)
      throw err;

    console.log('Server running at:', server.info.uri);
  });
});
