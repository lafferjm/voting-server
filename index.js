const io = require('socket.io')(process.env.PORT || 3001);

let users = [];
let results = [];

io.of('/lobby').on('connect', socket => {
  console.log('User connected');

  socket.on('add-user', user => {
    user.id = socket.id;
    user.hasVoted = false;

    if (users.length === 0) {
      user.isAdmin = true;
      socket.emit('your-admin', {});
    }

    users.push(user);

    io.of('/lobby').emit('list-users', users);
  });

  socket.on('user-voted', vote => {
    const [user] = users.filter(e => e.id === socket.id);
    if (user) {
      user.hasVoted = true;

      results.push(vote);

      io.of('/lobby').emit('list-users', users);

      if (!users.some(user => user.hasVoted == false)) {
        io.of('/lobby').emit('all-voted', results);
      };
    }
  });

  socket.on('start-voting', () => {
    io.of('/lobby').emit('voting-started', {});
  });

  socket.on('reset', () => {
    results = [];
    users = users.map(user => {
      user.hasVoted = false;
      return user;
    });
    io.of('/lobby').emit('list-users', users);
    io.of('/lobby').emit('voting-reset', {});
  });

  socket.on('bye-bye', () => {
    users = users.filter(e => e.id !== socket.id);
    if (users.length === 0) {
      results = [];
    }

    io.of('/lobby').emit('list-users', users);
    console.log('user disconnected');
  });
});

console.log('server online');
