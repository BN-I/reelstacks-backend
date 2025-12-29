const mongoose = require('mongoose');
const config = require('../../src/config/config');
const { userService } = require('../../src/services');
const { roles } = require('../../src/config/roles');

const generator = require('generate-password');
const argv = require('minimist');

mongoose.connect(config.mongoose.url, config.mongoose.options).then(async () => {
  console.log('Connected to MongoDB');

  await createUser();

  await mongoose.disconnect();
  console.log('Disconnect to MongoDB');
});

async function createUser() {
  console.log('createUser...');

  // const { n, e, r } = argv(process.argv.slice(2));
  const [n, e, r] = process.argv.slice(2);
  console.log('createUser...', n, e, r);

  const name = n;
  const email = e;
  const role = r;
  if (!name || !email || !role) {
    console.error('Please provide name, email, and role');
    return;
  }
  if (!roles.includes(role)) {
    console.error('Role must be either "admin" or "user"');
    return;
  }

  console.log('Creating user with name:', name, 'email:', email, 'role:', role);

  const password = generator.generate({
    length: 32,
    numbers: true,
  });

  const apiKey = generator.generate({
    length: 64,
    numbers: true,
  });

  try {
    const user = await userService.getUserByEmail(email);
    if (!user) {
      const nUser = await userService.createUser({
        name,
        email,
        password,
        apiKey,
        isEmailVerified: true,
        role,
      });

      console.log('User created with password: ', password, 'API Key', apiKey);
      console.log('Bearer token: Bearer ', Buffer.from(`${email}:${apiKey}`).toString('base64'));
    } else {
      await userService.updateUserById(user.id, { password, apiKey });

      console.log('User updated with password: ', password, 'API Key', apiKey);
    }
  } catch (e) {
    console.log('Error: ', e);
  }
}
